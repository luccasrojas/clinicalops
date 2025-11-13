"use client";

import React, { JSX, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * JsonFormEditor
 * Single-page, recursive, generative UI that lets users edit values *and* structure of arbitrary JSON.
 * - ShadCN components
 * - Type inference (string | number | boolean | object | array | null)
 * - Add/remove fields & array items
 * - Rename keys
 * - Keeps a single JSON state in sync (values + structure)
 *
 * NOTE: Replace the demo initialData below with your incoming JSON.
 */

// ---------- Types ----------
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type JsonType =
  | "string"
  | "number"
  | "boolean"
  | "object"
  | "array"
  | "null";

export type Path = Array<string | number>; // e.g. ["rootKey", 0, "childKey"]

// Props for the top-level editor
export interface JsonFormEditorProps {
  initialData: JsonValue;
  onChange?: (data: JsonValue) => void;
  className?: string;
}

// ---------- Utilities ----------
function inferType(value: JsonValue): JsonType {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  switch (typeof value) {
    case "string":
      return "string";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "object":
      return "object"; // non-null object
    default:
      return "string";
  }
}

function defaultForType(t: JsonType): JsonValue {
  switch (t) {
    case "string":
      return "";
    case "number":
      return 0;
    case "boolean":
      return false;
    case "object":
      return {} as JsonObject;
    case "array":
      return [] as JsonArray;
    case "null":
      return null;
    default:
      return "";
  }
}

// function cloneShallow<T>(v: T): T {
//   if (Array.isArray(v)) return [...(v as unknown as any[])] as unknown as T;
//   if (v && typeof v === "object")
//     return { ...(v as Record<string, unknown>) } as unknown as T;
//   return v;
// }

function setAtPath(
  root: JsonValue,
  path: Path,
  newValue: JsonValue
): JsonValue {
  if (path.length === 0) return newValue; // replacing root
  const [head, ...rest] = path;
  if (Array.isArray(root) && typeof head === "number") {
    const next = [...root];
    next[head] = setAtPath(next[head], rest, newValue);
    return next;
  }
  if (root && typeof root === "object" && !Array.isArray(root)) {
    const obj = { ...(root as JsonObject) };
    const key = String(head);
    obj[key] = setAtPath(obj[key], rest, newValue);
    return obj;
  }
  // If path is invalid relative to current structure, create missing containers
  if (typeof head === "number") {
    const arr: JsonArray = [];
    arr[head] = setAtPath(defaultForType("null"), rest, newValue);
    return arr;
  } else {
    const obj: JsonObject = {};
    obj[head] = setAtPath(defaultForType("null"), rest, newValue);
    return obj;
  }
}

function deleteAtPath(root: JsonValue, path: Path): JsonValue {
  if (path.length === 0) return root;
  const [head, ...rest] = path;
  if (Array.isArray(root) && typeof head === "number") {
    if (rest.length === 0) {
      const next = [...root];
      next.splice(head, 1);
      return next;
    }
    const next = [...root];
    next[head] = deleteAtPath(next[head], rest);
    return next;
  }
  if (root && typeof root === "object" && !Array.isArray(root)) {
    const obj = { ...(root as JsonObject) };
    const key = String(head);
    if (rest.length === 0) {
      // delete key
      const { [key]: _, ...restObj } = obj;
      return restObj as JsonObject;
    }
    obj[key] = deleteAtPath(obj[key], rest);
    return obj;
  }
  return root;
}

function renameKeyAtPath(
  root: JsonValue,
  pathToParent: Path,
  oldKey: string,
  newKey: string
): JsonValue {
  const parent = getAtPath(root, pathToParent);
  if (!parent || typeof parent !== "object" || Array.isArray(parent))
    return root;
  const parentObj = { ...(parent as JsonObject) };
  if (oldKey === newKey) return root;
  if (newKey in parentObj) {
    // naive conflict handling: append suffix
    let i = 1;
    let candidate = `${newKey}_${i}`;
    while (candidate in parentObj) {
      i += 1;
      candidate = `${newKey}_${i}`;
    }
    newKey = candidate;
  }
  parentObj[newKey] = parentObj[oldKey];
  delete parentObj[oldKey];
  return setAtPath(root, pathToParent, parentObj);
}

function getAtPath(root: JsonValue, path: Path): JsonValue {
  let cur: JsonValue = root;
  for (const seg of path) {
    if (Array.isArray(cur) && typeof seg === "number") {
      cur = cur[seg];
    } else if (cur && typeof cur === "object" && !Array.isArray(cur)) {
      cur = (cur as JsonObject)[String(seg)];
    } else {
      return undefined as unknown as JsonValue;
    }
  }
  return cur;
}

function insertArrayItem(
  root: JsonValue,
  pathToArray: Path,
  atIndex: number | null,
  itemType: JsonType
): JsonValue {
  const arr = getAtPath(root, pathToArray);
  const newItem = defaultForType(itemType);
  if (!Array.isArray(arr)) {
    // create array if missing
    const created = [] as JsonArray;
    const idx = atIndex ?? 0;
    created.splice(idx, 0, newItem);
    return setAtPath(root, pathToArray, created);
  }
  const next = [...arr];
  const idx = atIndex ?? arr.length;
  next.splice(idx, 0, newItem);
  return setAtPath(root, pathToArray, next);
}

// ---------- Field Editors ----------

interface FieldHeaderProps {
  name: string;
  onRename?: (newName: string) => void;
  canEditKey: boolean;
}

const FieldHeader: React.FC<FieldHeaderProps> = ({
  name,
  onRename,
  canEditKey,
}) => {
  const [editing, setEditing] = useState<boolean>(false);
  const [draft, setDraft] = useState<string>(name);

  return (
    <div className="flex items-center gap-2">
      {canEditKey ? (
        <div className="flex items-center gap-2">
          {editing ? (
            <div className="flex items-center gap-2">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="h-8 w-48"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  if (draft && draft !== name) onRename?.(draft);
                  setEditing(false);
                }}
              >
                {/* {"Save"} */}
                {"Guardar"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDraft(name);
                  setEditing(false);
                }}
              >
                {/* {"Cancel"} */}
                {"Cancelar"}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium uppercase text-muted">
                {name.replaceAll("_", " ")}
              </Label>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditing(true)}
              >
                {/* {"Rename"} */}
                {"Renombrar"}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Label className="text-sm font-medium">{name}</Label>
      )}
    </div>
  );
};

