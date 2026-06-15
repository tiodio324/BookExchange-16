// ============================================
// Request Types (Журнал действий пользователей)
// ============================================

export type RequestType = 'take' | 'return' | 'add' | 'download';

export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface BookRequest {
  id: string;
  bookId: string;
  userId: string;
  type: RequestType;
  status: RequestStatus;
  note?: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface RequestFormData {
  bookId: string;
  userId: string;
  type: RequestType;
  note?: string;
}

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  take: 'Взял книгу',
  return: 'Отдал в обмен',
  add: 'Добавил книгу',
  download: 'Скачал книгу',
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pending: 'На рассмотрении',
  approved: 'Выполнено',
  rejected: 'Отклонена',
};

export const REQUEST_STATUS_COLORS: Record<RequestStatus, 'success' | 'warning' | 'error'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
};
