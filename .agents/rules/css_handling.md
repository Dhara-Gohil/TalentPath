# CSS & Styling Rules (MUI)

Governs all visual styling in `client/`. The project uses MUI as its sole component/design
system — no competing CSS frameworks (no Tailwind, no Bootstrap, no plain global stylesheets
beyond resets).

## 1. Theme is the single source of truth

- One theme file: `client/src/theme/theme.ts`, created with MUI's `createTheme`.
- All colors, spacing multiples, typography scale, and border radii come from the theme.
  No hardcoded hex colors, `px` magic numbers, or inline font sizes in components.
- Status colors (candidate status, interview status, recommendation) are defined once as
  a token map, not re-picked per component:

```ts
// client/src/theme/statusColors.ts
export const candidateStatusColor: Record<CandidateStatus, ChipProps['color']> = {
  APPLIED: 'default',
  SCREENING: 'info',
  INTERVIEW: 'primary',
  SHORTLISTED: 'secondary',
  HIRED: 'success',
  REJECTED: 'error',
};
```

Every status badge/chip in the app (candidate list, candidate details, dashboard pipeline
chart) imports from this map — never a local `if/else` returning a color string.

## 2. Spacing & layout

- Use the `theme.spacing()` scale (via `sx={{ p: 2, gap: 1 }}` or `theme.spacing(2)`) —
  never raw pixel values like `padding: '13px'`.
- Layout is built with MUI's `Box`, `Stack`, and `Grid` — not custom flex/grid CSS files,
  unless MUI's layout primitives genuinely can't express it.
- Responsive behavior uses theme breakpoints (`sx={{ display: { xs: 'none', md: 'flex' } }}`
  or `useMediaQuery`), not manual `@media` queries in a separate `.css` file.

## 3. Styling approach — `sx` vs `styled`

- **One-off, component-local styling** → the `sx` prop.
- **Reused across ≥2 places, or a variant of an MUI component** → a `styled()` component,
  colocated in the same file or a `*.styles.ts` sibling file:

```ts
// client/src/components/CandidateCard.styles.ts
import { styled } from '@mui/material/styles';
import Card from '@mui/material/Card';

export const CandidateCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  transition: theme.transitions.create(['box-shadow']),
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
}));
```

- Never duplicate the same `sx` object across multiple components — extract to a
  `styled()` component or a shared `sx` constant instead.

## 4. No dead or unused CSS

- Delete unused CSS classes, unused `styled()` exports, and unused imports as part of
  any file touched — this repo has previously failed the TypeScript build specifically
  because of unused imports (`Divider` in `ViewAiSummaryModal.tsx`, stray imports in
  `CandidateDetails.tsx`); do not reintroduce that pattern.
- Prefer MUI components over custom CSS for standard UI (buttons, dialogs, chips, tables,
  form fields) — only reach for custom CSS when MUI has no equivalent.

## 5. Forms

- Form layout uses MUI `TextField`, `Select`, `Autocomplete`, etc., wired through
  React Hook Form's `Controller` — not uncontrolled raw `<input>` elements styled by hand.
- Validation error text renders via MUI's built-in `error`/`helperText` props, sourced
  from the Zod/Yup resolver — don't hand-roll separate error `<Typography>` blocks with
  custom red-text styling.

## 6. Charts (Recharts)

- Recharts color props (`stroke`, `fill`) pull from the same theme token map used
  elsewhere (`theme.palette.primary.main`, the status color map in §1) so dashboard
  charts visually match the status chips used across the rest of the app.
- Wrap each chart in a `ResponsiveContainer` — do not give charts a fixed pixel
  width/height that breaks on smaller viewports.

## 7. What NOT to do

- No inline `style={{...}}` attributes — use `sx` instead, so theme tokens stay available.
- No new global `.css`/`.scss` files for component styling — theme + `sx` + `styled()`
  covers this project's needs.
- No hardcoded hex/rgb colors anywhere outside `theme.ts` and `statusColors.ts`.
- No magic pixel numbers for spacing, radius, or breakpoints — always reference theme values.
