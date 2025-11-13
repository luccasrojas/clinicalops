# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Prartis** is a clinical notes application that uses AI to assist healthcare professionals. The system records medical consultations, transcribes them using AssemblyAI, and generates structured clinical notes using OpenAI's GPT models.

The application is split into two main components:
- **next-app**: Next.js 15 frontend and backend (main application)
- **fastapi-app**: FastAPI backend for transcription and clinical note generation

## Architecture

### Data Flow

1. **Video/Audio Recording**: Uses Stream Video SDK for real-time consultation recording
2. **Recording Upload**: Audio recordings are uploaded to Google Cloud Storage (GCS)
3. **Async Processing (Inngest)**: When a recording ends, an Inngest workflow is triggered
4. **Transcription**: FastAPI calls AssemblyAI to transcribe audio with speaker labels
5. **Clinical Note Generation**: FastAPI uses OpenAI GPT-5 to generate structured clinical notes based on the transcript
6. **Storage**: Transcripts stored in GCS as JSONL, clinical notes stored in Convex

### Key Services Integration

- **Clerk**: Authentication and organization management (multi-tenant)
- **Convex**: Real-time database for users, meetings, agents, clinical notes, subscriptions
- **Drizzle + PostgreSQL**: Secondary database (currently minimal usage)
- **Stream Video**: Video calling and recording infrastructure
- **Inngest**: Background job processing for meeting recordings
- **Polar**: Subscription billing and payments
- **Google Cloud Storage**: File storage for recordings and transcripts

### Database Schema (Convex)

Main tables:
- `users`: Clerk user data synced to Convex
- `agents`: Patient simulation agents (real or AI-generated)
- `meetings`: Video consultation sessions with status tracking
- `templates`: Clinical note templates for customization
- `subscriptions`: Polar subscription data
- `products`: Polar product catalog
- `profiles`: User profile information (specialty, institution, etc.)

### Authentication & Authorization

- Uses Clerk with organization support (multi-tenant)
- Middleware enforces authentication on all routes except public routes
- Users without an organization are redirected to `/org-selection`
- Webhook routes are protected by `INTERNAL_WEBHOOK_SECRET`

### Meeting Status Processing

Meetings have statuses: `scheduled`, `in_progress`, `processing`, `completed`, `failed`

When processing (via Inngest), the system:
1. Transcribes audio (AssemblyAI via FastAPI)
2. Converts transcript to JSONL format
3. Uploads JSONL to GCS
4. Fetches user's clinical note template (if any)
5. Generates structured clinical note (OpenAI GPT-5 via FastAPI)
6. Saves results back to Convex

Processing progress is tracked in `statusProcessingData` with Spanish status messages.

## Development Commands

### Next.js App (next-app/)

```bash
# Install dependencies
pnpm install

# Start development server with Turbopack
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint
pnpm lint

# Database operations (Drizzle)
pnpm db:push
pnpm db:studio

# Inngest dev server (for background jobs)
pnpm dev:inngest

# Webhook tunneling for local development
pnpm dev:webhook
```

### FastAPI App (fastapi-app/)

```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn main:app --reload

# Run tests
pytest

# Test specific file
pytest test_transcribe_router.py
```

### Environment Variables

Both apps require environment variables. Key variables include:

**Next.js**:
- `NEXT_PUBLIC_CONVEX_URL`, `CONVEX_DEPLOYMENT`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_STREAM_VIDEO_API_KEY`, `STREAM_VIDEO_SECRET_KEY`
- `DATABASE_URL` (PostgreSQL)
- `INTERNAL_WEBHOOK_SECRET`
- `GCS_BUCKET_NAME`, `GCS_PROJECT_ID`, `GCS_SERVICE_ACCOUNT_JSON`
- `FASTAPI_APP_URL`

**FastAPI**:
- `OPENAI_API_KEY`
- `ASSEMBLY_KEY` (AssemblyAI)

## Code Organization

### Next.js App Structure

```
next-app/
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── (auth)/            # Auth routes (sign-in, sign-up)
│   │   ├── (landing)/         # Landing page
│   │   ├── dashboard/         # Main dashboard routes
│   │   ├── call/              # Video call interface
│   │   └── api/               # API routes
│   ├── components/            # React components
│   ├── modules/               # Feature modules (agents, meetings, templates)
│   ├── inngest/               # Inngest background jobs
│   ├── lib/                   # Utility functions
│   ├── db/                    # Drizzle schema
│   ├── gcs/                   # Google Cloud Storage client
│   ├── hooks/                 # React hooks
│   ├── prompts/               # LLM prompts
│   └── middleware.ts          # Clerk middleware
├── convex/                    # Convex backend functions
│   ├── schema.ts              # Database schema
│   ├── agents.ts              # Agent CRUD
│   ├── meetings.ts            # Meeting CRUD
│   ├── users.ts               # User management
│   ├── subscriptions.ts       # Polar integration
│   ├── webhooks/              # Webhook handlers
│   └── analytics/             # Analytics queries
└── public/                    # Static assets
```

### Module Pattern

Features are organized in `src/modules/` with consistent structure:
- `types.ts`: TypeScript types
- `hooks/`: React hooks for the feature
- `server/procedures.ts`: Server-side functions

Example: `modules/meetings/` contains all meeting-related code.

### FastAPI App Structure

```
fastapi-app/
├── main.py                    # FastAPI app entry point
├── routers/                   # API route handlers
│   └── transcribe_router.py  # Transcription & clinical note endpoints
├── modules/                   # Business logic
│   └── transcribe_module.py  # AssemblyAI & OpenAI integration
└── data/                      # Prompts and examples
    └── prompt.py              # System prompts for clinical notes
```

## Common Patterns

### Convex Queries and Mutations

- Defined in `convex/*.ts` files
- Imported via `api` from `convex/_generated/api`
- Called client-side with `useQuery` or `useMutation` hooks
- Called server-side with `fetchQuery` or `fetchMutation` from `convex/nextjs`

### Inngest Functions

- Defined in `src/inngest/functions.ts`
- Steps are wrapped with error handling via `withStepErrorHandling`
- Updates meeting status in Convex on each step
- Spanish status messages for user-facing progress

### Stream Video Integration

- Client created in `src/lib/stream-video.ts`
- Video calls use `@stream-io/video-react-sdk`
- Webhooks at `/api/webhook` handle recording completion
- When recording ends, triggers Inngest workflow

### Clerk Organization Pattern

- Multi-tenant: users belong to organizations
- Middleware redirects users without org to `/org-selection`
- User ID and Org ID available via `auth()` in server components

## Testing

### FastAPI Tests

```bash
# Run all tests
pytest

# Run specific test file
pytest test_transcribe_router.py

# Run with verbose output
pytest -v
```

Test files are colocated with the main application in `fastapi-app/`.

## Important Notes

- The application is bilingual: UI is Spanish (`esUY` locale), but code/comments are mixed English/Spanish
- Clinical notes use structured JSON format with specific medical fields
- AssemblyAI is configured for Spanish transcription with 2 speakers expected
- OpenAI GPT-5 is used with minimal reasoning effort for clinical note generation
- Transcripts are stored as JSONL format in GCS with 7-day signed URLs
- The `notebooks/` directory contains experimental Jupyter notebooks for prompt development
