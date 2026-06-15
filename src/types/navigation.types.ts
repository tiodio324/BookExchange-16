// ============================================
// Navigation Types
// ============================================

import type { RolePermissions } from './user.types';

export type PageId =
  | 'home'
  | 'books'
  | 'chat'
  | 'requests'
  | 'members'
  | 'admin'
  | 'admin-genres'
  | 'admin-members';

export interface PageConfig {
  id: PageId;
  title: string;
  icon: string;
  requiresAuth: boolean;
  requiredRole?: 'member' | 'admin';
  requiredPermission?: keyof RolePermissions;
  showInNav: boolean;
  parentId?: PageId;
}

export const PAGES_CONFIG: Record<PageId, PageConfig> = {
  home: {
    id: 'home',
    title: 'Главная',
    icon: 'home',
    requiresAuth: false,
    showInNav: true,
  },
  books: {
    id: 'books',
    title: 'Каталог книг',
    icon: 'book',
    requiresAuth: false,
    showInNav: true,
  },
  chat: {
    id: 'chat',
    title: 'Чат',
    icon: 'chat',
    requiresAuth: true,
    requiredRole: 'member',
    requiredPermission: 'canUseChat',
    showInNav: true,
  },
  requests: {
    id: 'requests',
    title: 'Журнал действий',
    icon: 'exchange',
    requiresAuth: true,
    requiredRole: 'member',
    showInNav: true,
  },
  members: {
    id: 'members',
    title: 'Пользователи',
    icon: 'users',
    requiresAuth: true,
    requiredRole: 'admin',
    showInNav: true,
  },
  admin: {
    id: 'admin',
    title: 'Администрирование',
    icon: 'settings',
    requiresAuth: true,
    requiredRole: 'admin',
    showInNav: true,
  },
  'admin-genres': {
    id: 'admin-genres',
    title: 'Управление жанрами',
    icon: 'folder-plus',
    requiresAuth: true,
    requiredRole: 'admin',
    showInNav: false,
    parentId: 'admin',
  },
  'admin-members': {
    id: 'admin-members',
    title: 'Управление читателями',
    icon: 'user-plus',
    requiresAuth: true,
    requiredRole: 'admin',
    showInNav: false,
    parentId: 'admin',
  },
};
