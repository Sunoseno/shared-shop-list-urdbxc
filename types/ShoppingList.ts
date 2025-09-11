
export interface ShoppingItem {
  id: string;
  name: string;
  description?: string;
  done: boolean;
  repeating: 'daily' | 'weekly' | 'monthly' | null;
  createdAt: Date;
  doneAt?: Date;
  order: number;
}

export interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingItem[];
  members: string[];
  owner: string;
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
