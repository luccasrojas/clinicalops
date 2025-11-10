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

    console.log('[Lambda API] Invoking:', functionName);
    console.log('[Lambda API] Payload:', JSON.stringify(payload, null, 2));

    // Wrap the payload in the expected Lambda event format
    // Lambda functions expect different formats depending on the request type:
    // - For POST/PUT/PATCH: { body: "stringified JSON" }
    // - For GET: { queryStringParameters: {...}, pathParameters: {...} }
    let lambdaEvent: Record<string, unknown>;

    if (payload && (payload.queryStringParameters || payload.pathParameters)) {
      // GET request with query/path parameters
      lambdaEvent = {
        queryStringParameters: payload.queryStringParameters || {},
        pathParameters: payload.pathParameters || {},
      };
    } else {
      // POST/PUT/PATCH request with body
      lambdaEvent = {
        body: JSON.stringify(payload ?? {}),
      };
    }

    console.log('[Lambda API] Lambda event:', JSON.stringify(lambdaEvent, null, 2));

    const command = new InvokeCommand({
      FunctionName: functionName,
      InvocationType: invocationType ?? 'RequestResponse',
      Payload: Buffer.from(JSON.stringify(lambdaEvent)),
    });

    const response = await lambdaClient.send(command);

    const rawPayload = response.Payload ? textDecoder.decode(response.Payload) : '';
    let parsedPayload: unknown = {};

    console.log('[Lambda API] Raw response:', rawPayload);

    try {
      parsedPayload = rawPayload ? JSON.parse(rawPayload) : {};
    } catch (error) {
      console.error('[Lambda API] Error parsing response:', error, rawPayload);
      parsedPayload = rawPayload;
    }

    if (response.FunctionError) {
      const errorMessage = extractErrorMessage(parsedPayload) ?? response.FunctionError;
      console.error('[Lambda API] Function error:', errorMessage);
      console.error('[Lambda API] Parsed payload:', parsedPayload);
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
      console.log('[Lambda API] Lambda response statusCode:', statusCode);
      console.log('[Lambda API] Lambda body:', lambdaBody);
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

    console.log('[Lambda API] Final body:', body);
    console.log('[Lambda API] Final statusCode:', statusCode);

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
