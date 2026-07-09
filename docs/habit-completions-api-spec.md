# Backend task: habit completion history endpoint

## Goal

The dashboard's habit cards render a per-day completion history (currently 7 "week dots").
Today the frontend *derives* this from `currentStreak` + `lastCompletedDate`, which can only
represent consecutive runs — any completion before the current streak started renders as
"missed" even if it happened. We need real per-day completion data so the history is accurate
and the window size becomes a product choice (7/14/30 days).

## Existing contract (do not break)

The frontend proxies to the API and currently uses:

- `GET /api/habits` → `Habit[]` — camelCase JSON:
  `{ id, emoji, name, target, currentStreak?, longestStreak?, lastCompletedDate? }`
  where `lastCompletedDate` is a **calendar date string `"YYYY-MM-DD"` in the user's timezone**.
- `POST /api/habits/{habitId}/completions` — body `{ habitId, timezone }` (IANA id), records
  today's completion for that user-local calendar day and returns `{ habit: Habit }` with
  updated streak fields.
- Auth is cookie/BFF session on every call; mutations additionally require the
  `X-CSRF-TOKEN` header. GET endpoints require no CSRF token.
- Reminder endpoints use `TimeOnly`-style `"HH:mm:ss"` strings — keep the existing
  serialization conventions (camelCase, date-only strings) for anything new.

The `GET /api/habits` response shape must remain backward compatible.

## Requirement 1 (primary): bulk history for the dashboard

```
GET /api/habits/completions?days={N}&timezone={IANA id}
```

Returns completion dates for **all habits owned by the current user** in one call
(the dashboard lists every habit, so a per-habit endpoint would be an N+1).

Response `200`:

```json
{
  "from": "2026-06-10",
  "to": "2026-07-09",
  "completions": {
    "habit-id-1": ["2026-07-07", "2026-07-08", "2026-07-09"],
    "habit-id-2": []
  }
}
```

- `to` = today's calendar date in the supplied `timezone`; `from` = `to - (days - 1)`.
  The range is inclusive on both ends.
- `completions` is keyed by habit id and includes **every habit the user owns**, with an
  empty array when there are no completions in range.
- Date arrays: `"YYYY-MM-DD"` strings, sorted ascending, only dates that have a completion,
  no duplicates.
- Dates are user-local calendar dates — the same convention as `lastCompletedDate`. If
  completions are stored as timestamps, convert to a calendar date using the completion's
  recorded timezone (the `timezone` value sent at completion time), not the query's timezone;
  the query `timezone` is only for computing the `from`/`to` window. If completions are
  already stored as calendar dates, return them as stored.

### Parameters and validation

| Param      | Required | Default | Rules                                        |
| ---------- | -------- | ------- | -------------------------------------------- |
| `days`     | no       | `30`    | integer, 1–90 → otherwise `400`              |
| `timezone` | yes      | —       | valid IANA timezone id → otherwise `400`     |

- `401` when unauthenticated (consistent with existing endpoints).
- No CSRF token required (read-only GET, matching existing GETs).

## Requirement 2 (secondary): single-habit history for the detail screen

```
GET /api/habits/{habitId}/completions?days={N}&timezone={IANA id}
```

Same parameters, validation, and date semantics. Response `200`:

```json
{ "from": "2026-06-10", "to": "2026-07-09", "completions": ["2026-07-07", "2026-07-09"] }
```

- `404` when the habit doesn't exist or isn't owned by the current user (match whatever
  `GET /api/habits/{habitId}` does today).

## Performance

- Each endpoint should be a single query over the completions table; ensure an index
  exists covering `(userId, date)` or `(habitId, date)` as appropriate for the schema.
- `days` is capped at 90, so responses stay small; no pagination needed.

## Acceptance criteria

1. Bulk endpoint returns all owned habits as keys, including habits with zero completions.
2. A habit completed today, and also 10 days ago with a broken streak in between, returns
   both dates — history is not inferred from streaks.
3. `days=7` returns only dates within the last 7 user-local calendar days, inclusive of today.
4. Works correctly across a timezone where "today" differs from UTC (e.g. `Pacific/Auckland`
   just after local midnight): `to` reflects the user-local date.
5. Invalid `days` (0, 91, non-integer) and invalid `timezone` return `400`.
6. Habits belonging to other users never appear (bulk) / return `404` (single).
7. `GET /api/habits` response is unchanged.

## Frontend integration (for reference, no action needed)

The frontend will add a server-fn proxy and parse with:

```ts
const habitCompletionsSchema = z.object({
  from: z.string(),
  to: z.string(),
  completions: z.record(z.string(), z.array(z.string())),
});
```

and replace the streak-derived `WeekDots` logic in
`src/components/dashboard/HabitCard.tsx` with a set-membership lookup.
