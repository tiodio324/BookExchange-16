import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { dataStore, authStore } from '@/store';
import {
  REQUEST_TYPE_LABELS,
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_COLORS,
} from '@/types';
import { Card, Badge } from '@/components/UI';
import { formatDateTime } from '@/utils';
import styles from './RequestsPage.module.scss';

export const RequestsPage = observer(() => {
  const {
    visibleRequests,
    requestsLoading,
    loadRequests,
    loadBooks,
    loadUsers,
    getBookById,
    getUserById,
  } = dataStore;

  const { isAdmin } = authStore;

  useEffect(() => {
    loadRequests();
    loadBooks();
    loadUsers();
  }, [loadRequests, loadBooks, loadUsers]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Журнал действий</h1>
        <p className={styles.subtitle}>
          {isAdmin
            ? 'История всех действий читателей в системе'
            : 'История ваших действий в буккроссинг-пункте'}
        </p>
      </div>

      {requestsLoading ? (
        <Card><p className={styles.empty}>Загрузка...</p></Card>
      ) : visibleRequests.length === 0 ? (
        <Card><p className={styles.empty}>Записей пока нет</p></Card>
      ) : (
        <div className={styles.list}>
          {visibleRequests.map(request => {
            const book = getBookById(request.bookId);
            const user = getUserById(request.userId);
            return (
              <Card key={request.id} className={styles.requestCard}>
                <div className={styles.info}>
                  <div className={styles.row}>
                    <span className={styles.bookTitle}>{book ? book.title : 'Книга удалена'}</span>
                    <Badge
                      variant={
                        request.type === 'take' ? 'info'
                          : request.type === 'return' ? 'warning'
                            : request.type === 'download' ? 'success'
                              : 'default'
                      }
                      size="sm"
                    >
                      {REQUEST_TYPE_LABELS[request.type]}
                    </Badge>
                  </div>
                  {isAdmin && (
                    <span className={styles.meta}>
                      Пользователь: {user ? `${user.firstName} ${user.lastName} (${user.email})` : '—'}
                    </span>
                  )}
                  <span className={styles.meta}>{formatDateTime(request.createdAt)}</span>
                </div>

                <div className={styles.actions}>
                  <Badge variant={REQUEST_STATUS_COLORS[request.status]}>
                    {REQUEST_STATUS_LABELS[request.status]}
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
});
