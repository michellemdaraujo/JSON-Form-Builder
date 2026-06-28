# JSON Form Builder

A visual form builder built with Next.js + TypeScript. Create fields, configure validation, preview the live form, and export/import the schema as JSON.

**Live demo:** https://json-form-builder-two.vercel.app/

## How to Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- **7 field types** — text, textarea, number, select, radio, checkbox (single or multi-option), date
- **Drag-and-drop reordering** — reorder fields with @dnd-kit
- **Live preview** — form renders in real time with validation and mock submission
- **Validation rules** — required, min/max (length or value), regex, and built-in presets (email, URL, letters only)
- **Default values** — configurable per field type, reflected in the live preview
- **Conditional visibility** — show/hide fields based on another field's value
- **JSON export/import** — copy, download, paste, or upload JSON schemas with Zod-based validation on import
- **localStorage persistence** — save and load schemas between sessions

## Architecture

Three-column layout: field cards (left), live preview (center), JSON schema (right).

All state lives in `FormBuilder` as a single `FormSchema` object, passed to children via props. The editor sidebar works with a local draft — changes only apply when the user clicks "Add Field" or "Save Changes", preventing incomplete fields from breaking the preview.

The live preview builds a Zod schema from field definitions on every change via `useMemo`, then passes it to `react-hook-form` through `zodResolver`.

`FormField` is a discriminated union keyed on `type`, so TypeScript enforces that `options` only exists on select/radio/checkbox fields and `defaultValue` has the correct type per field kind.

### Key files

| Path | Purpose |
|------|---------|
| `types/form-schema.ts` | Form schema types (field types, validation, conditional visibility) |
| `utils/validation.ts` | Builds a Zod schema dynamically from field config |
| `components/FormBuilder.tsx` | Main orchestrator — schema state, drag-and-drop, sidebar coordination |
| `components/EditorSidebar.tsx` | Sidebar overlay with draft state and validation on save |
| `components/FieldEditor.tsx` | Field property editor (options, defaults, validation rules) |
| `components/FormPreview.tsx` | Live form with react-hook-form + zod validation |
| `components/JsonPanel.tsx` | JSON export (copy/download) and import (paste/upload) with Zod validation |

## Technical Decisions & Tradeoffs

| Library | Why |
|---------|-----|
| **Next.js 16 + React 19** | App router with `next/dynamic` and `ssr: false` since the builder is entirely client-side and depends on `localStorage`. |
| **Zod v4** | TypeScript-first, composes well for dynamically building validation schemas at runtime. |
| **react-hook-form** | Minimal re-renders; `zodResolver` plugs the dynamic schema directly into form validation. |
| **@dnd-kit** | Modular, accessible (keyboard support), better UX than move-up/down buttons for a form builder. |
| **Tailwind CSS v4** | Utility-first CSS with no runtime cost. |

- **Single state object** instead of a reducer — readable and sufficient at this scale. A reducer would be warranted if undo/redo were added.
- **Schema rebuilt on every change** — fine for small forms; would benefit from debouncing for large ones.
- **No global state library** — props are sufficient for a single-page builder.
- **Draft-based sidebar editing** — small complexity cost, but prevents invalid intermediate states from reaching the preview.

## Assumptions

- "JSON schema" refers to a JSON form configuration, not the formal JSON Schema specification.
- `required` is a boolean flag; validation is enforced at runtime by Zod.
- `min`/`max` means string length for text/textarea and numeric range for number fields.
- Checkbox fields always have options. A single option renders as one checkbox; multiple options render as a group.
- Conditional visibility supports a single condition (field equals value).
- Custom validation rules are predefined presets (email, URL, letters only), not user-defined expressions.

## Known Limitations / What I'd Do Next

The following items were out of scope for the challenge timebox but are things I'd address next.

**Bugs I'm aware of:**
- `ctx.addIssue()` in the JSON import `superRefine` may need `{ code: "custom", message }` instead of a plain string in Zod v4
- Deleting a field referenced in conditional visibility leaves a dangling reference (field stays hidden)
- Changing field type doesn't strip old properties (e.g. `options` remains when switching from select to text)

**Features & improvements:**
- Tests — unit tests for `buildZodSchema`, component tests with Testing Library, E2E with Playwright
- Accessibility — ARIA attributes, focus trap in sidebar/modal, contrast improvements
- Responsiveness — basic responsive layout is in place (single-column stacking on small screens), but could be improved with max-width for ultra-wide screens and better mobile UX for the sidebar and modals
- Deeper import validation — cross-validate conditional visibility references, ensure choice fields have options
- More validation rules — min/max date, custom rules beyond built-in presets
- Auto-save option — persist to localStorage on every edit instead of requiring manual save
- More conditional operators — greater than, less than, contains, range
- Live JSON editing — edit the form by modifying JSON directly with two-way sync
- Drag-and-drop for options — reorder select/radio/checkbox options
- Undo/redo — reducer with history stack
- Performance — reduce LCP (currently 7.3s due to client-side dynamic import), loading skeleton
