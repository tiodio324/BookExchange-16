import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { authStore } from '@/store';
import { Modal, Button, Input } from '@/components/UI';
import styles from './LoginModal.module.scss';

export const LoginModal = observer(() => {
  const {
    loginModalOpen,
    closeLoginModal,
    authMode,
    setAuthMode,
    login,
    register,
    loginError,
    isLoading,
    clearError,
  } = authStore;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'register') {
      const ok = await register(email, password, firstName, lastName);
      if (ok) resetForm();
    } else {
      const ok = await login(email, password);
      if (ok) resetForm();
    }
  };

  const switchMode = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    clearError();
  };

  const handleClose = () => {
    closeLoginModal();
    resetForm();
    setAuthMode('login');
  };

  const isRegister = authMode === 'register';
  const canSubmit = isRegister
    ? email && password && firstName && lastName
    : email && password;

  return (
    <Modal
      isOpen={loginModalOpen}
      onClose={handleClose}
      title={isRegister ? 'Регистрация' : 'Вход'}
      size="sm"
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.roleSelector}>
          <button
            type="button"
            className={`${styles.roleButton} ${authMode === 'login' ? styles.active : ''}`}
            onClick={() => switchMode('login')}
          >
            Вход
          </button>
          <button
            type="button"
            className={`${styles.roleButton} ${authMode === 'register' ? styles.active : ''}`}
            onClick={() => switchMode('register')}
          >
            Регистрация
          </button>
        </div>

        {isRegister && (
          <>
            <Input
              label="Имя *"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoFocus
            />
            <Input
              label="Фамилия *"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </>
        )}

        <Input
          type="email"
          label="Email *"
          placeholder="example@mail.ru"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={loginError || undefined}
          autoFocus={!isRegister}
        />

        <Input
          type="password"
          label="Пароль *"
          placeholder="Минимум 6 символов"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint={isRegister ? 'Пароль должен содержать минимум 6 символов' : undefined}
        />

        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={isLoading}
          disabled={!canSubmit}
        >
          {isRegister ? 'Зарегистрироваться' : 'Войти'}
        </Button>
      </form>
    </Modal>
  );
});
