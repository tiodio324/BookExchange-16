import { makeAutoObservable, runInAction } from 'mobx';
import { v4 as uuidv4 } from 'uuid';
import {
  Genre,
  GenreFormData,
  UserProfile,
  Book,
  BookFormData,
  BookRequest,
  FilterParams,
  isProtectedAdminUser,
} from '@/types';
import FirebaseService from '@/firebase';
import { authStore } from './AuthStore';
import { fileToDataUrl } from '@/utils/file';

const normalizeRequest = (raw: BookRequest & { memberId?: string }): BookRequest => ({
  ...raw,
  userId: raw.userId || raw.memberId || '',
});

export class DataStore {
  genres: Genre[] = [];
  users: UserProfile[] = [];
  books: Book[] = [];
  requests: BookRequest[] = [];

  genresLoading = false;
  usersLoading = false;
  booksLoading = false;
  requestsLoading = false;

  error: string | null = null;
  filters: FilterParams = {};

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get activeGenres(): Genre[] {
    return this.genres
      .filter(g => g.isActive)
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }

  get activeUsers(): UserProfile[] {
    return this.users
      .filter(u => u.isActive)
      .sort((a, b) => a.lastName.localeCompare(b.lastName, 'ru'));
  }

  /** @deprecated используйте activeUsers */
  get activeMembers(): UserProfile[] {
    return this.activeUsers;
  }

  get activeBooks(): Book[] {
    return this.books.filter(b => b.isActive);
  }

  get availableBooks(): Book[] {
    return this.activeBooks.filter(b => b.status === 'available');
  }

  get filteredBooks(): Book[] {
    let result = this.activeBooks;

    if (this.filters.genreId) {
      result = result.filter(b => b.genreId === this.filters.genreId);
    }

    if (this.filters.status) {
      result = result.filter(b => b.status === this.filters.status);
    }

    if (this.filters.format) {
      result = result.filter(b => b.format === this.filters.format);
    }

    if (this.filters.search) {
      const searchWords = this.filters.search
        .toLowerCase()
        .trim()
        .split(/\s+/)
        .filter(word => word.length > 0);

      if (searchWords.length > 0) {
        result = result.filter(b => {
          const haystack = `${b.title} ${b.author}`.toLowerCase();
          return searchWords.every(word => haystack.includes(word));
        });
      }
    }

    return result.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
  }

  get myBooks(): Book[] {
    const userId = authStore.currentUserId;
    if (!userId) return [];
    return this.activeBooks.filter(
      b => b.format === 'paper' && b.ownerId === userId && b.status === 'taken',
    );
  }

  get booksOnHandCount(): number {
    return this.activeBooks.filter(b => b.format === 'paper' && b.status === 'taken').length;
  }

  getPendingTakeRequest = (bookId: string): BookRequest | undefined => {
    return this.requests.find(
      r => r.bookId === bookId && r.type === 'take' && r.status === 'pending',
    );
  };