interface PrimitiveEditorProps {
  value: JsonPrimitive;
  onChange: (next: JsonPrimitive) => void;
  typeHint?: JsonType; // optional override
}

const PrimitiveEditor: React.FC<PrimitiveEditorProps> = ({
  value,
  onChange,
  typeHint,
}) => {
  const t = typeHint ?? inferType(value);
  if (t === "boolean") {
    return (
      <div className="flex items-center gap-3 py-1">
        <Switch checked={Boolean(value)} onCheckedChange={(v) => onChange(v)} />
        <span className="text-sm text-muted-foreground">{String(value)}</span>
      </div>
    );
  }
  if (t === "number") {
    return (
      <Input
        type="number"
        value={typeof value === "number" ? String(value) : ""}
        onChange={(e) => {
          const n = e.target.value === "" ? "" : Number(e.target.value);
          onChange(n === "" ? ("" as unknown as number) : isNaN(n) ? 0 : n);
        }}
      />
    );
  }
  // string or null fall back to textarea if long-ish
  const str = value === null ? "" : String(value);
  const multiline = str.length > 80 || str.includes("\n");
  return multiline ? (
    <Textarea value={str} onChange={(e) => onChange(e.target.value)} />
  ) : (
    <Input value={str} onChange={(e) => onChange(e.target.value)} />
  );
};

interface ObjectEditorProps {
  obj: JsonObject;
  path: Path;
  data: JsonValue;
  setData: (next: JsonValue) => void;
  structureMode: boolean;
}

