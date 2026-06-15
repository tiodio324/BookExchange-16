import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { dataStore, uiStore } from '@/store';
import { Card, Button, Table, Modal, Input } from '@/components/UI';
import type { TableColumn } from '@/components/UI';
import type { Genre, UserProfile, GenreFormData } from '@/types';
import { isProtectedAdminUser } from '@/types';
import styles from './AdminPage.module.scss';

type AdminTab = 'genres' | 'users';

const emptyGenreForm: GenreFormData = {
  name: '',
  description: '',
};

const renderActions = (onEdit: () => void, onDelete: () => void) => (
  <div className={styles.actions}>
    <Button size="sm" variant="ghost" onClick={onEdit} aria-label="Редактировать">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    </Button>
    <Button size="sm" variant="ghost" onClick={onDelete} aria-label="Удалить">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
      </svg>
    </Button>
  </div>
);

export const AdminPage = observer(() => {
  const {
    genres,
    users,
    loadAllData,
    createGenre,
    updateGenre,
    deleteGenre,
    deactivateUser,
    genresLoading,
    usersLoading,
  } = dataStore;

  const [activeTab, setActiveTab] = useState<AdminTab>('genres');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [genreForm, setGenreForm] = useState<GenreFormData>(emptyGenreForm);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const openCreateModal = () => {
    setGenreForm(emptyGenreForm);
    setEditingId(null);
    setModalMode('create');
    setModalOpen(true);
  };

  const openEditModal = (genre: Genre) => {
    setModalMode('edit');
    setEditingId(genre.id);
    setGenreForm({ name: genre.name, description: genre.description || '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!genreForm.name) {
        uiStore.showError('Укажите название жанра');
        return;
      }
      if (modalMode === 'create') {
        await createGenre(genreForm);
      } else if (editingId) {
        await updateGenre(editingId, genreForm);
      }
      uiStore.showSuccess(modalMode === 'create' ? 'Жанр добавлен' : 'Жанр обновлён');
      setModalOpen(false);
    } catch {
      uiStore.showError('Ошибка сохранения');
    }
  };

  const handleDeleteGenre = (id: string) => {
    uiStore.showConfirm('Удаление жанра', 'Вы уверены, что хотите удалить этот жанр?', async () => {
      await deleteGenre(id);
      uiStore.showSuccess('Жанр удалён');
    });
  };

  const handleDeactivateUser = (user: UserProfile) => {
    if (isProtectedAdminUser(user)) return;

    uiStore.showConfirm(
      'Деактивация пользователя',
      `Деактивировать аккаунт ${user.email}?`,
      async () => {
        await deactivateUser(user.id);
        uiStore.showSuccess('Пользователь деактивирован');
      },
    );
  };

  const genreColumns: TableColumn<Genre>[] = [
    { key: 'name', title: 'Название' },
    { key: 'description', title: 'Описание', render: (v: unknown) => (v as string) || '—' },
    {
      key: 'actions',
      title: '',
      width: '100px',
      render: (_: unknown, row: Genre) => renderActions(() => openEditModal(row), () => handleDeleteGenre(row.id)),
    },
  ];

  const userColumns: TableColumn<UserProfile>[] = [
    { key: 'email', title: 'Email' },
    { key: 'lastName', title: 'Фамилия' },
    { key: 'firstName', title: 'Имя' },
    { key: 'role', title: 'Роль', width: '120px', render: (v: unknown) => (v === 'admin' ? 'Админ' : 'Читатель') },
    {
      key: 'actions',
      title: '',
      width: '140px',
      render: (_: unknown, row: UserProfile) => {
        if (isProtectedAdminUser(row)) {
          return <span>—</span>;
        }
        return row.isActive ? (
          <Button size="sm" variant="danger" onClick={() => handleDeactivateUser(row)}>
            Деактивировать
          </Button>
        ) : (
          <span>Неактивен</span>
        );
      },
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Администрирование</h1>
        <p className={styles.subtitle}>Управление жанрами и зарегистрированными пользователями</p>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'genres' ? styles.active : ''}`}
          onClick={() => setActiveTab('genres')}
        >
          Жанры
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'users' ? styles.active : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Пользователи
        </button>
      </div>

      {activeTab === 'genres' && (
        <Card className={styles.toolbar}>
          <Button variant="primary" onClick={openCreateModal}>Добавить жанр</Button>
        </Card>
      )}

      <Card padding="none">
        {activeTab === 'genres' && (
          <Table
            columns={genreColumns}
            data={genres.filter(g => g.isActive)}
            keyField="id"
            loading={genresLoading}
            emptyText="Нет жанров"
          />
        )}
        {activeTab === 'users' && (
          <Table
            columns={userColumns}
            data={users}
            keyField="id"
            loading={usersLoading}
            emptyText="Нет зарегистрированных пользователей"
          />
        )}
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalMode === 'create' ? 'Добавить жанр' : 'Редактировать жанр'}
        footer={
          <div className={styles.modalFooter}>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Отмена</Button>
            <Button variant="primary" onClick={handleSave}>Сохранить</Button>
          </div>
        }
      >
        <div className={styles.form}>
          <Input
            label="Название *"
            value={genreForm.name}
            onChange={(e) => setGenreForm({ ...genreForm, name: e.target.value })}
          />
          <Input
            label="Описание"
            value={genreForm.description}
            onChange={(e) => setGenreForm({ ...genreForm, description: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
});
