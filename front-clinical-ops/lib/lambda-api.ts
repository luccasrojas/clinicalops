type InvokeLambdaOptions = {
  functionName: string;
  payload?: Record<string, unknown>;
  invocationType?: 'RequestResponse' | 'Event';
};

export async function invokeLambdaApi<T>({
  functionName,
  payload,
  invocationType,
}: InvokeLambdaOptions): Promise<T> {
  const response = await fetch('/api/lambda', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      functionName,
      payload,
      invocationType,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage =
      (data as { error?: string; details?: string } | null)?.error ??
      'Error al invocar la función de AWS';
    throw new Error(errorMessage);
  }

  return data as T;
}
