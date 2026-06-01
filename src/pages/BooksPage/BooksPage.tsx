import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { dataStore, authStore, uiStore } from '@/store';
import {
  BOOK_CONDITION_LABELS,
  BOOK_STATUS_LABELS,
  BOOK_STATUS_COLORS,
} from '@/types';
import type { Book } from '@/types';
import { Card, Select, Input, Button, Badge } from '@/components/UI';
import styles from './BooksPage.module.scss';

export const BooksPage = observer(() => {
  const {
    filteredBooks,
    activeGenres,
    loadBooks,
    loadGenres,
    loadMembers,
    loadRequests,
    booksLoading,
    filters,
    setFilter,
    getGenreById,
    getMemberById,
    hasPendingRequest,
    requestBook,
    requestReturn,
  } = dataStore;

  const { isMember, isAdmin, currentMemberId } = authStore;
  const [searchValue, setSearchValue] = useState(filters.search || '');

  useEffect(() => {
    loadBooks();
    loadGenres();
    loadMembers();
    loadRequests();
  }, [loadBooks, loadGenres, loadMembers, loadRequests]);

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

  const statusOptions = [
    { value: '', label: 'Любой статус' },
    ...Object.entries(BOOK_STATUS_LABELS).map(([value, label]) => ({ value, label })),
  ];

  const handleTake = async (book: Book) => {
    const ok = await requestBook(book.id);
    if (ok) {
      uiStore.showSuccess('Заявка на книгу отправлена администратору');
    } else {
      uiStore.showError('Не удалось оформить заявку');
    }
  };

  const handleReturn = async (book: Book) => {
    const ok = await requestReturn(book.id);
    if (ok) {
      uiStore.showSuccess('Заявка на возврат отправлена');
    } else {
      uiStore.showError('Не удалось оформить возврат');
    }
  };

  const renderAction = (book: Book) => {
    if (isAdmin) {
      if (book.holderId) {
        const holder = getMemberById(book.holderId);
        return (
          <span className={styles.holder}>
            У читателя: {holder ? `${holder.lastName} ${holder.firstName}` : '—'}
          </span>
        );
      }
      return null;
    }

    if (!isMember) {
      return <span className={styles.hint}>Войдите по читательскому билету, чтобы взять книгу</span>;
    }

    const isMine = book.holderId === currentMemberId;

    if (book.status === 'available') {
      const pending = currentMemberId ? hasPendingRequest(book.id, currentMemberId, 'take') : false;
      return (
        <Button variant="primary" size="sm" disabled={pending} onClick={() => handleTake(book)}>
          {pending ? 'Заявка отправлена' : 'Взять себе'}
        </Button>
      );
    }

    if (book.status === 'taken' && isMine) {
      const pending = currentMemberId ? hasPendingRequest(book.id, currentMemberId, 'return') : false;
      return (
        <Button variant="secondary" size="sm" disabled={pending} onClick={() => handleReturn(book)}>
          {pending ? 'Возврат на рассмотрении' : 'Вернуть книгу'}
        </Button>
      );
    }

    if (book.status === 'reserved' && currentMemberId && hasPendingRequest(book.id, currentMemberId, 'take')) {
      return <span className={styles.hint}>Ваша заявка на рассмотрении</span>;
    }

    return null;
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Каталог книг</h1>
        <p className={styles.subtitle}>
          Книг в обороте: {filteredBooks.length}
        </p>
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
            return (
              <Card key={book.id} className={styles.bookCard}>
                <div className={styles.bookTop}>
                  <h3 className={styles.bookTitle}>{book.title}</h3>
                  <Badge variant={BOOK_STATUS_COLORS[book.status]} size="sm">
                    {BOOK_STATUS_LABELS[book.status]}
                  </Badge>
                </div>
                <p className={styles.bookAuthor}>{book.author}</p>
                <div className={styles.bookMeta}>
                  {genre && <Badge variant="default" size="sm">{genre.name}</Badge>}
                  <Badge variant="info" size="sm">{BOOK_CONDITION_LABELS[book.condition]}</Badge>
                </div>
                {book.description && <p className={styles.bookDesc}>{book.description}</p>}
                <div className={styles.bookFooter}>{renderAction(book)}</div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
});