const ObjectEditor: React.FC<ObjectEditorProps> = ({
  obj,
  path,
  data,
  setData,
  structureMode,
}) => {
  const [newKey, setNewKey] = useState<string>("");
  const [newType, setNewType] = useState<JsonType>("string");

  const keys = useMemo(() => Object.keys(obj), [obj]);

  return (
    <div className="space-y-3">
      {keys.map((k) => {
        const childPath = [...path, k];
        const val = obj[k];
        const t = inferType(val);
        return (
          <Card key={k} className="border-muted/50">
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <FieldHeader
                  name={k}
                  canEditKey={structureMode}
                  onRename={(nextName) =>
                    setData(renameKeyAtPath(data, path, k, nextName))
                  }
                />
                {structureMode && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setData(deleteAtPath(data, childPath))}
                  >
                    {/* {"Remove"} */}
                    {"Eliminar"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <NodeEditor
                value={val}
                path={childPath}
                data={data}
                setData={setData}
                structureMode={structureMode}
              />
            </CardContent>
          </Card>
        );
      })}

      {structureMode && (
        <div className="flex flex-col gap-2 rounded-lg border p-3">
          <div className="text-sm font-medium">
            {/* {"Add field"} */}
            {"Agregar campo"}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="field_name"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="w-48"
            />
            <select
              className="h-9 rounded-md border bg-background px-2 text-sm"
              value={newType}
              onChange={(e) => setNewType(e.target.value as JsonType)}
            >
              <option value="string">string</option>
              <option value="number">number</option>
              <option value="boolean">boolean</option>
              <option value="object">object</option>
              <option value="array">array</option>
              <option value="null">null</option>
            </select>
            <Button
              size="sm"
              onClick={() => {
                if (!newKey) return;
                const parent = getAtPath(data, path);
                const nextObj: JsonObject = {
                  ...(parent &&
                  typeof parent === "object" &&
                  !Array.isArray(parent)
                    ? (parent as JsonObject)
                    : {}),
                  [newKey]: defaultForType(newType),
                };
                setData(setAtPath(data, path, nextObj));
                setNewKey("");
                setNewType("string");
              }}
            >
              {/* {"Add"} */}
              {"Agregar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

interface ArrayEditorProps {
  arr: JsonArray;
  path: Path;
  data: JsonValue;
  setData: (next: JsonValue) => void;
  structureMode: boolean;
}

const ArrayEditor: React.FC<ArrayEditorProps> = ({
  arr,
  path,
  data,
  setData,
  structureMode,
}) => {
  // Infer a default item type from first non-undefined element
  const firstType: JsonType = useMemo(() => {
    for (const el of arr) return inferType(el);
    return "string";
  }, [arr]);

  const [itemType, setItemType] = useState<JsonType>(firstType);

  return (
    <div className="space-y-3">
      {arr.map((item, index) => {
        const itemPath = [...path, index];
        return (
          <Card key={index} className="border-muted/50">
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Item {index}</div>
                {structureMode && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setData(deleteAtPath(data, itemPath))}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <NodeEditor
                value={item}
                path={itemPath}
                data={data}
                setData={setData}
                structureMode={structureMode}
              />
            </CardContent>
          </Card>
        );
      })}

      {structureMode && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
          <div className="text-sm font-medium">Add array item</div>
          <select
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={itemType}
            onChange={(e) => setItemType(e.target.value as JsonType)}
          >
            <option value="string">string</option>
            <option value="number">number</option>
            <option value="boolean">boolean</option>
            <option value="object">object</option>
            <option value="array">array</option>
            <option value="null">null</option>
          </select>
          <Button
            size="sm"
            onClick={() => setData(insertArrayItem(data, path, null, itemType))}
          >
            Add item
          </Button>
        </div>
      )}
    </div>
  );
};

interface NodeEditorProps {
  value: JsonValue;
  path: Path;
  data: JsonValue;
  setData: (next: JsonValue) => void;
  structureMode: boolean;
}

const NodeEditor: React.FC<NodeEditorProps> = ({
  value,
  path,
  data,
  setData,
  structureMode,
}) => {
  const t = inferType(value);

  if (t === "object") {
    return (
      <ObjectEditor
        obj={value as JsonObject}
        path={path}
        data={data}
        setData={setData}
        structureMode={structureMode}
      />
    );
  }
  if (t === "array") {
    return (
      <ArrayEditor
        arr={value as JsonArray}
        path={path}
        data={data}
        setData={setData}
        structureMode={structureMode}
      />
    );
  }
  // primitive
  return (
    <PrimitiveEditor
      value={value as JsonPrimitive}
      onChange={(next) => setData(setAtPath(data, path, next))}
      typeHint={t}
    />
  );
};

export const JsonFormEditor: React.FC<JsonFormEditorProps> = ({
  initialData,
  onChange,
  className,
}) => {
  const [data, setData] = useState<JsonValue>(initialData);
  const [structureMode, setStructureMode] = useState<boolean>(true);

  // bubble up
  React.useEffect(() => {
    onChange?.(data);
  }, [data, onChange]);

  return (
    <div className={"flex flex-col gap-4 " + (className ?? "")}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {/* {"Structure Editing"} */}
            {"Edición de estructura"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {/* Enable to add/remove fields, rename keys, and edit array structure. */}
            {
              "Habilitar para agregar/eliminar campos, cambiar nombres de claves y editar la estructura de lista."
            }
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={structureMode}
              onCheckedChange={setStructureMode}
            />
            <span className="text-sm">
              {structureMode ? "Enabled" : "Disabled"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="space-y-4">
        <NodeEditor
          value={data}
          path={[]}
          data={data}
          setData={setData}
          structureMode={structureMode}
        />
      </div>

      <Separator />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {/* {"Live JSON"} */}
            {"JSON en vivo"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            className="font-mono text-xs"
            rows={12}
            value={JSON.stringify(data, null, 2)}
            readOnly
          />
        </CardContent>
      </Card>
    </div>
  );
};

// ---------- Demo Wrapper (optional) ----------
// Replace this with your own page that passes real data into <JsonFormEditor />
const demoData: JsonValue = {
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

export default function JsonFormEditorDemo(): JSX.Element {
  const [last, setLast] = useState<JsonValue>(demoData);
  return (
    <div className="container mx-auto max-w-5xl p-4">
      <h1 className="mb-4 text-2xl font-semibold">
        JSON Generative Form Editor
      </h1>
      <JsonFormEditor initialData={last} onChange={setLast} />
    </div>
  );
}
