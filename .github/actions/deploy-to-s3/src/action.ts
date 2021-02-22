import * as core from '@actions/core'
import winston from 'winston'
import { run, DeployConfig } from './aws'

const input = (key: string, required: boolean = true) => core.getInput(key, { required })

const configuration: DeployConfig = {
  accessKey: input('aws-access-key'),
  secretAccessKey: input('aws-secret-access-key'),
  bucket: input('aws-bucket'),
  region: input('aws-region'),
  directory: input('directory'),
  prefix: input('prefix', false) ?? null,
  deleteObjects: input('delete-existing-objects') === 'true'
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  defaultMeta: {
    service: 'deploy-to-s3'
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
})

run(configuration, logger)