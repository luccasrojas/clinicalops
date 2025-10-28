'use client';

import { useRegisterStore } from '../stores/register-store';
import { RegisterStep1Form } from './register-step1-form';
import { RegisterStep2Form } from './register-step2-form';
import { VerifyEmailForm } from './verify-email-form';

export function RegisterMultiStepForm() {
  const currentStep = useRegisterStore((state) => state.currentStep);
  const step1Data = useRegisterStore((state) => state.step1Data);
  const nextStep = useRegisterStore((state) => state.nextStep);
  const setEmailVerified = useRegisterStore((state) => state.setEmailVerified);

  const handleEmailVerified = () => {
    setEmailVerified(true);
    nextStep();
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-2">
          {/* Step 1 */}
          <div className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                currentStep >= 1
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              1
            </div>
            <span
              className={`ml-2 text-sm font-medium hidden sm:inline ${
                currentStep >= 1 ? 'text-gray-900' : 'text-gray-500'
              }`}
            >
              Información Básica
            </span>
          </div>

          <div className="w-12 h-1 bg-gray-200">
            <div
              className={`h-full transition-all ${
                currentStep >= 2 ? 'bg-blue-600 w-full' : 'bg-gray-200 w-0'
              }`}
            />
          </div>

          {/* Step 2 - Verify Email */}
          <div className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                currentStep >= 2
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              2
            </div>
            <span
              className={`ml-2 text-sm font-medium hidden sm:inline ${
                currentStep >= 2 ? 'text-gray-900' : 'text-gray-500'
              }`}
            >
              Verificar Email
            </span>
          </div>

          <div className="w-12 h-1 bg-gray-200">
            <div
              className={`h-full transition-all ${
                currentStep >= 3 ? 'bg-blue-600 w-full' : 'bg-gray-200 w-0'
              }`}
            />
          </div>

          {/* Step 3 - Clinical History */}
          <div className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                currentStep >= 3
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              3
            </div>
            <span
              className={`ml-2 text-sm font-medium hidden sm:inline ${
                currentStep >= 3 ? 'text-gray-900' : 'text-gray-500'
              }`}
            >
              Historia Clínica
            </span>
          </div>
        </div>
      </div>

      {/* Form content */}
      <div className="flex justify-center">
        {currentStep === 1 && <RegisterStep1Form />}
        {currentStep === 2 && step1Data && (
          <VerifyEmailForm
            email={step1Data.email}
            onVerified={handleEmailVerified}
          />
        )}
        {currentStep === 3 && <RegisterStep2Form />}
      </div>
    </div>
  );
}
