import { NextResponse } from 'next/server';

/**
 * Health check endpoint for network status monitoring
 * Returns a simple 200 OK response
 */
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}
