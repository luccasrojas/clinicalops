type Metadata = {
  diagnosis: string;
  summary: string;
  createdBy?: string;
  [key: string]: unknown;
};

export type MedicalHistory = {
  historyID: string;
  doctorID: string;
  patientID: string;
  recordingURL: string;
  jsonData: Record<string, unknown>;
  metaData: Metadata;
  status?: string;
  createdAt: string;
  updatedAt: string;
  preview?: {
    diagnosis?: string;
    symptoms?: string;
    treatment?: string;
  };
};

export type MedicalHistoriesResponse = {
  histories: MedicalHistory[];
  lastKey: string | null;
  count: number;
};

export type MedicalHistoriesFilters = {
  doctorID: string;
  searchKeywords?: string;
  startDate?: string;
  endDate?: string;
  patientID?: string;
  limit?: number;
  lastKey?: string;
};

export type SingleHistoryResponse = {
  history: MedicalHistory;
};

export type UpdateMedicalHistoryRequest = {
  historyID: string;
  jsonData: Record<string, unknown>;
  metaData?: Record<string, unknown>;
};

export type UpdateMedicalHistoryResponse = {
  history: MedicalHistory;
  versionID: string;
  message: string;
};

// Summary generation types
export type GenerateSummaryRequest = {
  jsonData: Record<string, unknown>;
  modelId?: string;
};

export type GenerateSummaryResponse = {
  diagnosis: string;
  summary: string;
};

// Update metadata types
export type UpdateMetadataRequest = {
  historyID: string;
  metaData: {
    diagnosis: string;
    summary: string;
    createdBy?: string;
  };
};
