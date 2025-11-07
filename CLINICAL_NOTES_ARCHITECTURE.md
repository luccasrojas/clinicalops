# Arquitectura del Sistema de Notas Clínicas JSON

**Documentación Técnica Completa: Renderizado, Edición y Sincronización en Tiempo Real**

---

## Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Generación del JSON (Backend)](#1-generación-del-json-backend)
3. [Almacenamiento en Convex](#2-almacenamiento-en-convex)
4. [Renderizado Frontend](#3-renderizado-frontend-tiptapprosemirror)
5. [Sincronización en Tiempo Real](#4-sincronización-en-tiempo-real-convex)
6. [Lógica de Edición](#5-lógica-de-edición)
7. [Sistema de Auto-Guardado](#6-sistema-de-auto-guardado)
8. [Funcionalidad Tipo Google Docs](#7-funcionalidad-tipo-google-docs)
9. [Flujo de Datos Completo](#8-flujo-de-datos-completo)
10. [Análisis Técnico Profundo](#9-análisis-técnico-profundo)

---

## Resumen Ejecutivo

El sistema de notas clínicas de Prartis implementa un flujo completo que va desde la grabación de audio hasta la edición en tiempo real de notas clínicas estructuradas en formato JSON. El sistema funciona **similar a Google Docs** en términos de actualizaciones en tiempo real y auto-guardado, pero **NO implementa colaboración multi-usuario**.

### Stack Tecnológico Principal

- **Backend**: FastAPI + Python
- **AI**: OpenAI GPT-5 (generación de notas), AssemblyAI (transcripción)
- **Base de Datos**: Convex (real-time database)
- **Editor**: TipTap + Prosemirror (rich text editor)
- **Jobs**: Inngest (procesamiento asíncrono)
- **Storage**: Google Cloud Storage (grabaciones y transcripts)

### Características Clave

✅ **Implementado**:
- Generación automática de notas clínicas estructuradas en JSON
- Renderizado de JSON como documento editable con formato
- Sincronización en tiempo real vía Convex
- Auto-guardado con debouncing (1 segundo)
- Transformaciones bidireccionales JSON ↔ Editor

❌ **NO Implementado**:
- Edición colaborativa multi-usuario
- CRDTs (Conflict-free Replicated Data Types)
- Operational Transforms (OT)
- Resolución de conflictos sofisticada
- Cursores en vivo de otros usuarios
- Historial de versiones completo

---

## 1. Generación del JSON (Backend)

### 1.1 Arquitectura del Backend

**Ubicación**: `fastapi-app/`

```
fastapi-app/
├── main.py                    # FastAPI app
├── routers/
│   └── transcribe_router.py  # Endpoints de transcripción y notas clínicas
├── modules/
│   └── transcribe_module.py  # Lógica de negocio (AssemblyAI + OpenAI)
└── data/
    └── prompt.py              # Prompts del sistema para GPT
```

### 1.2 Endpoint de Generación de Notas Clínicas

**Archivo**: `fastapi-app/routers/transcribe_router.py`

```python
@router.post("/clinical-note")
def clinical_note_endpoint(payload: dict):
    """
    Genera una nota clínica estructurada desde una transcripción.

    Payload esperado:
    {
        "transcription": "SpeakerA: ...\nSpeakerB: ...",
        "clinical_note_example": "..." (opcional)
    }

    Respuesta:
    {
        "status": "success",
        "clinical_note": {...},         # JSON object
        "clinical_note_str": "..."      # String JSON (preserva orden de keys)
    }
    """
    transcription = payload.get("transcription")
    clinical_note_example = payload.get(
        "clinical_note_example",
        default_clinical_note_example
    )

    if not transcription:
        raise HTTPException(
            status_code=400,
            detail="Missing 'transcription' in request body"
        )

    try:
        clinical_note = generate_clinical_note(
            transcription,
            system_prompt,
            clinical_note_example
        )

        # Convertir a string con formato e indentación
        clinical_note_str = json.dumps(
            clinical_note,
            ensure_ascii=False,  # Preserva acentos españoles
            indent=2
        )

        return {
            "status": "success",
            "clinical_note": clinical_note,
            "clinical_note_str": clinical_note_str
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### 1.3 Generación con OpenAI GPT-5

**Archivo**: `fastapi-app/modules/transcribe_module.py`

```python
def generate_clinical_note(transcription, prompt, clinical_note_example):
    """
    Genera nota clínica usando OpenAI GPT-5 con formato JSON estructurado.
    """
    client = OpenAI(api_key=OPENAI_API_KEY)

    # Agregar contexto temporal
    temporal_context = generate_temporal_context()  # "hoy es lunes, 7 de enero de 2025..."
    formatted_prompt = prompt.format(
        temporal_context=temporal_context,
        clinical_note_example=clinical_note_example
    )

    # Llamada a OpenAI GPT-5
    completion = client.responses.create(
        model="gpt-5",
        reasoning={"effort": "minimal"},
        input=[
            {
                "role": "system",
                "content": formatted_prompt,
            },
            {
                "role": "user",
                "content": transcription,
            },
        ],
        text={
            "format": {"type": "json_object"}  # ¡CLAVE! Fuerza respuesta JSON
        },
    )

    # Parsear respuesta JSON
    raw_json = completion.output[1].content[0].text
    data = json.loads(
        raw_json,
        object_pairs_hook=dict  # Preserva orden de keys en Python 3.7+
    )

    return data
```

### 1.4 Estructura del JSON Generado

El JSON sigue el formato de historia clínica colombiana estándar:

```json
{
  "datos_personales": {
    "edad": "35 años",
    "sexo": "Masculino",
    "acompanante": "Esposa"
  },
  "motivo_consulta": "Dolor abdominal",
  "enfermedad_actual": "Paciente masculino de 35 años...",
  "antecedentes_relevantes": {
    "patologicos": ["Diabetes tipo 2"],
    "quirurgicos": ["Apendicectomía 2015"],
    "farmacologicos": ["Metformina 850mg BID"],
    "alergicos": "Ninguno conocido",
    "toxicos": "Niega",
    "familiares": "Madre hipertensa"
  },
  "revision_por_sistemas": {
    "cardiovascular": "Niega dolor torácico",
    "respiratorio": "Sin disnea",
    "gastrointestinal": "Dolor epigástrico",
    "genitourinario": "Sin alteraciones",
    "neurologico": "Sin cefalea"
  },
  "examen_fisico": {
    "signos_vitales": {
      "presion_arterial": "120/80 mmHg",
      "frecuencia_cardiaca": "72 lpm",
      "frecuencia_respiratoria": "16 rpm",
      "temperatura": "36.5°C",
      "saturacion_oxigeno": "98%"
    },
    "aspecto_general": "Paciente alerta, orientado...",
    "hallazgos_por_sistema": {
      "cardiopulmonar": "Ruidos cardiacos rítmicos...",
      "abdomen": "Blando, doloroso a la palpación...",
      "extremidades": "Sin edema"
    }
  },
  "paraclinicos_imagenes": [
    {
      "tipo": "Hemograma completo",
      "fecha": "2025-01-07",
      "resultado": "Leucocitos 8500, Hb 14.2"
    }
  ],
  "impresion_diagnostica": [
    {
      "codigo_cie10": "K29.7",
      "descripcion": "Gastritis, no especificada",
      "tipo": "principal"
    }
  ],
  "analisis_clinico": "Paciente con cuadro sugestivo de gastritis...",
  "plan_manejo": {
    "tratamiento_farmacologico": [
      "Omeprazol 20mg VO c/12h x 14 días",
      "Sucralfato 1g VO c/8h x 7 días"
    ],
    "recomendaciones_no_farmacologicas": [
      "Evitar alimentos irritantes",
      "Comidas pequeñas y frecuentes"
    ],
    "seguimiento": "Control en 2 semanas o antes si empeora",
    "interconsultas": "Gastroenterología si no mejora"
  },
  "notas_calidad_datos": "Transcripción completa con datos clínicos adecuados."
}
```

### 1.5 Características Importantes del Backend

**1. Preservación de Acentos Españoles**
```python
json.dumps(clinical_note, ensure_ascii=False, indent=2)
```
- `ensure_ascii=False`: Mantiene caracteres UTF-8 (á, é, í, ó, ú, ñ)
- `indent=2`: Formato legible con 2 espacios de indentación

**2. Doble Formato de Respuesta**
```python
return {
    "clinical_note": clinical_note,      # Objeto Python/JSON
    "clinical_note_str": clinical_note_str  # String serializado
}
```
**Razón**: Inngest (sistema de jobs) puede desordenar las keys del objeto JSON durante la serialización, por eso se envía también el string para preservar el orden exacto.

**3. Plantillas Personalizables**
```python
clinical_note_example = payload.get("clinical_note_example", default_clinical_note_example)
```
Los usuarios pueden definir templates personalizados que GPT usará como referencia para generar notas en su formato preferido.

---

## 2. Almacenamiento en Convex

### 2.1 ¿Qué es Convex?

**Convex** es una base de datos en tiempo real con las siguientes características:
- **TypeScript End-to-End**: Schema, queries y mutations tipados
- **Real-Time Subscriptions**: WebSocket automático bajo el capó
- **Serverless**: No requiere gestión de infraestructura
- **ACID Transactions**: Garantías de consistencia
- **Similar a**: Firebase Realtime Database + TypeScript + SQL-like queries

### 2.2 Schema de la Base de Datos

**Archivo**: `next-app/convex/schema.ts`

```typescript
export default defineSchema({
  meetings: defineTable({
    nanoId: v.string(),  // ID público (ej: "m_abc123xyz")
    name: v.string(),
    userId: v.string(),  // Clerk user ID
    agentId: v.id("agents"),
    agentNanoId: v.string(),

    // Estados del meeting
    status: MeetingStatus,  // "scheduled" | "in_progress" | "processing" | "completed" | "failed"
    startedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),

    // URLs de recursos
    transcriptUrl: v.optional(v.string()),  // GCS signed URL del transcript JSONL
    recordingUrl: v.optional(v.string()),    // GCS signed URL del audio

    // Notas clínicas (¡LO IMPORTANTE!)
    summary: v.optional(v.string()),
    structuredClinicalNoteJson: v.optional(v.string()),  // ← JSON stringificado de la nota
    structuredClinicalNoteJsonOriginal: v.optional(v.string()),  // ← Backup original

    // Metadata de procesamiento
    statusProcessingData: v.optional(
      v.object({
        statusMessageShort: v.string(),   // "Generando nota clínica"
        statusMessageLong: v.string(),    // Descripción detallada
        progressFraction: v.number(),     // 0.0 - 1.0
        progressStep: v.number(),         // 3 (de 5)
        totalSteps: v.number(),           // 5
        completedStepsList: v.array(v.string()),  // ["transcripción", "subida a almacenamiento"]
      })
    ),

    createdAt: v.number(),
    updatedAt: v.number(),
    simulation: v.boolean(),  // true si es práctica con agente IA
  })
    .index("by_user", ["userId"])
    .index("by_nanoId", ["nanoId"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["userId"],
    }),
});
```

### 2.3 Campo Clave: `structuredClinicalNoteJson`

```typescript
structuredClinicalNoteJson: v.optional(v.string())
```

**Características**:
- **Tipo**: `string` (no objeto) - Se almacena el JSON serializado
- **Razón**: Preservar orden de keys y evitar problemas de serialización
- **Contenido**: El JSON completo de la nota clínica generada por GPT-5
- **Opcional**: Puede ser `undefined` si el meeting no ha completado el procesamiento

**Ejemplo de valor almacenado**:
```typescript
"{\"datos_personales\":{\"edad\":\"35 años\"},\"motivo_consulta\":\"Dolor abdominal\",...}"
```

### 2.4 Flujo de Guardado Inicial (Inngest Workflow)

**Archivo**: `next-app/src/inngest/sessions-processing.ts`

El guardado inicial de la nota clínica ocurre a través de un workflow de Inngest después de que termina una grabación:

```typescript
export const sessionsProcessing = inngest.createFunction(
  { id: "sessions/processing" },
  { event: "sessions/processing" },
  async ({ event, step }) => {
    const { meetingNanoId, recordingUrl, userId } = event.data;

    // PASO 1: Transcribir audio (via FastAPI)
    const transcript = await step.run("transcribe", async () => {
      const res = await fetch(`${FASTAPI_APP_URL}/api/transcribe`, {
        method: "POST",
        body: JSON.stringify({ audio_url: recordingUrl }),
      });
      return (await res.json()).transcription;
    });

    // PASO 2: Convertir transcript a JSONL
    const transcriptJsonL = await step.run("transcript-to-jsonl", async () => {
      return parsePrartisTranscriptToJSONL(transcript);
    });

    // PASO 3: Subir JSONL a GCS
    const transcriptSignedGcsUrl = await step.run("upload-jsonl-to-gcs", async () => {
      const gcsFile = bucket.file(`transcripts/${meetingNanoId}.jsonl`);
      await gcsFile.save(transcriptJsonL);
      const [fileUrl] = await gcsFile.getSignedUrl({
        version: "v4",
        action: "read",
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 días
      });
      return fileUrl;
    });

    // PASO 4: Obtener template de nota clínica del usuario (opcional)
    const clinicalNoteExample = await step.run("fetch-clinical-note-example", async () => {
      const result = await fetchQuery(api.webhooks.templates.getDefault, { userId });
      return result?.clinicalNoteExampleContent || null;
    });

    // PASO 5: Generar nota clínica (via FastAPI + OpenAI GPT-5)
    const clinicalNoteOutputStr = await step.run("generate-clinical-note", async () => {
      const res = await fetch(`${FASTAPI_APP_URL}/api/clinical-note`, {
        method: "POST",
        body: JSON.stringify({
          transcription: transcript,
          ...(clinicalNoteExample ? { clinical_note_example: clinicalNoteExample } : {}),
        }),
      });
      const payload = await res.json();
      return payload["clinical_note_str"];  // ← String preserva orden de keys
    });

    // PASO 6: Guardar en Convex
    await step.run("save-meeting-LLM-outputs", async () => {
      await fetchMutation(api.webhooks.meetings.update, {
        secret: process.env.INTERNAL_WEBHOOK_SECRET!,
        nanoId: meetingNanoId,
        status: "completed",
        summary: "Resumen no generado en esta versión.",
        structuredClinicalNoteJson: clinicalNoteOutputStr,  // ← JSON como string
        structuredClinicalNoteJsonOriginal: clinicalNoteOutputStr,  // Backup
        transcriptUrl: transcriptSignedGcsUrl,
      });
    });
  }
);
```

### 2.5 Mutation de Convex para Guardar

**Archivo**: `next-app/convex/webhooks/meetings.ts`

```typescript
export const update = mutation({
  args: {
    secret: v.string(),
    nanoId: v.string(),
    status: v.optional(MeetingStatus),
    summary: v.optional(v.string()),
    structuredClinicalNoteJson: v.optional(v.string()),
    structuredClinicalNoteJsonOriginal: v.optional(v.string()),
    transcriptUrl: v.optional(v.string()),
    statusProcessingData: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Validar secret interno
    if (args.secret !== process.env.INTERNAL_WEBHOOK_SECRET) {
      throw new Error("Unauthorized");
    }

    // Buscar meeting por nanoId
    const meeting = await ctx.db
      .query("meetings")
      .withIndex("by_nanoId", (q) => q.eq("nanoId", args.nanoId))
      .unique();

    if (!meeting) {
      throw new Error(`Meeting not found: ${args.nanoId}`);
    }

    // Actualizar campos
    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.status) updateData.status = args.status;
    if (args.summary) updateData.summary = args.summary;
    if (args.structuredClinicalNoteJson) {
      updateData.structuredClinicalNoteJson = args.structuredClinicalNoteJson;
    }
    if (args.structuredClinicalNoteJsonOriginal) {
      updateData.structuredClinicalNoteJsonOriginal = args.structuredClinicalNoteJsonOriginal;
    }
    if (args.transcriptUrl) updateData.transcriptUrl = args.transcriptUrl;
    if (args.statusProcessingData) {
      updateData.statusProcessingData = args.statusProcessingData;
    }

    // Aplicar cambios
    await ctx.db.patch(meeting._id, updateData);

    return { success: true };
  },
});
```

---

## 3. Renderizado Frontend (TipTap/Prosemirror)

### 3.1 ¿Qué es TipTap y Prosemirror?

**Prosemirror**:
- Framework de bajo nivel para editores de texto enriquecido
- Usado por: Atlassian (Confluence), Google Docs internals, etc.
- Muy poderoso pero complejo de usar directamente

**TipTap**:
- Framework de alto nivel construido sobre Prosemirror
- API moderna y React-friendly
- Sistema de extensiones modular
- Usado por: GitLab, Substack, Linear, etc.

### 3.2 Componente Principal del Editor

**Archivo**: `next-app/src/components/tiptap/editor.tsx`

Este es el componente principal que renderiza y permite editar las notas clínicas.

```typescript
interface TiptapEditorPRARTISProps {
  value?: JsonValue;  // JSON de la nota clínica
  onChange?: (value: JsonValue) => void;  // Callback al editar
  className?: string;
}

export const TiptapEditorPRARTIS = ({
  value,
  onChange,
  className,
}: TiptapEditorPRARTISProps) => {
  // Inicializar editor con TipTap
  const editor = useEditor({
    extensions: [
      CustomDocument,        // Extensión custom para documento
      StarterKit.configure({
        document: false,     // Desactivar doc default
        paragraph: false,    // Desactivar paragraph default
      }),
      CustomParagraph,       // Extensión custom para párrafos con niveles
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "customDocument") {
            return "Título del documento";
          }
          return "Agrega contenido clínico...";
        },
      }),
    ],
    content: value ? jsonToTiptapDoc(value) : undefined,  // ← Transformación JSON → TipTap

    // ¡CLAVE! Callback cuando el usuario edita
    onUpdate: ({ editor }) => {
      const tiptapJson = editor.getJSON();
      const transformed = tiptapToStructuredJson(tiptapJson);  // ← TipTap → JSON
      onChange?.(transformed);
    },
  });

  return (
    <div className={cn("tiptap-editor", className)}>
      <EditorContent editor={editor} />
    </div>
  );
};
```

### 3.3 Extensiones Custom de Prosemirror

**CustomDocument**:
```typescript
const CustomDocument = Document.extend({
  content: "heading block*",  // Un heading seguido de múltiples bloques
});
```

**CustomParagraph**:
```typescript
const CustomParagraph = Paragraph.extend({
  addAttributes() {
    return {
      level: {
        default: 1,  // Nivel de indentación (1-5)
        parseHTML: (element) => element.getAttribute("data-level") || 1,
        renderHTML: (attributes) => ({
          "data-level": attributes.level,
          style: `margin-left: ${(attributes.level - 1) * 1.5}rem`,  // Indentación visual
        }),
      },
    };
  },
});
```

**¿Por qué niveles?** Para representar la jerarquía del JSON:
```json
{
  "datos_personales": {        // ← Nivel 1 (heading)
    "edad": "35 años"          // ← Nivel 2 (párrafo indentado)
  }
}
```

### 3.4 Transformación: JSON → TipTap Document

**Función clave**: `jsonToTiptapDoc()`

```typescript
function jsonToTiptapDoc(data: JsonValue): JSONContent {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error("Root debe ser un objeto");
  }

  return {
    type: "doc",
    content: objectToTiptapNodes(data as Record<string, JsonValue>, 1),
  };
}

function objectToTiptapNodes(
  obj: Record<string, JsonValue>,
  level: number
): JSONContent[] {
  const nodes: JSONContent[] = [];

  for (const [key, value] of Object.entries(obj)) {
    // Agregar heading para la key
    nodes.push({
      type: "heading",
      attrs: { level: Math.min(level, 3) },  // H1-H3 máximo
      content: [{ type: "text", text: key }],
    });

    // Procesar el value según su tipo
    if (value === null || value === undefined) {
      // Valor vacío
      nodes.push({
        type: "paragraph",
        attrs: { level: level + 1 },
        content: [{ type: "text", text: "" }],
      });
    } else if (typeof value === "string") {
      // String simple
      nodes.push({
        type: "paragraph",
        attrs: { level: level + 1 },
        content: [{ type: "text", text: value }],
      });
    } else if (typeof value === "number" || typeof value === "boolean") {
      // Número o booleano
      nodes.push({
        type: "paragraph",
        attrs: { level: level + 1 },
        content: [{ type: "text", text: String(value) }],
      });
    } else if (Array.isArray(value)) {
      // Array de elementos
      value.forEach((item, index) => {
        if (typeof item === "object" && item !== null && !Array.isArray(item)) {
          // Array de objetos - cada objeto como sub-sección
          nodes.push(
            ...objectToTiptapNodes(
              { [`${index + 1}`]: item },  // Numeración 1, 2, 3...
              level + 1
            )
          );
        } else {
          // Array de primitivos
          nodes.push({
            type: "paragraph",
            attrs: { level: level + 1 },
            content: [{ type: "text", text: String(item) }],
          });
        }
      });
    } else if (typeof value === "object") {
      // Objeto nested - recursión
      nodes.push(...objectToTiptapNodes(value as Record<string, JsonValue>, level + 1));
    }
  }

  return nodes;
}
```

**Ejemplo de transformación**:

**JSON Input**:
```json
{
  "datos_personales": {
    "edad": "35 años",
    "sexo": "Masculino"
  },
  "motivo_consulta": "Dolor abdominal"
}
```

**TipTap Document Output**:
```json
{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 1 },
      "content": [{ "type": "text", "text": "datos_personales" }]
    },
    {
      "type": "heading",
      "attrs": { "level": 2 },
      "content": [{ "type": "text", "text": "edad" }]
    },
    {
      "type": "paragraph",
      "attrs": { "level": 3 },
      "content": [{ "type": "text", "text": "35 años" }]
    },
    {
      "type": "heading",
      "attrs": { "level": 2 },
      "content": [{ "type": "text", "text": "sexo" }]
    },
    {
      "type": "paragraph",
      "attrs": { "level": 3 },
      "content": [{ "type": "text", "text": "Masculino" }]
    },
    {
      "type": "heading",
      "attrs": { "level": 1 },
      "content": [{ "type": "text", "text": "motivo_consulta" }]
    },
    {
      "type": "paragraph",
      "attrs": { "level": 2 },
      "content": [{ "type": "text", "text": "Dolor abdominal" }]
    }
  ]
}
```

### 3.5 Transformación: TipTap Document → JSON

**Función clave**: `tiptapToStructuredJson()`

```typescript
function tiptapToStructuredJson(tiptapDoc: JSONContent): JsonValue {
  if (!tiptapDoc.content) return {};

  const result: Record<string, any> = {};
  const stack: { obj: Record<string, any>; level: number }[] = [
    { obj: result, level: 0 },
  ];

  let currentKey: string | null = null;

  for (const node of tiptapDoc.content) {
    if (node.type === "heading") {
      // Heading = key en el JSON
      const headingLevel = node.attrs?.level ?? 1;
      const keyText = extractText(node);

      // Ajustar stack según nivel de heading
      while (
        stack.length > 1 &&
        stack[stack.length - 1].level >= headingLevel
      ) {
        stack.pop();
      }

      currentKey = keyText;
      const currentObj = stack[stack.length - 1].obj;

      // Inicializar con objeto vacío (se llenará con siguiente párrafo)
      currentObj[currentKey] = {};
      stack.push({ obj: currentObj[currentKey], level: headingLevel });
    } else if (node.type === "paragraph") {
      // Paragraph = value en el JSON
      const text = extractText(node);

      if (currentKey !== null) {
        const parentObj = stack[stack.length - 2]?.obj;
        if (parentObj && currentKey in parentObj) {
          // Si el value actual es {}, reemplazar con string
          if (
            typeof parentObj[currentKey] === "object" &&
            Object.keys(parentObj[currentKey]).length === 0
          ) {
            parentObj[currentKey] = text;
          }
        }
      }
    }
  }

  return result;
}

