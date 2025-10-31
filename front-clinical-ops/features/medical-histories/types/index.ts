export type EditorJsBlock = {
  type: string;
  data: Record<string, any>;
};

export type EditorJsData = {
  time?: number;
  blocks: EditorJsBlock[];
  version?: string;
};

export type MedicalHistory = {
  historyID: string;
  doctorID: string;
  patientID: string;
  recordingURL: string;
  jsonData: Record<string, any>;
  editorData?: EditorJsData;  // Editor.js format for rich editing
  metaData: {
    patientName?: string;
    diagnosis?: string;
    createdBy?: string;
    [key: string]: any;
  };
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
  patientName?: string;
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
  jsonData?: Record<string, any>;
  editorData?: EditorJsData;
  metaData?: Record<string, any>;
};

export type UpdateMedicalHistoryResponse = {
  history: MedicalHistory;
  versionID: string;
  message: string;
};
