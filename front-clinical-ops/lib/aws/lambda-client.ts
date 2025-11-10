import { LambdaClient } from '@aws-sdk/client-lambda';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';

const region = process.env.AWS_REGION ?? process.env.NEXT_PUBLIC_AWS_REGION ?? 'us-east-1';

// Use fromNodeProviderChain to automatically detect credentials from multiple sources:
// 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
// 2. Container metadata (ECS, Amplify Web Compute)
// 3. Instance metadata (EC2)
// 4. Credentials file (~/.aws/credentials)
export const lambdaClient = new LambdaClient({
  region,
  credentials: fromNodeProviderChain(),
});
