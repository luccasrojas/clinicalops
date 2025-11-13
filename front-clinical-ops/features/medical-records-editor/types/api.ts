import type { JsonValue } from './editor';

export type MedicalRecord = {
  historyID: string;
  doctorID?: string;
  patientID?: string;
  patientName?: string;
  status?: string;
  structuredClinicalNote: string;
  structuredClinicalNoteOriginal?: string;
  lastEditedAt?: number;
  lastEditedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  readOnly?: boolean;
  metaData?: Record<string, JsonValue>;
};

export type MedicalRecordResponse = {
  record: MedicalRecord;
};

export type UpdateMedicalRecordPayload = {
  historyID: string;
  structuredClinicalNote?: string;
  estructuraClinica?: string;
  userId: string;
  changeDescription?: string;
};

export type UpdateMedicalRecordResponse = {
  message: string;
  historyID: string;
  timestamp: number;
  versionTimestamp?: number;
};

export type VersionEntry = {
  historyID: string;
  versionTimestamp: number;
  structuredClinicalNote: string;
  userId: string;
  changeDescription?: string;
  createdAt?: string;
};

export type VersionHistoryResponse = {
  historyID: string;
  versions: VersionEntry[];
  count: number;
};

export type RestoreVersionPayload = {
  historyID: string;
  versionTimestamp: number;
  userId: string;
};

export type RestoreVersionResponse = {
  message: string;
  historyID: string;
  restoredFrom: number;
  timestamp: number;
  structuredClinicalNote: string;
};

export type ExportMedicalRecordPayload = {
  historyID: string;
  format: 'pdf' | 'docx';
};

export type ExportMedicalRecordResponse = {
  message: string;
  historyID: string;
  format: string;
  downloadUrl: string;
  expiresIn: number;
};
