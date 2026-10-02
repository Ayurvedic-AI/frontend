const AUTH_STORAGE_KEYS = [
  'userData',
  'userId',
  'email',
  'firstName',
  'lastName',
  'authToken',
  'refreshToken',
  'authMethod',
  'permissions',
  'roleType',
  'status',
  // Added by feature 002 — sign-out also clears any in-flight OTP timer state.
  'otp_expiry_time',
] as const;

export function clearAuthStorage(): void {
  AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
}
