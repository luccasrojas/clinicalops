import os
import json
import boto3
import hmac
import hashlib
import base64
from botocore.exceptions import ClientError

# Cognito configuration
COGNITO_CLIENT_ID = os.getenv("COGNITO_CLIENT_ID")
COGNITO_CLIENT_SECRET = os.getenv("COGNITO_CLIENT_SECRET")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

cognito_client = boto3.client('cognito-idp', region_name=AWS_REGION)


def calculate_secret_hash(username, client_id, client_secret):
    """Calculate SECRET_HASH for Cognito operations"""
    message = username + client_id
    dig = hmac.new(
        key=client_secret.encode('utf-8'),
        msg=message.encode('utf-8'),
        digestmod=hashlib.sha256
    ).digest()
    return base64.b64encode(dig).decode()


def lambda_handler(event, context):
    """
    Lambda function to verify email with OTP code
    
    Expected event body:
    {
        "email": "doctor@example.com",
        "code": "123456"
    }
    
    Returns:
    - Success: Confirmation message
    - Error: Error message and status code
    """
    
    try:
        # Parse request body
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', {})
        
        # Extract and validate required fields
        email = body.get('email')
        code = body.get('code')

        print(f"Received verification request for email: {email}")
        print(f"Received verification code: {code}")
        
        # Validate required fields
        if not all([email, code]):
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Both email and code are required'
                })
            }
        
        # Calculate SECRET_HASH
        secret_hash = calculate_secret_hash(email, COGNITO_CLIENT_ID, COGNITO_CLIENT_SECRET)
        
        # Confirm sign up with verification code
        cognito_client.confirm_sign_up(
            ClientId=COGNITO_CLIENT_ID,
            SecretHash=secret_hash,
            Username=email,
            ConfirmationCode=code
        )
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Email verified successfully',
                'email': email,
                'verified': True
            })
        }
    
    except cognito_client.exceptions.CodeMismatchException:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Invalid verification code'
            })
        }
    
    except cognito_client.exceptions.ExpiredCodeException:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Verification code has expired'
            })
        }
    
    except cognito_client.exceptions.NotAuthorizedException:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'User is already confirmed'
            })
        }
    
    except ClientError as e:
        print(f"ClientError: {e}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': f'Verification error: {str(e)}'
            })
        }
    
    except Exception as e:
        print(f"Unexpected error: {e}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error'
            })
        }
