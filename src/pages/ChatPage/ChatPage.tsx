import { useEffect, useState, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { chatStore, authStore, dataStore, navigationStore, uiStore } from '@/store';
import { Card, Button, Input } from '@/components/UI';
import { formatDateTime } from '@/utils';
import styles from './ChatPage.module.scss';

export const ChatPage = observer(() => {
  const { chatPreviews, messages, activeChatId, loadingChats, loadingMessages, sending } = chatStore;
  const { currentUserId, canUseChat, isAuthenticated } = authStore;
  const { loadUsers } = dataStore;
  const { navigate } = navigationStore;

  const [messageText, setMessageText] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentUserId && isAuthenticated) {
      chatStore.subscribeToUserChats(currentUserId);
      loadUsers();
    }
    return () => chatStore.cleanup();
  }, [currentUserId, isAuthenticated, loadUsers]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    const ok = await chatStore.sendMessage(messageText);
    if (ok) {
      setMessageText('');
    } else {
      uiStore.showError('Не удалось отправить сообщение');
    }
  };

  if (!canUseChat()) {
    return (
      <div className={styles.page}>
        <Card>
          <p className={styles.empty}>Войдите в аккаунт, чтобы пользоваться чатом</p>
          <Button variant="primary" onClick={() => authStore.openLoginModal()}>Войти</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Чат</h1>
        <p className={styles.subtitle}>Обсуждение обмена книгами с другими читателями</p>
      </div>

      <div className={styles.layout}>
        <Card className={styles.chatList} padding="none">
          <div className={styles.listHeader}>Диалоги</div>
          {loadingChats ? (
            <p className={styles.empty}>Загрузка...</p>
          ) : chatPreviews.length === 0 ? (
            <p className={styles.empty}>
              Диалогов пока нет. Начните общение из карточки книги — кнопка «Написать».
            </p>
          ) : (
            <ul className={styles.previews}>
              {chatPreviews.map(preview => (
                <li key={preview.chatId}>
                  <button
                    type="button"
                    className={`${styles.previewItem} ${activeChatId === preview.chatId ? styles.active : ''}`}
                    onClick={() => chatStore.openChat(preview.chatId)}
                  >
                    <span className={styles.previewName}>
                      {chatStore.getOtherUserName(preview.otherUserId)}
                    </span>
                    {preview.bookTitle && (
                      <span className={styles.previewBook}>Книга: {preview.bookTitle}</span>
                    )}
                    <span className={styles.previewMessage}>{preview.lastMessage || 'Нет сообщений'}</span>
                    <span className={styles.previewTime}>{formatDateTime(preview.lastMessageAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className={styles.chatWindow} padding="none">
          {!activeChatId ? (
            <div className={styles.placeholder}>
              <p>Выберите диалог или начните новый из каталога книг</p>
              <Button variant="secondary" onClick={() => navigate('books')}>Перейти в каталог</Button>
            </div>
          ) : (
            <>
              <div className={styles.messages} ref={messagesContainerRef}>
                {loadingMessages ? (
                  <p className={styles.empty}>Загрузка сообщений...</p>
                ) : messages.length === 0 ? (
                  <p className={styles.empty}>Напишите первое сообщение</p>
                ) : (
                  messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`${styles.message} ${msg.senderId === currentUserId ? styles.own : styles.other}`}
                    >
                      <div className={styles.messageText}>{msg.text}</div>
                      <span className={styles.messageTime}>{formatDateTime(msg.createdAt)}</span>
                    </div>
                  ))
                )}
              </div>
              <form className={styles.inputRow} onSubmit={handleSend}>
                <Input
                  placeholder="Введите сообщение..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                />
                <Button
                  type="submit"
                  variant="primary"
                  className={styles.sendButton}
                  loading={sending}
                  disabled={!messageText.trim()}
                  aria-label="Отправить"
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  }
                />
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
});
