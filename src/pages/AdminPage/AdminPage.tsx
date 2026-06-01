import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { dataStore, uiStore } from '@/store';
import { Card, Button, Table, Modal, Input, Select } from '@/components/UI';
import type { TableColumn } from '@/components/UI';
import {
  BOOK_CONDITION_LABELS,
  BOOK_STATUS_LABELS,
} from '@/types';
import type {
  Book,
  Genre,
  Member,
  BookFormData,
  GenreFormData,
  MemberFormData,
  BookCondition,
} from '@/types';
import styles from './AdminPage.module.scss';

type AdminTab = 'books' | 'genres' | 'members';

const emptyBookForm: BookFormData = {
  title: '',
  author: '',
  genreId: '',
  condition: 'good',
  description: '',
};

const emptyGenreForm: GenreFormData = {
  name: '',
  description: '',
};

const emptyMemberForm: MemberFormData = {
  cardNumber: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
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
    books,
    genres,
    members,
    activeGenres,
    loadAllData,
    createBook,
    updateBook,
    deleteBook,
    createGenre,
    updateGenre,
    deleteGenre,
    createMember,
    updateMember,
    deleteMember,
    getGenreById,
    booksLoading,
    genresLoading,
    membersLoading,
  } = dataStore;

  const [activeTab, setActiveTab] = useState<AdminTab>('books');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [bookForm, setBookForm] = useState<BookFormData>(emptyBookForm);
  const [genreForm, setGenreForm] = useState<GenreFormData>(emptyGenreForm);
  const [memberForm, setMemberForm] = useState<MemberFormData>(emptyMemberForm);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const resetForms = () => {
    setBookForm(emptyBookForm);
    setGenreForm(emptyGenreForm);
    setMemberForm(emptyMemberForm);
    setEditingId(null);
  };

  const openCreateModal = () => {
    resetForms();
    setModalMode('create');
    setModalOpen(true);
  };

  const openEditModal = (item: Book | Genre | Member) => {
    setModalMode('edit');
    setEditingId(item.id);

    if (activeTab === 'books') {
      const b = item as Book;
      setBookForm({
        title: b.title,
        author: b.author,
        genreId: b.genreId,
        condition: b.condition,
        description: b.description || '',
      });
    } else if (activeTab === 'genres') {
      const g = item as Genre;
      setGenreForm({ name: g.name, description: g.description || '' });
    } else {
      const m = item as Member;
      setMemberForm({
        cardNumber: m.cardNumber,
        firstName: m.firstName,
        lastName: m.lastName,
        email: m.email || '',
        phone: m.phone || '',
      });
    }

    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (activeTab === 'books') {
        if (!bookForm.title || !bookForm.author || !bookForm.genreId) {
          uiStore.showError('Заполните название, автора и жанр');
          return;
        }
        if (modalMode === 'create') {
          await createBook(bookForm);
        } else if (editingId) {
          await updateBook(editingId, bookForm);
        }
      } else if (activeTab === 'genres') {
        if (!genreForm.name) {
          uiStore.showError('Укажите название жанра');
          return;
        }
        if (modalMode === 'create') {
          await createGenre(genreForm);
        } else if (editingId) {
          await updateGenre(editingId, genreForm);
        }
      } else {
        if (!memberForm.cardNumber || !memberForm.firstName || !memberForm.lastName) {
          uiStore.showError('Заполните билет, имя и фамилию');
          return;
        }
        if (dataStore.isCardNumberTaken(memberForm.cardNumber, editingId || undefined)) {
          uiStore.showError('Такой читательский билет уже существует');
          return;
        }
        if (modalMode === 'create') {
          await createMember(memberForm);
        } else if (editingId) {
          await updateMember(editingId, memberForm);
        }
      }

      uiStore.showSuccess(modalMode === 'create' ? 'Запись добавлена' : 'Запись обновлена');
      setModalOpen(false);
      resetForms();
    } catch {
      uiStore.showError('Ошибка сохранения');
    }
  };

  const handleDelete = (id: string) => {
    uiStore.showConfirm(
      'Удаление записи',
      'Вы уверены, что хотите удалить эту запись?',
      async () => {
        if (activeTab === 'books') {
          await deleteBook(id);
        } else if (activeTab === 'genres') {
          await deleteGenre(id);
        } else {
          await deleteMember(id);
        }
        uiStore.showSuccess('Запись удалена');
      }
    );
  };

  const genreOptions = activeGenres.map(g => ({ value: g.id, label: g.name }));
  const conditionOptions = Object.entries(BOOK_CONDITION_LABELS).map(([value, label]) => ({ value, label }));

  const bookColumns: TableColumn<Book>[] = [
    { key: 'title', title: 'Название' },
    { key: 'author', title: 'Автор' },
    { key: 'genreId', title: 'Жанр', render: (v: unknown) => getGenreById(v as string)?.name || '—' },
    { key: 'status', title: 'Статус', width: '110px', render: (v: unknown) => BOOK_STATUS_LABELS[v as Book['status']] },
    {
      key: 'actions',
      title: '',
      width: '100px',
      render: (_: unknown, row: Book) => renderActions(() => openEditModal(row), () => handleDelete(row.id)),
    },
  ];

  const genreColumns: TableColumn<Genre>[] = [
    { key: 'name', title: 'Название' },
    { key: 'description', title: 'Описание', render: (v: unknown) => (v as string) || '—' },
    {
      key: 'actions',
      title: '',
      width: '100px',
      render: (_: unknown, row: Genre) => renderActions(() => openEditModal(row), () => handleDelete(row.id)),
    },
  ];

  const memberColumns: TableColumn<Member>[] = [
    { key: 'cardNumber', title: 'Билет', width: '140px' },
    { key: 'lastName', title: 'Фамилия' },
    { key: 'firstName', title: 'Имя' },
    { key: 'phone', title: 'Телефон', render: (v: unknown) => (v as string) || '—' },
    {
      key: 'actions',
      title: '',
      width: '100px',
      render: (_: unknown, row: Member) => renderActions(() => openEditModal(row), () => handleDelete(row.id)),
    },
  ];

  const entityName = activeTab === 'books' ? 'книгу' : activeTab === 'genres' ? 'жанр' : 'читателя';

  const getModalTitle = () => {
    const action = modalMode === 'create' ? 'Добавить' : 'Редактировать';
    return `${action} ${entityName}`;
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Администрирование</h1>
        <p className={styles.subtitle}>Управление книгами, жанрами и читательскими билетами</p>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'books' ? styles.active : ''}`}
          onClick={() => setActiveTab('books')}
        >
          Книги
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'genres' ? styles.active : ''}`}
          onClick={() => setActiveTab('genres')}
        >
          Жанры
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'members' ? styles.active : ''}`}
          onClick={() => setActiveTab('members')}
        >
          Читатели
        </button>
      </div>

      <Card className={styles.toolbar}>
        <Button variant="primary" onClick={openCreateModal}>
          Добавить {entityName}
        </Button>
      </Card>

      <Card padding="none">
        {activeTab === 'books' && (
          <Table
            columns={bookColumns}
            data={books.filter(b => b.isActive)}
            keyField="id"
            loading={booksLoading}
            emptyText="Нет книг"
          />
        )}
        {activeTab === 'genres' && (
          <Table
            columns={genreColumns}
            data={genres.filter(g => g.isActive)}
            keyField="id"
            loading={genresLoading}
            emptyText="Нет жанров"
          />
        )}
        {activeTab === 'members' && (
          <Table
            columns={memberColumns}
            data={members.filter(m => m.isActive)}
            keyField="id"
            loading={membersLoading}
            emptyText="Нет читателей"
          />
        )}
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={getModalTitle()}
        footer={
          <div className={styles.modalFooter}>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Отмена</Button>
            <Button variant="primary" onClick={handleSave}>Сохранить</Button>
          </div>
        }
      >
        <div className={styles.form}>
          {activeTab === 'books' && (
            <>
              <Input
                label="Название *"
                value={bookForm.title}
                onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
              />
              <Input
                label="Автор *"
                value={bookForm.author}
                onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
              />
              <Select
                label="Жанр *"
                options={genreOptions}
                value={bookForm.genreId}
                onChange={(e) => setBookForm({ ...bookForm, genreId: e.target.value })}
              />
              <Select
                label="Состояние"
                options={conditionOptions}
                value={bookForm.condition}
                onChange={(e) => setBookForm({ ...bookForm, condition: e.target.value as BookCondition })}
                placeholder=""
              />
              <Input
                label="Описание"
                value={bookForm.description}
                onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
              />
            </>
          )}
          {activeTab === 'genres' && (
            <>
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
            </>
          )}
          {activeTab === 'members' && (
            <>
              <Input
                label="Читательский билет *"
                hint="Например: BC-001. По этому номеру читатель входит в систему."
                value={memberForm.cardNumber}
                onChange={(e) => setMemberForm({ ...memberForm, cardNumber: e.target.value })}
              />
              <Input
                label="Фамилия *"
                value={memberForm.lastName}
                onChange={(e) => setMemberForm({ ...memberForm, lastName: e.target.value })}
              />
              <Input
                label="Имя *"
                value={memberForm.firstName}
                onChange={(e) => setMemberForm({ ...memberForm, firstName: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                value={memberForm.email}
                onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
              />
              <Input
                label="Телефон"
                value={memberForm.phone}
                onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
              />
            </>
          )}
        </div>
      </Modal>
    </div>
  );
});
