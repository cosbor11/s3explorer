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
  },
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
    label: 'AWS SDK Assume Role',
    description: 'Requires temporary credentials assumed from a role.',
    instructions: (
      <span>
        Use AWS CLI or SDK to assume a role and export temporary credentials.{' '}
        <a
          href="https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html"
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-blue-400 hover:text-blue-300"
        >
          See documentation
        </a>
        .
      </span>
    ),
    values: {
      endpoint: 'https://s3.amazonaws.com',
      region: 'us-east-1',
      accessKeyId: 'assume-role-access-key-id',
      secretAccessKey: 'assume-role-secret-access-key',
    },
  },
  {
    label: 'AWS SDK Session Token',
    description: 'Requires session-based credentials from AWS STS.',
    instructions: (
      <span>
        Generate session credentials with AWS STS{' '}
        <code>get-session-token</code> and provide <code>accessKeyId</code>, <code>secretAccessKey</code>, and <code>sessionToken</code>.{' '}
        <a
          href="https://docs.aws.amazon.com/cli/latest/reference/sts/get-session-token.html"
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-blue-400 hover:text-blue-300"
        >
          See guide
        </a>
        .
      </span>
    ),
    values: {
      endpoint: 'https://s3.amazonaws.com',
      region: 'us-east-1',
      accessKeyId: 'session-access-key-id',
      secretAccessKey: 'session-secret-access-key',
    },
  },
]
