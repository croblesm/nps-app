"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface AssistantContextData {
  [key: string]: unknown;
}

interface AssistantContextType {
  pageContext: AssistantContextData;
  setPageContext: (context: AssistantContextData) => void;
}

const AssistantContext = createContext<AssistantContextType>({
  pageContext: {},
  setPageContext: () => {},
});

export function AssistantContextProvider({ children }: { children: ReactNode }) {
  const [pageContext, setPageContextState] = useState<AssistantContextData>({});

  const setPageContext = useCallback((context: AssistantContextData) => {
    setPageContextState(context);
  }, []);

  return (
    <AssistantContext.Provider value={{ pageContext, setPageContext }}>
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistantContext() {
  return useContext(AssistantContext);
}
