import * as aws from 'aws-sdk'
import * as mime from 'mime-types'
import fs from 'fs'
import glob from 'fast-glob'
import winston from 'winston'
import { normalize } from './util'

export interface DeployConfig {
  accessKey: string
  secretAccessKey: string
  bucket: string
  region: string
  directory: string
  deleteObjects: boolean
  prefix: string | null
}

export async function run(configuration: DeployConfig, logger: winston.Logger) {
  const s3 = new aws.S3({
    credentials: {
      accessKeyId: configuration.accessKey,
      secretAccessKey: configuration.secretAccessKey
    },
    region: configuration.region,
    apiVersion: '2006-03-01'
  })

  // Set the "relative root" of where to upload our objects
  const root = configuration.prefix !== null && configuration.prefix !== ''
    ? normalize(configuration.prefix)
    : ''
  logger.info(`uploading new objects with a prefix of: ${root}`)

  // Delete all the existing objects if true in configuration
  if (configuration.deleteObjects) {
    logger.info('attempting to delete old objects in bucket (delete-existing objects: true)')
    const getObjects = async () => await s3.listObjectsV2({
      Bucket: configuration.bucket,
      Prefix: root
    }).promise()

    let objects = await getObjects()
    let objectCount = objects.Contents?.length ?? 0

    if (objectCount === 0) {
      logger.info('prefix space is empty, no objects to delete')
    }

    // Keep deleting until there are no more items to delete with the prefix
    while ((objects.Contents?.length ?? 0) > 0){
      objects.Contents?.forEach(object => {
        logger.info(`deleting object ${object.Key}`)
      })
      await s3.deleteObjects({
        Bucket: configuration.bucket,
        Delete: {
          Objects: objects.Contents!.map(({ Key }) => ({ Key: Key! }))
        }
      }).promise()

      objects = await getObjects()
      objectCount += objects.Contents?.length ?? 0
      logger.info(`batch deleted ${objects.Contents?.length ?? 0} objects from bucket`)
    }
    logger.info(`${objectCount} objects from bucket have been deleted`)
  }

  const files = await glob(`${configuration.directory}/**`, {
    followSymbolicLinks: false,
    onlyFiles: true
  })

  await Promise.all(
    files.map(async file => {
      logger.info(`uploading file: ${file}`)

      // Trim off the specified directory (fast-glob includes this so we must shave it off)
      const trimLength = normalize(configuration.directory).length
      const objectKey = `${root}${file.substr(trimLength)}`
      let mimeType: string | undefined | false = mime.lookup(file)
      if (mimeType === false) {
        mimeType = undefined
      }

      const fileStream = fs.createReadStream(file)
      fileStream.on('error', (err) => {
        logger.error(`error while creating read stream for ${file}: ${err.name} - ${err.message}`)
      })

      return await s3.upload({
        Bucket: configuration.bucket,
        Body: fileStream,
        ACL: 'public-read',
        Key: objectKey,
        ContentType: mimeType
      }).promise()
    })
  )

  logger.info('upload complete')

  return s3
}