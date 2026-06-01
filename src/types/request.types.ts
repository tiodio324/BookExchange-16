// ============================================
// Request Types (Заявка на выдачу / возврат книги)
// ============================================

export type RequestType = 'take' | 'return';

export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface BookRequest {
  id: string;
  bookId: string;
  memberId: string;
  type: RequestType;
  status: RequestStatus;
  note?: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface RequestFormData {
  bookId: string;
  memberId: string;
  type: RequestType;
  note?: string;
}

// Подписи типа заявки
export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  take: 'Взять книгу',
  return: 'Вернуть книгу',
};

// Подписи статуса заявки
export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pending: 'На рассмотрении',
  approved: 'Одобрена',
  rejected: 'Отклонена',
};

// Цвета статуса заявки (Badge variant)
export const REQUEST_STATUS_COLORS: Record<RequestStatus, 'success' | 'warning' | 'error'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
};
