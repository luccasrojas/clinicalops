# GitHub Copilot Instructions for ClinicalOps

## Project Overview
Monorepo for a Spanish-language clinical transcription and note generation platform. Audio consultations → AssemblyAI transcription → OpenAI GPT-5 structured clinical notes.

## Architecture

### Backend (`fastapi-app/`)
FastAPI service with clean separation of concerns:
- **`main.py`** - Entry point, router registration only
- **`routers/`** - HTTP layer (validation, error handling, responses)
- **`modules/`** - Pure business logic (importable in notebooks)
- **`data/`** - Prompts and configuration constants

**Key pattern**: Keep routers thin. All business logic goes in `modules/` for reusability and testability.

### Frontend (`front-clinical-ops/`)
- Next.js 16 + App Router
- React 19 + TypeScript + Tailwind CSS v4
- Currently boilerplate - UI development in progress

### Notebooks (`notebooks/`)
Jupyter notebooks for prototyping. Keep lightweight; commit rendered `.ipynb` files.

## Critical Workflows

### Development Commands
```bash
# Backend (from fastapi-app/)
uvicorn main:app --reload        # Dev server at :8000
pytest                           # Run tests
pytest -vv -s --tb=long         # Verbose with prints and full tracebacks

# Frontend (from front-clinical-ops/)
pnpm install                     # First time only
pnpm dev                         # Dev server at :3000
pnpm lint                        # Lint check
```

### Environment Variables
Backend requires `.env` in `fastapi-app/`:
- `OPENAI_API_KEY` - GPT-5 access
- `ASSEMBLY_KEY` - AssemblyAI transcription

## Code Patterns

### Adding API Endpoints
1. Create router in `routers/` (follow `transcribe_router.py` pattern)
2. Implement logic in `modules/` (follow `transcribe_module.py` pattern)
3. Register in `main.py`: `app.include_router(your_router.router, prefix="/api")`

### API Endpoints Structure
Production endpoints are POST with JSON payloads:
- `/api/transcribe` - `{"audio_url": "https://..."}`
- `/api/clinical-note` - `{"transcription": "...", "clinical_note_example": "..."}`

### Spanish Language Context
All medical content is in **Spanish**. Clinical notes use:
- Neutral Spanish medical terminology
- International System of Units (SI)
- Active voice, short sentences
- Temporal context generation (`generate_temporal_context()` in `transcribe_module.py`)

### Temporal Context Implementation
**Critical**: `generate_temporal_context()` currently uses `locale.setlocale(locale.LC_TIME, "es_ES")` which **fails on some OS**. A locale-free brute-force implementation is commented out in `transcribe_module.py` for cross-platform compatibility. Use that approach if encountering locale errors.

### OpenAI Integration
Uses GPT-5 with:
- `reasoning={"effort": "minimal"}`
- `text={"format": {"type": "json_object"}}` for structured output
- Response accessed via `completion.output[1].content[0].text`

### AssemblyAI Configuration
Configured for clinical consultations:
- Language: Spanish (`es`)
- Speaker labels enabled
- Expected speakers: 2 (doctor/patient)
- Model: `SpeechModel.universal`

## Style Conventions

### Python (Backend)
- PEP8: 4-space indents, `snake_case` functions, `PascalCase` classes
- Type hints on FastAPI endpoints
- Short docstrings where logic is non-obvious
- Test files mirror module names: `test_transcribe_router.py`
- Use `pytest.mark.asyncio` for async handlers

### TypeScript/React (Frontend)
- ES modules, functional components
- PascalCase file names in `app/`
- Tailwind utility classes (centralize shared styles in `app/globals.css`)
- ESLint for code quality

## Testing
- Use FastAPI `TestClient` for endpoint testing
- Mock external APIs (AssemblyAI, OpenAI) for deterministic offline tests
- Include success and error cases
- Reference: Look for test patterns in `fastapi-app/` when they exist

## Deployment
Backend deploys to Google Cloud Platform:
- Containerized via `Dockerfile`
- Cloud Build config in `cloudbuild.yaml`
- Target: `us-central1-docker.pkg.dev/prartis-cloud-platform/fastapi-app-artifact/fastapi-app-image`

**Security TODO**: Webhook secret middleware needed (see `main.py:13-15`)

## Common Gotchas
- Never commit API keys - use `.env` files
- Notebooks > 5MB should be `.gitignore`d
- Clinical notes require specific JSON structure (see `data/prompt.py`)
- Frontend uses `pnpm`, not `npm`
- Backend modules must be pure logic (no FastAPI dependencies) for notebook reuse
