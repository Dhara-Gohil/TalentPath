# AGENTS.md — Interview Management Platform

This file is the entry point for AI agents (and developers) working in this repository.
Read the linked rule files before generating or modifying code. When a rule conflicts
with a one-off request, prefer the rule unless the user explicitly overrides it.

## Project Summary

Full-stack Interview Management Platform for recruiters.

- **Frontend**: `client/` — React.js, React Router, Axios, React Hook Form, Zod/Yup, MUI, Recharts
- **Backend**: `server/` — Node.js, Express.js, Prisma ORM, SQLite, JWT, bcrypt/bcryptjs
- **AI**: OpenAI API, isolated inside `server/src/services/aiService`, API key backend-only

Do not introduce Next.js or MongoDB. Do not move the OpenAI API key to the client.

## Rule Index

| Rule file | Governs |
|---|---|
| [rules/api_calling.md](./rules/api_calling.md) | How the client talks to the backend: service layer, request/response contracts, env config, error handling |
| [rules/css_handling.md](./rules/css_handling.md) | MUI usage, theming, tokens, responsive layout, styled components |
| [rules/function_creation.md](./rules/function_creation.md) | Function/hook design, typing, purity, async handling, single responsibility |

## Domain Reference (for consistent naming)

Agents should reuse these exact enum and entity names when generating types, Prisma
schema, or UI — do not invent synonyms.

- **Roles**: `ADMIN`, `RECRUITER`
- **Job status**: `DRAFT`, `OPEN`, `CLOSED`
- **Employment type**: `FULL_TIME`, `PART_TIME`, `CONTRACT`, `INTERNSHIP`
- **Candidate status**: `APPLIED`, `SCREENING`, `SHORTLISTED`, `INTERVIEW`, `REJECTED`, `HIRED`
  - Allowed forward transitions: `APPLIED → SCREENING → SHORTLISTED → INTERVIEW → HIRED`
  - `REJECTED` is reachable from any active stage
  - No other transitions are valid; enforce this on the backend, not just the UI
- **Interview type**: `TECHNICAL`, `HR`, `MANAGERIAL`, `CULTURAL`
- **Interview status**: `SCHEDULED`, `COMPLETED`, `CANCELLED`, `RESCHEDULED`
- **Feedback recommendation**: `STRONG_YES`, `YES`, `MAYBE`, `NO`, `STRONG_NO`
- **Ratings**: integers 1–10 (`technicalRating`, `communicationRating`, `problemSolvingRating`, `cultureFitRating`)

## Cross-Cutting Rules (apply everywhere)

1. Passwords are never returned from any API response — enforce with a Prisma `select`
   or explicit `omit`, not just by "remembering not to."
2. Feedback can only be created when the parent interview's status is `COMPLETED`.
3. All dashboard numbers come from real backend aggregation queries — never hardcode
   or compute stats client-side from a full unpaginated fetch.
4. The OpenAI key (`OPENAI_API_KEY`) lives only in `server/.env` and is read only inside
   `aiService`. No route handler, frontend file, or client bundle may reference it.
