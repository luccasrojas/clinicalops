'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMedicalHistories } from '../api/get-medical-histories';
import { MedicalHistoryCard } from './medical-history-card';
import { useDebounce } from 'use-debounce';
import type { MedicalHistoriesResponse } from '../types';

type MedicalHistoriesDashboardProps = {
  doctorID: string;
  onNewRecording: () => void;
};

export function MedicalHistoriesDashboard({
  doctorID,
  onNewRecording,
}: MedicalHistoriesDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(
    searchParams.get('search') || ''
  );
  const [startDate, setStartDate] = useState(
    searchParams.get('startDate') || ''
  );
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
  const [showFilters, setShowFilters] = useState(false);

  const [debouncedSearch] = useDebounce(searchTerm, 500);

  const { data, isLoading, error } = useMedicalHistories({
    doctorID,
    searchKeywords: debouncedSearch || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    limit: 20,
  });

  const histories = (data as MedicalHistoriesResponse | undefined)?.histories || [];

  const handleEdit = (historyID: string) => {
    router.push(`/dashboard/historias/${historyID}`);
  };

  const handleDownload = async (historyID: string) => {
    // TODO: Implement download functionality
    console.log('Download history:', historyID);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Mis Historias Clínicas</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Gestiona y revisa todas tus historias clínicas
          </p>
        </div>
        <Button
          onClick={onNewRecording}
          size="lg"
          className="bg-teal-500 hover:bg-teal-600 w-full sm:w-auto text-sm sm:text-base"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          <span className="hidden sm:inline">Grabar Nueva Historia Clínica</span>
          <span className="sm:hidden">Nueva Grabación</span>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por diagnóstico o palabras clave..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 sm:pl-10 text-sm sm:text-base"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm sm:text-base"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>

        {showFilters && (
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 p-3 sm:p-4 bg-muted rounded-lg">
            <div className="flex-1">
              <label className="text-xs sm:text-sm font-medium mb-2 block">
                Fecha Inicio
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-sm sm:text-base"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs sm:text-sm font-medium mb-2 block">
                Fecha Fin
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-sm sm:text-base"
              />
            </div>
            <Button variant="ghost" onClick={handleClearFilters} className="w-full sm:w-auto text-sm sm:text-base">
              Limpiar Filtros
            </Button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-48 bg-muted animate-pulse rounded-lg"
            />
          ))}
        </div>
      ) : null}

      {/* Error State */}
      {error ? (
        <div className="text-center py-12">
          <p className="text-destructive">
            Error al cargar las historias clínicas: {error.message}
          </p>
        </div>
      ) : null}

      {/* Empty State */}
      {!isLoading && !error && histories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            No se encontraron historias clínicas
          </p>
          {(searchTerm || startDate || endDate) ? (
            <Button
              variant="link"
              onClick={handleClearFilters}
              className="mt-2"
            >
              Limpiar filtros
            </Button>
          ) : null}
        </div>
      ) : null}

      {/* Histories Grid */}
      {!isLoading && !error && histories.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {histories.map((history) => (
              <MedicalHistoryCard
                key={history.historyID}
                history={history}
                onEdit={handleEdit}
                onDownload={handleDownload}
              />
            ))}
          </div>

          {/* Results Count */}
          <div className="text-center text-sm text-muted-foreground">
            Mostrando {histories.length} historias clínicas
          </div>
        </>
      ) : null}
    </div>
  );
}
