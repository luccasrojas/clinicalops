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
    <div className="container mx-auto py-8 px-4">
      <MedicalHistoryViewer historyID={historyID} />
    </div>
  );
}
