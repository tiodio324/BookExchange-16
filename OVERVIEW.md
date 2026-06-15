# Обзор проекта: Сервис для обмена книгами между пользователями (буккроссинг)

## 📋 Описание проекта

Веб-приложение для буккроссинга — обмена **бумажными и электронными** книгами между пользователями. SPA на React без `react-router`, с **Firebase Authentication**, **Realtime Database** и встроенным **чатом**.

**Цель:** автоматизация книгообмена — учёт книг, обмен между пользователями, общение в чате и журнал действий.

## 💡 Идея и концепция

- Пользователи **регистрируются** через Firebase Auth (email + пароль).
- Добавляют в оборот **бумажные** или **электронные** книги.
- Обмен происходит **напрямую** между пользователями (взять / вернуть).
- Для согласования деталей — **чат** (в т.ч. из карточки книги).
- Администратор ведёт справочник жанров и просматривает пользователей / журнал.

## 🎯 Основные возможности

### Гость
- Просмотр каталога книг (фильтр по формату, жанру, статусу).

### Пользователь (после регистрации)
- Добавление бумажных и электронных книг (файл загружается и хранится в RTDB как base64-строка).
- Взять / вернуть **бумажную** книгу.
- **Скачать** электронную книгу (остаётся доступной всем; скачивание записывается в журнал).
- **Чат** с другими пользователями.
- Журнал своих действий.

### Администратор
- CRUD жанров.
- Просмотр и деактивация пользователей.
- Журнал всех действий (только просмотр).

## 🛠 Технологический стек

- **React 19**, **TypeScript**, **Vite**, **MobX**, **SCSS**
- **Firebase Auth** — регистрация и вход
- **Firebase RTDB** — данные, чат, файлы электронных книг (base64-строка)

## 📁 Структура (ключевые части)

```
src/
├── store/
│   ├── AuthStore.ts      # Firebase Auth + роли
│   ├── DataStore.ts      # Книги, жанры, пользователи, журнал
│   ├── ChatStore.ts      # Чат в реальном времени
│   └── NavigationStore.ts
├── pages/
│   ├── BooksPage/        # Каталог (бумажные + электронные)
│   ├── ChatPage/         # Чат
│   ├── RequestsPage/     # Журнал действий
│   └── ...
├── firebase.ts           # Auth, RTDB
└── types/
```

## 🔐 Роли

| Роль | Как получить |
|------|----------------|
| guest | По умолчанию |
| member | Регистрация через Firebase Auth |
| admin | Email = `VITE_ADMIN_EMAIL` (см. CREDENTIALS.md) |

## 🗄 Данные

- **UserProfile** — id (Firebase UID), email, имя, роль, isActive
- **Book** — title, author, genreId, **format** (paper/electronic), electronicData (base64), ownerId, holderId, status
- **BookRequest** — журнал: take / return / add
- **Chat** — `chats/{chatId}`, `userChats/{userId}`, сообщения в реальном времени

## 🚀 Запуск

```bash
npm install
npm run dev
npm run lint
```

URL: `http://localhost:5173/BookExchange-16/`

## 💻 API stores (примеры)

```typescript
// Auth
authStore.register(email, password, firstName, lastName);
authStore.login(email, password);
authStore.logout();

// Книги
dataStore.createBook({ ...form, format: 'electronic' }, file);
dataStore.requestBook(bookId);

// Чат
chatStore.startChatWithUser(otherUserId, bookId, bookTitle);
chatStore.sendMessage('Текст сообщения');
```

## 📞 Дополнительно

- **Учётные данные:** `CREDENTIALS.md`
- **БД:** Firebase RTDB → `16-book-exchange_kirill`
- **Включить Email/Password** в Firebase Console → Authentication

---

**Удачи на защите! 🎉**
