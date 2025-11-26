# ClinicalOps Agent Guide

This monorepo powers Prartis/ClinicalOps, a Spanish-language clinical documentation platform that records encounters, transcribes audio, and generates structured medical notes. Production traffic runs through AWS Lambda microservices that are consumed by a Next.js 16 frontend. Legacy FastAPI + Next.js code still exists under `clinicians-app-main/` as a reference implementation.

---

## 1. Repo Overview

- **Languages & stacks**: Python 3.11 for Lambdas/FastAPI, TypeScript/React 19 for the frontend, Tailwind v4, Tiptap, AWS SDK v3.  
- **Primary data flow**: Audio/recording → AssemblyAI transcription → GPT‑5 JSON note generation → DynamoDB/Convex storage → Next.js editor.
- **Docs to know**:  
  - `CLINICAL_NOTES_ARCHITECTURE.md`: deep dive into end-to-end flow (JSON schema, editors, synchronization).  
  - `.github/copilot-instructions.md`: detailed patterns for Lambdas, GPT-5 usage, architecture decisions.

### Top-level directories

| Path | Purpose |
| --- | --- |
| `front-clinical-ops/` | **Active frontend** (Next.js 16 App Router, Bulletproof React structure). Talks to Lambdas via a server-side `/api/lambda` proxy. |
| `lambdas/` | Source of record for production AWS Lambda microservices (auth, transcription, medical history CRUD, exports, WebSocket handlers, etc.). Pushing to the `lambdas` branch triggers auto-deploy. |
| `clinicians-app-main/next-app/` | Legacy Next.js 15 app (Clerk, Convex, Inngest). Keep for reference/migrations but do not couple new work to it. |
| `clinicians-app-main/fastapi-app/` | Reference FastAPI backend with AssemblyAI/OpenAI logic mirrored in some Lambdas. Useful for local experiments/tests. |
| `infrastructure/` | AWS bootstrap scripts (Dynamo tables, S3 exports bucket, WebSocket API Gateway wiring). |
| `notebooks/` | Exploratory notebooks/utilities for prompt work and transcript analysis (keep outputs small). |
| `recording/` | Example clinical histories/transcripts for dev/testing. |
| `fix_cors.py` | Utility script to fix API Gateway CORS for `web-clinicalops` (uses profile `admin-clinicalops`). |

---

## 2. Frontend (`front-clinical-ops/`)

### Architecture

```
front-clinical-ops/
├── app/              # Next.js App Router routes, layouts, error boundaries
│   ├── api/lambda/   # Server route invoking AWS Lambda via SDK
│   ├── auth/         # Login/register pages
│   ├── dashboard/    # Authenticated experience
│   └── provider.tsx  # Wraps React Query + Auth context
├── components/       # Shared UI; `components/ui/` = shadcn primitives
├── features/         # MAIN organization (auth, patients, recording, medical-histories, medical-records-editor, etc.)
│   └── [feature]/
│       ├── api/        # Fetchers + TanStack Query options/hooks
│       ├── components/ # Feature-specific UI
│       ├── hooks/, stores/, types/, utils/
├── lib/              # Pre-configured libs (`lambda-api`, AWS SDK client, React Query config)
├── styles/           # Global Tailwind styles (v4)
├── types/, utils/    # Shared TS helpers
└── public/           # Static assets
```

- **React 19 + Next.js 16**: uses the App Router with server components where possible.
- **State**: React Query v5 via `app/provider.tsx`, feature-specific Zustand stores (e.g., `features/medical-records-editor/stores`), React Hook Form + Zod for forms, local state for UI.
- **UI Stack**: shadcn/ui + Radix primitives, Montserrat font, lucide icons, Motion for animations, Tailwind utilities only (no ad-hoc CSS unless unavoidable).
- **Auth**: `features/auth/contexts/auth-context.tsx` persists Clerk-like tokens in `localStorage` + cookies for middleware, and exposes helpers such as `getDoctorID`.
- **Editor**: `features/medical-records-editor` is a Tiptap-based JSON note editor with toolbars, export menu (`html-docx-js`, `jspdf`), version history panel, and a WebSocket-friendly save pipeline (via Lambdas).
- **Recording flow**: `features/recording` uploads audio, requests a signed URL (`generate_presigned_url` Lambda), and polls `create_medical_history_from_recording`.

