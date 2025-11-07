import { NextResponse } from 'next/server';
import { InvokeCommand } from '@aws-sdk/client-lambda';
import { lambdaClient } from '@/lib/aws/lambda-client';

export const runtime = 'nodejs';

type LambdaRequestBody = {
  functionName?: string;
  payload?: Record<string, unknown>;
  invocationType?: 'Event' | 'RequestResponse';
};

type LambdaHttpResponse = {
  statusCode?: number | string;
  body?: unknown;
};

const isLambdaHttpResponse = (value: unknown): value is LambdaHttpResponse => {
  return typeof value === 'object' && value !== null && 'statusCode' in value;
};

const extractErrorMessage = (value: unknown): string | undefined => {
  if (typeof value === 'object' && value !== null) {
    const candidate = value as { errorMessage?: string; error?: string; message?: string };
    return candidate.errorMessage ?? candidate.error ?? candidate.message;
  }
  if (typeof value === 'string') {
    return value;
  }
  return undefined;
};

const textDecoder = new TextDecoder('utf-8');

export async function POST(request: Request) {
  try {
    const { functionName, payload, invocationType }: LambdaRequestBody = await request.json();

    if (!functionName) {
      return NextResponse.json(
        { error: 'functionName es requerido' },
        { status: 400 }
      );
    }

    const command = new InvokeCommand({
      FunctionName: functionName,
      InvocationType: invocationType ?? 'RequestResponse',
      Payload: Buffer.from(JSON.stringify(payload ?? {})),
    });

    const response = await lambdaClient.send(command);

    const rawPayload = response.Payload ? textDecoder.decode(response.Payload) : '';
    let parsedPayload: unknown = {};

    try {
      parsedPayload = rawPayload ? JSON.parse(rawPayload) : {};
    } catch (error) {
      console.error('Error al parsear la respuesta de Lambda', error, rawPayload);
      parsedPayload = rawPayload;
    }

    if (response.FunctionError) {
      const errorMessage = extractErrorMessage(parsedPayload) ?? response.FunctionError;
      return NextResponse.json(
        { error: 'Error ejecutando la lambda', details: errorMessage },
        { status: 502 }
      );
    }

    let statusCode = 200;
    let body: unknown = parsedPayload;

    if (isLambdaHttpResponse(parsedPayload)) {
      statusCode = Number(parsedPayload.statusCode) || 200;
      const lambdaBody = parsedPayload.body;
      if (typeof lambdaBody === 'string') {
        try {
          body = JSON.parse(lambdaBody);
        } catch {
          body = lambdaBody;
        }
      } else if (lambdaBody !== undefined) {
        body = lambdaBody;
      }
    }

    return NextResponse.json(body ?? {}, { status: statusCode });
  } catch (error) {
    console.error('Fallo invocando lambda', error);
    return NextResponse.json(
      {
        error: 'No se pudo invocar la función Lambda',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
