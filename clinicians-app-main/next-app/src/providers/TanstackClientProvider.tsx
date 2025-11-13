"use client";
// https://tanstack.com/query/v4/docs/framework/react/reference/QueryClientProvider

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

interface TanstackClientProviderProps {
  children: React.ReactNode;
}

export const TanstackClientProvider: React.FC<TanstackClientProviderProps> = ({
  children,
}: TanstackClientProviderProps) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