### Lambda proxy pattern

- Client code never hits AWS directly. Instead, `lib/lambda-api.ts` posts to `/api/lambda`, passing `{ functionName, payload, invocationType }`.
- `app/api/lambda/route.ts` (Node runtime) uses `@aws-sdk/client-lambda` with `fromNodeProviderChain` credentials to invoke the Lambda synchronously and unwrap HTTP-like responses. Set `AWS_REGION`/`NEXT_PUBLIC_AWS_REGION` + credentials (`~/.aws/credentials`, environment variables, or container metadata) before running `npm run dev`.

### Feature/module rules (Bulletproof React)

1. **Unidirectional imports**: shared (`components/`, `hooks/`, `lib/`, `utils/`) → features → `app/`. Never import from another feature.
2. **Colocation**: keep hooks/types/utils next to their feature. Only promote to shared when multiple features need it.
3. **API layer pattern**: each feature's `api/` folder defines (a) fetcher, (b) `queryOptions`, (c) hook wrapper with optional `queryConfig`. Example: `features/medical-histories/api/get-medical-histories.ts`.
4. **No barrel exports** inside features; import files directly to keep tree-shaking intact.
5. **shadcn components**: prefer `cva` for variants, `Slot` for `asChild`, and use the shared `cn()` helper from `@/lib/utils`.
6. **Testing**: colocate tests (`Component.test.tsx` or `__tests__/`). Use Vitest + Testing Library; mock network via MSW when needed.

### Commands (uses npm — see `package-lock.json`)

```bash
cd front-clinical-ops
npm install            # first-time setup
npm run dev            # http://localhost:3000
npm run lint           # ESLint (Next config)
npm run build && npm start
```

---

## 3. AWS Lambda microservices (`lambdas/`)

- Each folder contains `lambda_function.py`, `requirements.txt`, and `lambda_config.yml`. The config defines runtime, memory, timeout, and handler. Follow the same structure for new Lambdas.
- **Key Lambdas** (non-exhaustive): `auth_*` (login/register/verify), `generate_presigned_url`, `create_medical_history_from_recording`, `transcribe`, `create_medical_record`, `extract_format`, CRUD for `medical_histories`, `update_medical_record`, `get_version_history`, `restore_version`, `export_medical_record`, WebSocket handlers (`websocket_connect|disconnect|message`).
- **Clinical note generation** (`create_medical_record`):  
  - Uses GPT-5 via `client.responses.create(...)` with `text={"format": {"type": "json_object"}}`.  
  - Injects temporal context using hardcoded Spanish day/month arrays (see `generate_temporal_context`).  
  - Respects doctor-provided formats by reordering the JSON output according to `DEFAULT_MEDICAL_RECORD_FORMAT` in `lambdas/create_medical_record/prompts.py`.
- **Transcription** (`transcribe`): uses AssemblyAI's universal speech model with `speaker_labels`, `language_code="es"`, `speakers_expected=2`, outputs `"SpeakerA: ...\n\nSpeakerB: ..."` transcripts.
- **Format extraction/validation**: `extract_format` and `validate_example` parse physician-provided templates, ensuring stored histories follow the expected schema.
- **Versioning/export**: `update_medical_record` persists JSON plus version metadata in DynamoDB, `get_version_history`/`restore_version` interact with the versions table, while `export_medical_record` streams PDF/DOCX via `jspdf`/`html-docx-js` counterparts.
- **WebSocket Lambdas** coordinate live updates through API Gateway (see `infrastructure/websocket-api-setup.sh`).

### Deployment workflow

