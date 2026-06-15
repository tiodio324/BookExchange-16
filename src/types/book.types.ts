// ============================================
// Book Types (Книга в обороте буккроссинга)
// ============================================

export type BookCondition = 'new' | 'good' | 'used' | 'worn';

export type BookFormat = 'paper' | 'electronic';

export type BookStatus = 'available' | 'reserved' | 'taken';

export interface Book {
  id: string;
  title: string;
  author: string;
  genreId: string;
  format: BookFormat;
  condition: BookCondition;
  description?: string;
  /** Файл книги как Data URL (base64-строка) в RTDB */
  electronicData?: string;
  /** Исходное имя загруженного файла (с расширением) */
  electronicFileName?: string;
  status: BookStatus;
  ownerId: string;
  holderId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BookFormData {
  title: string;
  author: string;
  genreId: string;
  format: BookFormat;
  condition: BookCondition;
  description?: string;
}

export const BOOK_CONDITION_LABELS: Record<BookCondition, string> = {
  new: 'Новая',
  good: 'Хорошее',
  used: 'Б/у',
  worn: 'Потрёпанная',
};

export const BOOK_FORMAT_LABELS: Record<BookFormat, string> = {
  paper: 'Бумажная',
  electronic: 'Электронная',
};

export const BOOK_STATUS_LABELS: Record<BookStatus, string> = {
  available: 'Свободна',
  reserved: 'Ожидает передачи',
  taken: 'На руках',
};

export const BOOK_STATUS_COLORS: Record<BookStatus, 'success' | 'warning' | 'info'> = {
  available: 'success',
  reserved: 'warning',
  taken: 'info',
};

export const BOOK_FORMAT_COLORS: Record<BookFormat, 'default' | 'info'> = {
  paper: 'default',
  electronic: 'info',
};

/** Ссылка для открытия/скачивания электронной книги (только из RTDB) */
export const getBookElectronicHref = (book: Book): string | null => {
  if (book.format !== 'electronic') return null;
  return book.electronicData || null;
};

/** Статус в каталоге: электронные книги всегда доступны всем */
export const getBookStatusLabel = (book: Book): string => {
  if (book.format === 'electronic') return 'Доступна';
  return BOOK_STATUS_LABELS[book.status];
};

export const getBookStatusColor = (book: Book): 'success' | 'warning' | 'info' => {
  if (book.format === 'electronic') return 'success';
  return BOOK_STATUS_COLORS[book.status];
};
