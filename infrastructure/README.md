# Infrastructure Setup for Clinical Notes Editor

This directory contains scripts and documentation for setting up the AWS infrastructure required for the Google Docs-like clinical notes editor.

## Overview

The editor requires the following AWS resources:

1. **Lambda Functions** (8 functions)
   - `update_medical_record` - Update clinical notes
   - `get_version_history` - Retrieve version history
   - `restore_version` - Restore previous versions
   - `export_medical_record` - Export to PDF/DOCX
   - `websocket_connect` - Handle WebSocket connections
   - `websocket_disconnect` - Handle disconnections
   - `websocket_message` - Handle WebSocket messages

2. **DynamoDB Tables** (3 tables)
   - `medical_record_versions` - Version history storage
   - `websocket_connections` - Active WebSocket connections
   - `medical_histories` - Main medical records (already exists)

3. **WebSocket API Gateway** (Real-time updates)
   - WebSocket endpoint for live updates
   - Routes: `$connect`, `$disconnect`, `$default`

4. **S3 Bucket**
   - `clinicalops-exports` - Temporary storage for PDF/DOCX exports

## Setup Instructions

### Prerequisites

- AWS CLI installed and configured
- AWS profile `admin-clinicalops` with PowerUserAccess
- Git repository with `lambdas` branch

### Step 1: Create DynamoDB Tables and S3 Bucket

```bash
# From project root
cd infrastructure
bash dynamodb-tables.sh
```

This script will create:
- `medical_record_versions` table
- `websocket_connections` table (with 24-hour TTL)
- `clinicalops-exports` S3 bucket (with 7-day lifecycle policy)

### Step 2: Deploy Lambda Functions

```bash
# From project root
git checkout lambdas
git add lambdas/update_medical_record/
git add lambdas/get_version_history/
git add lambdas/restore_version/
git add lambdas/export_medical_record/
git add lambdas/websocket_connect/
git add lambdas/websocket_disconnect/
git add lambdas/websocket_message/
git commit -m "feat: add clinical notes editor Lambda functions"
git push origin lambdas
```

GitHub Actions will automatically deploy the Lambda functions.

### Step 3: Create WebSocket API Gateway

#### Option A: Using AWS Console

1. Go to **API Gateway Console**
2. Click **Create API** → **WebSocket API**
3. Configure:
   - **API name**: `clinical-notes-realtime`
   - **Route selection expression**: `$request.body.action`
4. Add routes:
   - `$connect` → Lambda: `websocket_connect`
   - `$disconnect` → Lambda: `websocket_disconnect`
   - `$default` → Lambda: `websocket_message`
5. Deploy to stage `prod`
6. Note the WebSocket URL: `wss://{api-id}.execute-api.us-east-1.amazonaws.com/prod`

#### Option B: Using AWS CLI

```bash
# Create WebSocket API
aws apigatewayv2 create-api \
  --name clinical-notes-realtime \
  --protocol-type WEBSOCKET \
  --route-selection-expression '$request.body.action' \
  --region us-east-1 \
  --profile admin-clinicalops

# Save the API ID from the response
API_ID="<your-api-id>"

# Get Lambda ARNs
CONNECT_ARN=$(aws lambda get-function --function-name websocket_connect --query 'Configuration.FunctionArn' --output text --region us-east-1 --profile admin-clinicalops)
DISCONNECT_ARN=$(aws lambda get-function --function-name websocket_disconnect --query 'Configuration.FunctionArn' --output text --region us-east-1 --profile admin-clinicalops)
MESSAGE_ARN=$(aws lambda get-function --function-name websocket_message --query 'Configuration.FunctionArn' --output text --region us-east-1 --profile admin-clinicalops)

# Create integrations
CONNECT_INTEGRATION_ID=$(aws apigatewayv2 create-integration \
  --api-id $API_ID \
  --integration-type AWS_PROXY \
  --integration-uri $CONNECT_ARN \
  --query 'IntegrationId' \
  --output text \
  --region us-east-1 \
  --profile admin-clinicalops)

DISCONNECT_INTEGRATION_ID=$(aws apigatewayv2 create-integration \
  --api-id $API_ID \
  --integration-type AWS_PROXY \
  --integration-uri $DISCONNECT_ARN \
  --query 'IntegrationId' \
  --output text \
  --region us-east-1 \
  --profile admin-clinicalops)

MESSAGE_INTEGRATION_ID=$(aws apigatewayv2 create-integration \
  --api-id $API_ID \
  --integration-type AWS_PROXY \
  --integration-uri $MESSAGE_ARN \
  --query 'IntegrationId' \
  --output text \
  --region us-east-1 \
  --profile admin-clinicalops)

# Create routes
aws apigatewayv2 create-route \
  --api-id $API_ID \
  --route-key '$connect' \
  --target "integrations/$CONNECT_INTEGRATION_ID" \
  --region us-east-1 \
  --profile admin-clinicalops

aws apigatewayv2 create-route \
  --api-id $API_ID \
  --route-key '$disconnect' \
  --target "integrations/$DISCONNECT_INTEGRATION_ID" \
  --region us-east-1 \
  --profile admin-clinicalops

aws apigatewayv2 create-route \
  --api-id $API_ID \
  --route-key '$default' \
  --target "integrations/$MESSAGE_INTEGRATION_ID" \
  --region us-east-1 \
  --profile admin-clinicalops

# Create deployment
aws apigatewayv2 create-deployment \
  --api-id $API_ID \
  --stage-name prod \
  --region us-east-1 \
  --profile admin-clinicalops

# Grant API Gateway permission to invoke Lambda functions
aws lambda add-permission \
  --function-name websocket_connect \
  --statement-id apigateway-websocket-connect \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:us-east-1:880140151067:$API_ID/*/*" \
  --region us-east-1 \
  --profile admin-clinicalops

aws lambda add-permission \
  --function-name websocket_disconnect \
  --statement-id apigateway-websocket-disconnect \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:us-east-1:880140151067:$API_ID/*/*" \
  --region us-east-1 \
  --profile admin-clinicalops

aws lambda add-permission \
  --function-name websocket_message \
  --statement-id apigateway-websocket-message \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:us-east-1:880140151067:$API_ID/*/*" \
  --region us-east-1 \
  --profile admin-clinicalops

# Print WebSocket URL
echo "WebSocket URL: wss://$API_ID.execute-api.us-east-1.amazonaws.com/prod"
```

