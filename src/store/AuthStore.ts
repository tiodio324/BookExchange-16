import { makeAutoObservable, runInAction } from 'mobx';
import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type FirebaseUser,
} from '@/firebase';
import FirebaseService from '@/firebase';
import { User, UserRole, ROLE_PERMISSIONS, RolePermissions, UserProfile, ProfileRole } from '@/types';
import { getFirebaseAuthErrorMessage } from '@/utils/authErrors';
import { getUserFullName, ADMIN_EMAIL } from '@/types/userProfile.types';

export class AuthStore {
  private _user: User = { role: 'guest' };
  private _profile: UserProfile | null = null;

  authInitialized = false;
  loginModalOpen = false;
  authMode: 'login' | 'register' = 'login';
  loginError: string | null = null;
  isLoading = false;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    this.initAuthListener();
  }

  get user(): User {
    return this._user;
  }

  get profile(): UserProfile | null {
    return this._profile;
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

  get currentUserId(): string | null {
    return this._user.uid ?? null;
  }

  get currentEmail(): string | null {
    return this._user.email ?? null;
  }

  /** @deprecated используйте currentUserId */
  get currentMemberId(): string | null {
    return this.currentUserId;
  }

  get permissions(): RolePermissions {
    return ROLE_PERMISSIONS[this._user.role];
  }

  canViewBooks = (): boolean => this.permissions.canViewBooks;
  canViewMembers = (): boolean => this.permissions.canViewMembers;
  canViewRequests = (): boolean => this.permissions.canViewRequests;
  canUseChat = (): boolean => this.permissions.canUseChat;
  canBorrow = (): boolean => this.permissions.canBorrow;
  canReturn = (): boolean => this.permissions.canReturn;
  canAddBooks = (): boolean => this.permissions.canAddBooks;
  canManageGenres = (): boolean => this.permissions.canManageGenres;
  canManageMembers = (): boolean => this.permissions.canManageMembers;
  canAccessAdmin = (): boolean => this.permissions.canAccessAdmin;

  hasPermission = (permission: keyof RolePermissions): boolean =>
    this.permissions[permission];

  hasRole = (requiredRole: UserRole): boolean => {
    const roleHierarchy: Record<UserRole, number> = {
      guest: 0,
      member: 1,
      admin: 2,
    };
    return roleHierarchy[this._user.role] >= roleHierarchy[requiredRole];
  };

  private initAuthListener = (): void => {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await this.applyFirebaseUser(firebaseUser);
      } else {
        runInAction(() => {
          this._user = { role: 'guest' };
          this._profile = null;
          this.authInitialized = true;
        });
      }
    });
  };

  private applyFirebaseUser = async (firebaseUser: FirebaseUser): Promise<void> => {
    try {
      let profile = await FirebaseService.getSnapshot<UserProfile>(`users/${firebaseUser.uid}`);

      if (!profile) {
        profile = await this.createProfileFromFirebaseUser(firebaseUser);
      }

      if (!profile.isActive) {
        await signOut(auth);
        runInAction(() => {
          this.loginError = 'Аккаунт деактивирован администратором';
          this._user = { role: 'guest' };
          this._profile = null;
          this.authInitialized = true;
        });
        return;
      }

      const role: UserRole = profile.role === 'admin' ? 'admin' : 'member';

      runInAction(() => {
        this._profile = profile;
        this._user = {
          role,
          uid: firebaseUser.uid,
          email: profile.email,
          name: getUserFullName(profile),
        };
        this.authInitialized = true;
        this.loginError = null;
      });
    } catch (error) {
      console.error('Apply firebase user error:', error);
      runInAction(() => {
        this.authInitialized = true;
      });
    }
  };

  private createProfileFromFirebaseUser = async (firebaseUser: FirebaseUser): Promise<UserProfile> => {
    const now = new Date().toISOString();
    const displayName = firebaseUser.displayName?.trim() || '';
    const [lastName = '', firstName = ''] = displayName.includes(' ')
      ? [displayName.split(' ')[0], displayName.split(' ').slice(1).join(' ')]
      : ['', displayName];

    const email = (firebaseUser.email || '').toLowerCase();
    const role: ProfileRole = email === ADMIN_EMAIL ? 'admin' : 'member';

    const profile: UserProfile = {
      id: firebaseUser.uid,
      email,
      firstName,
      lastName,
      role,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await FirebaseService.setData(`users/${firebaseUser.uid}`, profile);
    return profile;
  };

  openLoginModal = (mode: 'login' | 'register' = 'login'): void => {
    this.loginModalOpen = true;
    this.authMode = mode;
    this.loginError = null;
  };

  closeLoginModal = (): void => {
    this.loginModalOpen = false;
    this.loginError = null;
    this.isLoading = false;
  };

  setAuthMode = (mode: 'login' | 'register'): void => {
    this.authMode = mode;
    this.loginError = null;
  };

  register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ): Promise<boolean> => {
    this.isLoading = true;
    this.loginError = null;

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      const displayName = `${lastName.trim()} ${firstName.trim()}`.trim();
      await updateProfile(credential.user, { displayName });

      const now = new Date().toISOString();
      const role: ProfileRole = normalizedEmail === ADMIN_EMAIL ? 'admin' : 'member';
      const profile: UserProfile = {
        id: credential.user.uid,
        email: normalizedEmail,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      await FirebaseService.setData(`users/${credential.user.uid}`, profile);
      this.closeLoginModal();
      return true;
    } catch (error) {
      const code = (error as { code?: string }).code || '';
      runInAction(() => {
        this.loginError = getFirebaseAuthErrorMessage(code);
      });
      return false;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  };

  login = async (email: string, password: string): Promise<boolean> => {
    this.isLoading = true;
    this.loginError = null;

    try {
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      this.closeLoginModal();
      return true;
    } catch (error) {
      const code = (error as { code?: string }).code || '';
      runInAction(() => {
        this.loginError = getFirebaseAuthErrorMessage(code);
      });
      return false;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  };

  logout = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
    runInAction(() => {
      this._user = { role: 'guest' };
      this._profile = null;
      this.loginError = null;
    });
  };

  clearError = (): void => {
    this.loginError = null;
  };
}

export const authStore = new AuthStore();
