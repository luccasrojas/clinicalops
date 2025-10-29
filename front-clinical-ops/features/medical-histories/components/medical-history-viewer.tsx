'use client'

import { useState } from 'react'
import { Edit2, Save, X, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useMedicalHistory } from '../api/get-medical-history'
import { useUpdateMedicalHistory } from '../api/update-medical-history'
import type { SingleHistoryResponse } from '../types'

type MedicalHistoryViewerProps = {
  historyID: string
}

export function MedicalHistoryViewer({ historyID }: MedicalHistoryViewerProps) {
  const { data, isLoading, error } = useMedicalHistory(historyID)
  const updateHistory = useUpdateMedicalHistory()

  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState<Record<string, any>>({})

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
    setEditedData(JSON.parse(JSON.stringify(history.jsonData)))
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setEditedData({})
    setIsEditing(false)
  }

  const saveChanges = async () => {
    try {
      await updateHistory.mutateAsync({
        historyID,
        jsonData: editedData,
      })
      setIsEditing(false)
      setEditedData({})
    } catch (error) {
      console.error('Error updating history:', error)
    }
  }

  const handleDownload = () => {
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

  const renderEditableValue = (
    key: string,
    value: any,
    path: string[],
  ): React.ReactNode => {
    const currentPath = [...path, key]

    const updateValue = (newValue: any) => {
      const newData = { ...editedData }
      let current: any = newData

      for (let i = 0; i < currentPath.length - 1; i++) {
        current = current[currentPath[i]]
      }

      current[currentPath[currentPath.length - 1]] = newValue
      setEditedData(newData)
    }

    const getCurrentValue = () => {
      let current = editedData
      for (const key of currentPath) {
        current = current?.[key]
      }
      return current
    }

    if (Array.isArray(value)) {
      return (
        <Textarea
          value={JSON.stringify(getCurrentValue(), null, 2)}
          onChange={(e) => {
            try {
              updateValue(JSON.parse(e.target.value))
            } catch {
              // Invalid JSON, don't update
            }
          }}
          rows={4}
          className='font-mono text-sm'
        />
      )
    }

    if (typeof value === 'object' && value !== null) {
      return (
        <div className='space-y-3 pl-4 border-l-2 border-muted'>
          {Object.entries(value).map(([k, v]) => (
            <div key={k}>
              <label className='text-sm font-medium capitalize block mb-1'>
                {k.replace(/_/g, ' ')}:
              </label>
              {renderEditableValue(k, v, currentPath)}
            </div>
          ))}
        </div>
      )
    }

    const currentValue = String(getCurrentValue() ?? '')

    if (currentValue.length > 100) {
      return (
        <Textarea
          value={currentValue}
          onChange={(e) => updateValue(e.target.value)}
          rows={4}
        />
      )
    }

    return (
      <Input
        value={currentValue}
        onChange={(e) => updateValue(e.target.value)}
      />
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
          {!isEditing ? (
            <>
              <Button variant='outline' onClick={handleDownload}>
                <Download className='w-4 h-4 mr-2' />
                Descargar
              </Button>
              <Button onClick={startEditing}>
                <Edit2 className='w-4 h-4 mr-2' />
                Editar
              </Button>
            </>
          ) : (
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
      <div className='space-y-4'>
        {Object.entries(history.jsonData).map(([key, value]) => (
          <Card key={key}>
            <CardHeader>
              <CardTitle className='capitalize'>
                {key.replace(/_/g, ' ')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing
                ? renderEditableValue(key, value, [])
                : renderValue(value)}
            </CardContent>
          </Card>
        ))}
      </div>

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