### Step 4: Update Lambda Environment Variables

After creating the WebSocket API, update the `update_medical_record` Lambda function with the WebSocket endpoint:

```bash
# Replace with your actual API ID
API_ID="<your-api-id>"
WS_ENDPOINT="https://$API_ID.execute-api.us-east-1.amazonaws.com/prod"

aws lambda update-function-configuration \
  --function-name update_medical_record \
  --environment "Variables={AWS_REGION=us-east-1,DYNAMODB_MEDICAL_HISTORIES_TABLE=medical_histories,DYNAMODB_VERSIONS_TABLE=medical_record_versions,DYNAMODB_CONNECTIONS_TABLE=websocket_connections,WS_API_ENDPOINT=$WS_ENDPOINT}" \
  --region us-east-1 \
  --profile admin-clinicalops
```

### Step 5: Grant IAM Permissions

Ensure the Lambda execution role has the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:880140151067:table/medical_histories",
        "arn:aws:dynamodb:us-east-1:880140151067:table/medical_record_versions",
        "arn:aws:dynamodb:us-east-1:880140151067:table/websocket_connections"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::clinicalops-exports/*"
    },
    {
      "Effect": "Allow",
      "Action": "execute-api:ManageConnections",
      "Resource": "arn:aws:execute-api:us-east-1:880140151067:*/*/@connections/*"
    }
  ]
}
```

## Frontend Configuration

After infrastructure is set up, update the frontend environment variables:

```bash
# In front-clinical-ops/.env.local
NEXT_PUBLIC_WS_URL=wss://<api-id>.execute-api.us-east-1.amazonaws.com/prod
```

## Testing the Setup

### Test Lambda Functions

```bash
# Test update_medical_record
aws lambda invoke \
  --function-name update_medical_record \
  --payload '{"body":"{\"historyID\":\"test-123\",\"structuredClinicalNote\":\"{}\",\"userId\":\"user-1\"}"}' \
  response.json \
  --region us-east-1 \
  --profile admin-clinicalops

cat response.json
```

### Test WebSocket Connection

```bash
# Install wscat if not already installed
npm install -g wscat

# Connect to WebSocket
wscat -c "wss://<api-id>.execute-api.us-east-1.amazonaws.com/prod?historyID=test-123&userId=user-1"

# Send ping
{"action": "ping"}

# Should receive pong
```

## Monitoring and Logs

View Lambda logs in CloudWatch:

```bash
# View logs for update_medical_record
aws logs tail /aws/lambda/update_medical_record \
  --follow \
  --region us-east-1 \
  --profile admin-clinicalops
```

## Troubleshooting

### Lambda Function Not Found

Make sure you pushed to the `lambdas` branch and GitHub Actions completed successfully.

### WebSocket Connection Fails

- Check that API Gateway has correct Lambda integrations
- Verify Lambda permissions for API Gateway invocation
- Check CloudWatch logs for Lambda errors

### DynamoDB Access Denied

- Verify IAM role has DynamoDB permissions
- Check that table names match environment variables

### S3 Upload Fails

- Verify bucket exists: `aws s3 ls s3://clinicalops-exports --profile admin-clinicalops`
- Check IAM role has S3 permissions

## Cost Estimates

Based on moderate usage (100 active users, 1000 edits/day):

- **Lambda**: ~$10-20/month
- **DynamoDB**: ~$5-10/month (PAY_PER_REQUEST)
- **API Gateway WebSocket**: ~$5/month
- **S3**: <$1/month (with 7-day lifecycle)

**Total**: ~$20-35/month

## Cleanup

To remove all resources:

```bash
# Delete DynamoDB tables
aws dynamodb delete-table --table-name medical_record_versions --region us-east-1 --profile admin-clinicalops
aws dynamodb delete-table --table-name websocket_connections --region us-east-1 --profile admin-clinicalops

# Delete S3 bucket (must be empty first)
aws s3 rm s3://clinicalops-exports --recursive --profile admin-clinicalops
aws s3api delete-bucket --bucket clinicalops-exports --region us-east-1 --profile admin-clinicalops

# Delete WebSocket API
aws apigatewayv2 delete-api --api-id <api-id> --region us-east-1 --profile admin-clinicalops

# Delete Lambda functions (via GitHub Actions or manually)
```

## Support

For issues or questions, check:
- CloudWatch Logs for error details
- DynamoDB tables for data validation
- API Gateway logs for WebSocket connection issues
