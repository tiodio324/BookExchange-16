import { makeAutoObservable, runInAction } from 'mobx';
import { v4 as uuidv4 } from 'uuid';
import type { Unsubscribe } from 'firebase/database';
import { ChatMessage, ChatRoom, UserChatPreview } from '@/types';
import FirebaseService from '@/firebase';
import { authStore } from './AuthStore';
import { dataStore } from './DataStore';

const buildChatId = (userIdA: string, userIdB: string, bookId?: string): string => {
  const ids = [userIdA, userIdB].sort();
  return bookId ? `${ids[0]}_${ids[1]}_${bookId}` : `${ids[0]}_${ids[1]}`;
};

export class ChatStore {
  chatPreviews: UserChatPreview[] = [];
  messages: ChatMessage[] = [];
  activeChatId: string | null = null;
  loadingChats = false;
  loadingMessages = false;
  sending = false;

  private chatsUnsubscribe: Unsubscribe | null = null;
  private messagesUnsubscribe: Unsubscribe | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get activeChat(): UserChatPreview | undefined {
    return this.chatPreviews.find(c => c.chatId === this.activeChatId);
  }

  subscribeToUserChats = (userId: string): void => {
    this.unsubscribeFromChats();
    this.loadingChats = true;

    this.chatsUnsubscribe = FirebaseService.subscribeToData<Record<string, UserChatPreview>>(
      `userChats/${userId}`,
      (data) => {
        runInAction(() => {
          this.chatPreviews = data
            ? Object.values(data).sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
            : [];
          this.loadingChats = false;
        });
      },
    );
  };

  subscribeToMessages = (chatId: string): void => {
    this.unsubscribeFromMessages();
    this.activeChatId = chatId;
    this.loadingMessages = true;

    this.messagesUnsubscribe = FirebaseService.subscribeToData<Record<string, ChatMessage>>(
      `chats/${chatId}/messages`,
      (data) => {
        runInAction(() => {
          this.messages = data
            ? Object.values(data).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
            : [];
          this.loadingMessages = false;
        });
      },
    );
  };

  openChat = (chatId: string): void => {
    if (this.activeChatId === chatId) return;
    this.subscribeToMessages(chatId);
  };

  startChatWithUser = async (
    otherUserId: string,
    bookId?: string,
    bookTitle?: string,
  ): Promise<string | null> => {
    const userId = authStore.currentUserId;
    if (!userId || !authStore.canUseChat()) return null;
    if (userId === otherUserId) return null;

    const chatId = buildChatId(userId, otherUserId, bookId);
    const existing = await FirebaseService.getSnapshot<ChatRoom>(`chats/${chatId}`);

    if (!existing) {
      const now = new Date().toISOString();
      const participantIds = [userId, otherUserId].sort() as [string, string];
      const room: ChatRoom = {
        id: chatId,
        participantIds,
        bookId,
        bookTitle,
        lastMessage: '',
        lastMessageAt: now,
        createdAt: now,
      };

      const previewBase = {
        chatId,
        bookId,
        bookTitle,
        lastMessage: 'Диалог начат',
        lastMessageAt: now,
      };

      await FirebaseService.setData(`chats/${chatId}`, room);
      await FirebaseService.setData(`userChats/${userId}/${chatId}`, {
        ...previewBase,
        otherUserId,
      });
      await FirebaseService.setData(`userChats/${otherUserId}/${chatId}`, {
        ...previewBase,
        otherUserId: userId,
      });
    }

    this.subscribeToUserChats(userId);
    this.openChat(chatId);
    return chatId;
  };

  sendMessage = async (text: string): Promise<boolean> => {
    const userId = authStore.currentUserId;
    const chatId = this.activeChatId;
    const trimmed = text.trim();

    if (!userId || !chatId || !trimmed || !authStore.canUseChat()) return false;

    this.sending = true;
    const now = new Date().toISOString();
    const message: ChatMessage = {
      id: uuidv4(),
      senderId: userId,
      text: trimmed,
      createdAt: now,
    };

    try {
      await FirebaseService.setData(`chats/${chatId}/messages/${message.id}`, message);
      await FirebaseService.updateData(`chats/${chatId}`, {
        lastMessage: trimmed,
        lastMessageAt: now,
      });

      const room = await FirebaseService.getSnapshot<ChatRoom>(`chats/${chatId}`);
      if (room) {
        const previewUpdate = {
          lastMessage: trimmed,
          lastMessageAt: now,
        };
        await Promise.all(
          room.participantIds.map(participantId =>
            FirebaseService.updateData(`userChats/${participantId}/${chatId}`, previewUpdate),
          ),
        );
      }

      return true;
    } catch (error) {
      console.error('Send message error:', error);
      return false;
    } finally {
      runInAction(() => {
        this.sending = false;
      });
    }
  };

  getOtherUserName = (otherUserId: string): string => {
    const user = dataStore.getUserById(otherUserId);
    return user ? `${user.firstName} ${user.lastName}` : 'Пользователь';
  };

  cleanup = (): void => {
    this.unsubscribeFromChats();
    this.unsubscribeFromMessages();
    runInAction(() => {
      this.chatPreviews = [];
      this.messages = [];
      this.activeChatId = null;
    });
  };

  private unsubscribeFromChats = (): void => {
    if (this.chatsUnsubscribe) {
      this.chatsUnsubscribe();
      this.chatsUnsubscribe = null;
    }
  };

  private unsubscribeFromMessages = (): void => {
    if (this.messagesUnsubscribe) {
      this.messagesUnsubscribe();
      this.messagesUnsubscribe = null;
    }
  };
}

export const chatStore = new ChatStore();
