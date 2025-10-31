'use client'

import { useEffect, useRef, useState } from 'react'
import EditorJS, { OutputData } from '@editorjs/editorjs'
// @ts-ignore - Type definitions are incomplete for these plugins
import Header from '@editorjs/header'
// @ts-ignore - Type definitions are incomplete for these plugins
import List from '@editorjs/list'

type EditorMedicalHistoryProps = {
  data?: OutputData
  readOnly?: boolean
  onSave?: (data: OutputData) => void
  className?: string
}

/**
 * Editor.js component for medical histories
 *
 * Provides a rich text editor with support for:
 * - Headers (H2, H3, H4)
 * - Paragraphs
 * - Lists (ordered and unordered)
 *
 * Usage:
 * ```tsx
 * // Read-only mode
 * <EditorMedicalHistory data={editorData} readOnly />
 *
 * // Editable mode
 * <EditorMedicalHistory
 *   data={editorData}
 *   onSave={(data) => console.log(data)}
 * />
 * ```
 */
export function EditorMedicalHistory({
  data,
  readOnly = false,
  onSave,
  className = '',
}: EditorMedicalHistoryProps) {
  const editorRef = useRef<EditorJS | null>(null)
  const holderRef = useRef<HTMLDivElement>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize Editor.js
  useEffect(() => {
    if (!holderRef.current) return

    // Destroy previous instance if exists
    if (editorRef.current) {
      editorRef.current.destroy()
      editorRef.current = null
    }

    // Create new instance
    const editor = new EditorJS({
      holder: holderRef.current,
      readOnly,
      data: data || {
        time: Date.now(),
        blocks: [],
        version: '2.31.0',
      },
      tools: {
        header: {
          // @ts-ignore - Type definitions are incomplete
          class: Header,
          config: {
            placeholder: 'Ingrese un título...',
            levels: [2, 3, 4],
            defaultLevel: 2,
          },
        },
        list: {
          // @ts-ignore - Type definitions are incomplete
          class: List,
          inlineToolbar: true,
          config: {
            defaultStyle: 'unordered',
          },
        },
      },
      onChange: async () => {
        if (!readOnly && onSave && editorRef.current) {
          try {
            const outputData = await editorRef.current.save()
            onSave(outputData)
          } catch (err) {
            console.error('Error saving editor data:', err)
          }
        }
      },
      onReady: () => {
        setIsReady(true)
        console.log('Editor.js is ready')
      },
    })

    editorRef.current = editor

    // Cleanup on unmount
    return () => {
      if (editorRef.current) {
        editorRef.current.destroy()
        editorRef.current = null
      }
    }
  }, [data, readOnly]) // Re-initialize when data or readOnly changes

  // Save method (can be called externally)
  const save = async (): Promise<OutputData | null> => {
    if (!editorRef.current) return null

    try {
      const outputData = await editorRef.current.save()
      return outputData
    } catch (error) {
      console.error('Error saving editor data:', error)
      setError('Error al guardar los datos')
      return null
    }
  }

  // Expose save method via ref if needed
  useEffect(() => {
    if (isReady && editorRef.current) {
      // Could expose methods via imperative handle if needed
    }
  }, [isReady])

  if (error) {
    return (
      <div className='p-4 bg-destructive/10 text-destructive rounded-lg'>
        <p className='font-medium'>Error en el editor</p>
        <p className='text-sm'>{error}</p>
      </div>
    )
  }

  return (
    <div
      className={`medical-history-editor ${className}`}
      style={{
        '--editor-font-family': 'var(--font-geist-sans)',
      } as React.CSSProperties}
    >
      <div
        ref={holderRef}
        id='editorjs'
        className={`
          prose prose-sm max-w-none
          ${readOnly ? 'prose-slate' : 'prose-zinc'}
        `}
      />

      <style jsx>{`
        .medical-history-editor :global(.codex-editor) {
          font-family: var(--editor-font-family, sans-serif);
        }

        .medical-history-editor :global(.codex-editor__redactor) {
          padding-bottom: 2rem !important;
        }

        .medical-history-editor :global(.ce-block__content) {
          max-width: 100%;
        }

        .medical-history-editor :global(.ce-paragraph) {
          line-height: 1.6;
          padding: 0.5rem 0;
        }

        .medical-history-editor :global(.ce-header) {
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }

        .medical-history-editor :global(.cdx-list) {
          padding-left: 1.5rem;
        }

        .medical-history-editor :global(.cdx-list__item) {
          padding: 0.25rem 0;
          line-height: 1.5;
        }

        /* Read-only mode styles */
        ${readOnly ? `
          .medical-history-editor :global(.ce-toolbar) {
            display: none !important;
          }

          .medical-history-editor :global(.ce-block--selected .ce-block__content) {
            background: transparent !important;
          }

          .medical-history-editor :global(.codex-editor--narrow .codex-editor__redactor) {
            margin-right: 0 !important;
          }
        ` : ''}

        /* Editable mode styles */
        ${!readOnly ? `
          .medical-history-editor :global(.ce-block:hover) {
            background-color: rgba(0, 0, 0, 0.02);
            border-radius: 0.25rem;
          }
        ` : ''}
      `}</style>
    </div>
  )
}
