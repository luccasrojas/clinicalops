/**
 * Monitoring setup script for offline recording feature
 * This script helps set up monitoring and alerts for production deployment
 */

import { performanceMonitoringService } from '../services/performance-monitoring.service'

// Monitoring configuration
export const monitoringConfig = {
  // Metric collection interval (ms)
  collectionInterval: 60000, // 1 minute

  // Alert thresholds
  thresholds: {
    uploadSuccessRate: {
      warning: 0.9, // 90%
      critical: 0.85, // 85%
    },
    errorRate: {
      warning: 0.05, // 5%
      critical: 0.1, // 10%
    },
    syncQueueLength: {
      warning: 10,
      critical: 20,
    },
    storageUsagePerUser: {
      warning: 100 * 1024 * 1024, // 100MB
      critical: 500 * 1024 * 1024, // 500MB
    },
  },

  // Retention period for metrics (ms)
  retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
}

/**
 * Check if metrics exceed thresholds and return alerts
 */
export function checkMetricsForAlerts(): {
  level: 'info' | 'warning' | 'critical'
  message: string
  metric: string
  value: number
  threshold: number
}[] {
  const alerts: {
    level: 'info' | 'warning' | 'critical'
    message: string
    metric: string
    value: number
    threshold: number
  }[] = []

  const summary = performanceMonitoringService.getPerformanceSummary()

  // Check upload success rate
  const uploadSuccessRate = summary.uploadSuccessRate / 100
  if (
    uploadSuccessRate < monitoringConfig.thresholds.uploadSuccessRate.critical
  ) {
    alerts.push({
      level: 'critical',
      message: `Upload success rate is critically low: ${summary.uploadSuccessRate.toFixed(1)}%`,
      metric: 'uploadSuccessRate',
      value: uploadSuccessRate,
      threshold: monitoringConfig.thresholds.uploadSuccessRate.critical,
    })
  } else if (
    uploadSuccessRate < monitoringConfig.thresholds.uploadSuccessRate.warning
  ) {
    alerts.push({
      level: 'warning',
      message: `Upload success rate is below target: ${summary.uploadSuccessRate.toFixed(1)}%`,
      metric: 'uploadSuccessRate',
      value: uploadSuccessRate,
      threshold: monitoringConfig.thresholds.uploadSuccessRate.warning,
    })
  }

  // Check error rate
  if (summary.totalUploads > 0) {
    const errorRate = summary.failedUploads / summary.totalUploads
    if (errorRate > monitoringConfig.thresholds.errorRate.critical) {
      alerts.push({
        level: 'critical',
        message: `Error rate is critically high: ${(errorRate * 100).toFixed(1)}%`,
        metric: 'errorRate',
        value: errorRate,
        threshold: monitoringConfig.thresholds.errorRate.critical,
      })
    } else if (errorRate > monitoringConfig.thresholds.errorRate.warning) {
      alerts.push({
        level: 'warning',
        message: `Error rate is elevated: ${(errorRate * 100).toFixed(1)}%`,
        metric: 'errorRate',
        value: errorRate,
        threshold: monitoringConfig.thresholds.errorRate.warning,
      })
    }
  }

  // Check sync queue length
  if (summary.currentSyncQueue) {
    const queueLength = summary.currentSyncQueue.queueLength
    if (queueLength > monitoringConfig.thresholds.syncQueueLength.critical) {
      alerts.push({
        level: 'critical',
        message: `Sync queue is critically long: ${queueLength} recordings`,
        metric: 'syncQueueLength',
        value: queueLength,
        threshold: monitoringConfig.thresholds.syncQueueLength.critical,
      })
    } else if (
      queueLength > monitoringConfig.thresholds.syncQueueLength.warning
    ) {
      alerts.push({
        level: 'warning',
        message: `Sync queue is getting long: ${queueLength} recordings`,
        metric: 'syncQueueLength',
        value: queueLength,
        threshold: monitoringConfig.thresholds.syncQueueLength.warning,
      })
    }
  }

  // Check storage usage
  if (summary.currentStorage) {
    const avgStoragePerRecording =
      summary.currentStorage.totalRecordings > 0
        ? summary.currentStorage.totalSize /
          summary.currentStorage.totalRecordings
        : 0

    if (
      avgStoragePerRecording >
      monitoringConfig.thresholds.storageUsagePerUser.critical
    ) {
      alerts.push({
        level: 'critical',
        message: `Average storage per recording is critically high: ${(avgStoragePerRecording / 1024 / 1024).toFixed(2)}MB`,
        metric: 'storageUsagePerUser',
        value: avgStoragePerRecording,
        threshold: monitoringConfig.thresholds.storageUsagePerUser.critical,
      })
    } else if (
      avgStoragePerRecording >
      monitoringConfig.thresholds.storageUsagePerUser.warning
    ) {
      alerts.push({
        level: 'warning',
        message: `Average storage per recording is elevated: ${(avgStoragePerRecording / 1024 / 1024).toFixed(2)}MB`,
        metric: 'storageUsagePerUser',
        value: avgStoragePerRecording,
        threshold: monitoringConfig.thresholds.storageUsagePerUser.warning,
      })
    }
  }

  return alerts
}

/**
 * Format metrics for logging/monitoring systems
 */
