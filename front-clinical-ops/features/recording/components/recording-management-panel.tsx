'use client'

import { useEffect, useState } from 'react'
import { Search, Filter, FileText, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useRecordingStorage } from '../hooks/use-recording-storage'
import { RecordingRecord } from '../services/recording-storage.service'
import { RecordingCard } from './recording-card'
import { StorageStats } from './storage-stats'
import { CleanupDialog } from './cleanup-dialog'
import { ErrorLogViewer } from './error-log-viewer'
import { useSyncManager } from '../hooks/use-sync-manager'

type FilterType = 'all' | 'pending_upload' | 'synced' | 'failed'
type TabType = 'recordings' | 'errors'

type RecordingManagementPanelProps = {
  doctorID: string
}

const ITEMS_PER_PAGE = 20

export function RecordingManagementPanel({
  doctorID,
}: RecordingManagementPanelProps) {
  const { getAllRecordings, deleteRecording, isLoading } = useRecordingStorage()
  const { syncRecording } = useSyncManager({
    autoSync: false,
    onSyncComplete: async () => {
      // Trigger cleanup after successful sync
      if (typeof window !== 'undefined' && (window as any).__cleanupTrigger) {
        await (window as any).__cleanupTrigger()
      }
    },
  })
  const [recordings, setRecordings] = useState<RecordingRecord[]>([])
  const [filteredRecordings, setFilteredRecordings] = useState<
    RecordingRecord[]
  >([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [activeTab, setActiveTab] = useState<TabType>('recordings')
  const [currentPage, setCurrentPage] = useState(1)

  // Load recordings on mount
  useEffect(() => {
    loadRecordings()
  }, [])

  // Apply filters and search whenever they change
  useEffect(() => {
    applyFiltersAndSearch()
    setCurrentPage(1) // Reset to first page when filters change
  }, [recordings, searchQuery, activeFilter])

  const loadRecordings = async () => {
    try {
      const allRecordings = await getAllRecordings()
      // Filter by doctorID and sort by createdAt (newest first)
      const doctorRecordings = allRecordings
        .filter((r) => r.doctorID === doctorID)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
      setRecordings(doctorRecordings)
    } catch (error) {
      console.error('Error loading recordings:', error)
    }
  }

  const applyFiltersAndSearch = () => {
    let filtered = recordings

    // Apply status filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter((r) => r.status === activeFilter)
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (r) =>
          r.fileName.toLowerCase().includes(query) ||
          r.id.toLowerCase().includes(query) ||
          new Date(r.createdAt).toLocaleDateString('es-ES').includes(query),
      )
    }

    setFilteredRecordings(filtered)
  }

  const handleUpload = async (recording: RecordingRecord) => {
    try {
      await syncRecording(recording.id)
      // Reload recordings to reflect updated status
      await loadRecordings()
    } catch (error) {
      console.error('Error uploading recording:', error)
      throw error
    }
  }

  const handleDelete = async (recording: RecordingRecord) => {
    try {
      await deleteRecording(recording.id)
      // Reload recordings to reflect deletion
      await loadRecordings()
    } catch (error) {
      console.error('Error deleting recording:', error)
      throw error
    }
  }

  const handleRetry = async (recording: RecordingRecord) => {
    // Retry is the same as upload
    await handleUpload(recording)
  }

  const getFilterCounts = () => {
    return {
      all: recordings.length,
      pending_upload: recordings.filter((r) => r.status === 'pending_upload')
        .length,
      synced: recordings.filter((r) => r.status === 'synced').length,
      failed: recordings.filter((r) => r.status === 'failed').length,
    }
  }

  const filterCounts = getFilterCounts()

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500' />
      </div>
    )
  }

  return (
    <div className='w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8'>
      <div className='mb-6'>
        <h1 className='text-2xl sm:text-3xl font-semibold mb-2'>
          Gestión de Grabaciones
        </h1>
        <p className='text-sm text-muted-foreground'>
          Administra tus grabaciones locales, revisa su estado y realiza
          acciones
        </p>
      </div>

      {/* Tabs */}
      <div className='mb-6 border-b'>
        <div className='flex gap-4'>
          <button
            onClick={() => setActiveTab('recordings')}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === 'recordings'
                ? 'border-teal-500 text-teal-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className='flex items-center gap-2'>
              <FileText className='h-4 w-4' />
              <span>Grabaciones</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('errors')}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === 'errors'
                ? 'border-teal-500 text-teal-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className='flex items-center gap-2'>
              <AlertCircle className='h-4 w-4' />
              <span>Registro de Errores</span>
            </div>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'recordings' ? (
        <>
          {/* Storage Statistics */}
          <StorageStats onRefresh={loadRecordings} />

          {/* Search and Filters */}
          <div className='mb-6 space-y-4'>
            {/* Search Bar and Cleanup Button */}
            <div className='flex flex-col sm:flex-row gap-3'>
              <div className='relative flex-1'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  type='text'
                  placeholder='Buscar por nombre, ID o fecha...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='pl-10'
                />
              </div>
              <CleanupDialog onCleanupComplete={loadRecordings} />
            </div>

            {/* Filter Buttons */}
            <div className='flex flex-wrap gap-2'>
              <Button
                variant={activeFilter === 'all' ? 'default' : 'outline'}
                size='sm'
                onClick={() => setActiveFilter('all')}
                className='gap-2'
              >
                <Filter className='h-4 w-4' />
                Todas ({filterCounts.all})
              </Button>
              <Button
                variant={
                  activeFilter === 'pending_upload' ? 'default' : 'outline'
                }
                size='sm'
                onClick={() => setActiveFilter('pending_upload')}
              >
                Pendientes ({filterCounts.pending_upload})
              </Button>
              <Button
                variant={activeFilter === 'synced' ? 'default' : 'outline'}
                size='sm'
                onClick={() => setActiveFilter('synced')}
              >
                Sincronizadas ({filterCounts.synced})
              </Button>
              <Button
                variant={activeFilter === 'failed' ? 'default' : 'outline'}
                size='sm'
                onClick={() => setActiveFilter('failed')}
              >
                Fallidas ({filterCounts.failed})
              </Button>
            </div>
          </div>

          {/* Recordings List */}
          {filteredRecordings.length === 0 ? (
            <div className='text-center py-12'>
              <p className='text-muted-foreground'>
                {searchQuery || activeFilter !== 'all'
                  ? 'No se encontraron grabaciones con los filtros aplicados'
                  : 'No hay grabaciones guardadas localmente'}
              </p>
            </div>
          ) : (
            <>
              <div className='space-y-3'>
                {filteredRecordings
                  .slice(
                    (currentPage - 1) * ITEMS_PER_PAGE,
                    currentPage * ITEMS_PER_PAGE,
                  )
                  .map((recording) => (
                    <RecordingCard
                      key={recording.id}
                      recording={recording}
                      onUpload={handleUpload}
                      onDelete={handleDelete}
                      onRetry={handleRetry}
                    />
                  ))}
              </div>

              {/* Pagination */}
              {filteredRecordings.length > ITEMS_PER_PAGE && (
                <div className='mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-4'>
                  <div className='text-sm text-muted-foreground'>
                    Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{' '}
                    {Math.min(
                      currentPage * ITEMS_PER_PAGE,
                      filteredRecordings.length,
                    )}{' '}
                    de {filteredRecordings.length} grabaciones
                  </div>
                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <div className='flex items-center gap-1'>
                      {Array.from(
                        {
                          length: Math.ceil(
                            filteredRecordings.length / ITEMS_PER_PAGE,
                          ),
                        },
                        (_, i) => i + 1,
                      )
                        .filter((page) => {
                          const totalPages = Math.ceil(
                            filteredRecordings.length / ITEMS_PER_PAGE,
                          )
                          return (
                            page === 1 ||
                            page === totalPages ||
                            Math.abs(page - currentPage) <= 1
                          )
                        })
                        .map((page, index, array) => {
                          const prevPage = array[index - 1]
                          const showEllipsis = prevPage && page - prevPage > 1
                          return (
                            <div key={page} className='flex items-center gap-1'>
                              {showEllipsis && (
                                <span className='px-2 text-muted-foreground'>
                                  ...
                                </span>
                              )}
                              <Button
                                variant={
                                  currentPage === page ? 'default' : 'outline'
                                }
                                size='sm'
                                onClick={() => setCurrentPage(page)}
                                className='min-w-[2.5rem]'
                              >
                                {page}
                              </Button>
                            </div>
                          )
                        })}
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() =>
                        setCurrentPage((p) =>
                          Math.min(
                            Math.ceil(
                              filteredRecordings.length / ITEMS_PER_PAGE,
                            ),
                            p + 1,
                          ),
                        )
                      }
                      disabled={
                        currentPage ===
                        Math.ceil(filteredRecordings.length / ITEMS_PER_PAGE)
                      }
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <ErrorLogViewer />
      )}
    </div>
  )
}
