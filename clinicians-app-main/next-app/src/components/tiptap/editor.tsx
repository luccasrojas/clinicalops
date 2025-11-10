"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import "./styles.scss";

import React, { useEffect, useMemo, useState } from "react";
import { useEditor, EditorContent, JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Document from "@tiptap/extension-document";
import { Placeholder } from "@tiptap/extension-placeholder";
import Paragraph from "@tiptap/extension-paragraph";

// ----------------------
// 1️⃣ Production component
// ----------------------
interface TiptapEditorProps {
  value: JSONContent;
  onChange?: (data: Record<string, any>) => void;
}

/**
 * Custom document schema: always start with a heading, followed by any blocks.
 */
const CustomDocument = Document.extend({
  content: "heading block*",
});

export const TiptapEditor: React.FC<TiptapEditorProps> = ({
  value,
  onChange,
}) => {
  const editor = useEditor({
    extensions: [
      CustomDocument,
      StarterKit.configure({
        document: false,
        paragraph: false, // disable default paragraph
      }),
      CustomParagraph, // use our own
      Placeholder.configure({
        placeholder: ({ node }) =>
          node.type.name === "heading"
            ? "Título del documento"
            : "Agrega contenido clínico...",
      }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const tiptapJson = editor.getJSON();
      const transformed = tiptapToStructuredJson(tiptapJson);
      onChange?.(transformed);
    },
  });

  useEffect(() => {
    if (!editor) return;
    setTimeout(() => {
      editor.commands.setTextSelection({ from: 0, to: 0 });
      editor.chain().focus().run();
    }, 0);
  }, [editor]);

  return <EditorContent editor={editor} />;
};

const CustomParagraph = Paragraph.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      level: {
        default: 0,
        parseHTML: (element) =>
          parseInt(element.getAttribute("data-level") || "0", 10),
        renderHTML: (attributes) => ({
          "data-level": attributes.level,
          class: `p-level-${attributes.level}`,
        }),
      },
    };
  },
});

// ----------------------
// 2️⃣ Demo data
// ----------------------
// const demoData = {
//   datos_personales: {
//     edad: "",
//     sexo: "",
//     servicio_lugar: "",
//     acompanante: "",
//   },
//   motivo_consulta: "<palabras literales del paciente>",
//   enfermedad_actual:
//     "<relato cronopatológico en prosa clínica teniendo en cuenta unidad de tiempo respecto a hoy para la descripción sintomática>",
//   antecedentes_relevantes: {
//     personales: "",
//     quirurgicos: "",
//     farmacologicos: "",
//     alergias: "",
//     ginecoobstetricos: "",
//   },
//   analisis_clinico:
//     "<Paciente de {{edad}} años con diagnóstico actual de {{Dx principal}}.>",
//   notas_calidad_datos: "<inconsistencias, datos críticos ausentes>",
// };

