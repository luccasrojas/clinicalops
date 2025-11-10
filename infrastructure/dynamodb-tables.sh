#!/bin/bash
# DynamoDB Tables Creation Script for Clinical Notes Editor
# Run with: bash infrastructure/dynamodb-tables.sh
# Requires: AWS CLI configured with admin-clinicalops profile

set -e  # Exit on error

REGION="us-east-1"
PROFILE="admin-clinicalops"

echo "🏗️  Creating DynamoDB tables for Clinical Notes Editor..."
echo "Region: $REGION"
echo "Profile: $PROFILE"
echo ""

# ============================================================================
# TABLE 1: medical_record_versions (Version History)
# ============================================================================
echo "📦 Creating table: medical_record_versions"

aws dynamodb create-table \
  --table-name medical_record_versions \
  --attribute-definitions \
    AttributeName=historyID,AttributeType=S \
    AttributeName=versionTimestamp,AttributeType=N \
  --key-schema \
    AttributeName=historyID,KeyType=HASH \
    AttributeName=versionTimestamp,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --tags Key=Project,Value=ClinicalOps Key=Purpose,Value=VersionHistory \
  --region $REGION \
  --profile $PROFILE

echo "✅ Table medical_record_versions created successfully"
echo ""

# Wait for table to be active
echo "⏳ Waiting for table to become active..."
aws dynamodb wait table-exists \
  --table-name medical_record_versions \
  --region $REGION \
  --profile $PROFILE
echo "✅ Table is active"
echo ""

# ============================================================================
# TABLE 2: websocket_connections (WebSocket Connection Tracking)
# ============================================================================
echo "📦 Creating table: websocket_connections"

aws dynamodb create-table \
  --table-name websocket_connections \
  --attribute-definitions \
    AttributeName=connectionId,AttributeType=S \
  --key-schema \
    AttributeName=connectionId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --tags Key=Project,Value=ClinicalOps Key=Purpose,Value=WebSocketConnections \
  --region $REGION \
  --profile $PROFILE

echo "✅ Table websocket_connections created successfully"
echo ""

# Wait for table to be active
echo "⏳ Waiting for table to become active..."
aws dynamodb wait table-exists \
  --table-name websocket_connections \
  --region $REGION \
  --profile $PROFILE
echo "✅ Table is active"
echo ""

# Enable TTL on websocket_connections for automatic cleanup
echo "🔧 Enabling TTL on websocket_connections..."
aws dynamodb update-time-to-live \
  --table-name websocket_connections \
  --time-to-live-specification "Enabled=true, AttributeName=ttl" \
  --region $REGION \
  --profile $PROFILE
echo "✅ TTL enabled (24-hour automatic cleanup)"
echo ""

# ============================================================================
# TABLE 3: Update existing medical_histories table (if needed)
# ============================================================================
echo "🔍 Checking if medical_histories table exists..."

if aws dynamodb describe-table \
  --table-name medical_histories \
  --region $REGION \
  --profile $PROFILE > /dev/null 2>&1; then

  echo "✅ Table medical_histories already exists"
  echo "ℹ️  Note: Ensure the table has these fields:"
  echo "   - structuredClinicalNote (String)"
  echo "   - structuredClinicalNoteOriginal (String)"
  echo "   - lastEditedAt (Number)"
  echo "   - lastEditedBy (String)"
  echo ""
  echo "   These will be added automatically by the Lambda functions when first used."
  echo ""
else
  echo "⚠️  Table medical_histories does not exist!"
  echo "   This table should already exist from the previous setup."
  echo "   If you need to create it, use the following command:"
  echo ""
  echo "   aws dynamodb create-table \\"
  echo "     --table-name medical_histories \\"
  echo "     --attribute-definitions AttributeName=historyID,AttributeType=S \\"
  echo "     --key-schema AttributeName=historyID,KeyType=HASH \\"
  echo "     --billing-mode PAY_PER_REQUEST \\"
  echo "     --region $REGION \\"
  echo "     --profile $PROFILE"
  echo ""
fi

# ============================================================================
# TABLE 4: Create S3 bucket for exports (if needed)
# ============================================================================
echo "🪣 Checking if S3 bucket for exports exists..."

BUCKET_NAME="clinicalops-exports"

if aws s3 ls "s3://$BUCKET_NAME" --profile $PROFILE 2>&1 | grep -q 'NoSuchBucket'; then
  echo "📦 Creating S3 bucket: $BUCKET_NAME"

  aws s3api create-bucket \
    --bucket $BUCKET_NAME \
    --region $REGION \
    --profile $PROFILE

  # Enable versioning (optional but recommended)
  aws s3api put-bucket-versioning \
    --bucket $BUCKET_NAME \
    --versioning-configuration Status=Enabled \
    --profile $PROFILE

  # Set lifecycle policy to delete exports after 7 days
  cat > /tmp/lifecycle-policy.json <<EOF
{
  "Rules": [
    {
      "Id": "DeleteExportsAfter7Days",
      "Status": "Enabled",
      "Prefix": "exports/",
      "Expiration": {
        "Days": 7
      }
    }
  ]
}
EOF

  aws s3api put-bucket-lifecycle-configuration \
    --bucket $BUCKET_NAME \
    --lifecycle-configuration file:///tmp/lifecycle-policy.json \
    --profile $PROFILE

  rm /tmp/lifecycle-policy.json

  echo "✅ S3 bucket $BUCKET_NAME created with 7-day lifecycle policy"
else
  echo "✅ S3 bucket $BUCKET_NAME already exists"
fi
echo ""

# ============================================================================
# Summary
# ============================================================================
echo "======================================"
echo "✅ DynamoDB Tables Setup Complete!"
echo "======================================"
echo ""
echo "Created tables:"
echo "  1. medical_record_versions - Version history storage"
echo "  2. websocket_connections - WebSocket connection tracking (with TTL)"
echo ""
echo "Existing resources:"
echo "  - medical_histories - Main medical records table"
echo "  - clinicalops-exports - S3 bucket for PDF/DOCX exports"
echo ""
echo "Next steps:"
echo "  1. Deploy Lambda functions: git push origin lambdas"
echo "  2. Create WebSocket API Gateway"
echo "  3. Update Lambda environment variables with WebSocket endpoint"
echo ""
