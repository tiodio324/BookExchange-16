import { makeAutoObservable } from 'mobx';
import { User, UserRole, ROLE_PERMISSIONS, RolePermissions } from '@/types';
import { dataStore } from './DataStore';

// Ключи для сохранения сессии авторизации
const AUTH_STORAGE_KEY = 'bookcrossing_auth';
const SESSION_EXPIRY_KEY = 'bookcrossing_session_expiry';

// Длительность сессии (24 часа)
const SESSION_DURATION = 24 * 60 * 60 * 1000;

// Пароль администратора (единый смотритель пункта буккроссинга)
const ADMIN_PASSWORD = 'admin2026';

interface StoredAuthState {
  role: UserRole;
  memberId?: string;
  cardNumber?: string;
  expiry: number;
}

export class AuthStore {
  private _user: User = {
    role: 'guest',
  };

  loginModalOpen = false;
  loginError: string | null = null;
  isLoading = false;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    this.loadAuthState();
  }

  // Getters
  get user(): User {
    return this._user;
  }

  get isAuthenticated(): boolean {
    return this._user.role !== 'guest';
  }

  get isMember(): boolean {
    return this._user.role === 'member';
  }

  get isAdmin(): boolean {
    return this._user.role === 'admin';
  }

  get currentRole(): UserRole {
    return this._user.role;
  }

  get currentMemberId(): string | null {
    return this._user.memberId ?? null;
  }

  get currentCardNumber(): string | null {
    return this._user.cardNumber ?? null;
  }

  get permissions(): RolePermissions {
    return ROLE_PERMISSIONS[this._user.role];
  }

  // Проверки прав
  canViewBooks = (): boolean => this.permissions.canViewBooks;
  canViewMembers = (): boolean => this.permissions.canViewMembers;
  canViewRequests = (): boolean => this.permissions.canViewRequests;
  canBorrow = (): boolean => this.permissions.canBorrow;
  canReturn = (): boolean => this.permissions.canReturn;
  canManageBooks = (): boolean => this.permissions.canManageBooks;
  canManageGenres = (): boolean => this.permissions.canManageGenres;
  canManageMembers = (): boolean => this.permissions.canManageMembers;
  canManageRequests = (): boolean => this.permissions.canManageRequests;
  canAccessAdmin = (): boolean => this.permissions.canAccessAdmin;

  // Проверка минимально необходимой роли
  hasRole = (requiredRole: UserRole): boolean => {
    const roleHierarchy: Record<UserRole, number> = {
      guest: 0,
      member: 1,
      admin: 2,
    };
    // Администратор и читатель — разные ветви прав, но для навигации
    // достаточно иерархии: admin >= member >= guest.
    return roleHierarchy[this._user.role] >= roleHierarchy[requiredRole];
  };

  // Загрузка сессии из хранилища
  private loadAuthState = (): void => {
    try {
      const storedData = localStorage.getItem(AUTH_STORAGE_KEY);
      const expiryData = localStorage.getItem(SESSION_EXPIRY_KEY);

      if (storedData && expiryData) {
        const authState: StoredAuthState = JSON.parse(storedData);
        const expiry = parseInt(expiryData, 10);

        if (Date.now() < expiry && authState.role !== 'guest') {
          this._user = {
            role: authState.role,
            memberId: authState.memberId,
            cardNumber: authState.cardNumber,
          };
        } else {
          this.clearAuthStorage();
        }
      }
    } catch (error) {
      console.error('Failed to load auth state:', error);
      this.clearAuthStorage();
    }
  };

  // Сохранение сессии в хранилище
  private saveAuthState = (): void => {
    try {
      if (this._user.role !== 'guest') {
        const authState: StoredAuthState = {
          role: this._user.role,
          memberId: this._user.memberId,
          cardNumber: this._user.cardNumber,
          expiry: Date.now() + SESSION_DURATION,
        };
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
        localStorage.setItem(SESSION_EXPIRY_KEY, String(authState.expiry));
      } else {
        this.clearAuthStorage();
      }
    } catch (error) {
      console.error('Failed to save auth state:', error);
    }
  };

  private clearAuthStorage = (): void => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(SESSION_EXPIRY_KEY);
    } catch (error) {
      console.error('Failed to clear auth storage:', error);
    }
  };

  // Управление модальным окном
  openLoginModal = (): void => {
    this.loginModalOpen = true;
    this.loginError = null;
  };

  closeLoginModal = (): void => {
    this.loginModalOpen = false;
    this.loginError = null;
    this.isLoading = false;
  };

  // Вход администратора по паролю
  loginAsAdmin = async (password: string): Promise<boolean> => {
    this.isLoading = true;
    this.loginError = null;

    try {
      await new Promise(resolve => setTimeout(resolve, 400));

      if (password === ADMIN_PASSWORD) {
        this._user = { role: 'admin' };
        this.saveAuthState();
        this.closeLoginModal();
        return true;
      }

      this.loginError = 'Неверный пароль администратора';
      return false;
    } catch (error) {
      this.loginError = 'Ошибка авторизации';
      console.error('Admin login error:', error);
      return false;
    } finally {
      this.isLoading = false;
    }
  };

  // Вход читателя по номеру читательского билета (без пароля)
  loginAsReader = async (cardNumber: string): Promise<boolean> => {
    this.isLoading = true;
    this.loginError = null;

    try {
      await new Promise(resolve => setTimeout(resolve, 400));

      const card = cardNumber.trim();
      if (!card) {
        this.loginError = 'Введите номер читательского билета';
        return false;
      }

      const member = dataStore.members.find(
        m => m.isActive && m.cardNumber.toLowerCase() === card.toLowerCase()
      );

      if (!member) {
        this.loginError = 'Читательский билет не найден';
        return false;
      }

      this._user = {
        role: 'member',
        memberId: member.id,
        cardNumber: member.cardNumber,
        name: `${member.lastName} ${member.firstName}`.trim(),
      };
      this.saveAuthState();
      this.closeLoginModal();
      return true;
    } catch (error) {
      this.loginError = 'Ошибка авторизации';
      console.error('Reader login error:', error);
      return false;
    } finally {
      this.isLoading = false;
    }
  };

  // Выход
  logout = (): void => {
    this._user = { role: 'guest' };
    this.clearAuthStorage();
    this.loginError = null;
  };

  clearError = (): void => {
    this.loginError = null;
  };
}

// Singleton instance
export const authStore = new AuthStore();
