import { create } from 'zustand';
import { RegisterStep1Data } from '../types';

type RegisterStore = {
  currentStep: 1 | 2 | 3;
  step1Data: RegisterStep1Data | null;
  doctorID: string | null;
  emailVerified: boolean;
  setStep1Data: (data: RegisterStep1Data, doctorID: string) => void;
  setEmailVerified: (verified: boolean) => void;
  nextStep: () => void;
  reset: () => void;
};

export const useRegisterStore = create<RegisterStore>((set) => ({
  currentStep: 1,
  step1Data: null,
  doctorID: null,
  emailVerified: false,

  setStep1Data: (data, doctorID) =>
    set({
      step1Data: data,
      doctorID,
    }),

  setEmailVerified: (verified) =>
    set({
      emailVerified: verified,
    }),

  nextStep: () =>
    set((state) => ({
      currentStep: (state.currentStep + 1) as 1 | 2 | 3,
    })),

  reset: () =>
    set({
      currentStep: 1,
      step1Data: null,
      doctorID: null,
      emailVerified: false,
    }),
}));
