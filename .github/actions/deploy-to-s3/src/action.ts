import * as core from '@actions/core'
import * as aws from 'aws-sdk'
import * as mime from 'mime-types'
import * as fs from 'fs'
import glob from 'fast-glob'

const input = (key: string, required: boolean = true) => core.getInput(key, { required })
const normalize = (path: string) => {
  while (path.startsWith('/')) {
    path = path.substring(1)
  }
  while (path.endsWith('/')) {
    path = path.substring(0, path.length - 1)
  }
  return `/${path}`
}

interface Config {
  accessKey: string
  secretAccessKey: string
  bucket: string
  region: string
  directory: string
  deleteObjects: boolean
  prefix: string | null
}

;(async () => {
  const configuration: Config = {
    accessKey: input('aws-access-key'),
    secretAccessKey: input('aws-secret-access-key'),
    bucket: input('aws-bucket'),
    region: input('aws-region'),
    directory: input('directory'),
    prefix: input('prefix', false) ?? null,
    deleteObjects: input('delete-existing-objects') === 'true'
  }

  const s3 = new aws.S3({
    credentials: {
      accessKeyId: configuration.accessKey,
      secretAccessKey: configuration.secretAccessKey
    },
    region: configuration.region,
    apiVersion: '2006-03-01'
  })

  // Set the "relative root" of where to upload our objects
  const objectRoot = configuration.prefix !== null
    ? normalize(configuration.prefix)
    : '/'

  // Delete all the existing objects if true in configuration
  if (configuration.deleteObjects) {
    const nextObjects = () => s3.listObjects({
      Bucket: configuration.bucket,
      Prefix: objectRoot
    }).promise()

    let objects = await nextObjects()
    // Keep deleting until there are no more items to delete with the prefix
    while ((objects.Contents?.length ?? 0) > 0) {
      await s3.deleteObjects({
        Bucket: configuration.bucket,
        Delete: {
          Objects: objects.Contents!.map(obj => ({ Key: obj.Key! }))
        }
      }).promise()

      objects = await nextObjects()
    }
  }

  const files = await glob(`${configuration.directory}/**`, {
    followSymbolicLinks: false,
    onlyFiles: true
  })

  await Promise.all(
    files.map(async file => {
      const objectKey = `${objectRoot}${file}`
      let mimeType: string | undefined | false = mime.lookup(file)
      if (mimeType === false) {
        mimeType = undefined
      }

      const fileStream = fs.createReadStream(file)
      fileStream.on('error', (err) => {
        core.error(`Error creating stream of ${file}: ${err.name} - ${err.message}`)
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
})()