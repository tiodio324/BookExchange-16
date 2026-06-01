// ============================================
// User & Authentication Types
// ============================================

export type UserRole = 'guest' | 'member' | 'admin';

export interface User {
  role: UserRole;
  // Идентификатор и номер билета заполняются только для читателя (member)
  memberId?: string;
  cardNumber?: string;
  name?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User;
  loginModalOpen: boolean;
}

// Сопоставление ролей и прав доступа
export const ROLE_PERMISSIONS = {
  guest: {
    canViewBooks: true,
    canViewMembers: true,
    canViewRequests: false,
    canBorrow: false,
    canReturn: false,
    canManageBooks: false,
    canManageGenres: false,
    canManageMembers: false,
    canManageRequests: false,
    canAccessAdmin: false,
  },
  member: {
    canViewBooks: true,
    canViewMembers: true,
    canViewRequests: true,
    canBorrow: true,
    canReturn: true,
    canManageBooks: false,
    canManageGenres: false,
    canManageMembers: false,
    canManageRequests: false,
    canAccessAdmin: false,
  },
  admin: {
    canViewBooks: true,
    canViewMembers: true,
    canViewRequests: true,
    canBorrow: false,
    canReturn: false,
    canManageBooks: true,
    canManageGenres: true,
    canManageMembers: true,
    canManageRequests: true,
    canAccessAdmin: true,
  },
} as const;

export type RolePermissions = typeof ROLE_PERMISSIONS[UserRole];
