import type { NextRequest } from 'next/server';

export function isAgentApiConfigured(): boolean {
  return Boolean(process.env.AGENT_API_SECRET?.trim());
}

export function verifierAgentApiAuth(request: NextRequest): boolean {
  const secret = process.env.AGENT_API_SECRET?.trim();
  if (!secret) return false;

  const bearer = request.headers.get('authorization');
  if (bearer === `Bearer ${secret}`) return true;

  return request.headers.get('x-agent-secret') === secret;
}

export function reponseAgentNonAutorisee() {
  return Response.json(
    { message: 'Non autorisé. Header Authorization: Bearer AGENT_API_SECRET requis.' },
    { status: 401 },
  );
}
