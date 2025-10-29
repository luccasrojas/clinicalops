export type Patient = {
  pacientID: string;
  nombre: string;
  apellido: string;
  historyCount: number;
  lastVisit: string;
};

export type PatientsResponse = {
  patients: Patient[];
  count: number;
};
