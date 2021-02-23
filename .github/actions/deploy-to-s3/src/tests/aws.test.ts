import { run } from '../aws'
import { merge, logger } from './setup'

const configuration = merge({
  prefix: 's3-deploy-test-harness',
  directory: 'src',
  deleteObjects: true
})

describe('using the action', function () {
  test('uploading an archive', async done => {
    const s3 = await run(configuration, logger())
    const objects = await s3.listObjects({
      Prefix: 's3-deploy-test-harness',
      Bucket: configuration.bucket
    }).promise()
    expect(objects.Contents).toBeDefined()
    done()
  })
})