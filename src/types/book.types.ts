// ============================================
// Book Types (Книга в обороте буккроссинга)
// ============================================

export type BookCondition = 'new' | 'good' | 'used' | 'worn';

export type BookStatus = 'available' | 'reserved' | 'taken';

export interface Book {
  id: string;
  title: string;
  author: string;
  genreId: string;
  condition: BookCondition;
  description?: string;
  status: BookStatus;
  holderId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BookFormData {
  title: string;
  author: string;
  genreId: string;
  condition: BookCondition;
  description?: string;
}

// Подписи состояния книги
export const BOOK_CONDITION_LABELS: Record<BookCondition, string> = {
  new: 'Новая',
  good: 'Хорошее',
  used: 'Б/у',
  worn: 'Потрёпанная',
};

// Подписи статуса книги
export const BOOK_STATUS_LABELS: Record<BookStatus, string> = {
  available: 'Свободна',
  reserved: 'Бронь',
  taken: 'На руках',
};

// Цвета статуса (имена CSS-переменных через Badge variant)
export const BOOK_STATUS_COLORS: Record<BookStatus, 'success' | 'warning' | 'info'> = {
  available: 'success',
  reserved: 'warning',
  taken: 'info',
};
