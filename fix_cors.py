#!/usr/bin/env python3
"""
Script to fix CORS configuration for web-clinicalops API Gateway
Run this after AWS SSO login
"""

import boto3
import sys

API_ID = "gdo2g4iyq1"
REGION = "us-east-1"
PROFILE = "admin-clinicalops"

# Resources to fix
RESOURCES = [
    ("m5hn05", "/presigned-url"),
    ("9mtqiy", "/medical-histories"),
    ("vcru8m", "/medical-histories/{historyID}"),
    ("aknfw4", "/patients"),
]

def enable_cors(apigateway, resource_id, path):
    """Enable CORS for a resource"""
    print(f"Enabling CORS for {path} (ID: {resource_id})")

    try:
        # Delete existing OPTIONS method if it exists
        try:
            apigateway.delete_method(
                restApiId=API_ID,
                resourceId=resource_id,
                httpMethod='OPTIONS'
            )
        except:
            pass

        # Create OPTIONS method
        apigateway.put_method(
            restApiId=API_ID,
            resourceId=resource_id,
            httpMethod='OPTIONS',
            authorizationType='NONE'
        )

        # Create OPTIONS integration (MOCK)
        apigateway.put_integration(
            restApiId=API_ID,
            resourceId=resource_id,
            httpMethod='OPTIONS',
            type='MOCK',
            requestTemplates={
                'application/json': '{"statusCode": 200}'
            }
        )

        # Create OPTIONS method response
        apigateway.put_method_response(
            restApiId=API_ID,
            resourceId=resource_id,
            httpMethod='OPTIONS',
            statusCode='200',
            responseParameters={
                'method.response.header.Access-Control-Allow-Headers': False,
                'method.response.header.Access-Control-Allow-Methods': False,
                'method.response.header.Access-Control-Allow-Origin': False
            }
        )

        # Create OPTIONS integration response
        apigateway.put_integration_response(
            restApiId=API_ID,
            resourceId=resource_id,
            httpMethod='OPTIONS',
            statusCode='200',
            responseParameters={
                'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
                'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'",
                'method.response.header.Access-Control-Allow-Origin': "'*'"
            }
        )

        print(f"  ✓ CORS enabled for {path}")
        return True

    except Exception as e:
        print(f"  ✗ Failed to enable CORS for {path}: {e}")
        return False

def main():
    print("🔧 Fixing CORS for API Gateway: web-clinicalops")
    print(f"   API ID: {API_ID}")
    print(f"   Region: {REGION}\n")

    try:
        # Create session with profile
        session = boto3.Session(profile_name=PROFILE, region_name=REGION)
        apigateway = session.client('apigateway')

        # Enable CORS for all resources
        success_count = 0
        for resource_id, path in RESOURCES:
            if enable_cors(apigateway, resource_id, path):
                success_count += 1

        print(f"\n✅ CORS enabled for {success_count}/{len(RESOURCES)} resources")

        # Deploy API
        print("\n🚀 Deploying API to prod stage...")
        apigateway.create_deployment(
            restApiId=API_ID,
            stageName='prod',
            description='CORS fix deployment'
        )
        print("✅ API deployed successfully!")

        print("\n📝 Testing CORS...")
        print("Run this command to test:")
        print(f"curl -X OPTIONS 'https://web.clinicalops.co/medical-histories' -H 'Origin: http://localhost:3000' -v")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nMake sure you've run: aws sso login --profile admin-clinicalops")
        sys.exit(1)

if __name__ == "__main__":
    main()
