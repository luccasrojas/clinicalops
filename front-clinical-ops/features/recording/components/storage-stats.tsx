'use client'

import { useEffect, useState } from 'react'
import { HardDrive, CheckCircle, Clock, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRecordingStorage } from '../hooks/use-recording-storage'
import { StorageStats as StorageStatsType } from '../services/recording-storage.service'

type StorageStatsProps = {
  onRefresh?: () => void
}

export function StorageStats({ onRefresh }: StorageStatsProps) {
  const { storageStats, refreshStorageStats, estimateQuota } = useRecordingStorage()
  const [quota, setQuota] = useState<{ usage: number; quota: number } | null>(null)

  useEffect(() => {
    loadQuota()
  }, [])

  const loadQuota = async () => {
    try {
      const quotaData = await estimateQuota()
      setQuota(quotaData)
    } catch (error) {
      console.error('Error loading quota:', error)
    }
  }

  useEffect(() => {
    if (onRefresh) {
      const interval = setInterval(() => {
        refreshStorageStats()
        loadQuota()
      }, 10000) // Refresh every 10 seconds

      return () => clearInterval(interval)
    }
  }, [onRefresh, refreshStorageStats])

  if (!storageStats) {
    return null
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  const getStoragePercentage = (): number => {
    if (!quota || quota.quota === 0) return 0
    return (quota.usage / quota.quota) * 100
  }

  const storagePercentage = getStoragePercentage()
  const isStorageHigh = storagePercentage > 80
  const isStorageCritical = storagePercentage > 95

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
      {/* Total Recordings */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-sm font-medium text-muted-foreground'>
            Total de Grabaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-primary/10 rounded-lg'>
              <HardDrive className='h-5 w-5 text-primary' />
            </div>
            <div>
              <p className='text-2xl font-bold'>{storageStats.totalRecordings}</p>
              <p className='text-xs text-muted-foreground'>
                {formatBytes(storageStats.totalSize)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-sm font-medium text-muted-foreground'>
            Pendientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-amber-500/10 rounded-lg'>
              <Clock className='h-5 w-5 text-amber-600' />
            </div>
            <div>
              <p className='text-2xl font-bold'>{storageStats.pendingCount}</p>
              <p className='text-xs text-muted-foreground'>
                Por sincronizar
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Synced */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-sm font-medium text-muted-foreground'>
            Sincronizadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-green-500/10 rounded-lg'>
              <CheckCircle className='h-5 w-5 text-green-600' />
            </div>
            <div>
              <p className='text-2xl font-bold'>{storageStats.syncedCount}</p>
              <p className='text-xs text-muted-foreground'>
                Completadas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Failed */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-sm font-medium text-muted-foreground'>
            Fallidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-destructive/10 rounded-lg'>
              <XCircle className='h-5 w-5 text-destructive' />
            </div>
            <div>
              <p className='text-2xl font-bold'>{storageStats.failedCount}</p>
              <p className='text-xs text-muted-foreground'>
                Con errores
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storage Usage Bar */}
      {quota && quota.quota > 0 && (
        <Card className='md:col-span-2 lg:col-span-4'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Uso de Almacenamiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <div className='flex items-center justify-between text-sm'>
                <span>
                  {formatBytes(quota.usage)} de {formatBytes(quota.quota)} usados
                </span>
                <span className={`font-medium ${
                  isStorageCritical
                    ? 'text-destructive'
                    : isStorageHigh
                      ? 'text-amber-600'
                      : 'text-muted-foreground'
                }`}>
                  {storagePercentage.toFixed(1)}%
                </span>
              </div>
              <div className='h-3 w-full bg-muted rounded-full overflow-hidden'>
                <div
                  className={`h-full transition-all duration-300 ${
                    isStorageCritical
                      ? 'bg-destructive'
                      : isStorageHigh
                        ? 'bg-amber-500'
                        : 'bg-teal-500'
                  }`}
                  style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                />
              </div>
              {isStorageHigh && (
                <p className='text-xs text-amber-600 dark:text-amber-400'>
                  {isStorageCritical
                    ? 'Almacenamiento casi lleno. Considera eliminar grabaciones antiguas sincronizadas.'
                    : 'Almacenamiento alto. Puedes liberar espacio eliminando grabaciones antiguas.'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
