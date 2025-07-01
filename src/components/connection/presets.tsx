// src/components/connection/presets.ts
import { S3Connection } from '@/contexts/S3ConnectionContext'
import { JSX } from 'react'

export const presets: {
  label: string
  description: string
  instructions: JSX.Element
  values: Partial<Omit<S3Connection, 'id' | 'name'>>
}[] = [
  {
    label: 'AWS Key and Secret',
    description: 'Connect with your long-term IAM user credentials.',
    instructions: (
      <span>
        Create or locate your credentials in the AWS IAM console or <code>~/.aws/credentials</code>.{' '}
        <a
          href="https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users_create.html"
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-blue-400 hover:text-blue-300"
        >
          Learn more
        </a>
        .
      </span>
    ),
    values: {
      endpoint: 'https://s3.amazonaws.com',
      region: 'us-east-1',
      accessKeyId: '',
      secretAccessKey: '',
    },
  },
  {
    label: 'LocalStack',
    description: 'Uses test credentials for local development. No real AWS credentials needed.',
    instructions: (
      <span>
        Set endpoint to <code>http://localhost:4566</code>. Use <code>accessKeyId = testuser</code> and <code>secretAccessKey = testsecret</code>. No additional setup needed.
      </span>
    ),
    values: {
      endpoint: 'http://localhost:4566',
      region: 'us-east-1',
      accessKeyId: 'testuser',
      secretAccessKey: 'testsecret',
    },
  }

]
