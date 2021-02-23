import { DeployConfig } from '../aws'
import { config } from 'dotenv'
import winston from 'winston'

config()

export function merge(config: Pick<DeployConfig, 'prefix' | 'deleteObjects' | 'directory'>): DeployConfig {
  return {
    ...config,
    ...{
      accessKey: process.env.AWS_ACCESS_KEY!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      region: process.env.AWS_REGION!,
      bucket: process.env.AWS_BUCKET!
    }
  }
}

export function logger(): winston.Logger {
  return winston.createLogger({
    level: 'info',
    format: winston.format.simple(),
    transports: [
      new winston.transports.Console({
        format: winston.format.simple()
      })
    ]
  })
}