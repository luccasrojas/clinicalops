'use client'

import { useState } from 'react'
import { Edit2, Save, X, Download, FileJson } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMedicalHistory } from '../api/get-medical-history'
import { useUpdateMedicalHistory } from '../api/update-medical-history'
import { EditorMedicalHistory } from './editor-medical-history'
import type { SingleHistoryResponse, EditorJsData } from '../types'

type MedicalHistoryViewerProps = {
  historyID: string
}

export function MedicalHistoryViewer({ historyID }: MedicalHistoryViewerProps) {
  const { data, isLoading, error } = useMedicalHistory(historyID)
  const updateHistory = useUpdateMedicalHistory()

  const [isEditing, setIsEditing] = useState(false)
  const [editedEditorData, setEditedEditorData] = useState<EditorJsData | null>(null)
  const [viewMode, setViewMode] = useState<'editor' | 'json'>('editor')

  const history = (data as SingleHistoryResponse | undefined)?.history

  if (isLoading) {
    return (
      <div className='space-y-4'>
        {[...Array(5)].map((_, i) => (
          <div key={i} className='h-32 bg-muted animate-pulse rounded-lg' />
        ))}
      </div>
    )
  }

  if (error || !history) {
    return (
      <div className='text-center py-12'>
        <p className='text-destructive'>
          Error al cargar la historia clínica:{' '}
          {error?.message || 'Error desconocido'}
        </p>
      </div>
    )
  }

  const startEditing = () => {
    // Use editorData if available, otherwise empty
    if (history.editorData) {
      setEditedEditorData(JSON.parse(JSON.stringify(history.editorData)))
    } else {
      setEditedEditorData({
        time: Date.now(),
        blocks: [],
        version: '2.31.0'
      })
    }
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setEditedEditorData(null)
    setIsEditing(false)
  }

  const saveChanges = async () => {
    if (!editedEditorData) return

    try {
      await updateHistory.mutateAsync({
        historyID,
        editorData: editedEditorData,
      })
      setIsEditing(false)
      setEditedEditorData(null)
    } catch (error) {
      console.error('Error updating history:', error)
    }
  }

  const handleEditorChange = (data: EditorJsData) => {
    setEditedEditorData(data)
  }

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(history.jsonData, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `historia-clinica-${historyID}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'editor' ? 'json' : 'editor')
  }

  const renderJsonView = () => {
    const renderValue = (value: any, path: string[] = []): React.ReactNode => {
      if (value === null || value === undefined) {
        return (
          <span className='text-muted-foreground italic'>No especificado</span>
        )
      }

      if (Array.isArray(value)) {
        if (value.length === 0) {
          return <span className='text-muted-foreground italic'>Sin datos</span>
        }
        return (
          <ul className='list-disc list-inside space-y-1'>
            {value.map((item, index) => (
              <li key={index} className='text-sm'>
                {typeof item === 'object'
                  ? renderValue(item, [...path, String(index)])
                  : String(item)}
              </li>
            ))}
          </ul>
        )
      }

      if (typeof value === 'object') {
        return (
          <div className='space-y-3 pl-4 border-l-2 border-muted'>
            {Object.entries(value).map(([key, val]) => (
              <div key={key}>
                <span className='text-sm font-medium capitalize'>
                  {key.replace(/_/g, ' ')}:
                </span>
                <div className='mt-1'>{renderValue(val, [...path, key])}</div>
              </div>
            ))}
          </div>
        )
      }

      return <p className='text-sm'>{String(value)}</p>
    }

    return (
      <div className='space-y-4'>
        {Object.entries(history.jsonData).map(([key, value]) => (
          <Card key={key}>
            <CardHeader>
              <CardTitle className='capitalize'>
                {key.replace(/_/g, ' ')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderValue(value)}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Historia Clínica</h1>
          <p className='text-muted-foreground mt-1'>
            {history.metaData?.patientName || 'Paciente'}
          </p>
        </div>
        <div className='flex items-center space-x-2'>
          {!isEditing && (
            <>
              <Button variant='outline' onClick={toggleViewMode} size='sm'>
                <FileJson className='w-4 h-4 mr-2' />
                {viewMode === 'editor' ? 'Ver JSON' : 'Ver Editor'}
              </Button>
              <Button variant='outline' onClick={handleDownloadJson}>
                <Download className='w-4 h-4 mr-2' />
                Descargar JSON
              </Button>
              <Button onClick={startEditing}>
                <Edit2 className='w-4 h-4 mr-2' />
                Editar
              </Button>
            </>
          )}
          {isEditing && (
            <>
              <Button variant='outline' onClick={cancelEditing}>
                <X className='w-4 h-4 mr-2' />
                Cancelar
              </Button>
              <Button onClick={saveChanges} disabled={updateHistory.isPending}>
                <Save className='w-4 h-4 mr-2' />
                {updateHistory.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Medical History Content */}
      {viewMode === 'editor' ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {isEditing ? 'Editando Historia Clínica' : 'Historia Clínica'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EditorMedicalHistory
              data={isEditing ? editedEditorData || undefined : history.editorData}
              readOnly={!isEditing}
              onSave={handleEditorChange}
              className='min-h-[400px]'
            />
          </CardContent>
        </Card>
      ) : (
        renderJsonView()
      )}

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Registro</CardTitle>
        </CardHeader>
        <CardContent className='space-y-2'>
          <div>
            <span className='text-sm font-medium'>Creado:</span>
            <p className='text-sm text-muted-foreground'>
              {new Date(history.createdAt).toLocaleString('es-ES')}
            </p>
          </div>
          {history.updatedAt !== history.createdAt && (
            <div>
              <span className='text-sm font-medium'>Última actualización:</span>
              <p className='text-sm text-muted-foreground'>
                {new Date(history.updatedAt).toLocaleString('es-ES')}
              </p>
            </div>
          )}
          <div>
            <span className='text-sm font-medium'>ID:</span>
            <p className='text-sm text-muted-foreground font-mono'>
              {history.historyID}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
