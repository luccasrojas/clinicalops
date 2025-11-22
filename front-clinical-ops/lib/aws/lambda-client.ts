import { LambdaClient } from '@aws-sdk/client-lambda';
import { fromNodeProviderChain, fromIni } from '@aws-sdk/credential-providers';

const region = process.env.AWS_REGION ?? process.env.NEXT_PUBLIC_AWS_REGION ?? 'us-east-1';

// Determine credentials provider based on environment
// Development: Use AWS profile 'admin-clinicalops'
// Production (Amplify): Use IAM role via fromNodeProviderChain
const getCredentials = () => {
  // If running locally (development), use the admin-clinicalops profile
  if (process.env.NODE_ENV === 'development' || !process.env.AWS_EXECUTION_ENV) {
    return fromIni({ profile: 'admin-clinicalops' });
  }

  // In production (Amplify), use automatic credential chain
  return fromNodeProviderChain();
};

// Use fromNodeProviderChain to automatically detect credentials from multiple sources:
// 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
// 2. Container metadata (ECS, Amplify Web Compute)
// 3. Instance metadata (EC2)
// 4. Credentials file (~/.aws/credentials with profile)
export const lambdaClient = new LambdaClient({
  region,
  credentials: getCredentials(),
});
