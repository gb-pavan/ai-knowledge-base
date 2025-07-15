export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

export interface Article {
  _id: string;
  title: string;
  content: string;
  summary?: string;
  tags: string[];
  authorId: string;
  isPublished: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  _id: string;
  userId: string;
  question: string;
  answer: string;
  articleIds: string[];
  isFavorite: boolean;
  createdAt: Date;
}

export interface Feedback {
  _id: string;
  messageId: string;
  userId: string;
  rating: 'positive' | 'negative';
  comment?: string;
  createdAt: Date;
}

export interface ChatSession {
  _id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}