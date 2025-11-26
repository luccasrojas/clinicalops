'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { performanceMonitoringService } from '../services/performance-monitoring.service'
import { Activity, TrendingUp, HardDrive, Upload } from 'lucide-react'

/**
 * Performance dashboard component for monitoring recording metrics
 * Displays upload success rates, storage usage, and sync queue status
 */
export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<ReturnType<
    typeof performanceMonitoringService.getPerformanceSummary
  > | null>(null)

  useEffect(() => {
    // Initial load
    setMetrics(performanceMonitoringService.getPerformanceSummary())

    // Refresh every 5 seconds
    const interval = setInterval(() => {
      setMetrics(performanceMonitoringService.getPerformanceSummary())
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  if (!metrics) {
    return null
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  const formatSpeed = (bytesPerSec: number): string => {
    return `${formatBytes(bytesPerSec)}/s`
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}m ${secs}s`
  }

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      {/* Upload Success Rate */}
      <Card className='p-4'>
        <div className='flex items-center gap-2 mb-2'>
          <TrendingUp className='h-4 w-4 text-green-600' />
          <h3 className='text-sm font-medium'>Tasa de Éxito</h3>
        </div>
        <div className='text-2xl font-bold'>
          {metrics.uploadSuccessRate.toFixed(1)}%
        </div>
        <p className='text-xs text-muted-foreground mt-1'>
          {metrics.totalUploads} subidas totales
          {metrics.failedUploads > 0 && ` (${metrics.failedUploads} fallidas)`}
        </p>
      </Card>

      {/* Average Upload Speed */}
      <Card className='p-4'>
        <div className='flex items-center gap-2 mb-2'>
          <Upload className='h-4 w-4 text-blue-600' />
          <h3 className='text-sm font-medium'>Velocidad Promedio</h3>
        </div>
        <div className='text-2xl font-bold'>
          {formatSpeed(metrics.averageUploadSpeed)}
        </div>
        <p className='text-xs text-muted-foreground mt-1'>
          Velocidad de subida
        </p>
      </Card>

      {/* Average Recording Duration */}
      <Card className='p-4'>
        <div className='flex items-center gap-2 mb-2'>
          <Activity className='h-4 w-4 text-purple-600' />
          <h3 className='text-sm font-medium'>Duración Promedio</h3>
        </div>
        <div className='text-2xl font-bold'>
          {formatDuration(metrics.averageRecordingDuration)}
        </div>
        <p className='text-xs text-muted-foreground mt-1'>Por grabación</p>
      </Card>

      {/* Storage Usage */}
      <Card className='p-4'>
        <div className='flex items-center gap-2 mb-2'>
          <HardDrive className='h-4 w-4 text-orange-600' />
          <h3 className='text-sm font-medium'>Almacenamiento</h3>
        </div>
        <div className='text-2xl font-bold'>
          {metrics.currentStorage
            ? formatBytes(metrics.currentStorage.totalSize)
            : 'N/A'}
        </div>
        <p className='text-xs text-muted-foreground mt-1'>
          {metrics.currentStorage ? (
            <>
              {metrics.currentStorage.totalRecordings} grabaciones
              {metrics.currentStorage.pendingCount > 0 && (
                <> ({metrics.currentStorage.pendingCount} pendientes)</>
              )}
            </>
          ) : (
            'Sin datos'
          )}
        </p>
      </Card>

      {/* Sync Queue Status */}
      {metrics.currentSyncQueue && metrics.currentSyncQueue.queueLength > 0 && (
        <Card className='p-4 md:col-span-2'>
          <div className='flex items-center gap-2 mb-2'>
            <Activity className='h-4 w-4 text-teal-600 animate-pulse' />
            <h3 className='text-sm font-medium'>Cola de Sincronización</h3>
          </div>
          <div className='text-2xl font-bold'>
            {metrics.currentSyncQueue.queueLength} en cola
          </div>
          <p className='text-xs text-muted-foreground mt-1'>
            {metrics.currentSyncQueue.activeUploads} subidas activas
          </p>
        </Card>
      )}
    </div>
  )
}
