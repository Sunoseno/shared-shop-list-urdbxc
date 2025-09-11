
import { ShoppingList, ShoppingItem } from '../types/ShoppingList';

export const mockUser = {
  email: 'user@example.com',
  name: 'Current User'
};

export const createMockItem = (name: string, description?: string, order: number = 0): ShoppingItem => ({
  id: Math.random().toString(36).substr(2, 9),
  name,
  description: description || '',
  done: false,
  repeating: null,
  createdAt: new Date(),
  order
});

export const mockShoppingLists: ShoppingList[] = [
  {
    id: '1',
    name: 'Weekly Groceries',
    items: [
      createMockItem('Milk', '2% organic milk', 0),
      createMockItem('Bread', 'Whole wheat bread', 1),
      createMockItem('Eggs', 'Free range eggs - dozen', 2),
      createMockItem('Apples', 'Gala apples - 2 lbs', 3),
    ],
    members: [mockUser.email, 'partner@example.com'],
    owner: mockUser.email,
  },
  {
    id: '2',
    name: 'Party Supplies',
    items: [
      createMockItem('Balloons', 'Blue and white balloons', 0),
      createMockItem('Cake', 'Chocolate birthday cake', 1),
    ],
    members: [mockUser.email, 'friend@example.com'],
    owner: mockUser.email,
  }
];
