import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { dataStore, authStore, navigationStore } from '@/store';
import { Card, Button, Badge } from '@/components/UI';
import styles from './HomePage.module.scss';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'primary' | 'success' | 'warning' | 'info';
}

const renderStatCard = ({ title, value, icon, color }: StatCardProps) => (
  <Card className={`${styles.statCard} ${styles[color]}`}>
    <div className={styles.statIcon}>{icon}</div>
    <div className={styles.statContent}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statTitle}>{title}</span>
    </div>
  </Card>
);

export const HomePage = observer(() => {
  const { activeBooks, availableBooks, activeMembers, pendingRequests, loadAllData, booksLoading } = dataStore;
  const { isMember, isAdmin, isAuthenticated } = authStore;
  const { navigate } = navigationStore;

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const takenCount = activeBooks.filter(b => b.status === 'taken').length;

  return (
    <div className={styles.page}>
      <section className={styles.welcome}>
        <div className={styles.welcomeContent}>
          <h1 className={styles.welcomeTitle}>
            Буккроссинг — обмен книгами
          </h1>
          <p className={styles.welcomeText}>
            «Прочитал — отдай другому». Берите книги из общего оборота и возвращайте их,
            чтобы они продолжили путешествие к новым читателям.
            {!isAuthenticated && ' Войдите по читательскому билету, чтобы брать книги.'}
          </p>
          {!isAuthenticated && (
            <Button
              variant="primary"
              size="lg"
              onClick={() => authStore.openLoginModal()}
            >
              Войти по билету
            </Button>
          )}
        </div>
        <div className={styles.welcomeDecor}>
          <svg viewBox="0 0 200 200" fill="none">
            <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="2" opacity="0.2" />
            <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="2" opacity="0.3" />
            <circle cx="100" cy="100" r="40" stroke="currentColor" strokeWidth="2" opacity="0.4" />
            <path d="M100 30 L100 170 M30 100 L170 100" stroke="currentColor" strokeWidth="1" opacity="0.2" />
          </svg>
        </div>
      </section>

      <section className={styles.stats}>
        {renderStatCard({
          title: 'Книг в обороте',
          value: booksLoading ? '...' : activeBooks.length,
          color: 'primary',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
          ),
        })}
        {renderStatCard({
          title: 'Свободны',
          value: availableBooks.length,
          color: 'success',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ),
        })}
        {renderStatCard({
          title: 'На руках',
          value: takenCount,
          color: 'info',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          ),
        })}
        {renderStatCard({
          title: 'Читателей',
          value: activeMembers.length,
          color: 'warning',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          ),
        })}
      </section>

      <section className={styles.quickActions}>
        <h2 className={styles.sectionTitle}>Быстрые действия</h2>
        <div className={styles.actionCards}>
          <Card
            className={styles.actionCard}
            hoverable
            onClick={() => navigate('books')}
          >
            <div className={styles.actionIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
              </svg>
            </div>
            <h3>Каталог книг</h3>
            <p>Просмотр и поиск книг по жанрам</p>
          </Card>

          {(isMember || isAdmin) && (
            <Card
              className={styles.actionCard}
              hoverable
              onClick={() => navigate('requests')}
            >
              <div className={styles.actionIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="17 1 21 5 17 9" />
                  <path d="M3 11V9a4 4 0 014-4h14" />
                  <polyline points="7 23 3 19 7 15" />
                  <path d="M21 13v2a4 4 0 01-4 4H3" />
                </svg>
              </div>
              <h3>Заявки</h3>
              <p>{isAdmin ? 'Обработка заявок читателей' : 'Ваши заявки на книги'}</p>
              {isAdmin && pendingRequests.length > 0 && (
                <Badge variant="warning">{pendingRequests.length} в ожидании</Badge>
              )}
            </Card>
          )}

          <Card
            className={styles.actionCard}
            hoverable
            onClick={() => navigate('members')}
          >
            <div className={styles.actionIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            </div>
            <h3>Читатели</h3>
            <p>Участники буккроссинг-пункта</p>
          </Card>

          {isAdmin && (
            <Card
              className={styles.actionCard}
              hoverable
              onClick={() => navigate('admin')}
            >
              <div className={styles.actionIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
              </div>
              <h3>Администрирование</h3>
              <p>Книги, жанры и читательские билеты</p>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
});
