"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useMemo, useState } from "react";
import { EditorContent, JSONContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import { Plugin, PluginKey, TextSelection } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

/* ------------------------------
   Types
------------------------------ */

export interface TiptapEditorV2Props {
  value: JSONContent;
  onChange?: (data: Record<string, any>) => void;
  /** Heading levels that should interpret "Key: Value" lines as pairs (default: [2]) */
  kvHeadingLevels?: number[];
}

type Obj = Record<string, any>;

/* ------------------------------
   1) A tiny decoration plugin:
   - For every paragraph, if it contains ":", bold the part before the first colon
   - DOES NOT mutate the document (pure view)
------------------------------ */

const kvDecorationsKey = new PluginKey("kvDecorations");

function kvDecorationsPlugin(): Plugin {
  return new Plugin({
    key: kvDecorationsKey,
    state: {
      init: (_config, state) => buildDecorations(state.doc),
      apply: (tr, oldDecos, _oldState, newState) => {
        // Recompute on any change that maps positions
        if (tr.docChanged || tr.selectionSet) {
          return buildDecorations(newState.doc);
        }
        return oldDecos.map(tr.mapping, tr.doc);
      },
    },
    props: {
      decorations(state) {
        return this.getState(state) as DecorationSet;
      },
    },
  });
}

function buildDecorations(doc: any): DecorationSet {
  const decos: Decoration[] = [];
  const walk = (node: any, pos = 0) => {
    if (node.type.name === "paragraph") {
      // Find first ":" in this paragraph by scanning text child nodes
      let accum = 0;
      //   let startOfPara = pos + 1; // inside the node
      const startOfPara = pos + 1; // inside the node
      let colonAbsPos: number | null = null;
      //   let keyStartAbs = startOfPara;
      const keyStartAbs = startOfPara;
      let keyEndAbs: number | null = null;

      node.descendants((child: any, childPos: number) => {
        if (child.isText && colonAbsPos === null) {
          const text: string = child.text || "";
          const idx = text.indexOf(":");
          if (idx !== -1) {
            // absolute position of the colon character
            colonAbsPos = startOfPara + accum + idx;
            keyEndAbs = colonAbsPos; // everything before colon is KEY
          }
          accum += text.length;
        } else {
          // non-text: still advance accum by its nodeSize
          if (!child.isText) {
            accum += child.nodeSize;
          }
        }
        return colonAbsPos === null; // stop early if found
      });

      if (colonAbsPos != null && keyEndAbs != null && keyEndAbs > keyStartAbs) {
        // Bold the KEY
        decos.push(
          Decoration.inline(keyStartAbs, keyEndAbs, {
            class: "kv-key font-semibold uppercase",
          })
        );
        // Subtle styling for the colon itself
        decos.push(
          Decoration.inline(colonAbsPos, colonAbsPos + 1, {
            class: "kv-sep",
          })
        );
      }
    }
    let offset = pos;
    node.forEach((child: any, _i: number) => {
      walk(child, offset + 1); // +1 to move inside
      offset += child.nodeSize;
    });
  };
  walk(doc, 0);
  return DecorationSet.create(doc, decos);
}

/* ------------------------------
   2) Custom Document: keep it simple (headings + paragraphs)
------------------------------ */

const CustomDocument = Document.extend({
  content: "block+",
});

/* ------------------------------
   3) Transform -> structured JSON
   Rule: under a heading whose level is in kvHeadingLevels,
         a paragraph with "Key: Value" becomes { key: value }
------------------------------ */

function toStructuredJSON(
  doc: JSONContent,
  kvLevels: number[]
): Record<string, any> {
  const result: Obj = {};
  const stack: Array<{ level: number; box: Obj }> = [{ level: 0, box: result }];

  const getText = (n: JSONContent): string =>
    (n.content ?? [])
      .map((c: any) => (c?.type === "hardBreak" ? "\n" : c?.text ?? ""))
      .join("");

  const pushLevel = (level: number): Obj => {
    while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
    const parent = stack[stack.length - 1]?.box ?? result;
    const newBox: Obj = {};
    // We don’t know the key until heading text is read; caller handles it.
    // Here we just return the container used for that heading.
    stack.push({ level, box: newBox });
    return newBox;
  };

  let currentContainer: Obj = result;

  for (const node of doc.content ?? []) {
    if (node.type === "heading") {
      const level = Number((node.attrs as any)?.level ?? 1);
      const title = getText(node).trim();
      if (!title) continue;

      const parent = (() => {
        while (stack.length && stack[stack.length - 1].level >= level)
          stack.pop();
        return stack[stack.length - 1].box;
      })();

      const key = title.toLowerCase().replace(/\s+/g, "_");
      const box: Obj = {};
      parent[key] = box;
      stack.push({ level, box });
      currentContainer = box;
      continue;
    }

    if (node.type === "paragraph") {
      const text = getText(node).trim();
      if (!text) continue;

      // Are we inside a heading level that should parse KV?
      const currentLevel = stack[stack.length - 1].level;
      if (kvLevels.includes(currentLevel)) {
        const idx = text.indexOf(":");
        if (idx !== -1) {
          const k = text.slice(0, idx).trim();
          const v = text.slice(idx + 1).trim();
          if (k) {
            const normKey = k.toLowerCase().replace(/\s+/g, "_");
            currentContainer[normKey] = v;
            continue;
          }
        }
      }

      // Fallback: append plain text under _text
      currentContainer._text =
        (currentContainer._text ? currentContainer._text + "\n" : "") + text;
    }
  }

  return result;
}

/* ------------------------------
   4) Component
------------------------------ */

export const TiptapEditorV2: React.FC<TiptapEditorV2Props> = ({
  value,
  onChange,
  kvHeadingLevels = [2], // default: only under H2
}) => {
  const editor = useEditor({
    extensions: [
      CustomDocument,
      StarterKit.configure({
        document: false,
      }),
      Paragraph, // keep default paragraph behavior
    ],
    content: value,
    immediatelyRender: false, // ✅ prevent SSR hydration mismatch
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const structured = toStructuredJSON(json, kvHeadingLevels);
      onChange?.(structured);
    },
    editorProps: {
      handleKeyDown: (view, event) => {
        if (event.key === "Home" && (event.ctrlKey || event.metaKey)) {
          const tr = view.state.tr.setSelection(
            TextSelection.create(view.state.doc, 1)
          );
          view.dispatch(tr);
          return true;
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const plugin = kvDecorationsPlugin();
    editor.registerPlugin?.(plugin);
    return () => {
      editor.unregisterPlugin?.(kvDecorationsKey);
    };
  }, [editor]);

  return <EditorContent editor={editor} />;
};

export default TiptapEditorV2;

// Optional simple initial doc
const demoDoc: JSONContent = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "DATOS PERSONALES" }],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "ACOMPANANTE: esposa; Alba Marina Zapata" },
      ],
    },
    { type: "paragraph", content: [{ type: "text", text: "EDAD: 88" }] },
    { type: "paragraph", content: [{ type: "text", text: "SEXO: masculino" }] },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "ANTECEDENTES RELEVANTES" }],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "ALERGIAS: Niega alergias conocidas" }],
    },
  ],
};

