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
    """Calculate SECRET_HASH for Cognito authentication"""
    message = username + client_id
    dig = hmac.new(
        key=client_secret.encode('utf-8'),
        msg=message.encode('utf-8'),
        digestmod=hashlib.sha256
    ).digest()
    return base64.b64encode(dig).decode()


def lambda_handler(event, context):
    """
    Lambda function to authenticate users with AWS Cognito

    Expected event body:
    {
        "email": "user@example.com",
        "password": "Password123"
    }

    Returns:
    - Success: Access token, ID token, refresh token, and user info
    - Error: Error message and status code
    """

    try:
        # Parse request body
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', {})

        email = body.get('email')
        password = body.get('password')

        if not email or not password:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Email and password are required'
                })
            }

        # Calculate SECRET_HASH
        secret_hash = calculate_secret_hash(email, COGNITO_CLIENT_ID, COGNITO_CLIENT_SECRET)

        # Authenticate with Cognito using USER_PASSWORD_AUTH flow
        response = cognito_client.initiate_auth(
            ClientId=COGNITO_CLIENT_ID,
            AuthFlow='USER_PASSWORD_AUTH',
            AuthParameters={
                'USERNAME': email,
                'PASSWORD': password,
                'SECRET_HASH': secret_hash
            }
        )

        # Check if there's a challenge (like MFA or password change required)
        if 'ChallengeName' in response:
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'challenge': response['ChallengeName'],
                    'session': response['Session'],
                    'challengeParameters': response.get('ChallengeParameters', {})
                })
            }

        # Successful authentication
        auth_result = response['AuthenticationResult']

        # Get user information
        user_info = cognito_client.get_user(
            AccessToken=auth_result['AccessToken']
        )

        # Format user attributes
        user_attributes = {attr['Name']: attr['Value'] for attr in user_info['UserAttributes']}

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Login successful',
                'accessToken': auth_result['AccessToken'],
                'idToken': auth_result['IdToken'],
                'refreshToken': auth_result['RefreshToken'],
                'expiresIn': auth_result['ExpiresIn'],
                'tokenType': auth_result['TokenType'],
                'user': {
                    'username': user_info['Username'],
                    'email': user_attributes.get('email'),
                    'name': user_attributes.get('name'),
                    'familyName': user_attributes.get('family_name'),
                    'sub': user_attributes.get('sub')
                }
            })
        }

    except cognito_client.exceptions.NotAuthorizedException:
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Incorrect email or password'
            })
        }

    except cognito_client.exceptions.UserNotFoundException:
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'User not found'
            })
        }

    except cognito_client.exceptions.UserNotConfirmedException:
        return {
            'statusCode': 403,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'User email not confirmed. Please check your email for confirmation code.'
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
                'error': f'Authentication error: {str(e)}'
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