1. **Branch**: push to `lambdas`. `.github/workflows/deploy.yml` runs automatically.  
2. Workflow builds dependencies inside `public.ecr.aws/lambda/python:3.11`, zips code in `package/`, and deploys using config from `lambda_config.yml`.  
3. AWS credentials use OIDC to assume `arn:aws:iam::880140151067:role/GitHubActionRole`. Functions run under `LambdaExecutionRole`.  
4. Cleanup step removes AWS Lambdas that no longer exist in the repo (names must match directory names).  
5. Add/remove env vars via AWS Console/CLI (`--profile admin-clinicalops`).  

**Local testing**:

```bash
cd lambdas/create_medical_record
python -c "from lambda_function import lambda_handler; print(lambda_handler({'body': '{\"transcription\": \"...\"}'}, None))"
```

---

## 4. Reference apps in `clinicians-app-main/`

### `fastapi-app/`

- Mirrors Lambda logic for transcription + GPT-5 note generation. Structure: `main.py` wires routers, `routers/transcribe_router.py` exposes `/api/transcribe` and `/api/clinical-note`, `modules/transcribe_module.py` holds business logic, `data/prompt.py` stores system prompts.  
- Use for debugging or prototyping alternative workflows (e.g., hooking into notebooks).  
- Commands:

```bash
cd clinicians-app-main/fastapi-app
pip install -r requirements.txt
uvicorn main:app --reload          # :8000
pytest -vv                         # includes test_main.py & router tests
```

### `next-app/`

- Older Next.js 15 project with Clerk auth, Convex realtime DB, Inngest workflows, Stream Video, Drizzle ORM, etc. Most production work moved to `front-clinical-ops`, but this codebase is still a good reference for meeting flows, Inngest jobs (`src/inngest/functions.ts`), and Convex schema/API usage.
- Scripts (pnpm): `pnpm install`, `pnpm dev --turbopack`, `pnpm build`, `pnpm dev:inngest`, `pnpm db:push`.

---

## 5. Infrastructure & Ops

- **`infrastructure/README.md`** documents the AWS resources needed for the Google Docs-style editor:
  - DynamoDB tables: `medical_record_versions`, `websocket_connections` (with TTL), `medical_histories`.
  - S3 bucket `clinicalops-exports` for temporary PDF/DOCX exports (7-day lifecycle).
  - WebSocket API Gateway `clinical-notes-realtime` with `$connect/$disconnect/$default` routes mapped to Lambda handlers.
  - Scripts: `dynamodb-tables.sh` (creates tables/bucket), `websocket-api-setup.sh` (CLI alternative to console setup).
- **AWS CLI profile**: always run CLI commands with `--profile admin-clinicalops` in `us-east-1`.
- **CORS fixes**: run `python fix_cors.py` after `aws sso login --profile admin-clinicalops` to update API Gateway methods and redeploy stage `prod`.
- **WebSocket endpoint ID** is stored in `.websocket-api-id`. Update affected Lambdas when the endpoint changes (see Step 4 in the infra README).

---

## 6. Clinical note data model

- Standard JSON schema stored in `lambdas/create_medical_record/prompts.py` and documented thoroughly in `CLINICAL_NOTES_ARCHITECTURE.md`. Key fields include:
  - `datos_personales`, `motivo_consulta`, `enfermedad_actual` (chronopathological prose), `antecedentes_relevantes`, `revision_por_sistemas`, `examen_fisico`, `paraclinicos_imagenes`, `impresion_diagnostica`, `analisis_clinico`, `plan_manejo`, `notas_calidad_datos`.
- GPT-5 outputs must remain strictly JSON (no Markdown/bullets). Never fabricate data—omit sections when transcription lacks evidence.
- `recording/clinic-histories/history_example.txt` gives sample physician formats. Use `extract_format` Lambda or `notebooks/extract_format.ipynb` to convert them into JSON scaffolds.
- `notebooks/` provide utilities (`prompts.py`, `utils.py`, `transcript_analysis.ipynb`) to tweak prompts and inspect transcripts offline. Do not commit heavyweight notebook outputs.

---

## 7. Build, Test, and Development Commands

