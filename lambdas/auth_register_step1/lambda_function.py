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
    Lambda function to register a new doctor in Cognito (Step 1)

    Expected event body:
    {
        "email": "doctor@example.com",
        "password": "Password123",
        "name": "Juan",
        "familyName": "Pérez",
        "specialty": "Cardiología",
        "medicalRegistry": "MED-12345"
    }

    Returns:
    - Success: User sub (ID) and confirmation status
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
        password = body.get('password')
        name = body.get('name')
        family_name = body.get('familyName')
        specialty = body.get('specialty')
        medical_registry = body.get('medicalRegistry')

        # Validate required fields
        if not all([email, password, name, family_name, specialty, medical_registry]):
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'All fields are required: email, password, name, familyName, specialty, medicalRegistry'
                })
            }

        # Calculate SECRET_HASH
        secret_hash = calculate_secret_hash(email, COGNITO_CLIENT_ID, COGNITO_CLIENT_SECRET)

        # Prepare user attributes
        # Note: Custom attributes in Cognito have double "custom:" prefix due to creation
        user_attributes = [
            {'Name': 'email', 'Value': email},
            {'Name': 'name', 'Value': name},
            {'Name': 'family_name', 'Value': family_name},
            {'Name': 'custom:custom:specialty', 'Value': specialty},
            {'Name': 'custom:custom:medicalreg', 'Value': medical_registry}
        ]

        # Sign up user in Cognito
        response = cognito_client.sign_up(
            ClientId=COGNITO_CLIENT_ID,
            SecretHash=secret_hash,
            Username=email,
            Password=password,
            UserAttributes=user_attributes
        )

        user_sub = response['UserSub']
        user_confirmed = response['UserConfirmed']

        # Auto-confirm the user (admin action)
        # This skips email verification for doctor registration
        try:
            cognito_client.admin_confirm_sign_up(
                UserPoolId=os.getenv("COGNITO_USER_POOL_ID"),
                Username=email
            )
            user_confirmed = True
        except Exception as confirm_error:
            print(f"Error auto-confirming user: {confirm_error}")
            # Continue even if auto-confirm fails

        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'User registered successfully in Cognito',
                'userSub': user_sub,
                'email': email,
                'confirmed': user_confirmed,
                'nextStep': 'Please proceed to step 2 to provide example clinical history'
            })
        }

    except cognito_client.exceptions.UsernameExistsException:
        return {
            'statusCode': 409,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'A user with this email already exists'
            })
        }

    except cognito_client.exceptions.InvalidPasswordException as e:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': f'Invalid password: {str(e)}'
            })
        }

    except cognito_client.exceptions.InvalidParameterException as e:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': f'Invalid parameter: {str(e)}'
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
                'error': f'Registration error: {str(e)}'
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
