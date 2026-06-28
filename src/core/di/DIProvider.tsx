import React, { createContext, useContext, useRef } from 'react';
import { createContainer, type UseCases } from './container';

const UseCasesContext = createContext<UseCases | null>(null);

/** کانتینرِ تزریقِ وابستگی را یک‌بار می‌سازد و به درختِ کامپوننت‌ها می‌دهد. */
export function DIProvider({ children }: { children: React.ReactNode }) {
  const ref = useRef<UseCases | null>(null);
  if (ref.current === null) {
    ref.current = createContainer().useCases;
  }
  return <UseCasesContext.Provider value={ref.current}>{children}</UseCasesContext.Provider>;
}

/** دسترسیِ presentation به use caseها (نه به لایه‌ی data). */
export function useCases(): UseCases {
  const ctx = useContext(UseCasesContext);
  if (!ctx) throw new Error('useCases must be used within <DIProvider>');
  return ctx;
}
