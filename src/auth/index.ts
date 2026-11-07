import type { Session, User, JWTPayload } from "./types";

export interface AuthStrategy {
  validateSession: (token?: string | null) => Promise<Session | null>;
  createSession: (user: User) => Promise<string>;
}

function parseToken(token: string): JWTPayload | null {
  try {
    // Simple JWT parsing for testing (base64url decode payload)
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }
    const payload = parts[1];
    if (!payload) return null;
    const decoded = Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const parsed = JSON.parse(decoded) as JWTPayload;
    
    if (parsed.exp && parsed.exp * 1000 < Date.now()) {
      return null;
    }
    
    return parsed;
  } catch {
    return null;
  }
}

export const authStrategy: AuthStrategy = {
  validateSession: async (token?: string | null): Promise<Session | null> => {
    if (!token) {
      return null;
    }
    
    const payload = parseToken(token);
    if (!payload || !payload.sub) {
      return null;
    }
    
    const user: User = {
      id: payload.sub,
      email: payload.email || "",
      provider: payload.provider as string || "custom",
      providerId: payload.providerId as string || payload.sub,
    };
    
    return {
      user,
      expiresAt: payload.exp ? new Date(payload.exp * 1000) : new Date(Date.now() + 3600000),
    };
  },
  
  createSession: async (user: User): Promise<string> => {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({
        sub: user.id,
        email: user.email,
        provider: user.provider,
        providerId: user.providerId,
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
    ).toString("base64url");
    return `${header}.${payload}.signature`;
  },
};

export const validateSession = authStrategy.validateSession;
export const createSession = authStrategy.createSession;

export * from "./types";
export default authStrategy;
