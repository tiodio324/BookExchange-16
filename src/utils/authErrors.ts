export const getFirebaseAuthErrorMessage = (code: string): string => {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Этот email уже зарегистрирован';
    case 'auth/invalid-email':
      return 'Некорректный email';
    case 'auth/weak-password':
      return 'Пароль должен содержать минимум 6 символов';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Неверный email или пароль';
    case 'auth/too-many-requests':
      return 'Слишком много попыток. Попробуйте позже';
    default:
      return 'Ошибка авторизации';
  }
};
