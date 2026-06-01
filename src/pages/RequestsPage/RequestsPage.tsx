import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { dataStore, authStore, uiStore } from '@/store';
import {
  REQUEST_TYPE_LABELS,
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_COLORS,
} from '@/types';
import type { BookRequest } from '@/types';
import { Card, Button, Badge } from '@/components/UI';
import { formatDateTime } from '@/utils';
import styles from './RequestsPage.module.scss';

export const RequestsPage = observer(() => {
  const {
    visibleRequests,
    requestsLoading,
    loadRequests,
    loadBooks,
    loadMembers,
    getBookById,
    getMemberById,
    approveRequest,
    rejectRequest,
  } = dataStore;

  const { isAdmin } = authStore;

  useEffect(() => {
    loadRequests();
    loadBooks();
    loadMembers();
  }, [loadRequests, loadBooks, loadMembers]);

  const handleApprove = async (request: BookRequest) => {
    const ok = await approveRequest(request.id);
    if (ok) {
      uiStore.showSuccess('Заявка одобрена');
    } else {
      uiStore.showError('Не удалось одобрить заявку');
    }
  };

  const handleReject = async (request: BookRequest) => {
    const ok = await rejectRequest(request.id);
    if (ok) {
      uiStore.showInfo('Заявка отклонена');
    } else {
      uiStore.showError('Не удалось отклонить заявку');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Заявки</h1>
        <p className={styles.subtitle}>
          {isAdmin
            ? 'Обработка заявок на выдачу и возврат книг'
            : 'История ваших заявок в буккроссинг-пункте'}
        </p>
      </div>

      {requestsLoading ? (
        <Card><p className={styles.empty}>Загрузка...</p></Card>
      ) : visibleRequests.length === 0 ? (
        <Card><p className={styles.empty}>Заявок пока нет</p></Card>
      ) : (
        <div className={styles.list}>
          {visibleRequests.map(request => {
            const book = getBookById(request.bookId);
            const member = getMemberById(request.memberId);
            return (
              <Card key={request.id} className={styles.requestCard}>
                <div className={styles.info}>
                  <div className={styles.row}>
                    <span className={styles.bookTitle}>{book ? book.title : 'Книга удалена'}</span>
                    <Badge variant={request.type === 'take' ? 'info' : 'warning'} size="sm">
                      {REQUEST_TYPE_LABELS[request.type]}
                    </Badge>
                  </div>
                  {isAdmin && (
                    <span className={styles.meta}>
                      Читатель: {member ? `${member.lastName} ${member.firstName} (билет ${member.cardNumber})` : '—'}
                    </span>
                  )}
                  <span className={styles.meta}>{formatDateTime(request.createdAt)}</span>
                </div>

                <div className={styles.actions}>
                  <Badge variant={REQUEST_STATUS_COLORS[request.status]}>
                    {REQUEST_STATUS_LABELS[request.status]}
                  </Badge>
                  {isAdmin && request.status === 'pending' && (
                    <div className={styles.buttons}>
                      <Button variant="success" size="sm" onClick={() => handleApprove(request)}>
                        Одобрить
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleReject(request)}>
                        Отклонить
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
});
