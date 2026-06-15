// ============================================
// User & Authentication Types
// ============================================

export type UserRole = 'guest' | 'member' | 'admin';

export interface User {
  role: UserRole;
  uid?: string;
  email?: string;
  name?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User;
  loginModalOpen: boolean;
}

export const ROLE_PERMISSIONS = {
  guest: {
    canViewBooks: true,
    canViewMembers: false,
    canViewRequests: false,
    canUseChat: false,
    canBorrow: false,
    canReturn: false,
    canAddBooks: false,
    canManageGenres: false,
    canManageMembers: false,
    canAccessAdmin: false,
  },
  member: {
    canViewBooks: true,
    canViewMembers: false,
    canViewRequests: true,
    canUseChat: true,
    canBorrow: true,
    canReturn: true,
    canAddBooks: true,
    canManageGenres: false,
    canManageMembers: false,
    canAccessAdmin: false,
  },
  admin: {
    canViewBooks: true,
    canViewMembers: true,
    canViewRequests: true,
    canUseChat: false,
    canBorrow: false,
    canReturn: false,
    canAddBooks: false,
    canManageGenres: true,
    canManageMembers: true,
    canAccessAdmin: true,
  },
} as const;

export type RolePermissions = typeof ROLE_PERMISSIONS[UserRole];
