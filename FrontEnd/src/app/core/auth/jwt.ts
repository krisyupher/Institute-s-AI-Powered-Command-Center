/**
 * JWT helpers: decoding a token into a `Session`.
 *
 * Nothing here verifies a signature — that is the API's job. The frontend only reads
 * claims to render the shell and gate routes; the server re-checks every request.
 */
import { Session } from '../models/auth.model';
import { UserRole } from '../models/user.model';

type Claims = Record<string, unknown>;

/**
 * ASP.NET Core emits claims under either the short JWT names or the long WS-Federation
 * URIs, depending on whether `DefaultOutboundClaimTypeMap` was cleared in
 * `JwtTokenService`. Accepting both means Ticket 2.1 can land either way without a
 * frontend change.
 */
const CLAIM_ALIASES = {
  userId: [
    'nameid',
    'sub',
    'userId',
    'UserId',
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
  ],
  email: [
    'email',
    'Email',
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
  ],
  fullName: [
    'unique_name',
    'name',
    'fullName',
    'FullName',
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
  ],
  role: [
    'role',
    'Role',
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
  ],
} as const;

const ROLES: readonly UserRole[] = ['Admin', 'Teacher', 'Student'];

function base64UrlDecode(segment: string): string {
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/').padEnd(
    segment.length + ((4 - (segment.length % 4)) % 4),
    '=',
  );
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** First non-empty value among the aliases; JWT roles may arrive as an array. */
function claim(claims: Claims, aliases: readonly string[]): string | undefined {
  for (const alias of aliases) {
    const value = claims[alias];
    if (Array.isArray(value) && value.length > 0) {
      return String(value[0]);
    }
    if (typeof value === 'string' && value !== '') {
      return value;
    }
    if (typeof value === 'number') {
      return String(value);
    }
  }
  return undefined;
}

/** Reads the payload of a JWT without verifying it. Returns `null` if malformed. */
export function decodeClaims(token: string): Claims | null {
  const segments = token.split('.');
  if (segments.length !== 3) {
    return null;
  }
  try {
    const payload: unknown = JSON.parse(base64UrlDecode(segments[1]));
    return typeof payload === 'object' && payload !== null ? (payload as Claims) : null;
  } catch {
    return null;
  }
}

/**
 * Turns a token into a `Session`, or `null` when it is malformed, missing a usable role,
 * or already expired. Callers can therefore treat "has a session" as "is authenticated".
 */
export function decodeSession(token: string | null, now = Date.now()): Session | null {
  if (!token) {
    return null;
  }

  const claims = decodeClaims(token);
  if (!claims) {
    return null;
  }

  const role = claim(claims, CLAIM_ALIASES.role);
  if (!ROLES.includes(role as UserRole)) {
    return null;
  }

  // `exp` is in seconds since the epoch (RFC 7519). A token with no `exp` is treated as
  // non-expiring rather than invalid, so a backend that omits it still works.
  const exp = typeof claims['exp'] === 'number' ? claims['exp'] * 1000 : Number.POSITIVE_INFINITY;
  if (exp <= now) {
    return null;
  }

  const email = claim(claims, CLAIM_ALIASES.email) ?? '';
  return {
    userId: Number(claim(claims, CLAIM_ALIASES.userId) ?? 0),
    fullName: claim(claims, CLAIM_ALIASES.fullName) ?? email,
    email,
    role: role as UserRole,
    expiresAt: exp,
  };
}
