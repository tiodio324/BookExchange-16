import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { dataStore, authStore } from '@/store';
import type { Member } from '@/types';
import { Card, Table, Badge } from '@/components/UI';
import type { TableColumn } from '@/components/UI';
import styles from './MembersPage.module.scss';

export const MembersPage = observer(() => {
  const { activeMembers, membersLoading, loadMembers, loadBooks, books } = dataStore;
  const { isAdmin } = authStore;

  useEffect(() => {
    loadMembers();
    loadBooks();
  }, [loadMembers, loadBooks]);

  const booksOnHand = (memberId: string): number =>
    books.filter(b => b.isActive && b.holderId === memberId).length;

  const columns: TableColumn<Member>[] = [
    {
      key: 'index',
      title: '№',
      width: '56px',
      render: (_: unknown, __: Member, index: number) => index + 1,
    },
    {
      key: 'fullName',
      title: 'Читатель',
      render: (_: unknown, row: Member) => `${row.lastName} ${row.firstName}`,
    },
    ...(isAdmin
      ? [{
          key: 'cardNumber',
          title: 'Читательский билет',
          width: '180px',
          render: (v: unknown) => <code className={styles.card}>{v as string}</code>,
        }]
      : []),
    {
      key: 'booksOnHand',
      title: 'Книг на руках',
      width: '140px',
      align: 'center' as const,
      render: (_: unknown, row: Member) => (
        <Badge variant={booksOnHand(row.id) > 0 ? 'info' : 'default'}>
          {booksOnHand(row.id)}
        </Badge>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Читатели</h1>
        <p className={styles.subtitle}>
          Участников буккроссинг-пункта: {activeMembers.length}
        </p>
      </div>

      <Card padding="none">
        <Table
          columns={columns}
          data={activeMembers}
          keyField="id"
          loading={membersLoading}
          emptyText="Читатели не найдены"
        />
      </Card>
    </div>
  );
});
