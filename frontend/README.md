# TenderScout frontend

TenderScout helps Indian MSMEs find government tenders they can win, check eligibility and prepare a bid checklist, with a source citation (exact PDF page) for every fact. This package is the UI only. Right now it contains the public home page plus placeholder `/login` and `/signup` pages; the FastAPI backend comes later.

## Prerequisites

- Node >= 22.12 (Vite 8 requirement). `.nvmrc` pins 22.19.0, so run `nvm use`.
  The machine's default Node (20.18) is too old.

## Setup

```sh
cp .env.example .env   # VITE_API_BASE_URL=http://localhost:8000
npm install
npm run dev            # http://localhost:5173
```

| Script                 | What it does                               |
| ---------------------- | ------------------------------------------ |
| `npm run dev`          | Vite dev server                            |
| `npm run build`        | Type-check (`tsc -b`) and production build |
| `npm run preview`      | Serve the production build                 |
| `npm run lint`         | ESLint                                     |
| `npm run format`       | Prettier write (sorts Tailwind classes)    |
| `npm run format:check` | Prettier check                             |

## Stack

React 19.3, Vite 8.3, TypeScript 6.0 (strict), Tailwind CSS 4.3 (`@tailwindcss/vite`, no `tailwind.config`), shadcn/ui (new-york style, `radix-ui`), React Router 7.18, lucide-react, self-hosted Inter and JetBrains Mono via `@fontsource-variable`. All versions are pinned exactly (`.npmrc` has `save-exact=true`).

### Adding shadcn components

```sh
npx shadcn@4.22.1 add <name>
```

Then in the new file: import `cn` from `@/lib/utils` (the CLI writes `from "cn"` and adds a `cn` package; remove it from package.json), and replace `focus-visible:ring-[3px] focus-visible:ring-ring/50` with `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background`.

## Theme (dark only)

Tokens live in `src/index.css` (`:root`) and are mapped to Tailwind colors in `@theme inline`.

| Token                        | Value                              | Use                                 |
| ---------------------------- | ---------------------------------- | ----------------------------------- |
| `background`                 | `#0B0B0F`                          | Page                                |
| `card` / `surface`           | `#141418`                          | Cards                               |
| `muted` / `surface-2`        | `#1C1C22`                          | Inputs, hover                       |
| `border` / `input`           | `#2A2A32`                          | Borders                             |
| `foreground`                 | `#F5F5F4`                          | Text                                |
| `muted-foreground`           | `#A1A1AA`                          | Secondary text                      |
| `primary` / `-foreground`    | `#C2410C` / `#FFFFFF`              | Primary buttons                     |
| `primary-hover`              | `#9A3412`                          | Button hover                        |
| `brand` / `ring`             | `#EA580C`                          | Links, icons, active, focus, charts |
| `brand-soft` / `-foreground` | `rgba(234,88,12,0.12)` / `#FB923C` | Soft orange badges                  |
| `success`                    | `#22C55E`                          |                                     |
| `warning`                    | `#EAB308`                          | Yellow, never orange                |
| `destructive`                | `#EF4444`                          |                                     |
| `info`                       | `#3B82F6`                          |                                     |

Radius `0.625rem`. White on `#EA580C` is about 3.6:1 (fails AA), white on `#C2410C` is about 5.2:1, so button fills use `primary`, never `brand`.

## Routes

| Path      | Page                         |
| --------- | ---------------------------- |
| `/`       | `HomePage`                   |
| `/login`  | `ComingSoonPage` ("Log in")  |
| `/signup` | `ComingSoonPage` ("Sign up") |
| `*`       | `NotFoundPage`               |

## Folder structure

```
public/favicon.svg        orange diamond
src/
  main.tsx                fonts + CSS + React root
  App.tsx                 RouterProvider
  index.css               Tailwind + theme tokens
  env.d.ts                typed import.meta.env
  routes/index.tsx        route config (createBrowserRouter)
  pages/                  HomePage, ComingSoonPage, NotFoundPage
  components/
    ui/                   shadcn: accordion, badge, button, card, sheet
    layout/               Logo, SkipToContent, MarketingHeader, MarketingFooter, nav-items, AppShell (placeholder)
    landing/              Hero, VerdictPreviewCard, VerdictRing, HowItWorks, FeatureCards, Faq, FinalCta
    tender/ chat/ pdf/ pipeline/   placeholders for later screens
  lib/
    utils.ts              cn()
    format.ts             formatINR (₹48,00,000), formatINRShort (₹48L, ₹1.2Cr)
    api.ts                all data access (mocks first, then VITE_API_BASE_URL)
  types/ hooks/ mocks/    placeholders
```

## Verification log (initial scaffold)

Run with Node 22.19.0 on macOS (Apple M1):

- `npm install`: exit 0.
- `npm run build`: exit 0, zero TypeScript errors. Built CSS contains `#0b0b0f`; `dist/assets` has self-hosted `.woff2` fonts; no `fonts.googleapis.com` references.
- `npm run lint`: exit 0, zero errors and warnings.
- `npm run format:check`: exit 0.
- Dev server (`npm run dev -- --port 5173`): `GET /`, `/login`, `/signup`, `/does-not-exist` all returned HTTP 200 (SPA fallback). Server stopped afterwards.
- `npm run preview -- --port 4173`: `GET /` returned 200.
- Visual check: headless screenshots with the installed Google Chrome (no npm package added) at 1280px, plus 375px and 768px rendered inside fixed-width iframes (headless Chrome enforces a ~500px minimum window width, so a direct 375px window crops instead of reflowing). Checked: no horizontal overflow at 375px, hamburger only below `md`, sample card stacks under the hero copy on mobile/tablet and sits to the right at 1280px, orange primary buttons, readable contrast. Screenshots deleted afterwards.
- Theme tokens in `src/index.css` match the hex values in the table above.
- Not verified: manual screen-reader and keyboard testing (focus trap in the mobile Sheet, accordion arrow keys rely on Radix). Full WCAG validation needs manual testing with assistive technology.
