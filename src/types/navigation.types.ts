// ============================================
// Navigation Types
// ============================================

export type PageId =
  | 'home'
  | 'books'
  | 'requests'
  | 'members'
  | 'admin'
  | 'admin-books'
  | 'admin-genres'
  | 'admin-members';

export interface PageConfig {
  id: PageId;
  title: string;
  icon: string;
  requiresAuth: boolean;
  requiredRole?: 'member' | 'admin';
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
  requests: {
    id: 'requests',
    title: 'Заявки',
    icon: 'exchange',
    requiresAuth: true,
    requiredRole: 'member',
    showInNav: true,
  },
  members: {
    id: 'members',
    title: 'Читатели',
    icon: 'users',
    requiresAuth: false,
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
  'admin-books': {
    id: 'admin-books',
    title: 'Управление книгами',
    icon: 'book',
    requiresAuth: true,
    requiredRole: 'admin',
    showInNav: false,
    parentId: 'admin',
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