function extractText(node: JSONContent): string {
  if (!node.content) return "";
  return node.content
    .filter((n) => n.type === "text")
    .map((n) => n.text || "")
    .join("");
}
```

**Ejemplo de transformación inversa**:

**TipTap Document Input**: (del ejemplo anterior)

**JSON Output**:
```json
{
  "datos_personales": {
    "edad": "35 años",
    "sexo": "Masculino"
  },
  "motivo_consulta": "Dolor abdominal"
}
```

### 3.6 Renderizado en la UI

**Archivo**: `next-app/src/modules/meetings/ui/components/completed-state.tsx`

```typescript
export const CompletedState = ({ meetingId }: CompletedStateProps) => {
  // Obtener datos del meeting desde Convex (real-time)
  const meetingData = useQuery(api.meetings.getOne, { nanoId: meetingId });

  // Mutation para actualizar nota clínica
  const updateStructuredClinicalNote = useMutation(
    api.meetings.updateStructuredClinicalNote
  );

  // Handler para cambios en el editor (con debounce)
  const handleClinicalNoteChange = useDebouncedCallback(
    (structuredClinicalNoteJson: JsonValue) => {
      const currentJson = JSON.parse(
        meetingData.structuredClinicalNoteJson ?? "{}"
      );

      // Solo actualizar si cambió
      if (
        JSON.stringify(currentJson) !==
        JSON.stringify(structuredClinicalNoteJson)
      ) {
        console.log("Updating clinical note…");
        updateStructuredClinicalNote({
          nanoId: meetingData.nanoId,
          structuredClinicalNoteJson: JSON.stringify(structuredClinicalNoteJson),
        });
      }
    },
    1000  // ← 1 segundo de debounce
  );

  return (
    <div className="clinical-note-editor">
      <TiptapEditorPRARTIS
        value={JSON.parse(meetingData.structuredClinicalNoteJson ?? "{}")}
        onChange={handleClinicalNoteChange}
        className="min-h-[500px]"
      />
    </div>
  );
};
```

---

## 4. Sincronización en Tiempo Real (Convex)

### 4.1 Arquitectura de Convex Real-Time

Convex proporciona **subscripciones reactivas** automáticas sin necesidad de configurar WebSockets manualmente.

**Cómo funciona bajo el capó**:

```
┌─────────────────────┐
│   React Component   │
│                     │
│  useQuery(api.     │
│    meetings.getOne)│
└──────────┬──────────┘
           │
           │ 1. Establece WebSocket
           ▼
