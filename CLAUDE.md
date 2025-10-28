# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo containing a clinical operations platform for transcribing audio consultations and generating clinical notes. The system uses AssemblyAI for transcription and OpenAI GPT-5 for structured clinical note generation.

**Three main components:**
- `fastapi-app/` - Backend API service
- `front-clinical-ops/` - Next.js frontend
- `notebooks/` - Jupyter notebooks for prototyping

## Architecture

### Backend (FastAPI)

**Structure:**
- `main.py` - Application entry point with router registration
- `routers/` - API endpoint definitions (router pattern)
- `modules/` - Business logic implementation
- `data/` - Prompts and data constants

**Core workflow:**
1. Audio URL → `transcribe_audio()` → Spanish transcription with speaker labels
2. Transcription → `generate_clinical_note()` → Structured JSON clinical note

**Key integration points:**
- AssemblyAI API configured for Spanish (`es`), speaker labels, and 2 expected speakers
- OpenAI GPT-5 with reasoning effort set to "minimal"
- Temporal context generation (Spanish date/time without locale dependencies)

### Frontend (Next.js)

- Next.js 16 with App Router
- TypeScript with React 19
- Tailwind CSS v4
- **Architecture**: Feature-based organization following Bulletproof React patterns
- **State management**: TanStack Query v5 for server state, Zustand for global state
- **UI**: shadcn/ui components (Radix UI primitives)

**Project structure:**
```
front-clinical-ops/
├── app/                 # Next.js routes (pages)
├── components/          # Shared components only
│   └── ui/             # shadcn/ui component library
├── features/           # Feature modules (MAIN organization)
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
- Feature isolation: No cross-feature imports
- Unidirectional flow: shared → features → app
- Colocation: Keep code close to where it's used
- API pattern: fetcher + queryOptions + custom hook per endpoint

## Development Commands

### Backend

```bash
# Navigate to backend
cd fastapi-app

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn main:app --reload
# Server runs at http://localhost:8000

# Run tests
pytest                    # All tests
pytest test_main.py       # Specific file
pytest -vv -s --tb=long   # Verbose with print statements and full tracebacks
pytest -v                 # Verbose output

# Docker build and run
docker build -t prartis/fastapi-app-image .
docker run -p 8000:8000 prartis/fastapi-app-image
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

Required for backend (`fastapi-app/.env`):
- `OPENAI_API_KEY` - OpenAI API key for GPT-5
- `ASSEMBLY_KEY` - AssemblyAI API key for transcription

## API Endpoints

### Production endpoints:
- `POST /api/transcribe` - Transcribe audio from URL
  - Payload: `{"audio_url": "https://..."}`
- `POST /api/clinical-note` - Generate clinical note from transcription
  - Payload: `{"transcription": "...", "clinical_note_example": "..."}`

### Test endpoints (GET):
- `GET /api/test-transcribe` - Test transcription with hardcoded URL
- `GET /api/test-clinical-note` - Test clinical note generation

## Code Patterns

### Frontend Feature Development

When adding a new feature to the frontend:

1. **Create feature folder** in `features/[feature-name]/`
2. **API layer** (`features/[feature-name]/api/`):
   ```typescript
   // get-items.ts
   export const getItems = (params): Promise<Response> => {
     return api.get('/items', { params });
   };
   
   export const getItemsQueryOptions = (params) => {
     return queryOptions({
       queryKey: ['items', params],
       queryFn: () => getItems(params),
     });
   };
   
   export const useItems = ({ queryConfig, ...params }) => {
     return useQuery({
       ...getItemsQueryOptions(params),
       ...queryConfig,
     });
   };
   ```
3. **Components** (`features/[feature-name]/components/`): Feature-specific UI
4. **Types** (`features/[feature-name]/types/`): TypeScript definitions for this feature
5. **Compose at app level**: Import features in `app/` routes, never cross-feature

### Adding new API endpoints:
1. Create router in `routers/` following `transcribe_router.py` pattern
2. Create module in `modules/` for business logic
3. Register router in `main.py` with `app.include_router()`

### Router/Module separation:
- Routers handle HTTP layer (validation, error handling, response formatting)
- Modules contain pure business logic (can be imported in notebooks)

### Testing:
- Use FastAPI TestClient for endpoint testing
- See `test_main.py` for examples
- Include both success and error cases

## Important Notes

- **Language**: Clinical notes and transcriptions are in Spanish
- **OpenAI model**: Uses GPT-5 with minimal reasoning effort
- **Temporal context**: Custom implementation avoids `locale.setlocale()` for cross-platform compatibility
- **Security TODO**: Webhook secret middleware needed for production (see `main.py:13-15`)
- **Deployment**: Google Cloud Build config in `cloudbuild.yaml` deploys to Artifact Registry

## Deployment

Backend is containerized and deployed to Google Cloud Platform:
- Artifact Registry: `us-central1-docker.pkg.dev/prartis-cloud-platform/fastapi-app-artifact/fastapi-app-image`
- Build triggered via Cloud Build using `cloudbuild.yaml`
