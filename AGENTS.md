# Repository Guidelines

## Project Structure & Module Organization
- `fastapi-app/` hosts the FastAPI service. `main.py` wires global middleware, while `routers/` holds feature-specific endpoints (e.g., `transcribe_router.py`). Business logic lives in `modules/`, and sample payloads/config live under `data/`.
- `front-clinical-ops/` is a Next.js 16 app using the App Router. UI routes live in `app/`, shared assets in `public/`, and TypeScript config in `tsconfig.json`.
- `notebooks/` contains exploratory Jupyter notebooks; keep them lightweight and push only rendered `.ipynb` files.

## Build, Test, and Development Commands
Run services from their roots:
- Backend dev server: `cd fastapi-app && uvicorn main:app --reload` for live FastAPI reloads.
- Backend tests: `cd fastapi-app && pytest` to run `test_main.py` and router suites.
- Frontend dev server: `cd front-clinical-ops && pnpm dev` (install deps once with `pnpm install`).
- Frontend production build: `pnpm build` followed by `pnpm start`; lint with `pnpm lint`.

## Coding Style & Naming Conventions
- Python modules follow PEP8 (4-space indents, snake_case functions, PascalCase classes). Keep routers thin and move heavy logic into `modules/` for reuse/testability.
- TypeScript/React code uses ES modules, functional components, and PascalCase file names inside `app/`. Use Tailwind utility classes consistently; centralize shared styles in `app/globals.css`.
- Honor automated tooling: `eslint` for the frontend and `pytest` assertions + FastAPI type hints on the backend. Add short docstrings where logic is non-obvious.

## Testing Guidelines
- Prefer pt markers mirroring module names, e.g., `test_transcribe_router.py`. Use `pytest.mark.asyncio` for coroutine handlers.
- Mock external APIs (AssemblyAI/OpenAI) so tests run offline and deterministically.
- For the frontend, add Vitest/Playwright coverage before merging UI-critical paths; colocate tests next to components (`Component.test.tsx`).

## Commit & Pull Request Guidelines
- Git history uses short, imperative subjects (e.g., "Add Backend"). Keep messages under 72 characters and reference issue IDs when relevant.
- Every PR should describe scope, testing performed (`pytest`, `pnpm lint`, screenshots), and any env vars touched. Link design tickets for UI changes.
- Include screenshots or screen recordings for visible UI updates and sample API responses for backend changes.

## Security & Configuration Tips
- Store API keys and webhook secrets in `.env` files (never commit them). FastAPI TODOs expect a header-based secret—mirror that in tests.
- When sharing notebooks, strip credentials and cache files larger than 5 MB via `.gitignore` to keep the repo lean.
