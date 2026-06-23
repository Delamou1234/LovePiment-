export type SessionRole = 'admin' | 'customer' | 'courier';

export type SessionUser = {
  id?: string;
  email: string;
  name: string;
  role: SessionRole;
};

export type SessionPayload = SessionUser & { exp: number };
