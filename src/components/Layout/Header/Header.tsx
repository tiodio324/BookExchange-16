import { observer } from 'mobx-react-lite';
import { authStore, navigationStore } from '@/store';
import { Button } from '@/components/UI';
import styles from './Header.module.scss';

export const Header = observer(() => {
  const { isAuthenticated, currentRole, profile, logout, openLoginModal } = authStore;
  const { pageTitle, toggleMobileMenu, mobileMenuOpen, navigate } = navigationStore;

  const getRoleName = (role: string): string => {
    switch (role) {
      case 'admin': return 'Администратор';
      case 'member':
        if (profile) {
          return `${profile.firstName} ${profile.lastName}`.trim();
        }
        return 'Пользователь';
      default: return 'Гость';
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button 
          className={styles.menuButton}
          onClick={toggleMobileMenu}
          aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileMenuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <>
                <path d="M3 12h18M3 6h18M3 18h18" />
              </>
            )}
          </svg>
        </button>
        <div
          className={styles.logo}
          onClick={() => navigate('home')}
          aria-label="Перейти на главную страницу"
        >
          <svg className={styles.logoIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
          </svg>
          <span className={styles.logoText}>Буккроссинг</span>
        </div>
      </div>

      <h1 className={styles.title}>{pageTitle}</h1>

      <div className={styles.right}>
        {isAuthenticated ? (
          <div className={styles.userInfo}>
            <span className={styles.role}>{getRoleName(currentRole)}</span>
            <Button variant="ghost" size="sm" onClick={() => logout()} className={styles.headerButton}>
              Выйти
            </Button>
          </div>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => openLoginModal()} className={styles.headerButton}>
            Войти
          </Button>
        )}
      </div>
    </header>
  );
});
