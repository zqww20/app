# Manifest — AI Customs Brokerage Workspace

An internal-tool prototype for a customs brokerage: an AI-native workspace where a
licensed broker drives commercial invoices from intake through classification to a
filed customs entry. It grows out of the original **Manifest** invoice-classifier
prototype into a full operations interface.

> **Illustrative prototype.** Line-item extraction is real — the model reads an
> uploaded invoice. **HS codes are produced by a mock classification engine to
> demonstrate the workflow; they are not customs advice.** Every code is
> *AI-proposed* and must be confirmed by a licensed broker before any entry is
> filed. Nothing here submits to a customs authority.

## What's in it

A workspace shell (sidebar + top bar + AI copilot) over seven views:

| View | Route | What it does |
| --- | --- | --- |
| **Dashboard** | `/` | Clearance desk: AI morning digest, queue stats, "needs attention" list, risk flags, activity feed. |
| **Entries** | `/entries` | Filterable pipeline of every commercial invoice from intake → filed. |
| **Entry detail** | `/entries/:id` | Per-entry workspace — meta, risk flags, documents, and the classification ledger with **confirm / override** per line. |
| **Classify invoice** | `/classify` | The original intake flow. Drop a PDF/image; the model extracts each line and the engine proposes a tariff code, staged into broker review. |
| **Broker review** | `/review` | Human-in-the-loop queue of every low-confidence line across all entries, ranked most-uncertain first. |
| **Tariff lookup** | `/lookup` | Describe a good in plain language; get ranked candidate headings with the GRI reasoning behind each. |
| **Clients** | `/clients`, `/clients/:id` | Importers of record with standing instructions and their entries. |
| **Ask Manifest** | (slide-over) | A classification copilot that reasons with the same engine — classify a good, explain a code, or summarise the queue. |

## The AI-native parts

- **Real extraction.** `Classify invoice` sends the uploaded document to the Claude
  Messages API (vision) and parses the returned line items. Genuinely model-driven.
- **Proposed, not decided.** Classification, confidence, and the GRI basis are
  surfaced as *proposals*. A confidence threshold (80%) decides whether a line is
  "cleared to stage" or routed to **broker review**. The broker confirms or
  overrides — the human is always the last step before filing.
- **Risk flags & digest.** Entries carry AI-style risk flags (origin breaking a
  CUSMA claim, SIMA screening on steel, missing certificates) summarised into a
  dashboard digest.

The HS classification itself is a deterministic **mock engine** (`src/lib/classify.js`)
so the prototype runs offline and never implies a real customs decision.

## Architecture

```
src/
  theme.js                 design tokens (colors, fonts, status vocabulary)
  lib/
    classify.js            mock HS engine + candidate ranking
    format.js              money / percent / date / value helpers
    entries.js             per-entry and workspace rollups
  data/mockData.js         clients, entries, line items, activity, sample invoice
  components/
    ui.jsx                 primitives: Panel, Stat, StatusBadge, Stamp, Button…
    ClassificationRow.jsx  one extracted line + its proposed code (shared)
    Sidebar.jsx            nav + branding + broker badge
    Copilot.jsx            "Ask Manifest" slide-over
    HonestyBanner.jsx      the standing disclaimer
  views/                   Dashboard, Entries, EntryDetail, ClassifyIntake,
                           BrokerReview, TariffLookup, Clients
  App.jsx                  shell + routes
```

Stack: **Vite + React 18 + React Router + Tailwind CSS + lucide-react**. The visual
language — IBM Plex Sans/Mono, a paper/ink palette, and the customs "stamp" — is
carried from the seed component across every view.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build to dist/
npm run preview  # serve the build
```

## Scope & honesty

This is a design/UX prototype, not a clearance system. The classification engine is
illustrative, duty figures are mocked, and no data is transmitted to any customs
authority. It exists to show what an AI-native brokerage desk *feels* like to
operate while keeping the licensed broker firmly in the loop.
