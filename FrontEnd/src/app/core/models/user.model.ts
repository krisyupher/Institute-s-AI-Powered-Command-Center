/**
 * Mirrors `AiInstituteManager.Domain.Entities.User` and
 * the `UserRole` enum (backend `AiInstituteManager.Domain/Enums/UserRole.cs`).
 */
export type UserRole = 'Admin' | 'Teacher' | 'Student';

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string | null;
}
