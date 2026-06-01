import { makeAutoObservable, runInAction } from 'mobx';
import { v4 as uuidv4 } from 'uuid';
import {
  Genre,
  GenreFormData,
  Member,
  MemberFormData,
  Book,
  BookFormData,
  BookRequest,
  RequestType,
  FilterParams,
} from '@/types';
import FirebaseService from '@/firebase';
import { authStore } from './AuthStore';

export class DataStore {
  // Коллекции данных
  genres: Genre[] = [];
  members: Member[] = [];
  books: Book[] = [];
  requests: BookRequest[] = [];

  // Состояния загрузки
  genresLoading = false;
  membersLoading = false;
  booksLoading = false;
  requestsLoading = false;

  // Ошибка
  error: string | null = null;

  // Фильтры каталога книг
  filters: FilterParams = {};

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  // ============================================
  // Computed
  // ============================================

  get activeGenres(): Genre[] {
    return this.genres
      .filter(g => g.isActive)
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }

  get activeMembers(): Member[] {
    return this.members
      .filter(m => m.isActive)
      .sort((a, b) => a.lastName.localeCompare(b.lastName, 'ru'));
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

  // Книги, которые сейчас на руках у текущего читателя
  get myBooks(): Book[] {
    const memberId = authStore.currentMemberId;
    if (!memberId) return [];
    return this.activeBooks.filter(b => b.holderId === memberId);
  }

  // Заявки, видимые текущему пользователю
  get visibleRequests(): BookRequest[] {
    const sorted = [...this.requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (authStore.isAdmin) {
      return sorted;
    }
    const memberId = authStore.currentMemberId;
    if (!memberId) return [];
    return sorted.filter(r => r.memberId === memberId);
  }

  get pendingRequests(): BookRequest[] {
    return this.requests
      .filter(r => r.status === 'pending')
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  getGenreById = (id: string): Genre | undefined => {
    return this.genres.find(g => g.id === id);
  };

  getMemberById = (id: string): Member | undefined => {
    return this.members.find(m => m.id === id);
  };

  getBookById = (id: string): Book | undefined => {
    return this.books.find(b => b.id === id);
  };

  // Есть ли у читателя активная заявка на эту книгу
  hasPendingRequest = (bookId: string, memberId: string, type?: RequestType): boolean => {
    return this.requests.some(r =>
      r.bookId === bookId &&
      r.memberId === memberId &&
      r.status === 'pending' &&
      (type ? r.type === type : true)
    );
  };

  // ============================================
  // Загрузка данных
  // ============================================

  loadAllData = async (): Promise<void> => {
    await Promise.all([
      this.loadGenres(),
      this.loadMembers(),
      this.loadBooks(),
      this.loadRequests(),
    ]);
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

  loadMembers = async (): Promise<void> => {
    this.membersLoading = true;
    try {
      const data = await FirebaseService.getData<Record<string, Member>>('members');
      runInAction(() => {
        this.members = data ? Object.values(data) : [];
        this.membersLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = 'Ошибка загрузки читателей';
        this.membersLoading = false;
        console.error('Load members error:', error);
      });
    }
  };

  loadBooks = async (): Promise<void> => {
    this.booksLoading = true;
    this.error = null;
    try {
      const data = await FirebaseService.getData<Record<string, Book>>('books');
      runInAction(() => {
        this.books = data ? Object.values(data) : [];
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
      const data = await FirebaseService.getData<Record<string, BookRequest>>('requests');
      runInAction(() => {
        this.requests = data ? Object.values(data) : [];
        this.requestsLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = 'Ошибка загрузки заявок';
        this.requestsLoading = false;
        console.error('Load requests error:', error);
      });
    }
  };

  // ============================================
  // CRUD: Жанры (только администратор)
  // ============================================

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

  // ============================================
  // CRUD: Читатели (только администратор)
  // ============================================

  isCardNumberTaken = (cardNumber: string, excludeId?: string): boolean => {
    const card = cardNumber.trim().toLowerCase();
    return this.members.some(m =>
      m.id !== excludeId &&
      m.cardNumber.trim().toLowerCase() === card
    );
  };

  createMember = async (data: MemberFormData): Promise<Member | null> => {
    if (!authStore.canManageMembers()) return null;
    if (this.isCardNumberTaken(data.cardNumber)) return null;

    const now = new Date().toISOString();
    const member: Member = {
      id: uuidv4(),
      cardNumber: data.cardNumber.trim(),
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || '',
      phone: data.phone || '',
      joinedDate: data.joinedDate || now.split('T')[0],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await FirebaseService.setData(`members/${member.id}`, member);
      runInAction(() => {
        this.members.push(member);
      });
      return member;
    } catch (error) {
      console.error('Create member error:', error);
      return null;
    }
  };

  updateMember = async (id: string, data: Partial<MemberFormData>): Promise<boolean> => {
    if (!authStore.canManageMembers()) return false;

    const index = this.members.findIndex(m => m.id === id);
    if (index === -1) return false;
    if (data.cardNumber !== undefined && this.isCardNumberTaken(data.cardNumber, id)) return false;

    const current = this.members[index];
    const updated: Member = {
      ...current,
      ...data,
      cardNumber: data.cardNumber !== undefined ? data.cardNumber.trim() : current.cardNumber,
      email: data.email !== undefined ? (data.email || '') : (current.email || ''),
      phone: data.phone !== undefined ? (data.phone || '') : (current.phone || ''),
      updatedAt: new Date().toISOString(),
    };

    try {
      await FirebaseService.setData(`members/${id}`, updated);
      runInAction(() => {
        this.members[index] = updated;
      });
      return true;
    } catch (error) {
      console.error('Update member error:', error);
      return false;
    }
  };

  deleteMember = async (id: string): Promise<boolean> => {
    if (!authStore.canManageMembers()) return false;

    const index = this.members.findIndex(m => m.id === id);
    if (index === -1) return false;

    try {
      await FirebaseService.updateData(`members/${id}`, { isActive: false });
      runInAction(() => {
        this.members[index].isActive = false;
      });
      return true;
    } catch (error) {
      console.error('Delete member error:', error);
      return false;
    }
  };

  // ============================================
  // CRUD: Книги (только администратор)
  // ============================================

  createBook = async (data: BookFormData): Promise<Book | null> => {
    if (!authStore.canManageBooks()) return null;

    const now = new Date().toISOString();
    const book: Book = {
      id: uuidv4(),
      title: data.title,
      author: data.author,
      genreId: data.genreId,
      condition: data.condition,
      description: data.description || '',
      status: 'available',
      holderId: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await FirebaseService.setData(`books/${book.id}`, book);
      runInAction(() => {
        this.books.push(book);
      });
      return book;
    } catch (error) {
      console.error('Create book error:', error);
      return null;
    }
  };

  updateBook = async (id: string, data: Partial<BookFormData>): Promise<boolean> => {
    if (!authStore.canManageBooks()) return false;

    const index = this.books.findIndex(b => b.id === id);
    if (index === -1) return false;

    const current = this.books[index];
    const updated: Book = {
      ...current,
      ...data,
      description: data.description !== undefined ? (data.description || '') : (current.description || ''),
      updatedAt: new Date().toISOString(),
    };

    try {
      await FirebaseService.setData(`books/${id}`, updated);
      runInAction(() => {
        this.books[index] = updated;
      });
      return true;
    } catch (error) {
      console.error('Update book error:', error);
      return false;
    }
  };

  deleteBook = async (id: string): Promise<boolean> => {
    if (!authStore.canManageBooks()) return false;

    const index = this.books.findIndex(b => b.id === id);
    if (index === -1) return false;

    try {
      await FirebaseService.updateData(`books/${id}`, { isActive: false });
      runInAction(() => {
        this.books[index].isActive = false;
      });
      return true;
    } catch (error) {
      console.error('Delete book error:', error);
      return false;
    }
  };

  // ============================================
  // Бизнес-операции буккроссинга (state machine)
  // ============================================

  // Читатель оформляет заявку «Взять себе» на свободную книгу
  requestBook = async (bookId: string): Promise<boolean> => {
    if (!authStore.canBorrow()) return false;
    const memberId = authStore.currentMemberId;
    if (!memberId) return false;

    const bookIndex = this.books.findIndex(b => b.id === bookId);
    if (bookIndex === -1) return false;
    const book = this.books[bookIndex];
    if (book.status !== 'available') return false;
    if (this.hasPendingRequest(bookId, memberId)) return false;

    const now = new Date().toISOString();
    const request: BookRequest = {
      id: uuidv4(),
      bookId,
      memberId,
      type: 'take',
      status: 'pending',
      createdAt: now,
    };

    try {
      await FirebaseService.setData(`requests/${request.id}`, request);
      await FirebaseService.updateData(`books/${bookId}`, { status: 'reserved', updatedAt: now });
      runInAction(() => {
        this.requests.push(request);
        this.books[bookIndex] = { ...book, status: 'reserved', updatedAt: now };
      });
      return true;
    } catch (error) {
      console.error('Request book error:', error);
      return false;
    }
  };

  // Читатель оформляет заявку на возврат книги, которая у него на руках
  requestReturn = async (bookId: string): Promise<boolean> => {
    if (!authStore.canReturn()) return false;
    const memberId = authStore.currentMemberId;
    if (!memberId) return false;

    const bookIndex = this.books.findIndex(b => b.id === bookId);
    if (bookIndex === -1) return false;
    const book = this.books[bookIndex];
    if (book.status !== 'taken' || book.holderId !== memberId) return false;
    if (this.hasPendingRequest(bookId, memberId, 'return')) return false;

    const now = new Date().toISOString();
    const request: BookRequest = {
      id: uuidv4(),
      bookId,
      memberId,
      type: 'return',
      status: 'pending',
      createdAt: now,
    };

    try {
      await FirebaseService.setData(`requests/${request.id}`, request);
      runInAction(() => {
        this.requests.push(request);
      });
      return true;
    } catch (error) {
      console.error('Request return error:', error);
      return false;
    }
  };

  // Администратор одобряет заявку
  approveRequest = async (requestId: string): Promise<boolean> => {
    if (!authStore.canManageRequests()) return false;

    const reqIndex = this.requests.findIndex(r => r.id === requestId);
    if (reqIndex === -1) return false;
    const request = this.requests[reqIndex];
    if (request.status !== 'pending') return false;

    const bookIndex = this.books.findIndex(b => b.id === request.bookId);
    if (bookIndex === -1) return false;
    const book = this.books[bookIndex];

    const now = new Date().toISOString();
    const resolvedRequest: BookRequest = {
      ...request,
      status: 'approved',
      resolvedAt: now,
      resolvedBy: authStore.currentRole,
    };

    const updatedBook: Book =
      request.type === 'take'
        ? { ...book, status: 'taken', holderId: request.memberId, updatedAt: now }
        : { ...book, status: 'available', holderId: null, updatedAt: now };

    try {
      await FirebaseService.setData(`requests/${requestId}`, resolvedRequest);
      await FirebaseService.setData(`books/${book.id}`, updatedBook);
      runInAction(() => {
        this.requests[reqIndex] = resolvedRequest;
        this.books[bookIndex] = updatedBook;
      });
      return true;
    } catch (error) {
      console.error('Approve request error:', error);
      return false;
    }
  };

  // Администратор отклоняет заявку
  rejectRequest = async (requestId: string): Promise<boolean> => {
    if (!authStore.canManageRequests()) return false;

    const reqIndex = this.requests.findIndex(r => r.id === requestId);
    if (reqIndex === -1) return false;
    const request = this.requests[reqIndex];
    if (request.status !== 'pending') return false;

    const now = new Date().toISOString();
    const resolvedRequest: BookRequest = {
      ...request,
      status: 'rejected',
      resolvedAt: now,
      resolvedBy: authStore.currentRole,
    };

    try {
      await FirebaseService.setData(`requests/${requestId}`, resolvedRequest);
      runInAction(() => {
        this.requests[reqIndex] = resolvedRequest;
      });

      // Отклонённая заявка на выдачу возвращает книгу в свободный оборот
      if (request.type === 'take') {
        const bookIndex = this.books.findIndex(b => b.id === request.bookId);
        if (bookIndex !== -1 && this.books[bookIndex].status === 'reserved') {
          await FirebaseService.updateData(`books/${request.bookId}`, { status: 'available', updatedAt: now });
          runInAction(() => {
            this.books[bookIndex] = { ...this.books[bookIndex], status: 'available', updatedAt: now };
          });
        }
      }
      return true;
    } catch (error) {
      console.error('Reject request error:', error);
      return false;
    }
  };

  // ============================================
  // Фильтры
  // ============================================

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

// Singleton instance
export const dataStore = new DataStore();
