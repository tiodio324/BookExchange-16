import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { dataStore, authStore } from '@/store';
import type { UserProfile } from '@/types';
import { Card, Table, Badge } from '@/components/UI';
import type { TableColumn } from '@/components/UI';
import styles from './MembersPage.module.scss';

export const MembersPage = observer(() => {
  const { activeUsers, usersLoading, loadUsers, loadBooks, books } = dataStore;
  const { isAdmin } = authStore;

  useEffect(() => {
    loadUsers();
    loadBooks();
  }, [loadUsers, loadBooks]);

  const booksOnHand = (userId: string): number =>
    books.filter(
      b => b.isActive && b.format === 'paper' && b.ownerId === userId && b.status === 'taken',
    ).length;

  const columns: TableColumn<UserProfile>[] = [
    {
      key: 'index',
      title: '№',
      width: '56px',
      render: (_: unknown, __: UserProfile, index: number) => index + 1,
    },
    {
      key: 'fullName',
      title: 'Пользователь',
      render: (_: unknown, row: UserProfile) => `${row.firstName} ${row.lastName}`,
    },
    ...(isAdmin
      ? [{
          key: 'email',
          title: 'Email',
          width: '220px',
        }]
      : []),
    {
      key: 'booksOnHand',
      title: 'Книг на руках',
      width: '140px',
      align: 'center' as const,
      render: (_: unknown, row: UserProfile) => (
        <Badge variant={booksOnHand(row.id) > 0 ? 'info' : 'default'}>
          {booksOnHand(row.id)}
        </Badge>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Пользователи</h1>
        <p className={styles.subtitle}>
          Зарегистрированных участников: {activeUsers.length}
        </p>
      </div>

      <Card padding="none">
        <Table
          columns={columns}
          data={activeUsers}
          keyField="id"
          loading={usersLoading}
          emptyText="Пользователи не найдены"
        />
      </Card>
    </div>
  );
});
