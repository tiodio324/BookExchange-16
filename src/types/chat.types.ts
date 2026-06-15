// ============================================
// Chat Types
// ============================================

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export interface ChatRoom {
  id: string;
  participantIds: [string, string];
  bookId?: string;
  bookTitle?: string;
  lastMessage: string;
  lastMessageAt: string;
  createdAt: string;
}

export interface UserChatPreview {
  chatId: string;
  otherUserId: string;
  bookId?: string;
  bookTitle?: string;
  lastMessage: string;
  lastMessageAt: string;
}
