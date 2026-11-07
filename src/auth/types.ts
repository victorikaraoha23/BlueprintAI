export interface User {
  id: string;
  email: string;
  name?: string | null;
  imageUrl?: string | null;
  provider: string;
  providerId: string;
}

export interface Session {
  user: User;
  expiresAt: Date;
}

export interface JWTPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}
