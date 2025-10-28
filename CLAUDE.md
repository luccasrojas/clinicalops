# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ClinicalOps is a serverless clinical operations platform for transcribing audio consultations and generating clinical notes. The system uses AssemblyAI for transcription and OpenAI GPT-5 for structured clinical note generation.

**Architecture**: Full AWS serverless stack
- **Backend**: AWS Lambda functions (no traditional API server)
- **Frontend**: Next.js 16 App Router
- **Infrastructure**: AWS Cognito (auth), DynamoDB (data), API Gateway (routing), S3 (storage)

**Three main components:**
- `lambdas/` - AWS Lambda microservices (production backend)
- `front-clinical-ops/` - Next.js frontend application
- `notebooks/` - Jupyter notebooks for prototyping
- `fastapi-app/` - **DEPRECATED** - Example/reference only (not used in production)

## Architecture

### Backend (AWS Lambda - Serverless)

**ALL backend logic runs on AWS Lambda functions**. Each lambda is self-contained with its own dependencies and configuration.

**Structure:**
```
lambdas/
└── [lambda-name]/
    ├── lambda_function.py    # Handler function
    ├── requirements.txt       # Python dependencies
    ├── lambda_config.yml      # Lambda configuration (memory, timeout, env vars)
    └── prompts.py            # (optional) Prompts and constants
```

**Core Lambda Functions:**

1. **`transcribe/`** - Audio transcription
   - Input: Audio URL
   - Process: AssemblyAI API → Spanish transcription with speaker labels
   - Output: Formatted transcription text

2. **`create_medical_record/`** - Clinical note generation
   - Input: Transcription + format example
   - Process: OpenAI GPT-5 → Structured JSON clinical note
   - Output: Complete medical record in JSON format

3. **`extract_format/`** - Format extraction
   - Input: Example medical record text
   - Process: GPT-5 → Extract JSON structure
   - Output: JSON schema for medical records

4. **`auth_login/`** - User authentication
   - Input: Email + password
   - Process: AWS Cognito authentication
   - Output: JWT tokens + user info

5. **`auth_register_step1/`** - Doctor registration (basic info)
   - Input: Doctor details + credentials
   - Process: Create user in Cognito
   - Output: User ID (doctorID)

6. **`auth_register_step2/`** - Doctor registration (example history)
   - Input: Example clinical history text + doctor info
   - Process: extract_format lambda → save to DynamoDB
   - Output: Confirmation

**Deployment:**
- Push to `lambdas` branch triggers GitHub Actions
- Automatic deployment to AWS Lambda
- See `.github/workflows/deploy.yml` for details

**Key integration points:**
- AssemblyAI API configured for Spanish (`es`), speaker labels, 2 expected speakers
- OpenAI GPT-5 with reasoning effort set to "minimal"
- AWS Cognito for authentication (User Pool ID: `us-east-1_nuZ12lsNq`)
- DynamoDB `doctors` table for doctor profiles
- API Gateway (`auth-clinicalops`) routes requests to lambdas

### Frontend (Next.js)

**Core Stack:**
- Next.js 16 with App Router
- TypeScript 5 with React 19
- Tailwind CSS v4

**Architecture & Patterns:**
- **Architecture**: Feature-based organization following Bulletproof React patterns
- **State management**:
  - TanStack Query v5 (`@tanstack/react-query`) for server state/caching
  - Zustand for global application state
  - React Hook Form for form state
- **UI Components**:
  - shadcn/ui components (New York style)
  - Radix UI primitives (`@radix-ui/react-*`)
  - class-variance-authority (cva) for variant styling
  - tailwind-merge + clsx for className management
- **Animations**: Motion (Framer Motion successor v12) - `motion`, `framer-motion`
- **Validation**: Zod for schema validation
- **HTTP Client**: Axios for API requests
- **Icons**: Lucide React
- **Utilities**:
  - `@tanstack/eslint-plugin-query` for React Query linting
  - MSW (Mock Service Worker) for API mocking in tests
  - Prettier for code formatting

**Project structure:**
```
front-clinical-ops/
├── app/                 # Next.js routes (pages only)
├── components/          # Shared components ONLY
│   └── ui/             # shadcn/ui component library
├── features/           # Feature modules (PRIMARY organization)
│   └── [feature]/
│       ├── api/        # API calls & React Query hooks
│       ├── components/ # Feature-specific components
│       ├── hooks/      # Feature-specific hooks
│       ├── stores/     # Feature state (Zustand)
│       └── types/      # Feature types
├── lib/                # Configured libraries (api-client, etc)
├── hooks/              # Shared hooks
├── stores/             # Global stores
└── types/              # Shared types
```

