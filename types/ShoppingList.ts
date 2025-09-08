
export interface ShoppingItem {
  id: string;
  name: string;
  description?: string;
  isDone: boolean;
  isRepeating: 'none' | 'daily' | 'weekly' | 'monthly';
  createdAt: Date;
  completedAt?: Date;
  addedBy: string;
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
