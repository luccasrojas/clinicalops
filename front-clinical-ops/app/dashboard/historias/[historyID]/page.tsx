'use client';

import { use } from 'react';
import { MedicalHistoryViewer } from '@/features/medical-histories/components/medical-history-viewer';

export default function HistoryDetailPage({
  params,
}: {
  params: Promise<{ historyID: string }>;
}) {
  const { historyID } = use(params);

  return (
    <div className="container mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:py-8 lg:px-8">
      <MedicalHistoryViewer historyID={historyID} />
    </div>
  );
}