export function formatMetricsForExport(): {
  timestamp: number
  metrics: {
    uploadSuccessRate: number
    averageUploadSpeed: number
    averageRecordingDuration: number
    totalUploads: number
    failedUploads: number
    storageUsage: {
      totalRecordings: number
      pendingCount: number
      syncedCount: number
      failedCount: number
      totalSize: number
    } | null
    syncQueue: {
      queueLength: number
      activeUploads: number
    } | null
  }
  alerts: ReturnType<typeof checkMetricsForAlerts>
} {
  const summary = performanceMonitoringService.getPerformanceSummary()
  const alerts = checkMetricsForAlerts()

  return {
    timestamp: Date.now(),
    metrics: {
      uploadSuccessRate: summary.uploadSuccessRate,
      averageUploadSpeed: summary.averageUploadSpeed,
      averageRecordingDuration: summary.averageRecordingDuration,
      totalUploads: summary.totalUploads,
      failedUploads: summary.failedUploads,
      storageUsage: summary.currentStorage,
      syncQueue: summary.currentSyncQueue,
    },
    alerts,
  }
}

/**
 * Send metrics to monitoring service (implement based on your monitoring tool)
 */
export async function sendMetricsToMonitoring(
  endpoint?: string,
): Promise<void> {
  const metrics = formatMetricsForExport()

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Monitoring] Metrics:', metrics)
    return
  }

  // In production, send to your monitoring service
  // Example implementations:

  // Option 1: Send to custom endpoint
  if (endpoint) {
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metrics),
      })
    } catch (error) {
      console.error('[Monitoring] Failed to send metrics:', error)
    }
  }

  // Option 2: Send to analytics service (e.g., Google Analytics)
  if (typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag('event', 'recording_metrics', {
      event_category: 'performance',
      event_label: 'offline_recording',
      value: metrics.metrics.uploadSuccessRate,
      custom_metrics: metrics.metrics,
    })
  }

  // Option 3: Send to error tracking service (e.g., Sentry)
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    ;(window as any).Sentry.captureMessage('Recording Metrics', {
      level: 'info',
      extra: metrics,
    })
  }

  // Log alerts separately
  if (metrics.alerts.length > 0) {
    console.warn('[Monitoring] Alerts detected:', metrics.alerts)

    // Send critical alerts to error tracking
    const criticalAlerts = metrics.alerts.filter((a) => a.level === 'critical')
    if (
      criticalAlerts.length > 0 &&
      typeof window !== 'undefined' &&
      (window as any).Sentry
    ) {
      ;(window as any).Sentry.captureMessage('Critical Recording Alerts', {
        level: 'error',
        extra: { alerts: criticalAlerts },
      })
    }
  }
}

/**
 * Start monitoring (call this in your app initialization)
 */
export function startMonitoring(options?: {
  interval?: number
  endpoint?: string
}): () => void {
  const interval = options?.interval || monitoringConfig.collectionInterval
  const endpoint = options?.endpoint

  console.log('[Monitoring] Starting performance monitoring...')

  // Send initial metrics
  sendMetricsToMonitoring(endpoint)

  // Set up periodic collection
  const intervalId = setInterval(() => {
    sendMetricsToMonitoring(endpoint)
  }, interval)

  // Return cleanup function
  return () => {
    console.log('[Monitoring] Stopping performance monitoring...')
    clearInterval(intervalId)
  }
}

/**
 * Get health status for health check endpoints
 */
export function getHealthStatus(): {
  status: 'healthy' | 'degraded' | 'unhealthy'
  checks: {
    name: string
    status: 'pass' | 'warn' | 'fail'
    message: string
  }[]
} {
  const alerts = checkMetricsForAlerts()
  const summary = performanceMonitoringService.getPerformanceSummary()

  const checks: {
    name: string
    status: 'pass' | 'warn' | 'fail'
    message: string
  }[] = [
    {
      name: 'upload_success_rate',
      status: alerts.some(
        (a) => a.metric === 'uploadSuccessRate' && a.level === 'critical',
      )
        ? 'fail'
        : alerts.some(
              (a) => a.metric === 'uploadSuccessRate' && a.level === 'warning',
            )
          ? 'warn'
          : 'pass',
      message: `Upload success rate: ${summary.uploadSuccessRate.toFixed(1)}%`,
    },
    {
      name: 'error_rate',
      status: alerts.some(
        (a) => a.metric === 'errorRate' && a.level === 'critical',
      )
        ? 'fail'
        : alerts.some((a) => a.metric === 'errorRate' && a.level === 'warning')
          ? 'warn'
          : 'pass',
      message:
        summary.totalUploads > 0
          ? `Error rate: ${((summary.failedUploads / summary.totalUploads) * 100).toFixed(1)}%`
          : 'No uploads yet',
    },
    {
      name: 'sync_queue',
      status: alerts.some(
        (a) => a.metric === 'syncQueueLength' && a.level === 'critical',
      )
        ? 'fail'
        : alerts.some(
              (a) => a.metric === 'syncQueueLength' && a.level === 'warning',
            )
          ? 'warn'
          : 'pass',
      message: summary.currentSyncQueue
        ? `Queue length: ${summary.currentSyncQueue.queueLength}`
        : 'No queue data',
    },
  ]

  const status = checks.some((c) => c.status === 'fail')
    ? 'unhealthy'
    : checks.some((c) => c.status === 'warn')
      ? 'degraded'
      : 'healthy'

  return { status, checks }
}
