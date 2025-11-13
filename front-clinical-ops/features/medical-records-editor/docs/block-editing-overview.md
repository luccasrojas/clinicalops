# Notion-style block editing overview

This note documents how block creation/deletion works after replacing the old
“change type” select with a Notion-like flow.

## 1. Editor-facing behavior

- `FloatingBlockToolbar` now listens to every selection update. When the caret
  is inside a heading or paragraph we store the node position/level in memory
  (`activeBlock`) and display the block menu on the right-hand side.
- The menu exposes three insertion actions and a delete button:
  - **Texto** inserts a paragraph that inherits the level of the active block.
  - **Subtítulo/Subsección** inserts a new heading (`level = 2/3`), tags it as
    `isNew: true`, adds a temporary `jsonKey` (stable until the doctor renames
    it) and appends an empty paragraph to keep the document valid.
  - **Eliminar bloque** removes paragraphs directly or, for headings, removes
    the heading plus the paragraphs that belong to it until the next heading.
    We only enable the action for user-created headings (`isNew: true`) so the
    default format provided by the Lambda stays locked.

## 2. JSON transformation + locked structure

- `TiptapEditor` now receives an optional `lockedStructure` prop. We pass the
  parsed `estructura_historia_clinica` from
  `record.structuredClinicalNoteOriginal`, meaning we know exactly which paths
  were present in the original AI output.
- `JsonTransformerService.jsonToTiptap(json, lockedStructure)` flattens the
  locked structure into a `Set` of dot paths (`plan_manejo.medicacion`, etc.).
  Any heading whose path appears in this set is rendered with `isNew = false`
  (read-only). Unknown paths remain editable, even after a refresh.
- `tiptapToJson` prioritizes the heading text for new blocks. If the doctor
  hasn’t typed anything yet we keep writing the temporary `jsonKey` so saves do
  not churn keys on every keystroke. When the heading gets a name we switch to
  the normalized text via `unformatKey`.

## 3. Persistence pipeline

1. Every change calls `useAutosave.saveDraft`, which debounces updates and only
   posts when the document actually changed (`lodash.isequal` against the last
   saved value).
2. We continue to send the JSON string for `estructuraClinica` only. The Lambda
   (`lambdas/update_medical_record`) merges it into the existing note,
   snapshots the previous version in `medical_record_versions`, and broadcasts a
   WebSocket message so other editors reload.
3. When the page reloads we parse both `structuredClinicalNote` (current) and
   `structuredClinicalNoteOriginal` (locked template). That feeds the two-way
   transformer described above, so user-created blocks stay editable forever
   while the default schema remains protected.

## 4. Testing checklist

- Insert texto/Subtítulo/Subsección blocks in different positions and confirm
  they appear in the JSON output (inspect `saveDraft` payload in DevTools).
- Reload the page and ensure the newly created headings are still editable, yet
  template headings remain locked.
- Delete both paragraphs and custom headings (with nested paragraphs) to stay
  confident the Lambda receives the updated JSON and version history captures
  the change.

Keeping this flow documented should help future contributors extend the block
types (checkboxes, quotes, etc.) without breaking the autosave contract.

## 5. Open questions

- Should we expose drag & drop or slash commands for faster block insertion?
- Can we safely allow removing some locked headings (e.g., optional sections)
  without compromising downstream exports?
