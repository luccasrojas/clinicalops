#!/bin/bash
# WebSocket API Gateway Setup Script for Clinical Notes Editor
# Run with: bash infrastructure/websocket-api-setup.sh
# Requires: AWS CLI configured with admin-clinicalops profile

set -e  # Exit on error

REGION="us-east-1"
PROFILE="admin-clinicalops"
ACCOUNT_ID="880140151067"

echo "🌐 Setting up WebSocket API Gateway for Clinical Notes Editor..."
echo "Region: $REGION"
echo "Profile: $PROFILE"
echo ""

# ============================================================================
# STEP 1: Create WebSocket API
# ============================================================================
echo "📡 Creating WebSocket API..."

API_RESPONSE=$(aws apigatewayv2 create-api \
  --name clinical-notes-realtime \
  --protocol-type WEBSOCKET \
  --route-selection-expression '$request.body.action' \
  --description "Real-time updates for clinical notes editor" \
  --region $REGION \
  --profile $PROFILE)

API_ID=$(echo $API_RESPONSE | jq -r '.ApiId')

if [ -z "$API_ID" ] || [ "$API_ID" == "null" ]; then
  echo "❌ Failed to create WebSocket API"
  exit 1
fi

echo "✅ WebSocket API created with ID: $API_ID"
echo ""

# ============================================================================
# STEP 2: Get Lambda Function ARNs
# ============================================================================
echo "🔍 Getting Lambda function ARNs..."

CONNECT_ARN=$(aws lambda get-function \
  --function-name websocket_connect \
  --query 'Configuration.FunctionArn' \
  --output text \
  --region $REGION \
  --profile $PROFILE 2>/dev/null || echo "")

DISCONNECT_ARN=$(aws lambda get-function \
  --function-name websocket_disconnect \
  --query 'Configuration.FunctionArn' \
  --output text \
  --region $REGION \
  --profile $PROFILE 2>/dev/null || echo "")

MESSAGE_ARN=$(aws lambda get-function \
  --function-name websocket_message \
  --query 'Configuration.FunctionArn' \
  --output text \
  --region $REGION \
  --profile $PROFILE 2>/dev/null || echo "")

if [ -z "$CONNECT_ARN" ] || [ -z "$DISCONNECT_ARN" ] || [ -z "$MESSAGE_ARN" ]; then
  echo "❌ Error: One or more Lambda functions not found"
  echo "   Make sure the following functions are deployed:"
  echo "   - websocket_connect"
  echo "   - websocket_disconnect"
  echo "   - websocket_message"
  exit 1
fi

echo "✅ Lambda functions found"
echo "   Connect: $CONNECT_ARN"
  echo "   Disconnect: $DISCONNECT_ARN"
echo "   Message: $MESSAGE_ARN"
echo ""

# ============================================================================
# STEP 3: Create Lambda Integrations
# ============================================================================
echo "🔗 Creating Lambda integrations..."

CONNECT_INTEGRATION_ID=$(aws apigatewayv2 create-integration \
  --api-id $API_ID \
  --integration-type AWS_PROXY \
  --integration-uri $CONNECT_ARN \
  --query 'IntegrationId' \
  --output text \
  --region $REGION \
  --profile $PROFILE)

DISCONNECT_INTEGRATION_ID=$(aws apigatewayv2 create-integration \
  --api-id $API_ID \
  --integration-type AWS_PROXY \
  --integration-uri $DISCONNECT_ARN \
  --query 'IntegrationId' \
  --output text \
  --region $REGION \
  --profile $PROFILE)

MESSAGE_INTEGRATION_ID=$(aws apigatewayv2 create-integration \
  --api-id $API_ID \
  --integration-type AWS_PROXY \
  --integration-uri $MESSAGE_ARN \
  --query 'IntegrationId' \
  --output text \
  --region $REGION \
  --profile $PROFILE)

echo "✅ Integrations created"
echo ""

# ============================================================================
# STEP 4: Create Routes
# ============================================================================
echo "🛣️  Creating WebSocket routes..."

aws apigatewayv2 create-route \
  --api-id $API_ID \
  --route-key '$connect' \
  --target "integrations/$CONNECT_INTEGRATION_ID" \
  --region $REGION \
  --profile $PROFILE > /dev/null

aws apigatewayv2 create-route \
  --api-id $API_ID \
  --route-key '$disconnect' \
  --target "integrations/$DISCONNECT_INTEGRATION_ID" \
  --region $REGION \
  --profile $PROFILE > /dev/null

