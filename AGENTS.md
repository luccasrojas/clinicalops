# Repository Guidelines

## Project Structure & Module Organization

### Backend (FastAPI)
- `fastapi-app/` hosts the FastAPI service. `main.py` wires global middleware, while `routers/` holds feature-specific endpoints (e.g., `transcribe_router.py`). Business logic lives in `modules/`, and sample payloads/config live under `data/`.

### Frontend (Next.js - Bulletproof React Architecture)

**Feature-based organization** for scalability and maintainability:

```
front-clinical-ops/
├── app/                 # Next.js App Router - routes/pages only
├── components/          # Shared components used across entire app
│   └── ui/             # shadcn/ui component library
├── features/           # Feature modules (PRIMARY organization)
│   └── [feature-name]/
│       ├── api/        # API calls & React Query hooks for this feature
│       ├── components/ # Feature-specific components
│       ├── hooks/      # Feature-specific hooks
│       ├── stores/     # Feature-specific Zustand stores
│       ├── types/      # Feature-specific TypeScript types
│       └── utils/      # Feature-specific utilities
├── lib/                # Pre-configured libraries (api-client, react-query setup)
├── hooks/              # Shared hooks used across entire app
├── stores/             # Global state stores (Zustand)
├── types/              # Shared TypeScript types
└── utils/              # Shared utility functions
```

**Critical principles:**

1. **Feature isolation**: Each feature is self-contained. Code specific to a feature lives in `features/[name]/`. DO NOT import across features.
2. **Unidirectional architecture**: Code flows in one direction: `shared → features → app`
   - Shared folders (`components/`, `hooks/`, `lib/`, `utils/`) can be imported by features and app
   - Features can import from shared folders only
   - App can import from features and shared
   - Features CANNOT import from other features
   - Features CANNOT import from app
3. **Colocation**: Keep code as close as possible to where it's used. If it's only used in one feature, it belongs in that feature folder.
4. **Composition over cross-imports**: Compose different features at the application level (in `app/` routes), not by importing between features.

### Notebooks
- `notebooks/` contains exploratory Jupyter notebooks; keep them lightweight and push only rendered `.ipynb` files.

## Build, Test, and Development Commands
Run services from their roots:
- Backend dev server: `cd fastapi-app && uvicorn main:app --reload` for live FastAPI reloads.
- Backend tests: `cd fastapi-app && pytest` to run `test_main.py` and router suites.
- Frontend dev server: `cd front-clinical-ops && pnpm dev` (install deps once with `pnpm install`).
- Frontend production build: `pnpm build` followed by `pnpm start`; lint with `pnpm lint`.

## Coding Style & Naming Conventions

### Python
- Python modules follow PEP8 (4-space indents, snake_case functions, PascalCase classes). Keep routers thin and move heavy logic into `modules/` for reuse/testability.

### TypeScript/React

**Follow Bulletproof React patterns:**

- Functional components with TypeScript
- PascalCase for component files
- Use `cn()` utility from `@/lib/utils` for className merging
- Tailwind utility classes preferred over custom CSS
- Centralize shared styles in `styles/globals.css` using CSS variables

**Feature-based organization rules:**

- Place feature-specific code in `features/[feature-name]/`
- Shared components only in `components/` (especially `components/ui/` for shadcn)
- NO cross-feature imports - compose at app level instead
- Import directly, avoid barrel exports (they break tree-shaking)

**API layer pattern** for each endpoint:

```typescript
// features/medical-records/api/get-records.ts

// 1. Define fetcher function with types
export const getRecords = (params): Promise<RecordResponse> => {
  return api.get('/records', { params });
};

// 2. Define query options for React Query
export const getRecordsQueryOptions = (params) => {
  return queryOptions({
    queryKey: ['records', params],
    queryFn: () => getRecords(params),
  });
};

// 3. Export custom hook
export const useRecords = ({ queryConfig, ...params }) => {
  return useQuery({
    ...getRecordsQueryOptions(params),
    ...queryConfig,
  });
};
```

**Component best practices:**

- Colocate: Keep things close to where they're used
- Avoid large components with nested render functions - extract to separate components
- Limit props - consider composition if accepting too many
- Abstract shared patterns into `components/ui/` library
- Wrap 3rd party components to adapt to app needs

**Import aliases** (configured in `tsconfig.json`):

