import React, { createContext, useContext, useState } from 'react';
import { createContainer, type UseCases } from './container';

const UseCasesContext = createContext<UseCases | null>(null);

/** کانتینرِ تزریقِ وابستگی را یک‌بار می‌سازد و به درختِ کامپوننت‌ها می‌دهد. */
export function DIProvider({ children }: { children: React.ReactNode }) {
  const [useCasesInstance] = useState(() => createContainer().useCases);
  return <UseCasesContext.Provider value={useCasesInstance}>{children}</UseCasesContext.Provider>;
}

/** دسترسیِ presentation به use caseها (نه به لایه‌ی data). */
export function useCases(): UseCases {
  const ctx = useContext(UseCasesContext);
  if (!ctx) throw new Error('useCases must be used within <DIProvider>');
  return ctx;
}
