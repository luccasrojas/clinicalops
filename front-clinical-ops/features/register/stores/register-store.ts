import { create } from 'zustand';
import { RegisterStep1Data } from '../types';

type RegisterStore = {
  currentStep: 1 | 2;
  step1Data: RegisterStep1Data | null;
  doctorID: string | null;
  setStep1Data: (data: RegisterStep1Data, doctorID: string) => void;
  nextStep: () => void;
  reset: () => void;
};

export const useRegisterStore = create<RegisterStore>((set) => ({
  currentStep: 1,
  step1Data: null,
  doctorID: null,

  setStep1Data: (data, doctorID) =>
    set({
      step1Data: data,
      doctorID,
    }),

  nextStep: () =>
    set((state) => ({
      currentStep: (state.currentStep + 1) as 1 | 2,
    })),

  reset: () =>
    set({
      currentStep: 1,
      step1Data: null,
      doctorID: null,
    }),
}));
