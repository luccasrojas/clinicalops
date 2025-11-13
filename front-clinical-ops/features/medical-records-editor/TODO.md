# Notion-style block editor TODO

Context: we need to drop the “change text type” select approach and expose a
Notion-like experience where every heading/paragraph works as an individual
block. Users must be able to insert new blocks of a given type (texto,
subtítulo/subsección) and delete blocks that they created, while we keep the
read-only protections over the template headings. These changes must continue to
round-trip JSON through the `JsonTransformerService` and the
`update_medical_record` Lambda.

## Work plan

1. **Document existing structure**
   - [ ] Capture how the editor bootstraps its JSON, how the `ClinicalHeading`
     and `ClinicalText` extensions enforce hierarchy, and how autosave talks to
     the Lambda.
   - [ ] Map where `floating-block-toolbar.tsx` is mounted so that we can
     replace it with a block-based toolbar.

2. **Block action toolbar (frontend)**
   - [ ] Replace the current floating toolbar so that it appears whenever the
     caret is inside a block (no selection required) and shows `+ Texto`,
     `+ Subtítulo`, `+ Subsección`, and `Eliminar bloque`.
   - [ ] Implement insertion helpers that drop the new block immediately after
     the active node, pre-filling headings with `isNew: true`, `jsonKey: null`
     and an empty paragraph below the heading so that the document keeps a valid
     `(heading paragraph*)+` structure.
   - [ ] Guard deletions so they work for user-generated headings/paragraphs but
     prevent removing locked headings (`isNew: false`).
   - [ ] Unit-test/QA by creating/deleting blocks of each type and ensuring the
     JSON preview (browser console) still matches expectations.

3. **JSON + Lambda alignment**
   - [ ] Extend `JsonTransformerService` if needed so that new blocks with
     `jsonKey = null` still serialize deterministically (derive the key from the
     heading text with `unformatKey`).
   - [ ] Verify the autosave payload: only `estructura_historia_clinica` should
     change, but we need to make sure block CRUD operations trigger a `draft`
     save and eventual call to `update_medical_record`.
   - [ ] Document in `front-clinical-ops/features/medical-records-editor` how
     the transformer and Lambda work together so backend contributors can keep
     the schema consistent.

4. **Docs & follow-up**
   - [ ] Add a short “Block editing overview” doc (high-level diagram) so future
     work can extend block types (checkboxes, lists, etc.) without reverse
     engineering the current approach.
   - [ ] Outline open questions (e.g., should we allow deleting template
     headings, do we need drag-and-drop?) for product to follow up.
