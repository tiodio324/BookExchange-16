// ============================================
// User Profile (профиль зарегистрированного пользователя)
// ============================================

export type ProfileRole = 'member' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: ProfileRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || 'admin@bookexchange.ru').toLowerCase();

export const isProtectedAdminUser = (user: Pick<UserProfile, 'email'>): boolean =>
  user.email.toLowerCase() === ADMIN_EMAIL;

export const getUserFullName = (user: UserProfile): string => {
  return `${user.lastName} ${user.firstName}`.trim();
};

export const getUserShortName = (user: UserProfile): string => {
  const initial = user.firstName ? `${user.firstName.charAt(0)}.` : '';
  return `${user.lastName} ${initial}`.trim();
};
