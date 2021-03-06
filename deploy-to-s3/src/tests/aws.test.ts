import { run } from '../aws'
import { merge, logger } from './setup'

describe('using the action', function () {
  test('using a prefix', async done => {
    const configuration = merge({
      prefix: 's3-deploy-test-harness',
      directory: 'src',
      deleteObjects: true
    })

    const s3 = await run(configuration, logger())
    const objects = await s3.listObjects({
      Prefix: 's3-deploy-test-harness',
      Bucket: configuration.bucket
    }).promise()
    expect(objects.Contents).toBeDefined()
    done()
  })

  test('uploading to root', async done => {
    const configuration = merge({
      prefix: null,
      directory: 'src/tests',
      deleteObjects: true
    })

    const s3 = await run(configuration, logger())
    const objects = await s3.listObjects({
      Prefix: 's3-deploy-test-harness/src/tests',
      Bucket: configuration.bucket
    }).promise()
    expect(objects.Contents).toBeDefined()
    done()
  })
})