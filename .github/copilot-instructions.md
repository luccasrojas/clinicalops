# GitHub Copilot Instructions for ClinicalOps

## Project Overview

Monorepo for a Spanish-language clinical transcription platform. Audio → AssemblyAI → OpenAI GPT-5 → Structured clinical notes.

## Architecture

**Production**: AWS Lambda microservices architecture. Frontend connects directly to Lambda functions.

### Components

1. **`lambdas/`** - Production AWS Lambda microservices (GitHub Actions auto-deploy)
2. **`front-clinical-ops/`** - Next.js 16 frontend (connects to Lambdas)
3. **`fastapi-app/`** - Example/reference FastAPI implementation (not used in production)

### Lambda Functions (`lambdas/`)

Each Lambda is self-contained with `lambda_function.py`, `requirements.txt`, and `lambda_config.yml`:

- **`transcribe/`** - AssemblyAI audio → Spanish transcription with speaker labels
- **`create_medical_record/`** - Transcription + format → GPT-5 clinical note
- **`extract_format/`** - Extract JSON structure from medical record example
- **`upload_example/`** - Handle medical record examples
- **`validate_example/`** - Validate medical record structure

**Auto-deployment**: Push to `lambdas` branch triggers `.github/workflows/deploy.yml` which:

1. Detects changed Lambda directories
2. Builds dependencies in official Lambda container (`public.ecr.aws/lambda/python:3.11`)
3. Creates/updates Lambda functions with config from `lambda_config.yml`
4. Deletes Lambdas removed from repo

### Frontend (`front-clinical-ops/`)

Next.js 16 + App Router, React 19, TypeScript, Tailwind CSS v4. Connects directly to Lambda functions via AWS API Gateway or Lambda Function URLs.

**Tech Stack:**

- **UI Components**: shadcn/ui (New York style) with Radix UI primitives
- **Styling**: Tailwind CSS v4 with CSS variables for theming
- **State Management**: Zustand for global state, React Hook Form for forms, TanStack Query v5 for server state
- **Fonts**: Montserrat (loaded via `next/font/google`)
- **Icons**: Lucide React
- **Animations**: Motion (Framer Motion successor)

## Critical Docker Patterns

### Environment Variables in Docker

**⚠️ CRITICAL**: `.env` files are in `.gitignore` and **NOT copied to Docker images**. Two working approaches:

```bash
# Option 1: Pass env vars explicitly (production)
docker run -p 8000:8000 \
  -e ASSEMBLY_KEY="your_key" \
  -e OPENAI_API_KEY="your_key" \
  prartis/fastapi-app-image

# Option 2: Mount .env as volume (local dev only)
docker run -p 8000:8000 \
  -v $(pwd)/fastapi-app/.env:/app/.env \
  prartis/fastapi-app-image
```

