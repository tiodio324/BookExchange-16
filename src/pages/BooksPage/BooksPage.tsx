import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { dataStore, authStore, chatStore, navigationStore, uiStore } from '@/store';
import {
  BOOK_CONDITION_LABELS,
  BOOK_STATUS_LABELS,
  BOOK_FORMAT_LABELS,
  BOOK_FORMAT_COLORS,
  getBookElectronicHref,
  getBookStatusLabel,
  getBookStatusColor,
} from '@/types';
import type { Book, BookFormData, BookCondition, BookFormat } from '@/types';
import { Card, Select, Input, Button, Badge, Modal } from '@/components/UI';
import { EBOOK_MAX_SIZE_LABEL, getElectronicDownloadFileName } from '@/utils/file';
import styles from './BooksPage.module.scss';

const emptyBookForm: BookFormData = {
  title: '',
  author: '',
  genreId: '',
  format: 'paper',
  condition: 'good',
  description: '',
};

export const BooksPage = observer(() => {
  const {
    filteredBooks,
    activeGenres,
    loadBooks,
    loadGenres,
    loadUsers,
    booksLoading,
    filters,
    setFilter,
    getGenreById,
    getUserById,
    requestBook,
    releaseBook,
    confirmTransfer,
    rejectTransfer,
    getPendingTakeRequest,
    logElectronicDownload,
    createBook,
  } = dataStore;

  const { isMember, isAdmin, currentUserId, canAddBooks, isAuthenticated } = authStore;
  const { navigate } = navigationStore;

  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [bookForm, setBookForm] = useState<BookFormData>(emptyBookForm);
  const [ebookFile, setEbookFile] = useState<File | null>(null);

  useEffect(() => {
    loadBooks();
    loadGenres();
    loadUsers();
  }, [loadBooks, loadGenres, loadUsers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilter('search', searchValue || undefined);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue, setFilter]);

  const genreOptions = [
    { value: '', label: 'Все жанры' },
    ...activeGenres.map(g => ({ value: g.id, label: g.name })),
  ];

  const formGenreOptions = activeGenres.map(g => ({ value: g.id, label: g.name }));
  const conditionOptions = Object.entries(BOOK_CONDITION_LABELS).map(([value, label]) => ({ value, label }));
  const formatOptions = Object.entries(BOOK_FORMAT_LABELS).map(([value, label]) => ({ value, label }));

  const statusOptions = [
    { value: '', label: 'Любой статус' },
    ...Object.entries(BOOK_STATUS_LABELS).map(([value, label]) => ({ value, label })),
  ];

  const filterFormatOptions = [
    { value: '', label: 'Все форматы' },
    ...Object.entries(BOOK_FORMAT_LABELS).map(([value, label]) => ({ value, label })),
  ];

  const handleTake = async (book: Book) => {
    const ok = await requestBook(book.id);
    if (ok) {
      uiStore.showSuccess('Запрос отправлен — дождитесь подтверждения владельца');
    } else {
      uiStore.showError('Не удалось отправить запрос');
    }
  };

  const handleRelease = async (book: Book) => {
    const ok = await releaseBook(book.id);
    if (ok) {
      uiStore.showSuccess('Книга снова доступна для обмена');
    } else {
      uiStore.showError('Не удалось отдать книгу в обмен');
    }
  };

  const handleConfirmTransfer = async (book: Book) => {
    const ok = await confirmTransfer(book.id);
    if (ok) {
      uiStore.showSuccess('Книга передана новому владельцу');
    } else {
      uiStore.showError('Не удалось подтвердить передачу');
    }
  };

  const handleRejectTransfer = async (book: Book) => {
    uiStore.showConfirm(
      'Отклонить передачу',
      'Отменить запрос на получение этой книги?',
      async () => {
        const ok = await rejectTransfer(book.id);
        if (ok) {
          uiStore.showSuccess('Запрос на передачу отклонён');
        } else {
          uiStore.showError('Не удалось отклонить запрос');
        }
      },
    );
  };

  const handleDownload = async (book: Book) => {
    const href = getBookElectronicHref(book);
    if (!href) {
      uiStore.showError('Файл книги недоступен');
      return;
    }

    const ok = await logElectronicDownload(book.id);
    if (!ok) {
      uiStore.showError('Не удалось зафиксировать скачивание');
      return;
    }

    const link = document.createElement('a');
    link.href = href;
    link.download = getElectronicDownloadFileName(book);
    link.click();
    uiStore.showSuccess('Скачивание начато');
  };

  const handleAddBook = async () => {
    if (!bookForm.title || !bookForm.author || !bookForm.genreId) {
      uiStore.showError('Заполните название, автора и жанр');
      return;
    }

    if (bookForm.format === 'electronic' && !ebookFile) {
      uiStore.showError('Для электронной книги загрузите файл');
      return;
    }

    const book = await createBook(bookForm, ebookFile || undefined);
    if (book) {
      uiStore.showSuccess('Книга добавлена в оборот');
      setAddModalOpen(false);
      setBookForm(emptyBookForm);
      setEbookFile(null);
    } else {
      uiStore.showError(
        ebookFile
          ? `Не удалось добавить книгу. Проверьте размер файла (до ${EBOOK_MAX_SIZE_LABEL})`
          : 'Не удалось добавить книгу',
      );
    }
  };

  const handleStartChat = async (book: Book) => {
    if (!isAuthenticated) {
      authStore.openLoginModal();
      return;
    }
    const ownerId = book.ownerId;
    if (!ownerId || ownerId === currentUserId) return;

    const chatId = await chatStore.startChatWithUser(ownerId, book.id, book.title);
    if (chatId) {
      navigate('chat');
    } else {
      uiStore.showError('Не удалось открыть чат');
    }
  };

  const renderAction = (book: Book) => {
    if (book.format === 'electronic') {
      if (isAdmin) {
        return <span className={styles.hint}>Доступна всем для скачивания</span>;
      }
      if (!isMember) {
        return <span className={styles.hint}>Войдите в аккаунт, чтобы скачать книгу</span>;
      }
      const actions = [
        <Button key="download" variant="primary" size="sm" onClick={() => handleDownload(book)}>
          Скачать
        </Button>,
      ];
      if (book.ownerId && book.ownerId !== currentUserId) {
        actions.push(
          <Button key="chat" variant="ghost" size="sm" onClick={() => handleStartChat(book)}>
            Написать
          </Button>,
        );
      }
      return <div className={styles.actionGroup}>{actions}</div>;
    }

    if (isAdmin) {
      const owner = getUserById(book.ownerId);
      const pendingRequest = getPendingTakeRequest(book.id);
      return (
        <div className={styles.adminInfo}>
          <span className={styles.holder}>
            Владелец: {owner ? `${owner.lastName} ${owner.firstName}` : '—'}
          </span>
          {pendingRequest && (
            <span className={styles.hint}>
              Ожидает передачи: {getUserById(pendingRequest.userId)?.firstName || '—'}
            </span>
          )}
        </div>
      );
    }

    if (!isMember) {
      return <span className={styles.hint}>Войдите в аккаунт, чтобы брать и добавлять книги</span>;
    }

    const isOwner = book.ownerId === currentUserId;
    const pendingRequest = getPendingTakeRequest(book.id);
    const isPendingForMe = pendingRequest?.userId === currentUserId;
    const canChat = book.ownerId && book.ownerId !== currentUserId;
    const actions = [];

    if (book.status === 'available' && !isOwner) {
      actions.push(
        <Button key="take" variant="primary" size="sm" onClick={() => handleTake(book)}>
          Взять себе
        </Button>,
      );
    }

    if (book.status === 'available' && isOwner) {
      actions.push(
        <span key="own-available" className={styles.hint}>Ваша книга в обмене</span>,
      );
    }

    if (book.status === 'reserved' && isOwner && pendingRequest) {
      const requester = getUserById(pendingRequest.userId);
      actions.push(
        <span key="pending-info" className={styles.hint}>
          Запрос от: {requester ? `${requester.firstName} ${requester.lastName}` : '—'}
        </span>,
        <Button key="confirm" variant="primary" size="sm" onClick={() => handleConfirmTransfer(book)}>
          Подтвердить передачу
        </Button>,
        <Button key="reject" variant="ghost" size="sm" onClick={() => handleRejectTransfer(book)}>
          Отклонить
        </Button>,
      );
    }

    if (book.status === 'reserved' && isPendingForMe) {
      actions.push(
        <span key="waiting" className={styles.hint}>Ожидает подтверждения владельца</span>,
      );
    }

    if (book.status === 'reserved' && !isOwner && !isPendingForMe) {
      actions.push(
        <span key="reserved" className={styles.hint}>Книга зарезервирована</span>,
      );
    }

    if (book.status === 'taken' && isOwner) {
      actions.push(
        <Button key="release" variant="secondary" size="sm" onClick={() => handleRelease(book)}>
          Отдать в обмен
        </Button>,
      );
    }

    if (book.status === 'taken' && !isOwner) {
      actions.push(
        <span key="taken" className={styles.hint}>Книга у другого читателя</span>,
      );
    }

    if (canChat) {
      actions.push(
        <Button key="chat" variant="ghost" size="sm" onClick={() => handleStartChat(book)}>
          Написать
        </Button>,
      );
    }

    return actions.length > 0 ? <div className={styles.actionGroup}>{actions}</div> : null;
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Каталог книг</h1>
            <p className={styles.subtitle}>
              Книг в обороте: {filteredBooks.length} (бумажные и электронные)
            </p>
          </div>
          {canAddBooks() && (
            <Button variant="primary" onClick={() => setAddModalOpen(true)}>
              Добавить книгу
            </Button>
          )}
        </div>
      </div>

      <Card className={styles.filters}>
        <div className={styles.filterRow}>
          <div className={styles.filterItem}>
            <Input
              placeholder="Поиск по названию или автору..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              leftIcon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              }
            />
          </div>
          <div className={styles.filterItem}>
            <Select
              options={genreOptions}
              value={filters.genreId || ''}
              onChange={(e) => setFilter('genreId', e.target.value || undefined)}
              placeholder="Жанр"
            />
          </div>
          <div className={styles.filterItem}>
            <Select
              options={filterFormatOptions}
              value={filters.format || ''}
              onChange={(e) => setFilter('format', e.target.value || undefined)}
              placeholder="Формат"
            />
          </div>
          <div className={styles.filterItem}>
            <Select
              options={statusOptions}
              value={filters.status || ''}
              onChange={(e) => setFilter('status', e.target.value || undefined)}
              placeholder="Статус"
            />
          </div>
        </div>
      </Card>

      {booksLoading ? (
        <Card><p className={styles.empty}>Загрузка...</p></Card>
      ) : filteredBooks.length === 0 ? (
        <Card><p className={styles.empty}>Книги не найдены</p></Card>
      ) : (
        <div className={styles.grid}>
          {filteredBooks.map(book => {
            const genre = getGenreById(book.genreId);
            const owner = book.ownerId ? getUserById(book.ownerId) : undefined;
            return (
              <Card key={book.id} className={styles.bookCard}>
                <div className={styles.bookTop}>
                  <h3 className={styles.bookTitle}>{book.title}</h3>
                  <Badge variant={getBookStatusColor(book)} size="sm">
                    {getBookStatusLabel(book)}
                  </Badge>
                </div>
                <p className={styles.bookAuthor}>{book.author}</p>
                <div className={styles.bookMeta}>
                  {genre && <Badge variant="default" size="sm">{genre.name}</Badge>}
                  <Badge variant={BOOK_FORMAT_COLORS[book.format]} size="sm">
                    {BOOK_FORMAT_LABELS[book.format]}
                  </Badge>
                  <Badge variant="info" size="sm">{BOOK_CONDITION_LABELS[book.condition]}</Badge>
                </div>
                {book.format === 'paper' && owner && (
                  <p className={styles.owner}>
                    Владелец: {owner.firstName} {owner.lastName}
                  </p>
                )}
                {book.description && <p className={styles.bookDesc}>{book.description}</p>}
                <div className={styles.bookFooter}>{renderAction(book)}</div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Добавить книгу в оборот"
        footer={
          <div className={styles.modalFooter}>
            <Button variant="ghost" onClick={() => setAddModalOpen(false)}>Отмена</Button>
            <Button variant="primary" onClick={handleAddBook}>Добавить</Button>
          </div>
        }
      >
        <div className={styles.form}>
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
            options={formGenreOptions}
            value={bookForm.genreId}
            onChange={(e) => setBookForm({ ...bookForm, genreId: e.target.value })}
          />
          <Select
            label="Формат *"
            options={formatOptions}
            value={bookForm.format}
            onChange={(e) => setBookForm({ ...bookForm, format: e.target.value as BookFormat })}
            placeholder=""
          />
          {bookForm.format === 'paper' && (
            <Select
              label="Состояние"
              options={conditionOptions}
              value={bookForm.condition}
              onChange={(e) => setBookForm({ ...bookForm, condition: e.target.value as BookCondition })}
              placeholder=""
            />
          )}
          {bookForm.format === 'electronic' && (
            <div className={styles.fileField}>
              <label className={styles.fileLabel}>
                Файл книги (PDF, EPUB, FB2) *
              </label>
              <input
                type="file"
                accept=".pdf,.epub,.fb2,.mobi,.txt"
                onChange={(e) => setEbookFile(e.target.files?.[0] || null)}
              />
              <span className={styles.fileHint}>
                Файл сохраняется в базе данных. Максимальный размер: {EBOOK_MAX_SIZE_LABEL}
              </span>
              {ebookFile && <span className={styles.fileName}>{ebookFile.name}</span>}
            </div>
          )}
          <Input
            label="Описание"
            value={bookForm.description}
            onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
});