export const TiptapEditorV2Demo = () => {
  const [structured, setStructured] = useState<Record<string, any>>({});
  const initialDoc = useMemo(() => demoDoc, []);

  return (
    <div className="flex gap-4 bg-gray-50 p-4 rounded-lg border">
      <div className="flex-1">
        <h2 className="text-lg font-medium mb-2">Tiptap Editor V2</h2>
        <TiptapEditorV2
          value={initialDoc}
          onChange={setStructured}
          kvHeadingLevels={[2]}
        />
      </div>

      <div className="flex-1 bg-white rounded-lg border p-4">
        <h2 className="text-lg font-medium mb-2">Structured JSON (tracked)</h2>
        <pre className="text-xs overflow-auto max-h-[600px] whitespace-pre-wrap">
          {JSON.stringify(structured, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export const TiptapEditorV2Test = ({
  value,
  onChange,
}: TiptapEditorV2Props) => {
  const initialDoc = useMemo(() => value, [value]);

  return (
    <div className="flex gap-4 bg-gray-50 p-4 rounded-lg border">
      <div className="flex-1">
        <TiptapEditorV2
          value={initialDoc}
          onChange={onChange}
          kvHeadingLevels={[2]}
        />
      </div>

      <div className="flex-1 bg-white rounded-lg border p-4">
        <h2 className="text-lg font-medium mb-2">Your JSON format (tracked)</h2>
        <pre className="text-xs overflow-auto whitespace-pre-wrap">
          {JSON.stringify(value, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export const TiptapEditorV2PRARTIS = ({
  value,
  onChange,
}: TiptapEditorV2Props) => {
  const initialDoc = useMemo(() => value, [value]);
  return (
    <TiptapEditorV2
      value={initialDoc}
      onChange={onChange}
      kvHeadingLevels={[2]}
    />
  );
};
