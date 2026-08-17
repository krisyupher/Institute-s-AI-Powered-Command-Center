/**
 * Auth contract for `POST /api/auth/login` and `POST /api/auth/register`
 * (docs "Detailed Plan v2", Tickets 2.2 / 2.3).
 */
import { User, UserRole } from './user.model';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
}

/** `POST /api/auth/login` response: `{ token, email, role }`. */
export interface LoginResponse {
  token: string;
  email: string;
  role: UserRole;
}

/**
 * The signed-in user as reconstructed from the JWT payload. This is the app's source of
 * truth for identity — no extra round-trip is needed to know who is signed in.
 */
export interface Session {
  userId: number;
  fullName: string;
  email: string;
  role: UserRole;
  /** `exp` claim converted to epoch milliseconds. */
  expiresAt: number;
}

/** Convenience view of the session as the `User` shape components already render. */
export function sessionToUser(session: Session): User {
  return {
    id: session.userId,
    fullName: session.fullName,
    email: session.email,
    role: session.role,
    createdAt: new Date(0).toISOString(),
    updatedAt: null,
  };
}
