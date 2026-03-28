# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NPS (Net Promoter Score) analysis dashboard for a VS Code extension (MSSQL). A single-page React app that loads survey data from a CSV file (`public/data.csv`), classifies comments using a regex-based rule engine, and displays interactive charts and a filterable data table.

## Commands

- **Dev server:** `npm run dev` or `npm start` (runs on localhost:3000)
- **Build:** `npm run build`
- **Test:** `npm test` (Jest + React Testing Library, watch mode)
- **Single test:** `npm test -- --testPathPattern=<pattern>`

## Architecture

The entire app lives in a single component: `src/App.js` (~700+ lines). There is no routing, no backend, and no API calls beyond fetching the local CSV.

### Key sections of App.js

1. **Rule engine (top of file):** Regex-based classification system that categorizes NPS comments into:
   - **Categories** (`CATEGORY_RULES`): ADS/SSMS Comparison, Missing Feature, Connectivity, Quality/Performance, UI/UX, AI/GitHub Copilot, No comment, General Feedback — scored by weight × match count
   - **Areas** (`AREA_RULES`): Connectivity, Edit data, Query Results, Query Editor, Object Explorer, Database Management, GitHub Copilot, MCP, Other — first-match wins
   - **User types** (`USER_TYPE_RULES`): DBA, Developer, Data Analyst, General User — first-match wins
   - **Comment types** (`CONSTRUCTIVE_RULES`): constructive vs non-actionable

2. **NPSAnalysis component:** Loads `public/data.csv` via fetch + PapaParse, applies rule engine to each row, renders summary cards, charts, and a paginated/sortable/filterable table.

### Data flow

CSV (`public/data.csv`) → PapaParse → rule engine classification → React state → filtered/sorted display

### Styling

Tailwind CSS 3 with dark mode (`class` strategy). Dark mode is on by default. Styles are inline via Tailwind utility classes — `App.css` is the default CRA boilerplate and mostly unused.

### Alternate files

- `src/App-simple.js` and `src/App_bk.js` are earlier/backup versions — not imported anywhere.
