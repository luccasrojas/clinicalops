"use client";

import React, { JSX, useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { nanoid } from "nanoid";

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
export type Path = Array<string | number>;

export interface JsonFormEditorProps {
  initialData: JsonValue;
  onChange?: (data: JsonValue) => void;
  className?: string;
}

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
      return "object";
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
      return {};
    case "array":
      return [];
    case "null":
      return null;
    default:
      return "";
  }
}

function getAtPath(root: JsonValue, path: Path): JsonValue {
  let cur: JsonValue = root;
  for (const seg of path) {
    if (Array.isArray(cur) && typeof seg === "number") cur = cur[seg];
    else if (cur && typeof cur === "object" && !Array.isArray(cur))
      cur = (cur as JsonObject)[String(seg)];
  }
  return cur;
}

function setAtPath(
  root: JsonValue,
  path: Path,
  newValue: JsonValue
): JsonValue {
  if (path.length === 0) return newValue;
  const [head, ...rest] = path;
  if (Array.isArray(root) && typeof head === "number") {
    const next = [...root];
    next[head] = setAtPath(next[head], rest, newValue);
    return next;
  }
  if (root && typeof root === "object" && !Array.isArray(root)) {
    const obj = { ...(root as JsonObject) };
    obj[String(head)] = setAtPath(obj[String(head)], rest, newValue);
    return obj;
  }
  return root;
}

function deleteAtPath(root: JsonValue, path: Path): JsonValue {
  if (path.length === 0) return root;
  const [head, ...rest] = path;
  if (Array.isArray(root) && typeof head === "number") {
    const next = [...root];
    if (rest.length === 0) next.splice(head, 1);
    else next[head] = deleteAtPath(next[head], rest);
    return next;
  }
  if (root && typeof root === "object" && !Array.isArray(root)) {
    const obj = { ...(root as JsonObject) };
    if (rest.length === 0) {
      delete obj[String(head)];
      return obj;
    }
    obj[String(head)] = deleteAtPath(obj[String(head)], rest);
    return obj;
  }
  return root;
}

// ---------- Field Header Component ----------
const FieldHeader = ({
  name,
  onRename,
  canEditKey,
}: {
  name: string;
  onRename?: (newName: string) => void;
  canEditKey: boolean;
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  return (
    <div className="flex items-center gap-2">
      {canEditKey ? (
        editing ? (
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
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setDraft(name);
                setEditing(false);
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">{name}</Label>
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              Rename
            </Button>
          </div>
        )
      ) : (
        <Label className="text-sm font-medium">{name}</Label>
      )}
    </div>
  );
};

// ---------- Object Editor ----------
interface FieldMeta {
  id: string;
  key: string;
}

const ObjectEditor = ({
  obj,
  path,
  data,
  setData,
  structureMode,
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
any) => {
  const [fields, setFields] = useState<FieldMeta[]>(() =>
    Object.keys(obj).map((k) => ({ id: nanoid(), key: k }))
  );

  useEffect(() => {
    const existingKeys = new Set(Object.keys(obj));
    setFields((prev) => {
      const newList = prev.filter((f) => existingKeys.has(f.key));
      Object.keys(obj).forEach((k) => {
        if (!newList.find((f) => f.key === k))
          newList.push({ id: nanoid(), key: k });
      });
      return newList;
    });
  }, [obj]);

  const handleRename = (oldKey: string, newKey: string) => {
    const parent = getAtPath(data, path) as JsonObject;
    if (!parent) return;
    const updated: JsonObject = { ...parent };
    updated[newKey] = updated[oldKey];
    delete updated[oldKey];
    setData(setAtPath(data, path, updated));
    setFields((prev) =>
      prev.map((f) => (f.key === oldKey ? { ...f, key: newKey } : f))
    );
  };

  return (
    <div className="space-y-3">
      {fields.map((f) => {
        const val = obj[f.key];
        const childPath = [...path, f.key];
        return (
          <Card key={f.id} className="border-muted/50">
            <CardHeader className="py-3 flex justify-between items-center">
              <FieldHeader
                name={f.key}
                canEditKey={structureMode}
                onRename={(newKey) => handleRename(f.key, newKey)}
              />
              {structureMode && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setData(deleteAtPath(data, childPath))}
                >
                  Remove
                </Button>
              )}
            </CardHeader>
            <CardContent>
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
    </div>
  );
};

// ---------- Array & Primitive Editors ----------
const ArrayEditor = ({
  arr,
  path,
  data,
  setData,
  structureMode,
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
any) => (
  <div className="space-y-3">
    {arr.map(
      (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        item: any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        i: any
      ) => (
        <Card key={i} className="border-muted/50">
          <CardHeader className="py-3 flex justify-between items-center">
            <Label className="font-medium text-sm">Item {i}</Label>
            {structureMode && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setData(deleteAtPath(data, [...path, i]))}
              >
                Remove
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <NodeEditor
              value={item}
              path={[...path, i]}
              data={data}
              setData={setData}
              structureMode={structureMode}
            />
          </CardContent>
        </Card>
      )
    )}
  </div>
);

const PrimitiveEditor = ({
  value,
  onChange,
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
any) => {
  const t = inferType(value);
  if (t === "boolean")
    return <Switch checked={!!value} onCheckedChange={onChange} />;
  if (t === "number")
    return (
      <Input
        type="number"
        value={String(value)}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    );
  return (
    <Input
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};

const NodeEditor = ({
  value,
  path,
  data,
  setData,
  structureMode,
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
any) => {
  const t = inferType(value);
  if (t === "object")
    return (
      <ObjectEditor
        obj={value}
        path={path}
        data={data}
        setData={setData}
        structureMode={structureMode}
      />
    );
  if (t === "array")
    return (
      <ArrayEditor
        arr={value}
        path={path}
        data={data}
        setData={setData}
        structureMode={structureMode}
      />
    );
  return (
    <PrimitiveEditor
      value={value}
      onChange={(
        v: // eslint-disable-next-line @typescript-eslint/no-explicit-any
        any
      ) => setData(setAtPath(data, path, v))}
    />
  );
};

// ---------- Root Component ----------
export const JsonFormEditor = ({
  initialData,
  onChange,
  className,
}: JsonFormEditorProps) => {
  const [data, setData] = useState<JsonValue>(initialData);
  const [structureMode, setStructureMode] = useState(true);

  useEffect(() => {
    onChange?.(data);
  }, [data, onChange]);

  return (
    <div className={"flex flex-col gap-4 " + (className ?? "")}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Structure Editing</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Toggle to add/remove fields, rename keys, and edit array structure.
          </div>
          <Switch checked={structureMode} onCheckedChange={setStructureMode} />
        </CardContent>
      </Card>
      <Separator />
      <NodeEditor
        value={data}
        path={[]}
        data={data}
        setData={setData}
        structureMode={structureMode}
      />
      <Separator />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Live JSON</CardTitle>
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