aws apigatewayv2 create-route \
  --api-id $API_ID \
  --route-key '$default' \
  --target "integrations/$MESSAGE_INTEGRATION_ID" \
  --region $REGION \
  --profile $PROFILE > /dev/null

echo "✅ Routes created: \$connect, \$disconnect, \$default"
echo ""

# ============================================================================
# STEP 5: Create Deployment
# ============================================================================
echo "🚀 Deploying to 'prod' stage..."

aws apigatewayv2 create-deployment \
  --api-id $API_ID \
  --stage-name prod \
  --region $REGION \
  --profile $PROFILE > /dev/null

echo "✅ Deployment complete"
echo ""

# ============================================================================
# STEP 6: Grant API Gateway Permission to Invoke Lambda Functions
# ============================================================================
echo "🔐 Granting API Gateway permissions to invoke Lambda functions..."

# Grant permission for $connect
aws lambda add-permission \
  --function-name websocket_connect \
  --statement-id apigateway-websocket-connect-${API_ID} \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/*" \
  --region $REGION \
  --profile $PROFILE 2>/dev/null || echo "   (Permission may already exist)"

# Grant permission for $disconnect
aws lambda add-permission \
  --function-name websocket_disconnect \
  --statement-id apigateway-websocket-disconnect-${API_ID} \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/*" \
  --region $REGION \
  --profile $PROFILE 2>/dev/null || echo "   (Permission may already exist)"

# Grant permission for $default
aws lambda add-permission \
  --function-name websocket_message \
  --statement-id apigateway-websocket-message-${API_ID} \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/*" \
  --region $REGION \
  --profile $PROFILE 2>/dev/null || echo "   (Permission may already exist)"

echo "✅ Permissions granted"
echo ""

# ============================================================================
# STEP 7: Update update_medical_record Lambda with WebSocket Endpoint
# ============================================================================
echo "🔧 Updating update_medical_record Lambda with WebSocket endpoint..."

WS_ENDPOINT="https://$API_ID.execute-api.$REGION.amazonaws.com/prod"

aws lambda update-function-configuration \
  --function-name update_medical_record \
  --environment "Variables={AWS_REGION=$REGION,DYNAMODB_MEDICAL_HISTORIES_TABLE=medical_histories,DYNAMODB_VERSIONS_TABLE=medical_record_versions,DYNAMODB_CONNECTIONS_TABLE=websocket_connections,WS_API_ENDPOINT=$WS_ENDPOINT}" \
  --region $REGION \
  --profile $PROFILE > /dev/null

echo "✅ Lambda environment updated"
echo ""

# ============================================================================
# STEP 8: Test WebSocket Connection (Optional)
# ============================================================================
echo "🧪 Testing WebSocket connection..."

WS_URL="wss://$API_ID.execute-api.$REGION.amazonaws.com/prod"

echo "   WebSocket URL: $WS_URL"
echo ""
echo "   Test with wscat (install with: npm install -g wscat):"
echo "   wscat -c \"$WS_URL?historyID=test-123&userId=test-user\""
echo ""

# ============================================================================
# Summary
# ============================================================================
echo "======================================"
echo "✅ WebSocket API Setup Complete!"
echo "======================================"
echo ""
echo "API Information:"
echo "  API ID: $API_ID"
echo "  WebSocket URL: wss://$API_ID.execute-api.$REGION.amazonaws.com/prod"
echo "  Management Endpoint: https://$API_ID.execute-api.$REGION.amazonaws.com/prod"
echo "  Stage: prod"
echo ""
echo "Routes configured:"
echo "  - \$connect → websocket_connect"
echo "  - \$disconnect → websocket_disconnect"
echo "  - \$default → websocket_message"
echo ""
echo "Next steps:"
echo "  1. Update frontend environment variable:"
echo "     NEXT_PUBLIC_WS_URL=wss://$API_ID.execute-api.$REGION.amazonaws.com/prod"
echo ""
echo "  2. Test the connection:"
echo "     wscat -c \"wss://$API_ID.execute-api.$REGION.amazonaws.com/prod?historyID=test-123&userId=test-user\""
echo ""
echo "  3. Monitor logs:"
echo "     aws logs tail /aws/lambda/websocket_connect --follow --region $REGION --profile $PROFILE"
echo ""

# Save API ID to file for future reference
echo $API_ID > .websocket-api-id
echo "ℹ️  API ID saved to .websocket-api-id"
echo ""