**Why `--env-file` often fails**: It passes variables from host → container, but `load_dotenv()` in code looks for `.env` FILE inside container (which doesn't exist). Code relies on `os.getenv()` which works with Docker env vars.

### Docker Build Context

Dockerfile does `COPY . /app` which respects `.gitignore`. Never commit `.env` to make it available in Docker - use runtime env vars instead.

## Development Commands

### Lambdas (Production)

```bash
# Test locally (from lambda directory)
python -c "from lambda_function import lambda_handler; print(lambda_handler({'audio_url': 'test'}, None))"

# Deploy: push to lambdas branch
git checkout lambdas
git push origin lambdas
```

### FastAPI (Example/Reference only)

```bash
# From fastapi-app/ directory
uvicorn main:app --reload        # Dev server at :8000
pytest -vv -s --tb=long         # Tests with prints and full tracebacks

# Docker (for reference)
docker build -t prartis/fastapi-app-image .
docker run -p 8000:8000 -v $(pwd)/.env:/app/.env prartis/fastapi-app-image
```

### Frontend

```bash
# From front-clinical-ops/ directory
npm install                      # First time only
npm run dev                      # Dev server at :3000
npm run build                    # Production build
npm start                        # Production server
npm run lint                     # ESLint check
```

## Spanish Medical Context

### Temporal Context Generation

**Cross-platform locale solution** in `lambdas/create_medical_record/lambda_function.py`:

```python
def generate_temporal_context():
    # Hardcoded Spanish arrays - no locale.setlocale() needed
    meses = ["enero", "febrero", ...]
    dias = ["lunes", "martes", ...]
    # Returns: "hoy es viernes, 28 de octubre de 2025 14:30."
```

**Why**: `locale.setlocale(locale.LC_TIME, "es_ES")` fails on some OS. Use hardcoded arrays for portability.

### OpenAI GPT-5 Integration

**Critical pattern** - GPT-5 uses different API structure than GPT-4:

```python
# CORRECT GPT-5 pattern (see lambdas/create_medical_record/)
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
- Access response via `completion.output[1].content[0].text` NOT `completion.choices[0].message.content`
- Add `reasoning={"effort": "minimal"}` for cost efficiency

### Clinical Note Structure

Medical records follow strict JSON structure defined in `lambdas/create_medical_record/prompts.py`:

```python
DEFAULT_MEDICAL_RECORD_FORMAT = {
    "datos_personales": {...},
    "motivo_consulta": "",
    "enfermedad_actual": "<relato cronopatológico en prosa clínica>",
    "antecedentes_relevantes": {...},
    "examen_fisico": {...},
    "paraclinicos_imagenes": [...],
    "impresion_diagnostica": [{"diagnostico": "", "cie10": ""}],
    "analisis_clinico": "",
    "plan_manejo": {...},
    "notas_calidad_datos": ""
}
```

**Critical rules** (from `SYSTEM_PROMPT`):

- Write in neutral Spanish medical terminology
- Use International System of units
- Express time in h/d/sem (hours/days/weeks)
- `enfermedad_actual` must be chronopathological prose (no bullet points)
- Don't invent data - omit fields without evidence
- Don't include pathological history in `impresion_diagnostica`

### AssemblyAI Configuration

```python
config = aai.TranscriptionConfig(
    speech_model=aai.SpeechModel.universal,
    speaker_labels=True,
    language_code="es",
    speakers_expected=2  # Doctor + patient
)
```

**Output format**: `"SpeakerA: texto\n\nSpeakerB: texto\n\n"`

## Code Patterns

### Adding Lambdas (Production)

1. Create directory in `lambdas/` with structure:
   ```
   my_lambda/
   ├── lambda_function.py  # Must have lambda_handler(event, context)
   ├── requirements.txt
   └── lambda_config.yml   # runtime, memory_size, timeout, handler
   ```
2. Push to `lambdas` branch - auto-deploys via GitHub Actions

### Lambda Config Pattern

```yaml
# lambda_config.yml
runtime: python3.11
memory_size: 256
timeout: 90
handler: lambda_function.lambda_handler
description: "Lambda function description"
```

### Frontend Architecture (Bulletproof React Pattern)

**Follow feature-based architecture** inspired by bulletproof-react:

```
front-clinical-ops/
├── app/                 # Next.js App Router pages
├── components/          # Shared components used across entire app
│   └── ui/             # shadcn/ui components (Button, Dialog, etc.)
├── features/           # Feature-based modules (MAIN ORGANIZATION)
│   └── [feature-name]/
│       ├── api/        # API calls & React Query hooks for this feature
│       ├── components/ # Feature-specific components
│       ├── hooks/      # Feature-specific hooks
│       ├── stores/     # Feature-specific state (Zustand)
│       ├── types/      # Feature-specific TypeScript types
│       └── utils/      # Feature-specific utility functions
├── hooks/              # Shared hooks used across entire app
├── lib/                # Pre-configured libraries (api-client, react-query config)
├── stores/             # Global state stores (Zustand)
├── styles/             # Global styles and Tailwind config
├── types/              # Shared TypeScript types
└── utils/              # Shared utility functions
```

**Key principles:**

1. **Feature isolation**: Each feature in `features/` is self-contained. Avoid cross-feature imports - compose features at the app level instead.
2. **Unidirectional architecture**: Code flows `shared → features → app`. Features can import from shared (`components/`, `hooks/`, `lib/`, `utils/`), but not vice versa.
3. **Colocation**: Keep code as close as possible to where it's used. Feature-specific code stays in `features/[name]/`.
4. **API layer pattern**: Each feature's API calls follow this structure:
   ```typescript
   // features/medical-records/api/get-records.ts
   export const getRecords = (params): Promise<RecordResponse> => {
     return api.get('/records', { params });
   };
   
   export const getRecordsQueryOptions = (params) => {
     return queryOptions({
       queryKey: ['records', params],
       queryFn: () => getRecords(params),
     });
   };
   
   export const useRecords = ({ queryConfig, ...params }) => {
     return useQuery({
       ...getRecordsQueryOptions(params),
       ...queryConfig,
     });
   };
   ```

**shadcn/ui component pattern** in `components/ui/`:

```tsx
// Use cva for variant styling
const componentVariants = cva("base-classes", {
  variants: {
    variant: { default: "...", destructive: "..." },
    size: { default: "...", sm: "...", lg: "..." },
  },
  defaultVariants: { variant: "default", size: "default" },
});

// Use Slot for asChild polymorphism
function Component({ asChild = false, ...props }) {
  const Comp = asChild ? Slot : "button";
  return <Comp data-slot="component" {...props} />;
}
```

**Import aliases** (from `tsconfig.json`):

- `@/components` → `components/` (shared only)
- `@/features` → `features/`
- `@/lib` → `lib/`
- `@/styles` → `styles/`
- `@/hooks` → `hooks/` (shared only)
- `@/stores` → `stores/`
- `@/types` → `types/`
- `@/utils` → `utils/`

### FastAPI Pattern (Example/Reference only)

The `fastapi-app/` directory shows router-module separation pattern:

- `routers/` - HTTP layer only (validation, error responses)
- `modules/` - Pure business logic (reusable in notebooks)
- `data/` - Prompts and configuration

To add endpoints: Create router in `routers/`, logic in `modules/`, register in `main.py`

## Style Conventions

### Python

- PEP8: 4-space indents, `snake_case` functions, `PascalCase` classes
- Type hints on FastAPI endpoints
- Lambda handlers: `def lambda_handler(event, context):`
- Modules should be pure functions where possible for notebook reuse

### TypeScript/React

- Functional components with TypeScript
- PascalCase for component files in `app/` directory
- Use `cn()` utility from `@/lib/utils` for className merging
- Tailwind utilities preferred over custom CSS
- Centralize shared styles in `styles/globals.css` using CSS variables
- **Feature-based organization**: Place feature-specific code in `features/[feature-name]/` (see Frontend Architecture section)
- **Avoid cross-feature imports**: Features should not import from other features, only from shared folders
- **API calls pattern**: Define fetcher function, queryOptions, and custom hook for each endpoint (see API layer example)
- **Colocation**: Keep components, hooks, types, and utils as close as possible to where they're used

## Testing

- Mock AssemblyAI/OpenAI for deterministic offline tests
- `pytest.mark.asyncio` for async handlers
- Reference `fastapi-app/test_main.py` patterns for examples (when available)
- **Frontend testing approach:**
  - **Integration tests > Unit tests**: Focus on testing features as users would interact with them
  - **Colocate tests**: Place tests next to components (`Component.test.tsx`) or in feature `__tests__/` folders
  - **Test behavior, not implementation**: Test what renders, not internal state details
  - **Tools**: Vitest for unit/integration tests, Playwright for E2E
  - **Mock API with MSW**: Use service workers to intercept HTTP requests during tests

## Deployment

### Lambdas → AWS (Production)

- **Branch**: `lambdas` (auto-deploys on push)
- **GitHub Actions OIDC**: `arn:aws:iam::880140151067:role/GitHubActionRole`
- **Lambda Execution Role**: `arn:aws:iam::880140151067:role/LambdaExecutionRole`
- **Region**: `us-east-1`

**Deployment process**:

1. Detects changed Lambda directories
2. Runs `docker run` with `public.ecr.aws/lambda/python:3.11` to install dependencies
3. Creates ZIP with `package/` + `*.py` files
4. Creates/updates Lambda with config from `lambda_config.yml`

### AWS CLI Usage

**CRITICAL**: Always use `--profile admin-clinicalops` with AWS CLI commands:

```bash
aws s3 ls --profile admin-clinicalops
aws lambda list-functions --profile admin-clinicalops
aws cloudfront create-invalidation --profile admin-clinicalops --distribution-id XXX --paths "/*"
```

### FastAPI → GCP (Reference/Example)

- Manual: `docker build` → `docker push` to Artifact Registry
- Target: `us-central1-docker.pkg.dev/prartis-cloud-platform/fastapi-app-artifact/fastapi-app-image`

## Common Gotchas

- `.env` files never enter Docker images - use runtime env vars or volume mounts
- Lambda dependencies must build in Lambda's Python container (GitHub Actions handles this)
- Frontend uses `npm` (not yarn/pnpm) for package management
- Clinical notes require specific JSON structure (see `lambdas/create_medical_record/prompts.py`)
- Audio files (`.mp3`, `.wav`, etc.) are `.gitignore`d
- GPT-5 API is different from GPT-4 - use `responses.create()` not `chat.completions.create()`
- Temporal context uses hardcoded Spanish arrays (no `locale.setlocale()`)
- AssemblyAI output format: `"SpeakerA: text\n\nSpeakerB: text\n\n"`
- shadcn/ui dependencies may require matching versions (e.g., `@tanstack/react-query` v5 needs `@tanstack/react-query-devtools` v5)
- **Do NOT import between features**: Features should be composed at the app level, not imported cross-feature
- **Avoid barrel exports** in features: They prevent tree-shaking and hurt performance. Import files directly instead