const demoData = {
  datos_personales: {
    edad: "",
    sexo: "",
    servicio_lugar: "",
    acompanante: "",
  },
  motivo_consulta: "<palabras literales del paciente>",
  enfermedad_actual:
    "<relato cronopatológico en prosa clínica teniendo en cuenta unidad de tiempo respecto a hoy para la descripción sintomática>",
  antecedentes_relevantes: {
    personales: "",
    quirurgicos: "",
    farmacologicos: "",
    alergias: "",
    ginecoobstetricos: "",
  },
  revision_por_sistemas: {
    general_constitucional: "",
    piel: "",
    ojos_orl: "",
    respiratorio: "",
    cardiovascular: "",
    gastrointestinal: "",
    genitourinario: "",
    musculo_esqueletico: "",
    neurologico: "",
    endocrino: "",
  },
  examen_fisico: {
    estado_general: "",
    cabeza_orl: "",
    cuello: "",
    respiratorio: "<IPPA>",
    cardiovascular: "",
    abdomen: "",
    genitourinario: "",
    musculo_esqueletico: "",
    neurologico: "",
    piel_teg: "",
  },
  paraclinicos_imagenes: [
    {
      fecha: "",
      estudio: "",
      hallazgos: "",
    },
  ],
  impresion_diagnostica: [
    { diagnostico: "", cie10: "" },
    { diagnostico: "", cie10: "" },
  ],
  analisis_clinico:
    "<Paciente de {{edad}} años con diagnóstico actual de {{Dx principal}} con {{antecedente relevante si aplica}}. Actualmente {{estado/estabilidad, hallazgos clave}}. Conductas: {{qué haremos y por qué}}. Solicitudes: {{laboratorios/imágenes}} y propósito clínico.>",
  plan_manejo: {
    disposicion: "<Alta | Observación | Hospitalización | UCI>",
    dieta_nutricion: "<ayuno, líquida, blanda, normal; soporte si aplica>",
    oxigeno_ventilacion: "<aire ambiente | cánula | máscara; metas SpO2>",
    liquidos_accesos: "<VO/IV, soluciones, balance, accesos>",
    medicacion:
      "<analgesia; sintomáticos; antimicrobianos con indicación y duración; profilaxis TE; gastroprotección; ajustes de crónicos>",
    procedimientos_curaciones: "",
    monitorizacion_metas: "<signos, diuresis, glucemias, escalas>",
    paraclinicos_imagenes_solicitados: "<pruebas + objetivo clínico>",
    interconsultas_referencia: "<servicio y motivo>",
    rehabilitacion_enfermeria: "<órdenes>",
    educacion_advertencias: "<puntos clave y alarmas, según diagnóstico>",
    seguimiento_citas: "<cuándo, con quién, metas>",
  },
  notas_calidad_datos: "<inconsistencias, datos críticos ausentes>",
};

// ----------------------
// 3️⃣ Transform demoData → Tiptap doc
// ----------------------
function jsonToTiptapDoc(data: any, title = "Nota clínica"): JSONContent {
  const level = 0;

  return {
    type: "doc",
    content: [...objectToTiptapNodes(data, level)],
  };

  // As long as the above works, I prefer it without a title
  // return {
  //   type: "doc",
  //   content: [
  //     {
  //       type: "heading",
  //       attrs: { level: level },
  //       content: [{ type: "text", text: title }],
  //     },
  //     ...objectToTiptapNodes(data, level + 1),
  //   ],
  // };
}

function objectToTiptapNodes(
  value: any,
  level: number,
  key: string | undefined = undefined
): JSONContent[] {
  if (typeof value === "string") {
    return [
      {
        type: "paragraph",
        attrs: { level }, // 👈 will produce class="p-level-<x>"
        content: [
          { type: "text", text: value || `Valor de <${key}> está vacío.` },
        ],
      },
    ];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => objectToTiptapNodes(item, level));
  }

  if (typeof value === "object" && value !== null) {
    // alert("RECURSIVE" + JSON.stringify(value));
    // return objectToTiptapNodes(value);
    return Object.entries(value).flatMap(([key, val]) => {
      const inner = objectToTiptapNodes(val, level + 1, key);
      if (inner.length === 0) return [];
      return [
        {
          type: "heading",
          attrs: { level: level + 1 },
          content: [{ type: "text", text: formatKey(key) }],
        },
        ...inner,
      ];
    });
  }

  return [];
}

function formatKey(key: string): string {
  // I think I can remove the to upper case here. I can use CSS
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  // .toUpperCase();
  // return "whatever";
}

