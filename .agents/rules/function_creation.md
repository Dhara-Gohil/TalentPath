# Function & Hook Creation Rules

Governs how functions, hooks, and controllers are written in both `client/` and `server/`.

## 1. Explicit types, always

- Every function has explicit parameter types and an explicit return type — never rely
  on inference for exported/shared functions. `any` is not allowed; use `unknown` plus a
  narrowing check if the shape is genuinely dynamic (e.g. raw AI response before parsing).

```ts
// Bad
function calcAverage(ratings) { ... }

// Good
function calculateAverageRating(ratings: number[]): number | null {
  if (ratings.length === 0) return null;
  return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
}
```

- Domain enums (`CandidateStatus`, `InterviewStatus`, `Recommendation`, etc.) are typed
  using the literal union / Prisma-generated enum — never a bare `string`.

## 2. Pure functions for logic, isolate side effects

- Business logic that doesn't need I/O (status-transition validation, rating averages,
  pipeline-count aggregation shaping, skill-match diffing for AI evaluation display) is
  written as pure functions: same input → same output, no network/DB/DOM access.
- Pure logic lives in `*.utils.ts` (client) or `*.util.ts` / `*.logic.ts` (server) and is
  unit-testable without mocking Express or Prisma.

```ts
// server/src/utils/candidateWorkflow.util.ts
const ALLOWED_TRANSITIONS: Record<CandidateStatus, CandidateStatus[]> = {
  APPLIED: ['SCREENING', 'REJECTED'],
  SCREENING: ['INTERVIEW', 'REJECTED'],
  INTERVIEW: ['SHORTLISTED', 'REJECTED'],
  SHORTLISTED: ['HIRED', 'REJECTED'],
  HIRED: [],
  REJECTED: [],
};

export function isValidCandidateTransition(
  from: CandidateStatus,
  to: CandidateStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}
```

- Side effects (Prisma queries, OpenAI calls, JWT signing, bcrypt hashing) stay in
  `*.service.ts` files, which call into the pure utils rather than re-implementing logic.

## 3. Custom hooks for stateful/reusable frontend logic

- Any stateful logic reused across ≥2 components, or logic that mixes fetching + local
  state, is extracted into a custom hook in `client/src/hooks/`, not copy-pasted.

```ts
// client/src/hooks/useCandidateList.ts
export function useCandidateList(filters: CandidateFilters) {
  const [data, setData] = useState<PaginatedResponse<Candidate> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    candidateService
      .getCandidates(filters)
      .then((res) => { if (!cancelled) setData(res); })
      .catch((err: unknown) => { if (!cancelled) setError(toErrorMessage(err)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [JSON.stringify(filters)]);

  return { data, loading, error };
}
```

- Components consume hooks and render — they do not contain `useEffect` blocks that call
  `apiClient`/services directly for anything reused elsewhere (a one-off page-specific
  fetch used nowhere else may stay inline in the page component).

## 4. Async execution is non-blocking and errors are structured

- No blocking/synchronous work on the event loop (no sync file/crypto calls in request
  handlers); use the async variants (`bcrypt.hash`, not `bcrypt.hashSync`, in route paths).
- Every `async` function that can fail is wrapped in try/catch at the boundary where it's
  called (controller/service edge), and rethrows or returns a typed error result — never
  an empty `catch {}`.
- Express controllers use a shared `asyncHandler` wrapper (or equivalent) so rejected
  promises reach the error middleware instead of hanging the request:

```ts
export const asyncHandler =
  <T extends RequestHandler>(fn: T): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
```

- The AI evaluation call (`aiService.evaluateCandidate`) always has a timeout and a
  catch path that returns a clear 502/503-style error to the client rather than hanging
  the request indefinitely — OpenAI calls are the slowest, most failure-prone I/O in
  this app and must be treated as such.

## 5. Single responsibility

- A function does one thing. If a function both fetches data and formats it for a chart,
  and formats it for a chart, split it: `getHiringStats()` (data) +
  `formatHiringStatsForChart()` (pure transform).
- Controllers do request/response plumbing only (parse input, call service, shape
  response) — they do not contain Prisma queries or business-rule checks inline.
- Aim to keep functions short enough to read without scrolling; if a function needs
  a comment like `// now handle the second part`, it's a sign to split it.

## 6. Naming conventions

- `getX` / `fetchX` — read operations.
- `createX` / `updateX` / `deleteX` — mutations, matching CRUD intent exactly.
- `isX` / `hasX` / `canX` — boolean-returning pure functions (e.g. `isValidCandidateTransition`).
- `useX` — hooks, always starting with `use` per React rules-of-hooks lint requirements.
- `toX` / `formatX` — pure transform functions (e.g. `toErrorMessage`, `formatHiringStatsForChart`).

## 7. What NOT to do

- No functions with untyped `...args: any[]` or untyped object params (`function f(opts) {}`).
- No business logic (status transitions, rating math, pipeline aggregation) duplicated
  between frontend and backend — the backend is the source of truth; the frontend may
  mirror the same pure util for optimistic UI/disabled-button logic, imported from a
  shared location if the monorepo setup allows it, not reimplemented by hand.
- No `useEffect` performing a fetch directly inside a page/component when a hook already
  exists (or should exist) for that resource.
- No unhandled promise rejections — every `async` call site either `await`s inside a
  try/catch or has a `.catch()`.