**Key principles:**
1. **Feature isolation**: No cross-feature imports - each feature is self-contained
2. **Unidirectional flow**: `shared → features → app` (features can't import from app or other features)
3. **Colocation**: Keep code close to where it's used
4. **API pattern**: Each endpoint has: fetcher function + queryOptions + custom hook
5. **No barrel exports**: Import files directly for better tree-shaking

**API Base URLs:**

The frontend connects to two separate APIs:

1. **Auth API** (`auth.clinicalops.co`):
   - User authentication (login, register)
   - User management
   - Uses `authApi` client from `@/lib/api-client`

   Available endpoints:
   - `POST /auth/login` - User login
   - `POST /auth/register/step1` - Doctor signup (basic info)
   - `POST /auth/register/step2` - Doctor signup (example history)

2. **Main API** (`api.clinicalops.co`):
   - AI transformations (transcription, medical records)
   - Medical record operations
   - Uses `api` client from `@/lib/api-client`

   Available endpoints:
   - `POST /transcribe` - Transcribe audio
   - `POST /create-medical-record` - Generate clinical note
   - `POST /extract-format` - Extract medical record structure

## Development Commands

### Lambdas (Production Backend)

```bash
# Test lambda locally (from lambda directory)
python -c "from lambda_function import lambda_handler; print(lambda_handler({'key': 'value'}, None))"

# Deploy: push to lambdas branch
git checkout lambdas
git add lambdas/my_lambda/
git commit -m "feat: add my_lambda function"
git push origin lambdas
# GitHub Actions automatically deploys changed lambdas
```

### Frontend

```bash
# Navigate to frontend
cd front-clinical-ops

# Install dependencies
npm install

# Run development server
npm run dev
# Server runs at http://localhost:3000

# Build for production
npm run build

# Start production server
npm start

# Lint
npm run lint
```

### Notebooks

```bash
# Navigate to notebooks
cd notebooks

# Install dependencies
pip install -r requirements.txt

# Run Jupyter
jupyter notebook
```

## Environment Variables

### Lambda Environment Variables
Configured in each lambda's `lambda_config.yml`:

**Auth lambdas** (`auth_login`, `auth_register_step1`, `auth_register_step2`):
```yaml
environment_variables:
  COGNITO_CLIENT_ID: "4o7ibv9hdvn25f0012hdj149gn"
  COGNITO_CLIENT_SECRET: "1lv31uvm0bh7pbvs37qqsioisqbjeh67geiv5nsjr9eguu345u9e"
  COGNITO_USER_POOL_ID: "us-east-1_nuZ12lsNq"
  AWS_REGION: "us-east-1"
  DYNAMODB_DOCTORS_TABLE: "doctors"
```

**Other lambdas**:
- `OPENAI_API_KEY` - OpenAI API key for GPT-5
- `ASSEMBLY_KEY` - AssemblyAI API key for transcription

### Frontend Environment Variables
Create `.env.local` in `front-clinical-ops/`:
```
# Auth API (for login, register, user management)
NEXT_PUBLIC_AUTH_API_BASE_URL=https://auth.clinicalops.co

# Main API (for AI transformations, medical records)
NEXT_PUBLIC_API_BASE_URL=https://api.clinicalops.co
```

## AWS Resources

### Cognito
- **User Pool ID**: `us-east-1_nuZ12lsNq`
- **Client ID**: `4o7ibv9hdvn25f0012hdj149gn`
- **Region**: us-east-1
- **Tier**: ESSENTIALS (supports email MFA when configured with SES)
- **Custom attributes**: `custom:custom:specialty`, `custom:custom:medicalreg`

### DynamoDB
- **Table**: `doctors`
- **Partition Key**: `doctorID` (String - Cognito user sub)
- **Schema**:
  ```json
  {
    "doctorID": "string (Cognito sub)",
    "email": "string",
    "name": "string",
    "lastName": "string",
    "especiality": "string",
    "medicalRegistry": "string",
    "example_history": "object (processed by extract_format)",
    "example_history_raw": "string",
    "createdAt": "string",
    "registrationComplete": "boolean"
  }
  ```

### API Gateway
- **API Name**: `auth-clinicalops`
- **API ID**: `x4s8t05ane`
- **Stage**: `prod`
- **Base URL**: `https://x4s8t05ane.execute-api.us-east-1.amazonaws.com/prod`

## Code Patterns

### Frontend Feature Development (Bulletproof React)

When adding a new feature to the frontend, follow this structure:

**1. Create feature folder** in `features/[feature-name]/`

**2. API layer** (`features/[feature-name]/api/`):

```typescript
// Example 1: Auth API (for authentication endpoints)
// features/auth/api/login.ts
import { authApi } from '@/lib/api-client';
import { useMutation } from '@tanstack/react-query';
import { LoginResponse } from '@/types/auth';

type LoginData = {
  email: string;
  password: string;
};

export const login = (data: LoginData): Promise<LoginResponse> => {
  return authApi.post('/auth/login', data);
};

export const useLogin = () => {
  return useMutation({
    mutationFn: login,
  });
};
```

```typescript
// Example 2: Main API (for AI transformations)
// features/medical-records/api/get-records.ts
import { api } from '@/lib/api-client';
import { queryOptions, useQuery } from '@tanstack/react-query';

export type MedicalRecord = {
  id: string;
  patientName: string;
  data: object;
};

export const getRecords = (): Promise<{ records: MedicalRecord[] }> => {
  return api.get('/medical-records');
};

export const getRecordsQueryOptions = () => {
  return queryOptions({
    queryKey: ['medical-records'],
    queryFn: () => getRecords(),
  });
};

export const useMedicalRecords = ({ queryConfig } = {}) => {
  return useQuery({
    ...getRecordsQueryOptions(),
    ...queryConfig,
  });
};
```

**3. Components** (`features/[feature-name]/components/`):
- Feature-specific UI components
- Use shadcn/ui components from `@/components/ui`
- Keep components small and focused

**4. Types** (`features/[feature-name]/types/`):
- TypeScript definitions for this feature only

**5. Hooks** (`features/[feature-name]/hooks/`) (optional):
- Feature-specific custom hooks

**6. Stores** (`features/[feature-name]/stores/`) (optional):
- Feature-specific Zustand stores

**7. Compose at app level**:
- Import features in `app/` routes
- NEVER import across features

### Adding New Lambda Functions

1. **Create directory** in `lambdas/[lambda-name]/`

2. **Create `lambda_function.py`**:
```python
import os
import json
import boto3

def lambda_handler(event, context):
    """
    Lambda handler function

    Args:
        event: API Gateway event or direct invocation
        context: Lambda context object

    Returns:
        Response dict with statusCode, headers, body
    """
    try:
        # Parse input
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', {})

        # Your logic here
        result = process_data(body)

        # Return success response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(result)
        }

    except Exception as e:
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Internal server error'})
        }
```

3. **Create `requirements.txt`**:
```
boto3>=1.28.0
# Add other dependencies
```

4. **Create `lambda_config.yml`**:
```yaml
runtime: python3.11
memory_size: 256
timeout: 30
handler: lambda_function.lambda_handler
description: "Lambda function description"
environment_variables:
  VAR_NAME: "value"
  AWS_REGION: "us-east-1"
```

5. **Deploy**: Push to `lambdas` branch

### Component Best Practices (from Bulletproof React)

1. **Colocation**: Keep things close to where they're used
2. **Avoid large components**: Extract nested render functions to separate components
3. **Stay consistent**: Use linters and formatters
4. **Limit props**: If too many props, consider splitting or using composition
5. **Abstract shared components**: Build a component library in `components/ui/`
6. **Wrap 3rd party components**: Adapt them to app needs

### State Management Categories

1. **Component State**: Local to components (`useState`, `useReducer`)
2. **Application State**: Global app state (modals, notifications) - use Context, Zustand, or Redux
3. **Server Cache State**: API data - use TanStack Query (already configured)
4. **Form State**: Use React Hook Form with zod validation (already configured)
5. **URL State**: Data in URL params - use Next.js router

## Testing Guidelines

### Backend (Lambda Functions)
- Test lambda handlers with mock events
- Mock external services (AssemblyAI, OpenAI, AWS services)
- Test error handling and edge cases
- Example:
```python
def test_lambda_handler():
    event = {'body': json.dumps({'key': 'value'})}
    context = None
    response = lambda_handler(event, context)
    assert response['statusCode'] == 200
```

### Frontend (React/TypeScript)

**Testing philosophy from Bulletproof React**:
- **Integration tests > Unit tests**: Test features as users interact with them
- **Test behavior, not implementation**: Focus on what renders and user interactions
- **Colocate tests**: Place tests next to code
  - Component tests: `Component.test.tsx` next to `Component.tsx`
  - Feature tests: `features/[name]/__tests__/` folder
- **Mock APIs with MSW**: Use service workers instead of mocking fetch

**Testing tools:**
- **Vitest**: Unit and integration tests
- **Testing Library**: Test components as users interact
- **Playwright**: End-to-end tests
- **MSW**: Mock API responses

**Example:**
```typescript
// features/auth/__tests__/login.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { LoginForm } from '../components/login-form';

it('displays error on invalid credentials', async () => {
  render(<LoginForm />);

  // User interactions
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'test@example.com' }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Login' }));

  await waitFor(() => {
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });
});
```

## Important Notes

- **Language**: Clinical notes and transcriptions are in Spanish
- **OpenAI model**: Uses GPT-5 with minimal reasoning effort
- **Temporal context**: Custom implementation avoids `locale.setlocale()` for cross-platform compatibility
- **Backend**: ALL production code runs on AWS Lambda (fastapi-app is reference only)
- **Deployment**: Lambdas auto-deploy on push to `lambdas` branch
- **API Gateway**: Routes all requests to appropriate Lambda functions
- **Authentication**: AWS Cognito manages user authentication
- **Database**: DynamoDB stores doctor profiles and data
- **Frontend Architecture**: Bulletproof React patterns with strict feature isolation

## Lambda-Specific Patterns

### Spanish Temporal Context
```python
def generate_temporal_context():
    # Hardcoded Spanish arrays - no locale.setlocale() needed
    meses = ["enero", "febrero", "marzo", ...]
    dias = ["lunes", "martes", "miércoles", ...]
    # Returns: "hoy es viernes, 28 de octubre de 2025 14:30."
```

### OpenAI GPT-5 Integration
```python
# CORRECT GPT-5 pattern
completion = client.responses.create(
    model="gpt-5",
    reasoning={"effort": "minimal"},
    input=[{"role": "system", "content": prompt}, ...],
    text={"format": {"type": "json_object"}}
)
data = json.loads(completion.output[1].content[0].text)
```

**Key differences from GPT-4:**
- Use `responses.create()` NOT `chat.completions.create()`
- Parameter is `input` NOT `messages`
- Access via `completion.output[1].content[0].text` NOT `completion.choices[0].message.content`
- Add `reasoning={"effort": "minimal"}` for cost efficiency

### AssemblyAI Configuration
```python
config = aai.TranscriptionConfig(
    speech_model=aai.SpeechModel.universal,
    speaker_labels=True,
    language_code="es",
    speakers_expected=2  # Doctor + patient
)
```

### AWS Cognito Authentication Pattern
```python
import hmac
import hashlib
import base64

def calculate_secret_hash(username, client_id, client_secret):
    """Calculate SECRET_HASH for Cognito operations"""
    message = username + client_id
    dig = hmac.new(
        key=client_secret.encode('utf-8'),
        msg=message.encode('utf-8'),
        digestmod=hashlib.sha256
    ).digest()
    return base64.b64encode(dig).decode()

# Use in InitiateAuth
response = cognito_client.initiate_auth(
    ClientId=COGNITO_CLIENT_ID,
    AuthFlow='USER_PASSWORD_AUTH',
    AuthParameters={
        'USERNAME': email,
        'PASSWORD': password,
        'SECRET_HASH': secret_hash
    }
)
```

## Deployment

### Lambdas (Automatic via GitHub Actions)
1. Make changes to lambda code
2. Commit and push to `lambdas` branch
3. GitHub Actions automatically:
   - Detects changed lambdas
   - Builds in official Lambda container
   - Deploys to AWS
   - Configures from `lambda_config.yml`

## AWS Configuration

**IMPORTANT**: All AWS CLI commands must use the `admin-clinicalops` profile.

Always append `--profile admin-clinicalops` to AWS CLI commands:

```bash
# Examples:
aws s3 ls --profile admin-clinicalops
aws lambda list-functions --profile admin-clinicalops
aws cloudfront create-invalidation --profile admin-clinicalops --distribution-id XXX --paths "/*"
```

### Frontend (Manual)
```bash
cd front-clinical-ops
npm run build
# Deploy to hosting service (Vercel, Netlify, AWS Amplify, etc.)
```

## Frontend Dependencies

The following dependencies should be installed in `front-clinical-ops/`:

```bash
# Core dependencies (already installed)
npm install next@16 react@19.2 react-dom@19.2

# State Management & Data Fetching
npm install @tanstack/react-query@^5 zustand@^5 axios@^1

# UI Components & Styling
npm install @radix-ui/react-slot@^1 @radix-ui/react-label@^2 @radix-ui/react-separator@^1
npm install class-variance-authority clsx tailwind-merge lucide-react

# Forms & Validation
npm install react-hook-form@^7 zod@^3

# Animations
npm install motion framer-motion@^12

# Development Tools
npm install -D @tanstack/eslint-plugin-query@^5 prettier@^3 eslint-config-prettier@^10

# Testing (optional but recommended)
npm install -D msw@^2 @testing-library/react @testing-library/user-event vitest
```

## AWS CLI Usage

**ALWAYS use profile**: `--profile admin-clinicalops`

```bash
# Lambda
aws lambda list-functions --profile admin-clinicalops --region us-east-1
aws lambda invoke --function-name auth_login --payload '{}' response.json --profile admin-clinicalops

# API Gateway
aws apigateway get-rest-apis --profile admin-clinicalops --region us-east-1

# DynamoDB
aws dynamodb scan --table-name doctors --profile admin-clinicalops --region us-east-1

# Cognito
aws cognito-idp list-users --user-pool-id us-east-1_nuZ12lsNq --profile admin-clinicalops --region us-east-1
```
