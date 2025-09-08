
import { ShoppingList, ShoppingItem } from '../types/ShoppingList';

export const mockUser = {
  email: 'user@example.com',
  name: 'Current User'
};

export const createMockItem = (name: string, description?: string): ShoppingItem => ({
  id: Math.random().toString(36).substr(2, 9),
  name,
  description,
  isDone: false,
  isRepeating: 'none',
  createdAt: new Date(),
  addedBy: mockUser.email
});

export const mockShoppingLists: ShoppingList[] = [
  {
    id: '1',
    name: 'Weekly Groceries',
    items: [
      createMockItem('Milk', '2% organic milk'),
      createMockItem('Bread', 'Whole wheat bread'),
      createMockItem('Eggs', 'Free range eggs - dozen'),
      createMockItem('Apples', 'Gala apples - 2 lbs'),
    ],
    members: [mockUser.email, 'partner@example.com'],
    owner: mockUser.email,
    createdAt: new Date(),
    history: []
  },
  {
    id: '2',
    name: 'Party Supplies',
    items: [
      createMockItem('Balloons', 'Blue and white balloons'),
      createMockItem('Cake', 'Chocolate birthday cake'),
    ],
    members: [mockUser.email, 'friend@example.com'],
    owner: mockUser.email,
    createdAt: new Date(),
    history: []
  }
];
