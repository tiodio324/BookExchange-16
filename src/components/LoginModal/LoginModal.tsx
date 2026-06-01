import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { authStore } from '@/store';
import { Modal, Button, Input } from '@/components/UI';
import styles from './LoginModal.module.scss';

type LoginTab = 'reader' | 'admin';

export const LoginModal = observer(() => {
  const { loginModalOpen, closeLoginModal, loginAsReader, loginAsAdmin, loginError, isLoading, clearError } = authStore;
  const [tab, setTab] = useState<LoginTab>('reader');
  const [cardNumber, setCardNumber] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === 'reader') {
      const ok = await loginAsReader(cardNumber);
      if (ok) setCardNumber('');
    } else {
      const ok = await loginAsAdmin(password);
      if (ok) setPassword('');
    }
  };

  const switchTab = (next: LoginTab) => {
    setTab(next);
    clearError();
  };

  const handleClose = () => {
    closeLoginModal();
    setCardNumber('');
    setPassword('');
    setTab('reader');
  };

  return (
    <Modal
      isOpen={loginModalOpen}
      onClose={handleClose}
      title="Вход в буккроссинг"
      size="sm"
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.roleSelector}>
          <button
            type="button"
            className={`${styles.roleButton} ${tab === 'reader' ? styles.active : ''}`}
            onClick={() => switchTab('reader')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
            <span>Читатель</span>
          </button>
          <button
            type="button"
            className={`${styles.roleButton} ${tab === 'admin' ? styles.active : ''}`}
            onClick={() => switchTab('admin')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
            <span>Администратор</span>
          </button>
        </div>

        {tab === 'reader' ? (
          <Input
            label="Номер читательского билета"
            placeholder="Например: BC-001"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            error={loginError || undefined}
            hint="Билет выдаёт администратор буккроссинг-пункта"
            autoFocus
          />
        ) : (
          <Input
            type="password"
            label="Пароль администратора"
            placeholder="Введите пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={loginError || undefined}
            autoFocus
          />
        )}

        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={isLoading}
          disabled={tab === 'reader' ? !cardNumber : !password}
        >
          Войти
        </Button>
      </form>
    </Modal>
  );
});