| Area | Commands |
| --- | --- |
| Frontend (`front-clinical-ops`) | `npm install`, `npm run dev`, `npm run lint`, `npm run build && npm start` |
| Lambdas | Develop inside each folder; unit-test via `python -c ...` or `pytest` if you add tests. Deployment = push to `lambdas` branch. |
| FastAPI reference | `cd clinicians-app-main/fastapi-app && uvicorn main:app --reload` and `pytest`. |
| Legacy Next app | `cd clinicians-app-main/next-app && pnpm install && pnpm dev`. |

When touching multiple areas, run the relevant commands individually from each subdirectory root. Never assume a monolithic package manager command from the repo root.

---

## 8. Coding Style & Testing

### Python

- Follow PEP8 (4-space indent, `snake_case` functions, `PascalCase` classes). Keep Lambda logic pure and parameterized for easy reuse in notebooks/tests.
- For FastAPI routers, keep request parsing/throttling at the router level and move heavy logic into `modules/`.
- When calling GPT-5 or AssemblyAI, use the newer APIs (`client.responses.create`, `aai.TranscriptionConfig`) as shown in the Lambdas.

### TypeScript/React

- Functional components only. PascalCase filenames. Keep props small—compose smaller components inside features instead of creating mega components.
- Use the shared `cn()` helper; avoid ad-hoc class concatenation.
- Tailwind utilities first; global styles live in `app/globals.css`.
- Divide state into: component (local), application (context/Zustand), server cache (React Query), form (React Hook Form), and URL state (Next router).
- Error handling: centralize API errors in request layers (e.g., `lib/lambda-api.ts`) and add feature-level error states + toasts. Consider feature-scoped error boundaries for critical editors.
- Performance: Lazy-load expensive views, memoize expensive computations, and leverage React Query caching (`staleTime` is 5 minutes by default).

### Testing

- **Backend**: Use `pytest.mark.asyncio` for async functions, mock AssemblyAI/OpenAI to keep tests deterministic/offline. Add targeted unit tests next to modules (e.g., `lambdas/create_medical_record/tests/` if created).
- **Frontend**: Prefer integration-style tests with Vitest + Testing Library. Mock HTTP via MSW. Colocate tests with components (`Component.test.tsx`) or feature-level `__tests__/`.
- **E2E**: When necessary, rely on Playwright (not yet configured, but the expectation matches the Bulletproof React testing philosophy).

---

## 9. Security & Configuration

- Never commit `.env` files. Lambdas/FastAPI read env vars at runtime; Docker images do not bundle `.env`.
- FastAPI (reference) expects header-based secrets for TODO routes—mirror that behavior in tests.
- Store AWS/GCP/OpenAI keys in environment managers (SSM, Secrets Manager, Vercel/Amplify envs).  
- Frontend Lambda proxy should never log sensitive payloads in production; redact PHI before logging.
- Use the AWS CLI with `--profile admin-clinicalops` and region `us-east-1`. Scripts like `fix_cors.py` assume this profile.
- When editing notebooks, strip credentials and keep files <5 MB. Use `.gitignore` for raw audio/video.

---

## 10. Commit & PR Expectations

- Use short, imperative commit subjects (≤72 chars), referencing issue IDs when useful (e.g., `feat: add version restore lambda`).
- PRs must document scope, testing performed (`npm run lint`, `pytest`, screenshots for UI), and any env/config changes. Attach screenshots/GIFs for visible UI updates and sample API responses for backend changes.
- Before pushing Lambdas, make sure `lambda_config.yml` reflects the desired memory/timeout and that you tested the handler locally if logic is non-trivial.

---

## 11. Quick Reference Checklist

- Work inside the correct subdirectory before running commands.
- For frontend → backend calls, go through `invokeLambdaApi` / `/api/lambda`, never call AWS directly from the browser.
- Respect feature boundaries; promote shared utilities sparingly.
- GPT-5 responses always via `responses.create` with `text.format=json_object`.
- Keep data in Spanish medical prose, following the schema in `CLINICAL_NOTES_ARCHITECTURE.md`.
- Use `npm` in `front-clinical-ops`, `pnpm` only inside `clinicians-app-main/next-app`.
- Always authenticate AWS CLI with `admin-clinicalops` profile before running infra scripts.