┌─────────────────────┐
│   Convex Client     │
│   (JavaScript SDK)  │
└──────────┬──────────┘
           │
           │ 2. Subscribe a query
           ▼
┌─────────────────────┐
│   Convex Backend    │
│   (Serverless)      │
└──────────┬──────────┘
           │
           │ 3. Ejecuta query y observa cambios
           ▼
┌─────────────────────┐
│   Convex Database   │
│   (Document Store)  │
└─────────────────────┘

Cuando hay un cambio:
           │
           │ 4. Detecta cambio en documento
           ▼
┌─────────────────────┐
│   Convex Backend    │
│   (Push update)     │
└──────────┬──────────┘
           │
           │ 5. Push via WebSocket
           ▼
┌─────────────────────┐
│   Convex Client     │
│   (Re-ejecuta query)│
└──────────┬──────────┘
           │
           │ 6. Trigger React re-render
           ▼
┌─────────────────────┐
│   React Component   │
│   (UI actualizado)  │
└─────────────────────┘
```

### 4.2 Hook useQuery - Subscripción Automática

**Archivo**: `next-app/src/modules/meetings/ui/components/meeting-id-view.tsx`

```typescript
"use client";

import { useQuery } from "convex/react";
import { api } from "@convexdev/_generated/api";

export const MeetingView = ({ meetingId }: { meetingId: string }) => {
  // ¡ESTO ES MÁGICO! Subscripción real-time automática
  const meetingData = useQuery(api.meetings.getOne, {
    nanoId: meetingId,
  });

  // meetingData se actualiza automáticamente cuando cambia en la DB
  // No hay polling, no hay manual WebSocket, no hay setState()

  if (meetingData === undefined) {
    return <LoadingSpinner />;  // Query ejecutándose
  }

  if (meetingData === null) {
    return <NotFoundError />;  // Meeting no existe
  }

  // Renderizar según status
  switch (meetingData.status) {
    case "scheduled":
      return <ScheduledState meeting={meetingData} />;
    case "in_progress":
      return <InProgressState meeting={meetingData} />;
    case "processing":
      return <ProcessingState meeting={meetingData} />;
    case "completed":
      return <CompletedState meeting={meetingData} />;  // ← Editor de notas
    case "failed":
      return <FailedState meeting={meetingData} />;
    default:
      return <UnknownState />;
  }
};
```

**Características de `useQuery`**:

1. **Subscripción automática**: Se suscribe al resultado del query
2. **Re-ejecución automática**: Cuando cambian los argumentos, re-ejecuta el query
3. **Actualizaciones en vivo**: Cuando la data cambia en la DB, re-ejecuta el query
4. **Estados del hook**:
   - `undefined`: Query ejecutándose por primera vez
   - `null`: Query completado pero no encontró resultados
   - `T`: Query completado con datos

### 4.3 Query de Convex

**Archivo**: `next-app/convex/meetings.ts`

```typescript
export const getOne = query({
  args: {
    nanoId: v.string(),
  },
  handler: async (ctx, { nanoId }) => {
    // Buscar meeting por nanoId
    const meeting = await ctx.db
      .query("meetings")
      .withIndex("by_nanoId", (q) => q.eq("nanoId", nanoId))
      .unique();

    if (!meeting) {
      return null;
    }

    // Obtener datos del agent relacionado
    const agent = await ctx.db.get(meeting.agentId);

    return {
      ...meeting,
      agent,
    };
  },
});
```

**Características del query**:
- **Reactivo**: Convex observa todos los documentos accedidos
- **Granular**: Si cambia cualquier campo del documento, notifica a subscriptores
- **Eficiente**: Solo envía deltas (cambios) por el WebSocket
- **Transaccional**: Garantiza consistencia snapshot

### 4.4 Mutation de Convex

**Archivo**: `next-app/convex/meetings.ts`

```typescript
export const updateStructuredClinicalNote = mutation({
  args: {
    nanoId: v.string(),
    structuredClinicalNoteJson: v.string(),
  },
  handler: async (ctx, { nanoId, structuredClinicalNoteJson }) => {
    // Obtener identidad del usuario (Clerk)
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    // Buscar meeting
    const meeting = await ctx.db
      .query("meetings")
      .withIndex("by_nanoId", (q) => q.eq("nanoId", nanoId))
      .unique();

    if (!meeting) {
      throw new Error("Meeting not found");
    }

    // Verificar permisos (solo dueño puede editar)
    if (meeting.userId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    // Actualizar documento
    await ctx.db.patch(meeting._id, {
      structuredClinicalNoteJson,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
```

**Características de la mutation**:
- **Transaccional**: Todo-o-nada (ACID)
- **Autenticada**: Usa Clerk para verificar identidad
- **Autorizada**: Verifica que el usuario sea dueño del meeting
- **Real-time broadcast**: Automáticamente notifica a todos los subscriptores del query

### 4.5 Propagación de Cambios

**Flujo completo de actualización**:

```typescript
// 1. Usuario edita en TipTap
<TiptapEditorPRARTIS
  onChange={(newData) => {
    // 2. Debounce (1 segundo)
    debouncedUpdate(newData);
  }}
/>

// 3. Mutation a Convex
const updateStructuredClinicalNote = useMutation(
  api.meetings.updateStructuredClinicalNote
);

updateStructuredClinicalNote({
  nanoId: "m_abc123",
  structuredClinicalNoteJson: JSON.stringify(newData),
});

// 4. Convex actualiza DB
await ctx.db.patch(meeting._id, {
  structuredClinicalNoteJson: newJson,
});

// 5. Convex detecta cambio y notifica subscriptores
// 6. Todos los clientes con useQuery(api.meetings.getOne, { nanoId: "m_abc123" })
//    reciben actualización automáticamente

// 7. React re-renderiza con nueva data
const meetingData = useQuery(api.meetings.getOne, { nanoId: "m_abc123" });
// meetingData.structuredClinicalNoteJson ahora contiene el nuevo JSON
```

**Tiempo de propagación**: ~50-200ms (dependiendo de latencia de red)

---

## 5. Lógica de Edición

### 5.1 Ciclo de Vida de una Edición

```typescript
┌──────────────────────────────────────────────────────────────────┐
│ 1. USUARIO ESCRIBE EN EL EDITOR                                  │
│    Ejemplo: Cambia "35 años" → "36 años"                         │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. TIPTAP ONUPDATE CALLBACK                                      │
│    Cada keystroke dispara el callback                            │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. TRANSFORMACIÓN TIPTAP → JSON                                  │
│    const tiptapJson = editor.getJSON();                          │
│    const structured = tiptapToStructuredJson(tiptapJson);        │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│ 4. DEBOUNCED CALLBACK                                            │
│    Espera 1 segundo sin cambios antes de ejecutar                │
│    Si el usuario sigue escribiendo, reinicia el timer            │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│ 5. COMPARACIÓN CON VERSIÓN GUARDADA                              │
│    const current = JSON.parse(meetingData.structuredClinicalNote);│
│    if (JSON.stringify(current) !== JSON.stringify(newData)) {   │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│ 6. MUTATION A CONVEX                                             │
│    updateStructuredClinicalNote({                                │
│      nanoId,                                                     │
│      structuredClinicalNoteJson: JSON.stringify(newData)         │
│    });                                                           │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│ 7. CONVEX PERSISTE EN DB                                         │
│    await ctx.db.patch(meeting._id, { ... });                    │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│ 8. CONVEX NOTIFICA A TODOS LOS SUBSCRIPTORES                    │
│    Todos los clientes con useQuery() reciben update             │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│ 9. REACT RE-RENDERIZA (SOLO SI ES NECESARIO)                    │
│    Si el componente que editó es el mismo que recibe el update,  │
│    el editor NO se re-inicializa (gracias a useEditor hook)     │
└──────────────────────────────────────────────────────────────────┘
```

### 5.2 Debouncing - ¿Por qué 1 segundo?

**Archivo**: `next-app/src/modules/meetings/ui/components/completed-state.tsx`

```typescript
import { useDebouncedCallback } from "use-debounce";

const handleClinicalNoteChange = useDebouncedCallback(
  (structuredClinicalNoteJson: JsonValue) => {
    // ... lógica de guardado
  },
  1000  // ← 1 segundo (1000ms)
);
```

**Razones para 1 segundo**:

1. **Balance UX**: No tan rápido que dispare muchas mutations innecesarias, no tan lento que el usuario sienta que no se guarda
2. **Reduce carga en DB**: Un usuario escribiendo 60 palabras/minuto = ~5 keystrokes/segundo. Sin debounce = 5 mutations/segundo. Con debounce = 1 mutation cada 1-2 segundos.
3. **Red eficiente**: Menos round-trips HTTP/WebSocket
4. **Feedback visual**: Suficientemente rápido para que el usuario vea "Guardando..." en la UI

**Alternativas comunes**:
- **Google Docs**: ~500ms (más agresivo)
- **Notion**: ~2000ms (más conservador)
- **Microsoft Word Online**: ~1000ms (similar)

### 5.3 Comparación para Evitar Writes Innecesarios

```typescript
const handleClinicalNoteChange = useDebouncedCallback(
  (structuredClinicalNoteJson: JsonValue) => {
    const current = JSON.parse(
      meetingData.structuredClinicalNoteJson ?? "{}"
    );

    // ← COMPARACIÓN CRÍTICA
    if (
      JSON.stringify(current) !==
      JSON.stringify(structuredClinicalNoteJson)
    ) {
      console.log("Updating clinical note…");
      updateStructuredClinicalNote({
        nanoId: meetingData.nanoId,
        structuredClinicalNoteJson: JSON.stringify(structuredClinicalNoteJson),
      });
    } else {
      console.log("No changes detected, skipping update");
    }
  },
  1000
);
```

**¿Por qué comparar con JSON.stringify?**

**Problema**: Los objetos en JavaScript comparan por referencia, no por valor:
```typescript
const a = { name: "John" };
const b = { name: "John" };
console.log(a === b);  // false (diferentes referencias)
```

**Solución**: Serializar a string y comparar strings:
```typescript
console.log(JSON.stringify(a) === JSON.stringify(b));  // true
```

**Ventajas**:
- ✅ Detección de cambios profundos (nested objects)
- ✅ Simple de implementar
- ✅ Funciona con arrays y primitivos

**Desventajas**:
- ❌ Sensible al orden de keys (pero `jsonToTiptapDoc` preserva orden)
- ❌ Costo computacional O(n) donde n = tamaño del JSON
- ❌ No funciona con valores `undefined` (se omiten en JSON.stringify)

**Alternativas más sofisticadas**:
- Librería `fast-deep-equal` (más eficiente)
- Hash del contenido (MD5/SHA)
- Diff algorithms (como `diff-match-patch`)

### 5.4 Manejo de Estado del Editor

**Problema**: ¿Qué pasa si el editor recibe un update mientras el usuario está escribiendo?

**Solución de TipTap**: El hook `useEditor` mantiene estado interno y **NO se re-inicializa** en cada render de React.

```typescript
const editor = useEditor({
  content: value,  // ← Solo usado en la PRIMERA inicialización
  onUpdate: ({ editor }) => {
    onChange?.(tiptapToStructuredJson(editor.getJSON()));
  },
});

// En renders subsecuentes, el editor NO se re-crea
// El contenido del editor es controlado por Prosemirror, no por React
```

**Comportamiento**:

1. **Usuario A** abre el documento → Editor inicializa con JSON de la DB
2. **Usuario A** escribe "Paciente presenta..." → onUpdate dispara
3. **1 segundo después** → Mutation guarda en DB
4. **Convex notifica** → React re-renderiza
5. **Editor de Usuario A** → **NO se re-inicializa**, mantiene el texto que el usuario escribió
6. **Usuario B** (en otra pestaña/dispositivo) → Recibe update → Su editor SÍ se actualiza

**¿Por qué funciona así?**
- TipTap mantiene el **ProseMirror EditorState** independiente de React
- React solo controla el **montaje** del editor, no el contenido frame-a-frame
- Esto previene "saltos" en el cursor mientras el usuario escribe

### 5.5 Manejo de Errores en Edición

**Errores posibles**:

1. **Error de red**: Mutation falla porque no hay internet
2. **Error de autenticación**: Token de Clerk expiró
3. **Error de permisos**: Usuario intenta editar un meeting que no le pertenece
4. **Error de validación**: JSON mal formado

**Implementación actual**:
```typescript
const updateStructuredClinicalNote = useMutation(
  api.meetings.updateStructuredClinicalNote
);

// ⚠️ NO HAY MANEJO DE ERRORES EXPLÍCITO
updateStructuredClinicalNote({ nanoId, structuredClinicalNoteJson });
```

**Mejora recomendada**:
```typescript
try {
  await updateStructuredClinicalNote({
    nanoId,
    structuredClinicalNoteJson
  });
  toast.success("Nota guardada");
} catch (error) {
  console.error("Error saving note:", error);
  toast.error("Error al guardar. Reintentando...");
  // Retry logic aquí
}
```

---

## 6. Sistema de Auto-Guardado

### 6.1 Arquitectura del Auto-Guardado

El sistema de auto-guardado tiene 3 componentes clave:

```typescript
┌─────────────────────────────────────────────────────────────────┐
│                    COMPONENTES DEL AUTO-GUARDADO                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. DEBOUNCING (use-debounce)                                   │
│     └─ Espera 1 segundo sin cambios antes de guardar            │
│                                                                  │
│  2. CHANGE DETECTION (JSON.stringify comparison)                │
│     └─ Solo guarda si el contenido realmente cambió             │
│                                                                  │
│  3. OPTIMISTIC UPDATES (Convex mutations)                       │
│     └─ La UI se actualiza inmediatamente, sincroniza después    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Implementación Completa

**Archivo**: `next-app/src/modules/meetings/ui/components/completed-state.tsx`

```typescript
"use client";

import { useMutation, useQuery } from "convex/react";
import { useDebouncedCallback } from "use-debounce";
import { api } from "@convexdev/_generated/api";
import { TiptapEditorPRARTIS } from "@/components/tiptap/editor";
import type { JsonValue } from "convex/values";

export const CompletedState = ({ meetingId }: { meetingId: string }) => {
  // ═══════════════════════════════════════════════════════════════
  // 1. SUBSCRIPCIÓN REAL-TIME A LA DATA
  // ═══════════════════════════════════════════════════════════════
  const meetingData = useQuery(api.meetings.getOne, {
    nanoId: meetingId,
  });

  // ═══════════════════════════════════════════════════════════════
  // 2. MUTATION PARA ACTUALIZAR LA NOTA
  // ═══════════════════════════════════════════════════════════════
  const updateStructuredClinicalNote = useMutation(
    api.meetings.updateStructuredClinicalNote
  );

  // ═══════════════════════════════════════════════════════════════
  // 3. CALLBACK DEBOUNCED (1 SEGUNDO)
  // ═══════════════════════════════════════════════════════════════
  const handleClinicalNoteChange = useDebouncedCallback(
    (structuredClinicalNoteJson: JsonValue) => {
      // Parsear versión actual de la DB
      const current = JSON.parse(
        meetingData.structuredClinicalNoteJson ?? "{}"
      );

      // Comparar con nueva versión
      const hasChanged =
        JSON.stringify(current) !==
        JSON.stringify(structuredClinicalNoteJson);

      if (hasChanged) {
        console.log("📝 Updating clinical note…");

        // Guardar en Convex
        updateStructuredClinicalNote({
          nanoId: meetingData.nanoId,
          structuredClinicalNoteJson: JSON.stringify(
            structuredClinicalNoteJson
          ),
        });
      } else {
        console.log("⏭️  No changes detected, skipping update");
      }
    },
    1000 // ← 1 segundo de espera
  );

  // ═══════════════════════════════════════════════════════════════
  // 4. RENDERIZADO
  // ═══════════════════════════════════════════════════════════════
  if (!meetingData) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Sección de transcript */}
      <section>
        <h2>Transcripción</h2>
        {meetingData.transcriptUrl ? (
          <TranscriptViewer url={meetingData.transcriptUrl} />
        ) : (
          <p>No disponible</p>
        )}
      </section>

      {/* Sección de nota clínica EDITABLE */}
      <section>
        <h2>Nota Clínica</h2>
        <TiptapEditorPRARTIS
          value={JSON.parse(
            meetingData.structuredClinicalNoteJson ?? "{}"
          )}
          onChange={handleClinicalNoteChange}
          className="min-h-[500px] border rounded-lg p-4"
        />
      </section>
    </div>
  );
};
```

### 6.3 Flujo Temporal del Auto-Guardado

**Ejemplo: Usuario escribe "Paciente presenta dolor abdominal"**

```
t=0ms     Usuario presiona "P"
          └─> onUpdate dispara
              └─> handleClinicalNoteChange se encola (debounced)

t=50ms    Usuario presiona "a"
          └─> onUpdate dispara
              └─> Cancela callback anterior, encola nuevo callback

t=100ms   Usuario presiona "c"
          └─> onUpdate dispara
              └─> Cancela callback anterior, encola nuevo callback

... (usuario sigue escribiendo)

t=3000ms  Usuario presiona "l" (última letra)
          └─> onUpdate dispara
              └─> Cancela callback anterior, encola nuevo callback

t=4000ms  ⏰ 1 SEGUNDO SIN CAMBIOS
          └─> Callback se ejecuta
              └─> Compara JSON actual vs nuevo
                  └─> Son diferentes → Mutation a Convex
                      └─> Convex guarda en DB (50-100ms)
                          └─> Convex notifica subscriptores (50-100ms)

t=4200ms  ✅ Guardado completado y propagado
```

**Análisis**:
- **Usuario escribe durante 3 segundos** → Solo 1 mutation al final
- **Sin debouncing** → ~60 mutations (60 caracteres ≈ 60 keystrokes)
- **Reducción**: 98.3% menos mutations

### 6.4 Indicador Visual de Guardado (No Implementado)

**Mejora recomendada**: Agregar un indicador visual tipo "Guardando..." / "Guardado"

```typescript
const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

const handleClinicalNoteChange = useDebouncedCallback(
  async (structuredClinicalNoteJson: JsonValue) => {
    setSaveStatus("saving");

    try {
      await updateStructuredClinicalNote({
        nanoId: meetingData.nanoId,
        structuredClinicalNoteJson: JSON.stringify(structuredClinicalNoteJson),
      });

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);  // Ocultar después de 2s
    } catch (error) {
      console.error("Error saving:", error);
      setSaveStatus("idle");
      toast.error("Error al guardar");
    }
  },
  1000
);

// En el render:
<div className="flex items-center gap-2">
  <TiptapEditorPRARTIS ... />
  {saveStatus === "saving" && (
    <span className="text-gray-500">💾 Guardando...</span>
  )}
  {saveStatus === "saved" && (
    <span className="text-green-500">✓ Guardado</span>
  )}
</div>
```

### 6.5 Comparación con Otros Sistemas

| Sistema | Estrategia | Debounce | Indicador Visual |
|---------|------------|----------|------------------|
| **Prartis** | Debounce + Change detection | 1000ms | ❌ No |
| **Google Docs** | Operational Transforms + CRDT | ~500ms | ✅ "Guardando..." |
| **Notion** | Blocks optimistic + Queue | ~2000ms | ✅ "Sincronizando..." |
| **Microsoft Word Online** | OT + Conflict resolution | ~1000ms | ✅ "Guardado automáticamente" |
| **Dropbox Paper** | CRDTs (Yjs) | ~100ms | ✅ Avatar indicators |

---

## 7. Funcionalidad Tipo Google Docs

### 7.1 Características Implementadas ✅

#### 1. Actualizaciones en Tiempo Real (Real-Time Updates)

**Similar a Google Docs**: Cuando alguien edita un documento, otros usuarios ven los cambios casi instantáneamente.

**Implementación en Prartis**:
```typescript
// Usuario A y Usuario B abren el mismo meeting
const meetingData = useQuery(api.meetings.getOne, { nanoId: "m_abc123" });

// Usuario A edita y guarda
updateStructuredClinicalNote({ nanoId: "m_abc123", ... });

// Usuario B recibe actualización automáticamente (50-200ms)
// meetingData se actualiza sin refrescar la página
```

**Diferencia con Google Docs**:
- **Google Docs**: Actualización character-by-character mientras escribes
- **Prartis**: Actualización cada ~1 segundo (cuando se guarda con debounce)

#### 2. Auto-Guardado (Auto-Save)

**Similar a Google Docs**: No hay botón "Guardar". Todos los cambios se guardan automáticamente.

**Implementación en Prartis**:
```typescript
// No hay <button onClick={saveNote}>Guardar</button>
// Todo se guarda automáticamente con debouncing
const handleClinicalNoteChange = useDebouncedCallback(..., 1000);
```

**Diferencia con Google Docs**:
- **Google Docs**: Guarda continuamente (cada ~500ms)
- **Prartis**: Guarda después de 1 segundo sin cambios

#### 3. Editor de Texto Rico (Rich Text Editor)

**Similar a Google Docs**: Editor WYSIWYG con headings, párrafos, formato.

**Implementación en Prartis**:
```typescript
// TipTap = Editor moderno basado en Prosemirror
<TiptapEditorPRARTIS
  value={jsonData}
  onChange={handleChange}
/>
```

**Diferencia con Google Docs**:
- **Google Docs**: Full rich text (bold, italic, images, tables, comments)
- **Prartis**: Headings + párrafos con indentación (más simple)

#### 4. Persistencia Confiable

**Similar a Google Docs**: Los cambios se guardan en la nube, no se pierden.

**Implementación en Prartis**:
```typescript
// Convex proporciona persistencia ACID
await ctx.db.patch(meeting._id, { structuredClinicalNoteJson });
```

### 7.2 Características NO Implementadas ❌

#### 1. Edición Colaborativa Multi-Usuario

**Google Docs**: Múltiples usuarios pueden editar simultáneamente sin conflictos.

**Prartis**: ❌ **NO implementado**

**Problema**:
```typescript
// Escenario problemático:
// t=0: Usuario A abre nota → JSON = { motivo_consulta: "Dolor abdominal" }
// t=1: Usuario B abre nota → JSON = { motivo_consulta: "Dolor abdominal" }
// t=2: Usuario A cambia a "Dolor de cabeza"
// t=3: Usuario B cambia a "Dolor torácico"
// t=4: Usuario A guarda (debounce) → DB = "Dolor de cabeza"
// t=5: Usuario B guarda (debounce) → DB = "Dolor torácico" (¡SOBREESCRIBE A!)
```

**Resultado**: Last Write Wins (LWW) - El último en guardar gana, se pierde el trabajo del otro.

**Solución (no implementada)**:
- Usar **CRDTs** (Conflict-free Replicated Data Types)
- Usar **Operational Transforms** (OT)
- Implementar **Yjs** (librería de CRDT para editores colaborativos)

#### 2. Cursores en Vivo (Live Cursors)

**Google Docs**: Ves el cursor de otros usuarios en tiempo real con su nombre.

**Prartis**: ❌ **NO implementado**

**Cómo funcionaría**:
```typescript
// Cada usuario enviaría su posición de cursor
broadcastCursorPosition({
  userId: "user_123",
  position: 42,  // Offset en el documento
  selection: { from: 42, to: 50 },
});

// Otros usuarios renderizarían cursores
<CursorOverlay>
  <Cursor user="Juan" color="blue" position={42} />
  <Cursor user="María" color="green" position={100} />
</CursorOverlay>
```

**Librerías para implementar**:
- `@liveblocks/react` (Liveblocks)
- `@ably/spaces` (Ably)
- `y-prosemirror` + `y-websocket` (Yjs)

#### 3. Awareness / Presencia

**Google Docs**: Ves quién más está viendo/editando el documento (avatares arriba).

**Prartis**: ❌ **NO implementado**

**Cómo funcionaría**:
```typescript
// Convex Presence API (existe pero no está implementado aquí)
const presence = usePresence(api.meetings.presence, { meetingId });

// Renderizar avatars
<div className="avatars">
  {presence.users.map(user => (
    <Avatar key={user.id} name={user.name} />
  ))}
</div>
```

#### 4. Resolución de Conflictos

**Google Docs**: Si dos usuarios editan la misma parte, Google Docs fusiona los cambios inteligentemente.

**Prartis**: ❌ **NO implementado** (Last Write Wins)

**Ejemplo de conflicto**:
```json
// Versión inicial
{
  "motivo_consulta": "Dolor"
}

// Usuario A edita → "Dolor abdominal"
// Usuario B edita → "Dolor torácico"

// Google Docs → Detecta conflicto → Muestra UI para resolver
// Prartis → Usuario que guarda último sobrescribe al otro
```

#### 5. Historial de Versiones

**Google Docs**: Puedes ver versiones anteriores y restaurarlas.

**Prartis**: ❌ **NO implementado**

**Implementación recomendada**:
```typescript
// Agregar tabla de versiones en Convex
versions: defineTable({
  meetingId: v.id("meetings"),
  structuredClinicalNoteJson: v.string(),
  userId: v.string(),
  timestamp: v.number(),
  changeDescription: v.optional(v.string()),
})
```

#### 6. Comentarios y Sugerencias

**Google Docs**: Puedes agregar comentarios y sugerencias en partes del documento.

**Prartis**: ❌ **NO implementado**

### 7.3 Tabla Comparativa Completa

| Característica | Google Docs | Prartis | Implementación |
|----------------|-------------|---------|----------------|
| **Editor de texto** | ✅ Full rich text | ✅ Headings + párrafos | TipTap |
| **Auto-guardado** | ✅ ~500ms | ✅ ~1000ms | Debounce |
| **Real-time viewing** | ✅ Character-level | ✅ Document-level | Convex useQuery |
| **Colaboración multi-usuario** | ✅ OT | ❌ LWW | N/A |
| **Cursores en vivo** | ✅ | ❌ | N/A |
| **Presencia/Awareness** | ✅ | ❌ | N/A |
| **Resolución de conflictos** | ✅ Smart merge | ❌ LWW | N/A |
| **Historial de versiones** | ✅ | ❌ | N/A |
| **Comentarios** | ✅ | ❌ | N/A |
| **Sugerencias** | ✅ | ❌ | N/A |
| **Offline mode** | ✅ | ❌ | N/A |
| **Formato (bold, italic)** | ✅ | ❌ | N/A |
| **Imágenes/tablas** | ✅ | ❌ | N/A |

**Leyenda**:
- ✅ = Implementado
- ❌ = No implementado
- OT = Operational Transforms
- LWW = Last Write Wins
- N/A = No aplicable

### 7.4 ¿Cómo Agregar Colaboración Real?

**Opción 1: Yjs (Recomendado)**

```bash
pnpm add yjs y-prosemirror y-websocket
```

```typescript
import * as Y from "yjs";
import { ySyncPlugin, yCursorPlugin } from "y-prosemirror";
import { WebsocketProvider } from "y-websocket";

// Crear documento compartido Yjs
const ydoc = new Y.Doc();

// Conectar a servidor WebSocket
const provider = new WebsocketProvider(
  "wss://your-server.com",
  "meeting-m_abc123",
  ydoc
);

// Configurar TipTap con Yjs
const editor = useEditor({
  extensions: [
    StarterKit,
    Collaboration.configure({
      document: ydoc,
    }),
    CollaborationCursor.configure({
      provider,
      user: {
        name: currentUser.name,
        color: currentUser.color,
      },
    }),
  ],
});
```

**Ventajas**:
- ✅ CRDT (sin conflictos)
- ✅ Offline-first
- ✅ Cursores en vivo
- ✅ Undo/Redo colaborativo

**Desventajas**:
- ❌ Requiere servidor WebSocket custom
- ❌ Complejidad adicional

**Opción 2: Liveblocks**

```bash
pnpm add @liveblocks/client @liveblocks/react @liveblocks/yjs
```

```typescript
import { LiveblocksProvider } from "@liveblocks/react";
import { useLiveblocksExtension } from "@liveblocks/react-tiptap";

const editor = useEditor({
  extensions: [
    StarterKit,
    useLiveblocksExtension({
      offlineSupport_experimental: true,
    }),
  ],
});
```

**Ventajas**:
- ✅ Servicio gestionado (no servidor propio)
- ✅ CRDT + presencia + comentarios
- ✅ Fácil de integrar

**Desventajas**:
- ❌ Costo por usuario activo
- ❌ Vendor lock-in

---

## 8. Flujo de Datos Completo

### 8.1 Diagrama de Arquitectura Completa

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                USUARIO                                       │
│                         (Médico usando la app)                              │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 │ 1. Inicia consulta
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           STREAM VIDEO SDK                                   │
│                     (Grabación de audio/video)                              │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 │ 2. Termina consulta
                                 │    → Recording disponible
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          STREAM WEBHOOK                                      │
│                    (POST /api/webhook en Next.js)                           │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 │ 3. Dispara evento Inngest
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       INNGEST WORKFLOW                                       │
│                   (sessions/processing)                                      │
│                                                                              │
│  STEP 1: Transcribir audio                                                  │
│  ├─ POST /api/transcribe → FastAPI                                          │
│  └─ AssemblyAI transcribe → "SpeakerA: ...\nSpeakerB: ..."                 │
│                                                                              │
│  STEP 2: Convertir a JSONL                                                  │
│  └─ parsePrartisTranscriptToJSONL()                                         │
│                                                                              │
│  STEP 3: Subir a GCS                                                        │
│  └─ bucket.file('transcripts/m_abc123.jsonl').save()                        │
│                                                                              │
│  STEP 4: Obtener template (opcional)                                        │
│  └─ fetchQuery(api.webhooks.templates.getDefault)                           │
│                                                                              │
│  STEP 5: Generar nota clínica                                               │
│  ├─ POST /api/clinical-note → FastAPI                                       │
│  ├─ OpenAI GPT-5 + system prompt                                            │
│  └─ Retorna JSON estructurado                                               │
│                                                                              │
│  STEP 6: Guardar en Convex                                                  │
│  └─ fetchMutation(api.webhooks.meetings.update)                             │
│      └─ structuredClinicalNoteJson = JSON.stringify(...)                    │
│                                                                              │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 │ 4. Nota guardada en DB
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CONVEX DATABASE                                   │
│                                                                              │
│  meetings {                                                                 │
│    nanoId: "m_abc123",                                                      │
│    status: "completed",                                                     │
│    structuredClinicalNoteJson: "{...}",  ← JSON como string                │
│    transcriptUrl: "https://gcs...",                                         │
│    ...                                                                      │
│  }                                                                          │
│                                                                              │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 │ 5. Real-time push via WebSocket
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CONVEX SUBSCRIPTIONS                                │
│                      (Notifica a todos los clientes)                        │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 │ 6. useQuery recibe update
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REACT COMPONENT                                      │
│                    (CompletedState.tsx)                                      │
│                                                                              │
│  const meetingData = useQuery(api.meetings.getOne, {...});                 │
│  // meetingData.structuredClinicalNoteJson actualizado                      │
│                                                                              │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 │ 7. Renderizar en TipTap
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       TIPTAP EDITOR                                          │
│                                                                              │
│  Transformación: JSON → TipTap Document                                     │
│  ├─ jsonToTiptapDoc(JSON.parse(structuredClinicalNoteJson))                │
│  └─ Renderiza headings + párrafos con indentación                          │
│                                                                              │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 │ 8. Usuario edita
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EDICIÓN POR USUARIO                                  │
│                                                                              │
│  onUpdate: ({ editor }) => {                                                │
│    const tiptapJson = editor.getJSON();                                     │
│    const structured = tiptapToStructuredJson(tiptapJson);                   │
│    onChange(structured);  // ← Dispara callback                            │
│  }                                                                          │
│                                                                              │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 │ 9. Debounced callback (1s)
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      AUTO-GUARDADO                                           │
│                                                                              │
│  useDebouncedCallback((newData) => {                                        │
│    if (JSON.stringify(current) !== JSON.stringify(newData)) {              │
│      updateStructuredClinicalNote({                                         │
│        nanoId,                                                              │
│        structuredClinicalNoteJson: JSON.stringify(newData)                  │
│      });                                                                    │
│    }                                                                        │
│  }, 1000);                                                                  │
│                                                                              │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 │ 10. Mutation a Convex
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CONVEX MUTATION                                          │
│                                                                              │
│  export const updateStructuredClinicalNote = mutation({                     │
│    handler: async (ctx, { nanoId, structuredClinicalNoteJson }) => {       │
│      await ctx.db.patch(meeting._id, {                                     │
│        structuredClinicalNoteJson,                                          │
│        updatedAt: Date.now(),                                               │
│      });                                                                    │
│    }                                                                        │
│  });                                                                        │
│                                                                              │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 │ 11. Persiste en DB
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CONVEX DATABASE (ACTUALIZADO)                           │
│                                                                              │
│  meetings {                                                                 │
│    nanoId: "m_abc123",                                                      │
│    structuredClinicalNoteJson: "{...}",  ← NUEVO CONTENIDO                 │
│    updatedAt: 1738876543210,                                                │
│  }                                                                          │
│                                                                              │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 │ 12. Notifica subscriptores
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TODOS LOS CLIENTES CONECTADOS                             │
│              (Otros dispositivos/pestañas del mismo usuario)                │
│                                                                              │
│  useQuery actualiza automáticamente → React re-renderiza                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Tiempos de Respuesta Típicos

```typescript
┌──────────────────────────────────────────────────────────────────┐
│                    LATENCIAS POR OPERACIÓN                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Transcripción (AssemblyAI)           ~30-60 segundos            │
│  Generación nota (OpenAI GPT-5)       ~10-20 segundos            │
│  Subida a GCS                         ~1-3 segundos              │
│  Inngest workflow completo            ~45-90 segundos            │
│                                                                   │
│  Convex mutation                      ~50-150ms                  │
│  Convex query (cache hit)             ~10-30ms                   │
│  Real-time push notification          ~50-200ms                  │
│  React re-render                      ~1-10ms                    │
│                                                                   │
│  Debounce delay                       1000ms (configurable)      │
│  User keystroke → DB save             ~1050-1300ms              │
│  User keystroke → Other clients       ~1100-1500ms              │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 9. Análisis Técnico Profundo

### 9.1 Decisiones de Diseño Clave

#### ¿Por qué Convex en lugar de Firebase/Supabase?

**Firebase**:
- ✅ Real-time subscriptions
- ❌ No tiene TypeScript end-to-end
- ❌ Schema-less (fácil cometer errores)

**Supabase**:
- ✅ PostgreSQL (relacional)
- ❌ Real-time limitado a row-level changes
- ❌ Requiere configuración de WebSockets

**Convex**:
- ✅ TypeScript end-to-end
- ✅ Real-time subscriptions automáticas
- ✅ Schema validation en runtime
- ✅ Serverless (no gestión de infra)

#### ¿Por qué TipTap en lugar de Quill/Draft.js?

**Quill**:
- ❌ Arquitectura vieja (jQuery-era)
- ❌ Difícil personalizar

**Draft.js**:
- ❌ Facebook lo deprecó
- ❌ API compleja

**TipTap**:
- ✅ Basado en Prosemirror (usado por Atlassian, Google)
- ✅ API moderna y React-friendly
- ✅ Sistema de extensiones modular
- ✅ Activamente mantenido

#### ¿Por qué JSON stringificado en lugar de objeto en Convex?

**Opción 1: Almacenar como objeto**:
```typescript
structuredClinicalNoteJson: v.object({
  datos_personales: v.object({...}),
  ...
})
```

**Problemas**:
- ❌ Schema rígido (dificulta iteración rápida)
- ❌ Migraciones complejas al cambiar estructura
- ❌ Orden de keys no garantizado en JavaScript

**Opción 2: Almacenar como string** (implementado):
```typescript
structuredClinicalNoteJson: v.optional(v.string())
```

**Ventajas**:
- ✅ Flexibilidad total (cualquier estructura JSON)
- ✅ Preserva orden de keys
- ✅ Evita problemas de serialización de Inngest
- ✅ Fácil versionado (agregar campos nuevos)

**Desventaja**:
- ❌ No se puede hacer queries en campos nested
- ❌ Requiere JSON.parse() en cada uso

### 9.2 Limitaciones del Sistema Actual

#### 1. Falta de Colaboración Multi-Usuario

**Impacto**: Si dos médicos editan la misma nota simultáneamente, uno pierde su trabajo.

**Solución**: Implementar Yjs o Liveblocks.

#### 2. Sin Historial de Versiones

**Impacto**: No se puede ver quién cambió qué, ni restaurar versiones anteriores.

**Solución**: Agregar tabla `note_versions` en Convex con snapshots.

#### 3. Sin Indicador de Guardado

**Impacto**: Usuario no sabe si sus cambios se guardaron o no.

**Solución**: Agregar UI "Guardando..." / "Guardado" (ver sección 6.4).

#### 4. Sin Validación de Estructura JSON

**Impacto**: Un error en el código podría corromper la estructura JSON.

**Solución**: Agregar validación con Zod antes de guardar:
```typescript
import { z } from "zod";

const ClinicalNoteSchema = z.object({
  datos_personales: z.object({
    edad: z.string().optional(),
    sexo: z.string().optional(),
  }),
  motivo_consulta: z.string(),
  // ...
});

// Antes de guardar:
const validated = ClinicalNoteSchema.parse(newData);
```

#### 5. Sin Offline Support

**Impacto**: Si el usuario pierde conexión, no puede editar.

**Solución**: Implementar service worker + IndexedDB para cache offline.

### 9.3 Escalabilidad

**Pregunta**: ¿El sistema escala a 10,000 usuarios concurrentes?

**Análisis por componente**:

1. **Convex**:
   - ✅ Serverless (auto-scaling)
   - ✅ Diseñado para 100k+ usuarios
   - ⚠️ Límite: 10k connections WebSocket simultáneas (plan Pro)

2. **FastAPI**:
   - ⚠️ Requiere escalado horizontal (múltiples instancias)
   - ✅ Stateless (fácil de escalar)
   - ⚠️ AssemblyAI tiene rate limits

3. **OpenAI GPT-5**:
   - ⚠️ Rate limits por tier
   - ⚠️ Costo por token (puede ser caro a escala)

4. **Inngest**:
   - ✅ Serverless (auto-scaling)
   - ✅ Queue-based (maneja picos de tráfico)

5. **TipTap/React**:
   - ✅ Client-side (no afecta servidor)
   - ⚠️ Performance degrada con documentos muy largos (>10k palabras)

**Recomendaciones para escalar**:
- Implementar rate limiting en FastAPI
- Agregar caching (Redis) para notas clínicas frecuentemente accedidas
- Implementar pagination en listas de meetings
- Considerar CDN para assets estáticos

### 9.4 Seguridad

**Pregunta**: ¿Es seguro almacenar datos médicos así?

**Análisis**:

1. **Autenticación**: ✅ Clerk (industry-standard)
2. **Autorización**: ✅ Convex valida userId en cada mutation
3. **Encriptación en tránsito**: ✅ HTTPS/WSS
4. **Encriptación en reposo**: ⚠️ Depende de Convex (verificar compliance)
5. **HIPAA Compliance**: ❌ Requiere BAA (Business Associate Agreement)
6. **Logs de auditoría**: ❌ No implementado

**Para compliance médico (HIPAA)**:
- Firmar BAA con Convex, AssemblyAI, OpenAI
- Implementar audit logs
- Agregar encriptación end-to-end
- Implementar retención de datos configurable
- Agregar firma digital de médicos

### 9.5 Rendimiento del Editor

**Pregunta**: ¿Cómo se comporta con notas clínicas muy largas?

**Prueba hipotética**:
```typescript
// Nota clínica pequeña (~500 palabras)
JSON.parse()           → ~1ms
jsonToTiptapDoc()      → ~5ms
TipTap render          → ~10ms
Typing latency         → <16ms (60fps)

// Nota clínica grande (~5000 palabras)
JSON.parse()           → ~5ms
jsonToTiptapDoc()      → ~50ms
TipTap render          → ~100ms
Typing latency         → ~30ms (puede sentirse lento)

// Nota clínica muy grande (~20000 palabras)
JSON.parse()           → ~20ms
jsonToTiptapDoc()      → ~200ms
TipTap render          → ~500ms
Typing latency         → ~100ms (definitivamente lento)
```

**Optimizaciones posibles**:
1. **Virtual scrolling**: Renderizar solo párrafos visibles
2. **Lazy loading**: Cargar secciones bajo demanda
3. **Web Workers**: Hacer transformaciones JSON en background thread
4. **Memoization**: Cachear transformaciones JSON ↔ TipTap

---

## 10. Referencias y Recursos

### Documentación Oficial

- **TipTap**: https://tiptap.dev/docs
- **Prosemirror**: https://prosemirror.net/docs/
- **Convex**: https://docs.convex.dev/
- **Inngest**: https://www.inngest.com/docs
- **AssemblyAI**: https://www.assemblyai.com/docs
- **OpenAI**: https://platform.openai.com/docs

### Librerías Usadas

```json
{
  "@tiptap/react": "^3.7.2",
  "@tiptap/starter-kit": "^3.7.2",
  "@tiptap/extension-document": "^3.7.2",
  "@tiptap/extension-paragraph": "^3.7.2",
  "@tiptap/extension-placeholder": "^3.7.2",
  "prosemirror-state": "^1.4.3",
  "prosemirror-view": "^1.41.3",
  "convex": "^1.27.3",
  "inngest": "^3.44.2",
  "use-debounce": "^10.0.6"
}
```

### Archivos Clave del Código

**Backend**:
- `fastapi-app/routers/transcribe_router.py` - Endpoints de transcripción y notas
- `fastapi-app/modules/transcribe_module.py` - Lógica de AssemblyAI y OpenAI

**Processing**:
- `next-app/src/inngest/sessions-processing.ts` - Workflow de procesamiento
- `next-app/src/inngest/client.ts` - Cliente de Inngest

**Database**:
- `next-app/convex/schema.ts` - Schema de Convex
- `next-app/convex/meetings.ts` - Queries y mutations de meetings
- `next-app/convex/webhooks/meetings.ts` - Webhook para actualizar meetings

**Frontend**:
- `next-app/src/components/tiptap/editor.tsx` - Editor principal
- `next-app/src/components/tiptap/editor-v2.tsx` - Editor alternativo
- `next-app/src/modules/meetings/ui/components/completed-state.tsx` - UI de notas completadas
- `next-app/src/modules/meetings/ui/components/meeting-id-view.tsx` - Vista principal de meeting

### Conceptos Importantes

- **CRDT**: Conflict-free Replicated Data Type
- **OT**: Operational Transforms
- **Last Write Wins (LWW)**: Estrategia de resolución de conflictos simple
- **Debouncing**: Técnica para limitar frecuencia de función
- **Prosemirror Document**: Estructura de datos inmutable para documentos
- **Convex Subscriptions**: Sistema de real-time basado en queries reactivos

---

## Conclusión

El sistema de notas clínicas de Prartis implementa un flujo completo y funcional que va desde la grabación de consultas hasta la edición en tiempo real de notas estructuradas. La arquitectura es sólida para uso single-user, con características como:

- ✅ Generación automática de notas con IA (OpenAI GPT-5)
- ✅ Editor rico y personalizable (TipTap/Prosemirror)
- ✅ Sincronización en tiempo real (Convex)
- ✅ Auto-guardado inteligente (debouncing)
- ✅ Transformaciones bidireccionales JSON ↔ Editor

Para evolucionar hacia una solución colaborativa verdadera (tipo Google Docs), se requeriría implementar:

- ❌ CRDTs o OT para edición multi-usuario
- ❌ Cursores en vivo y awareness
- ❌ Resolución de conflictos
- ❌ Historial de versiones

El sistema actual es ideal para:
- 👨‍⚕️ Un médico editando sus propias notas
- 📱 Múltiples dispositivos del mismo médico sincronizados
- 🔄 Visualización en tiempo real de notas completas

No es ideal para:
- 👥 Múltiples médicos editando la misma nota simultáneamente
- 🏥 Hospitales con flujos de trabajo colaborativos intensos
- 📝 Scenarios de "handoff" donde un médico empieza y otro termina

---

**Documentación creada para**: Prartis Clinical Notes System
**Fecha**: 7 de enero de 2025
**Versión**: 1.0
