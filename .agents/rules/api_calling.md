# API Calling Rules

Governs how `client/` communicates with `server/`, and how `server/` structures its REST endpoints.

## 1. Client base URL & environment

- Never hardcode `http://localhost:5000` (or any absolute host) in application code.
- Single source of truth: `client/src/api/client.ts`

```ts
// client/src/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

export default apiClient;
```

- `VITE_API_URL` is defined in `client/.env.example` and set per-environment (empty/`/api`
  for same-origin dev proxy, full URL when frontend and backend are deployed separately).
- Never read `import.meta.env` outside of `client.ts` — other files import the configured
  client, not the raw env var.

## 2. Service layer — one file per resource

All HTTP calls live in `client/src/api/*.service.ts`. Components and pages **never** call
`apiClient` or `axios` directly.

Required services and their methods:

| File | Methods |
|---|---|
| `auth.service.ts` | `login`, `register`, `getMe`, `getUsers`, `updateUserRole`, `deleteUser` |
| `job.service.ts` | `getJobs`, `getJobById`, `createJob`, `updateJob`, `updateJobStatus`, `deleteJob` |
| `candidate.service.ts` | `getCandidates`, `getCandidateById`, `createCandidate`, `updateCandidate`, `updateCandidateStatus`, `deleteCandidate` |
| `interview.service.ts` | `getInterviews`, `getInterviewById`, `createInterview`, `updateInterview`, `updateInterviewStatus`, `cancelInterview` |
| `feedback.service.ts` | `submitFeedback`, `updateFeedback`, `getFeedbackByInterview` |
| `dashboard.service.ts` | `getDashboardStats` |
| `ai.service.ts` | `evaluateCandidate` |

Each service method:
- Takes typed parameters, returns `Promise<T>` using types from `client/src/api/types.ts`.
- Does not swallow errors — let them propagate to the caller (component/hook), which
  decides how to surface them (toast, form error, etc).

```ts
// client/src/api/job.service.ts
import apiClient from './client';
import type { Job, JobListResponse, JobFilters } from './types';

export const jobService = {
  getJobs: async (filters: JobFilters): Promise<JobListResponse> => {
    const { data } = await apiClient.get<JobListResponse>('/jobs', { params: filters });
    return data;
  },
  getJobById: async (id: string): Promise<Job> => {
    const { data } = await apiClient.get<Job>(`/jobs/${id}`);
    return data;
  },
  createJob: async (payload: CreateJobInput): Promise<Job> => {
    const { data } = await apiClient.post<Job>('/jobs', payload);
    return data;
  },
};
```

## 3. Shared types & response contracts

- `client/src/api/types.ts` mirrors the Prisma models (`User`, `Job`, `Candidate`,
  `Interview`, `Feedback`, `AiEvaluation`) minus server-only fields (e.g. `password`).
- List endpoints return a consistent paginated envelope everywhere:

```ts
interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
```

- Single-resource endpoints return the resource directly (no `{ data: ... }` wrapper) —
  don't mix conventions between list and detail endpoints.
- Error responses always take the shape `{ error: string, details?: unknown }` with a
  matching HTTP status code (400 validation, 401 unauthenticated, 403 unauthorized,
  404 not found, 409 invalid state transition, 500 unexpected).

## 4. Backend route structure

- Routes are thin: validate input → call a service/controller function → return JSON.
  No Prisma calls directly inside route handlers.
- Layout: `server/src/routes/*.routes.ts` → `server/src/controllers/*.controller.ts` →
  `server/src/services/*.service.ts` (Prisma calls live here).
- Every mutating route (`POST`/`PUT`/`PATCH`/`DELETE`) validates its body with Zod
  before touching the database, and returns 400 with field-level errors on failure.
- Status-changing endpoints (candidate status, interview status) validate the transition
  is legal server-side (see AGENTS.md workflow table) — the frontend disabling invalid
  buttons is not sufficient, since the API must be safe to call directly.

## 5. Auth on every call

- `apiClient` attaches the JWT via a request interceptor (from wherever the token is
  stored — see `AuthContext`), not manually per-call:

```ts
apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

- A response interceptor catches `401` globally and redirects to `/login` (clearing the
  stored token first), so individual services don't each re-implement this.
- Backend: every route except `/api/auth/login`, `/api/auth/register` sits behind the
  `authenticate` middleware; role-gated routes (e.g. user management) additionally use
  an `authorize('ADMIN')` middleware. Never check `req.user.role` ad hoc inside a
  controller — use the middleware.

## 6. AI calls stay backend-only

- The frontend calls `aiService.evaluateCandidate(candidateId)` → `POST /api/candidates/:id/ai-evaluation`.
- The frontend never calls OpenAI directly and never sees `OPENAI_API_KEY`.
- Server-side, the OpenAI request/response handling is isolated in
  `server/src/services/aiService.ts`; the route/controller only passes in the candidate
  data assembled by `candidate.service` and returns the structured JSON result.

## 7. What NOT to do

- No `fetch`/`axios` calls inside `.tsx` components or pages.
- No duplicated base URLs or endpoint strings scattered across files — endpoint paths
  live once, inside the relevant `*.service.ts`.
- No silent `catch (e) {}` blocks that hide backend errors from the user.
- No returning `password`, `passwordHash`, or the raw JWT secret from any endpoint.