- `@/components` → `components/` (shared only)
- `@/features` → `features/`
- `@/lib` → `lib/`
- `@/hooks` → `hooks/` (shared only)
- `@/stores` → `stores/`
- `@/types` → `types/`
- `@/utils` → `utils/`

**Automated tooling:**

- ESLint for linting (enforce conventions)
- Prettier for formatting (format on save)
- TypeScript for type safety
- Husky for pre-commit hooks (run lint/format/typecheck before commits)

## Testing Guidelines

### Backend (Python)
- Use pytest markers mirroring module names, e.g., `test_transcribe_router.py`
- Use `pytest.mark.asyncio` for coroutine handlers
- Mock external APIs (AssemblyAI/OpenAI) so tests run offline and deterministically

### Frontend (React/TypeScript)

**Testing philosophy**: Focus on integration tests that verify features work as users interact with them, not implementation details.

**Testing approach:**

- **Integration tests > Unit tests**: Test features as complete units, not isolated components
- **Test behavior, not implementation**: Test what renders and how users interact, not internal state
- **Colocate tests**: Place tests next to code
  - Component tests: `Component.test.tsx` next to `Component.tsx`
  - Feature tests: `features/[name]/__tests__/` folder
- **Mock APIs with MSW**: Use service workers to intercept HTTP requests instead of mocking fetch

**Testing tools:**

- **Vitest**: For unit and integration tests (Jest-compatible, modern, fast)
- **Testing Library**: Test components as users would interact with them
- **Playwright**: For end-to-end tests that run full application flows
- **MSW (Mock Service Worker)**: Mock API responses for deterministic tests

**Example test structure:**

```typescript
// features/discussions/__tests__/discussions.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { server } from '@/testing/mocks/server';
import { DiscussionsList } from '../components/discussions-list';

it('displays discussions when loaded', async () => {
  render(<DiscussionsList />);
  
  await waitFor(() => {
    expect(screen.getByText('Test Discussion')).toBeInTheDocument();
  });
});
```

**What to test:**

- User flows and interactions (integration tests)
- Shared utility functions (unit tests)
- Complex business logic (unit tests)
- Error states and edge cases
- Accessibility features

## Commit & Pull Request Guidelines
- Git history uses short, imperative subjects (e.g., "Add Backend"). Keep messages under 72 characters and reference issue IDs when relevant.
- Every PR should describe scope, testing performed (`pytest`, `pnpm lint`, screenshots), and any env vars touched. Link design tickets for UI changes.
- Include screenshots or screen recordings for visible UI updates and sample API responses for backend changes.

## Security & Configuration Tips
- Store API keys and webhook secrets in `.env` files (never commit them). FastAPI TODOs expect a header-based secret—mirror that in tests.
- When sharing notebooks, strip credentials and cache files larger than 5 MB via `.gitignore` to keep the repo lean.
- **Frontend security**: 
  - Use error boundaries to catch and handle errors gracefully
  - Implement proper authorization checks (see `lib/authorization.ts` pattern from bulletproof-react)
  - Sanitize user inputs and validate on both client and server
  - Never expose sensitive data in client-side code or API responses

## Additional Frontend Best Practices (Bulletproof React)

### State Management Categories

Divide state into categories rather than storing everything in one global store:

1. **Component State**: Local to components, use `useState` or `useReducer`
2. **Application State**: Global app state (modals, notifications, theme) - use Context + hooks, Zustand, or Redux
3. **Server Cache State**: Data from APIs - use TanStack Query, SWR, or Apollo Client (already using TanStack Query v5)
4. **Form State**: Use React Hook Form (already in use) with zod validation
5. **URL State**: Data in URL params/query strings - use Next.js router

### Error Handling

- **API errors**: Use interceptor in `lib/api-client.ts` to handle errors globally (show toasts, logout unauthorized users, refresh tokens)
- **In-app errors**: Place Error Boundaries at multiple levels (not just root) to contain errors locally
- **Error tracking**: Use Sentry or similar for production error tracking with source maps

### Performance

- Lazy load routes and heavy components with `React.lazy()` and `Suspense`
- Memoize expensive computations with `useMemo`
- Memoize callbacks with `useCallback` when passing to optimized child components
- Use React Query's built-in caching and background refetching
- Optimize images with Next.js Image component
- Keep bundle size small: check with `npm run build` and analyze if needed
