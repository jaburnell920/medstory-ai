// Simple password management for demo purposes
// In production, this should use a secure database with proper hashing

let currentPassword = 'sbc123';

export function getCurrentPassword(): string {
  return currentPassword;
}

export function setCurrentPassword(newPassword: string): void {
  currentPassword = newPassword;
}

export function validatePassword(password: string): boolean {
  return password === currentPassword;
}