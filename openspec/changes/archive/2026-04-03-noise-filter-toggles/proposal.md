## Why

Noise filters currently work as an all-or-nothing setting — once configured, they always exclude comments from NPS calculations. Users need the ability to temporarily toggle individual noise filters on/off to compare NPS scores with and without noise exclusion, without modifying the filter configuration. The Summary page also ignores noise filters entirely, generating reports from unfiltered data.

## What Changes

### Dashboard noise filter toggle chips
- Replace the static noise filter banner with interactive toggle chips
- Each filter becomes a clickable chip that can be toggled on/off
- Toggling a filter off recalculates NPS stats without that filter's exclusion
- Session-only — does not modify the filter's `isActive` in the database
- Stats API accepts an optional `excludeFilterIds` param to control which filters apply

### Summary page noise filter awareness
- Add noise filter toggle chips above the AI Summary card (same component as dashboard)
- Pass `excludeNoise` flag (and filter IDs) to the summarize API
- When noise filters are active, the AI summary only analyzes non-noise comments
- The NPS visual cards on the summary page also respect the toggle state

## Non-goals
- Modifying noise filter configuration (that's the Noise Filters page's job)
- Adding noise filter toggles to other pages (Chat, Categories, etc.)

## User-facing flow impact
- **Dashboard**: Noise banner now shows each filter as a toggleable chip. Click a filter to disable it temporarily — NPS recalculates instantly. Click again to re-enable.
- **Summary**: Same toggle chips above the summary card. Regenerating the summary respects the current toggle state.
- **Multiple filters**: Each filter is a separate chip. Users can disable some while keeping others active.

## Capabilities

### New Capabilities
_(none)_

### Modified Capabilities
- `ui-redesign`: Dashboard noise banner becomes interactive toggle chips; Summary page gains noise filter chips
- `chat-analysis`: (no change — chat already filters via dashboard state)

## Impact

- **Stats API**: `app/api/projects/[id]/stats/route.ts` — accept optional `excludeFilterIds` query param
- **Summarize API**: `app/api/ai/summarize/route.ts` — accept optional `excludeNoise` boolean + `excludeFilterIds` in body
- **Dashboard**: `app/project/[id]/dashboard/page.tsx` — interactive noise chips, pass filter state to stats API
- **Summary server component**: `app/project/[id]/summary/page.tsx` — fetch noise filters, pass to client
- **Summary client**: `app/project/[id]/summary/summary-client.tsx` — noise toggle chips, pass to summarize API
- **Shared component**: New `components/nps/NoiseFilterChips.tsx` — reusable toggle chip bar