  get visibleRequests(): BookRequest[] {
    const sorted = [...this.requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (authStore.isAdmin) {
      return sorted;
    }
    const userId = authStore.currentUserId;
    if (!userId) return [];
    return sorted.filter(r => {
      if (r.userId === userId) return true;
      if (r.status === 'pending' && r.type === 'take') {
        const book = this.getBookById(r.bookId);
        return book?.ownerId === userId;
      }
      return false;
    });
  }

  getGenreById = (id: string): Genre | undefined => {
    return this.genres.find(g => g.id === id);
  };

  getUserById = (id: string): UserProfile | undefined => {
    return this.users.find(u => u.id === id);
  };

  /** @deprecated используйте getUserById */
  getMemberById = (id: string): UserProfile | undefined => {
    return this.getUserById(id);
  };

  getBookById = (id: string): Book | undefined => {
    return this.books.find(b => b.id === id);
  };

  loadAllData = async (): Promise<void> => {
    await Promise.all([
      this.loadGenres(),
      this.loadUsers(),
      this.loadBooks(),
      this.loadRequests(),
    ]);
  };

  /** @deprecated используйте loadUsers */
  loadMembers = async (): Promise<void> => {
    await this.loadUsers();
  };

  loadGenres = async (): Promise<void> => {
    this.genresLoading = true;
    try {
      const data = await FirebaseService.getData<Record<string, Genre>>('genres');
      runInAction(() => {
        this.genres = data ? Object.values(data) : [];
        this.genresLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = 'Ошибка загрузки жанров';
        this.genresLoading = false;
        console.error('Load genres error:', error);
      });
    }
  };

  loadUsers = async (): Promise<void> => {
    this.usersLoading = true;
    try {
      const data = await FirebaseService.getData<Record<string, UserProfile>>('users');
      runInAction(() => {
        this.users = data ? Object.values(data) : [];
        this.usersLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = 'Ошибка загрузки пользователей';
        this.usersLoading = false;
        console.error('Load users error:', error);
      });
    }
  };

  loadBooks = async (): Promise<void> => {
    this.booksLoading = true;
    this.error = null;
    try {
      const data = await FirebaseService.getData<Record<string, Book>>('books');
      runInAction(() => {
        this.books = data
          ? Object.values(data).map(b => {
              const format = b.format || 'paper';
              let ownerId = b.ownerId || '';
              const status = b.status;
              let holderId: string | null = null;

              if (format === 'electronic') {
                return {
                  ...b,
                  format,
                  ownerId: ownerId || b.holderId || '',
                  status: 'available' as const,
                  holderId: null,
                };
              }

              // Миграция старой модели: держатель становится владельцем
              if (status === 'taken' && b.holderId) {
                ownerId = b.holderId;
                holderId = null;
              } else if (!ownerId && b.holderId) {
                ownerId = b.holderId;
              }

              return {
                ...b,
                format,
                ownerId,
                holderId,
                status,
              };
            })
          : [];
        this.booksLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = 'Ошибка загрузки книг';
        this.booksLoading = false;
        console.error('Load books error:', error);
      });
    }
  };

  loadRequests = async (): Promise<void> => {
    this.requestsLoading = true;
    try {
      const data = await FirebaseService.getData<Record<string, BookRequest & { memberId?: string }>>('requests');
      runInAction(() => {
        this.requests = data ? Object.values(data).map(normalizeRequest) : [];
        this.requestsLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = 'Ошибка загрузки журнала';
        this.requestsLoading = false;
        console.error('Load requests error:', error);
      });
    }
  };

  createGenre = async (data: GenreFormData): Promise<Genre | null> => {
    if (!authStore.canManageGenres()) return null;

    const now = new Date().toISOString();
    const genre: Genre = {
      id: uuidv4(),
      name: data.name,
      description: data.description || '',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await FirebaseService.setData(`genres/${genre.id}`, genre);
      runInAction(() => {
        this.genres.push(genre);
      });
      return genre;
    } catch (error) {
      console.error('Create genre error:', error);
      return null;
    }
  };

  updateGenre = async (id: string, data: Partial<GenreFormData>): Promise<boolean> => {
    if (!authStore.canManageGenres()) return false;

    const index = this.genres.findIndex(g => g.id === id);
    if (index === -1) return false;

    const updated: Genre = {
      ...this.genres[index],
      ...data,
      description: data.description !== undefined ? (data.description || '') : (this.genres[index].description || ''),
      updatedAt: new Date().toISOString(),
    };

    try {
      await FirebaseService.setData(`genres/${id}`, updated);
      runInAction(() => {
        this.genres[index] = updated;
      });
      return true;
    } catch (error) {
      console.error('Update genre error:', error);
      return false;
    }
  };

  deleteGenre = async (id: string): Promise<boolean> => {
    if (!authStore.canManageGenres()) return false;

    const index = this.genres.findIndex(g => g.id === id);
    if (index === -1) return false;

    try {
      await FirebaseService.updateData(`genres/${id}`, { isActive: false });
      runInAction(() => {
        this.genres[index].isActive = false;
      });
      return true;
    } catch (error) {
      console.error('Delete genre error:', error);
      return false;
    }
  };

  deactivateUser = async (id: string): Promise<boolean> => {
    if (!authStore.canManageMembers()) return false;

    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return false;
    if (isProtectedAdminUser(this.users[index])) return false;

    try {
      await FirebaseService.updateData(`users/${id}`, {
        isActive: false,
        updatedAt: new Date().toISOString(),
      });
      runInAction(() => {
        this.users[index].isActive = false;
      });
      return true;
    } catch (error) {
      console.error('Deactivate user error:', error);
      return false;
    }
  };

  createBook = async (data: BookFormData, file?: File): Promise<Book | null> => {
    if (!authStore.canAddBooks()) return null;
    const userId = authStore.currentUserId;
    if (!userId) return null;

    if (data.format === 'electronic' && !file) {
      return null;
    }

    const now = new Date().toISOString();
    const bookId = uuidv4();
    let electronicData: string | undefined;
    let electronicFileName: string | undefined;

    if (data.format === 'electronic' && file) {
      try {
        electronicData = await fileToDataUrl(file);
        electronicFileName = file.name;
      } catch (error) {
        if ((error as Error).message === 'FILE_TOO_LARGE') {
          console.error('Ebook file too large');
        } else {
          console.error('Read ebook file error:', error);
        }
        return null;
      }
    }

    const book: Book = {
      id: bookId,
      title: data.title,
      author: data.author,
      genreId: data.genreId,
      format: data.format,
      condition: data.condition,
      description: data.description || '',
      electronicData: data.format === 'electronic' ? electronicData : undefined,
      electronicFileName: data.format === 'electronic' ? electronicFileName : undefined,
      status: 'available',
      ownerId: userId,
      holderId: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const logEntry: BookRequest = {
      id: uuidv4(),
      bookId: book.id,
      userId,
      type: 'add',
      status: 'approved',
      createdAt: now,
      resolvedAt: now,
    };

    try {
      await FirebaseService.setData(`books/${book.id}`, book);
      await FirebaseService.setData(`requests/${logEntry.id}`, logEntry);
      runInAction(() => {
        this.books.push(book);
        this.requests.push(logEntry);
      });
      return book;
    } catch (error) {
      console.error('Create book error:', error);
      return null;
    }
  };

  /** Запрос на получение книги — ожидает подтверждения текущего владельца */
  requestBook = async (bookId: string): Promise<boolean> => {
    if (!authStore.canBorrow()) return false;
    const userId = authStore.currentUserId;
    if (!userId) return false;

    const bookIndex = this.books.findIndex(b => b.id === bookId);
    if (bookIndex === -1) return false;
    const book = this.books[bookIndex];
    if (book.format === 'electronic') return false;
    if (book.status !== 'available') return false;
    if (book.ownerId === userId) return false;
    if (this.getPendingTakeRequest(bookId)) return false;

    const now = new Date().toISOString();
    const logEntry: BookRequest = {
      id: uuidv4(),
      bookId,
      userId,
      type: 'take',
      status: 'pending',
      createdAt: now,
    };

    const updatedBook: Book = {
      ...book,
      status: 'reserved',
      updatedAt: now,
    };

    try {
      await FirebaseService.setData(`requests/${logEntry.id}`, logEntry);
      await FirebaseService.setData(`books/${bookId}`, updatedBook);
      runInAction(() => {
        this.requests.push(logEntry);
        this.books[bookIndex] = updatedBook;
      });
      return true;
    } catch (error) {
      console.error('Request book error:', error);
      return false;
    }
  };

  /** Владелец подтверждает передачу книги новому читателю */
  confirmTransfer = async (bookId: string): Promise<boolean> => {
    if (!authStore.isAuthenticated) return false;
    const ownerId = authStore.currentUserId;
    if (!ownerId) return false;

    const bookIndex = this.books.findIndex(b => b.id === bookId);
    if (bookIndex === -1) return false;
    const book = this.books[bookIndex];
    if (book.format === 'electronic') return false;
    if (book.ownerId !== ownerId) return false;
    if (book.status !== 'reserved') return false;

    const pendingRequest = this.getPendingTakeRequest(bookId);
    if (!pendingRequest) return false;

    const requestIndex = this.requests.findIndex(r => r.id === pendingRequest.id);
    if (requestIndex === -1) return false;

    const now = new Date().toISOString();
    const updatedRequest: BookRequest = {
      ...pendingRequest,
      status: 'approved',
      resolvedAt: now,
      resolvedBy: ownerId,
    };

    const updatedBook: Book = {
      ...book,
      ownerId: pendingRequest.userId,
      status: 'taken',
      holderId: null,
      updatedAt: now,
    };

    try {
      await FirebaseService.setData(`requests/${pendingRequest.id}`, updatedRequest);
      await FirebaseService.setData(`books/${bookId}`, updatedBook);
      runInAction(() => {
        this.requests[requestIndex] = updatedRequest;
        this.books[bookIndex] = updatedBook;
      });
      return true;
    } catch (error) {
      console.error('Confirm transfer error:', error);
      return false;
    }
  };

  /** Владелец отклоняет запрос на передачу */
  rejectTransfer = async (bookId: string): Promise<boolean> => {
    if (!authStore.isAuthenticated) return false;
    const ownerId = authStore.currentUserId;
    if (!ownerId) return false;

    const bookIndex = this.books.findIndex(b => b.id === bookId);
    if (bookIndex === -1) return false;
    const book = this.books[bookIndex];
    if (book.ownerId !== ownerId) return false;
    if (book.status !== 'reserved') return false;

    const pendingRequest = this.getPendingTakeRequest(bookId);
    if (!pendingRequest) return false;

    const requestIndex = this.requests.findIndex(r => r.id === pendingRequest.id);
    if (requestIndex === -1) return false;

    const now = new Date().toISOString();
    const updatedRequest: BookRequest = {
      ...pendingRequest,
      status: 'rejected',
      resolvedAt: now,
      resolvedBy: ownerId,
    };

    const updatedBook: Book = {
      ...book,
      status: 'available',
      updatedAt: now,
    };

    try {
      await FirebaseService.setData(`requests/${pendingRequest.id}`, updatedRequest);
      await FirebaseService.setData(`books/${bookId}`, updatedBook);
      runInAction(() => {
        this.requests[requestIndex] = updatedRequest;
        this.books[bookIndex] = updatedBook;
      });
      return true;
    } catch (error) {
      console.error('Reject transfer error:', error);
      return false;
    }
  };

  /** Владелец отдаёт книгу обратно в свободный обмен */
  releaseBook = async (bookId: string): Promise<boolean> => {
    if (!authStore.canReturn()) return false;
    const userId = authStore.currentUserId;
    if (!userId) return false;

    const bookIndex = this.books.findIndex(b => b.id === bookId);
    if (bookIndex === -1) return false;
    const book = this.books[bookIndex];
    if (book.format === 'electronic') return false;
    if (book.status !== 'taken' || book.ownerId !== userId) return false;

    const now = new Date().toISOString();
    const logEntry: BookRequest = {
      id: uuidv4(),
      bookId,
      userId,
      type: 'return',
      status: 'approved',
      createdAt: now,
      resolvedAt: now,
    };

    const updatedBook: Book = {
      ...book,
      status: 'available',
      updatedAt: now,
    };

    try {
      await FirebaseService.setData(`requests/${logEntry.id}`, logEntry);
      await FirebaseService.setData(`books/${bookId}`, updatedBook);
      runInAction(() => {
        this.requests.push(logEntry);
        this.books[bookIndex] = updatedBook;
      });
      return true;
    } catch (error) {
      console.error('Release book error:', error);
      return false;
    }
  };

  /** @deprecated используйте releaseBook */
  requestReturn = async (bookId: string): Promise<boolean> => {
    return this.releaseBook(bookId);
  };

  /** Скачивание электронной книги — только запись в журнал, книга остаётся доступной всем */
  logElectronicDownload = async (bookId: string): Promise<boolean> => {
    if (!authStore.canBorrow()) return false;
    const userId = authStore.currentUserId;
    if (!userId) return false;

    const book = this.books.find(b => b.id === bookId);
    if (!book || book.format !== 'electronic' || !book.electronicData) return false;

    const now = new Date().toISOString();
    const logEntry: BookRequest = {
      id: uuidv4(),
      bookId,
      userId,
      type: 'download',
      status: 'approved',
      createdAt: now,
      resolvedAt: now,
    };

    try {
      await FirebaseService.setData(`requests/${logEntry.id}`, logEntry);
      runInAction(() => {
        this.requests.push(logEntry);
      });
      return true;
    } catch (error) {
      console.error('Log electronic download error:', error);
      return false;
    }
  };

  setFilter = (key: keyof FilterParams, value: string | undefined): void => {
    this.filters = { ...this.filters, [key]: value };
  };

  clearFilters = (): void => {
    this.filters = {};
  };

  clearError = (): void => {
    this.error = null;
  };
}

export const dataStore = new DataStore();