// ----------------------
// 4️⃣ Transform Tiptap doc → structured JSON (your schema)
// ----------------------
// ----------------------
// 4️⃣ Transform Tiptap doc → structured JSON (with duplicate keys → arrays)
// ----------------------
function tiptapToStructuredJson(doc: JSONContent): Record<string, any> {
  type Obj = Record<string, any>;
  const result: Obj = {};

  // Track nesting levels — each frame: level and container
  const stack: Array<{ level: number; container: Obj }> = [
    { level: 0, container: result },
  ];

  // Keep where we’re writing text into
  let currentTextOwner: Obj | null = null;

  // Per-container key counters to detect duplicates
  const keyCounters = new WeakMap<Obj, Record<string, number>>();

  const getCounter = (container: Obj): Record<string, number> => {
    if (!keyCounters.has(container)) keyCounters.set(container, {});
    return keyCounters.get(container)!;
  };

  const getHeadingText = (node: JSONContent): string =>
    (node.content?.map((c: any) => c?.text ?? "").join("") || "").trim();

  const getParagraphText = (node: JSONContent): string =>
    (node.content ?? [])
      .map((c: any) => (c?.type === "hardBreak" ? "\n" : c?.text ?? ""))
      .join("")
      .trim();

  const asKey = (label: string) => unformatKey(label);

  const makeUniqueKey = (parent: Obj, key: string): string => {
    const counter = getCounter(parent);
    if (!counter[key]) counter[key] = 0;
    const count = counter[key]++;
    return count === 0 ? key : `${key}${count}`;
  };

  for (const node of doc.content ?? []) {
    if (!node) continue;

    if (node.type === "heading") {
      const rawLevel = Number((node.attrs as any)?.level ?? 1);
      if (rawLevel === 0) {
        currentTextOwner = null;
        continue;
      }

      const level = Math.max(1, rawLevel);
      const label = getHeadingText(node);
      const key = asKey(label);
      if (!key) continue;

      // Pop stack until we’re below current heading level
      while (stack.length && stack[stack.length - 1].level >= level)
        stack.pop();
      const parent = stack[stack.length - 1]?.container ?? result;

      // ✅ ensure unique key per parent
      const uniqueKey = makeUniqueKey(parent, key);

      const box: Obj = { _text: "" };
      parent[uniqueKey] = box;

      currentTextOwner = box;
      stack.push({ level, container: box });
      continue;
    }

    if (node.type === "paragraph") {
      if (!currentTextOwner) continue;
      const text = getParagraphText(node);
      if (!text) continue;
      currentTextOwner._text = currentTextOwner._text
        ? `${currentTextOwner._text}\n${text}`
        : text;
      continue;
    }
  }

  // Collapse {_text: "..."} → string
  const collapse = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(collapse);
    if (obj && typeof obj === "object") {
      const keys = Object.keys(obj);
      if (keys.length === 1 && keys[0] === "_text") return obj._text ?? "";
      const out: Obj = {};
      // // ✅ 1️⃣ push _text first if it exists
      if (typeof obj._text === "string" && obj._text.trim().length > 0)
        out._text = obj._text;
      // // ✅ 2️⃣ then push the rest of the keys in original order (excluding _text)
      for (const k of keys) {
        if (k === "_text") continue;
        out[k] = collapse(obj[k]);
      }
      return out;
    }
    return obj;
  };

  return collapse(result);
}

function unformatKey(label: string): string {
  return label.toLowerCase().replace(/\s+/g, "_");
}

// ----------------------
// 5️⃣ Demo wrapper
// ----------------------
export const TiptapEditorDemo = () => {
  const [structured, setStructured] = useState<Record<string, any>>({});
  const initialDoc = useMemo(() => jsonToTiptapDoc(demoData), []);

  return (
    <div className="flex gap-4 bg-gray-50 p-4 rounded-lg border">
      <div className="flex-1">
        <h2 className="text-lg font-medium mb-2">Tiptap Editor</h2>
        <TiptapEditor value={initialDoc} onChange={setStructured} />
      </div>

      <div className="flex-1 bg-white rounded-lg border p-4">
        <h2 className="text-lg font-medium mb-2">Your JSON format (tracked)</h2>
        <pre className="text-xs overflow-auto max-h-[600px] whitespace-pre-wrap">
          {JSON.stringify(structured, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export const TiptapEditorTest = ({
  value: data,
  onChange,
}: TiptapEditorProps) => {
  // const [structured, setStructured] = useState<Record<string, any>>({});
  const initialDoc = useMemo(() => jsonToTiptapDoc(data), []);

  return (
    <div className="flex gap-4 bg-gray-50 p-4 rounded-lg border">
      <div className="flex-1">
        <TiptapEditor value={initialDoc} onChange={onChange} />
      </div>

      <div className="flex-1 bg-white rounded-lg border p-4">
        <h2 className="text-lg font-medium mb-2">Your JSON format (tracked)</h2>
        <pre className="text-xs overflow-auto whitespace-pre-wrap">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export const TiptapEditorPRARTIS = ({
  value: data,
  onChange,
}: TiptapEditorProps) => {
  // const [structured, setStructured] = useState<Record<string, any>>({});
  const initialDoc = useMemo(() => jsonToTiptapDoc(data), []);

  return <TiptapEditor value={initialDoc} onChange={onChange} />;
};

export default TiptapEditor;
