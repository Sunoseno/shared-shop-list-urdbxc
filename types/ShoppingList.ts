
export interface ShoppingItem {
  id: string;
  name: string;
  description?: string;
  isDone: boolean;
  isRepeating: 'none' | 'daily' | 'weekly' | 'monthly';
  createdAt: Date;
  completedAt?: Date;
  addedBy: string;
  order: number;
}

export interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingItem[];
  members: string[];
  owner: string;
  createdAt: Date;
  history: ShoppingItem[];
}

export interface User {
  email: string;
  name: string;
}

export interface InviteLink {
  id: string;
  listId: string;
  email: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
}
