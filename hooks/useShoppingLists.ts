
import { useState, useEffect } from 'react';
import { ShoppingList, ShoppingItem } from '../types/ShoppingList';
import { mockShoppingLists, mockUser } from '../data/mockData';

export const useShoppingLists = () => {
  const [lists, setLists] = useState<ShoppingList[]>(mockShoppingLists);
  const [currentUser] = useState(mockUser);

  const createList = (name: string) => {
    const newList: ShoppingList = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      items: [],
      members: [currentUser.email],
      owner: currentUser.email,
      createdAt: new Date(),
      history: []
    };
    setLists(prev => [...prev, newList]);
    console.log('Created new list:', name);
    return newList.id;
  };

  const addItemToList = (listId: string, name: string, description?: string) => {
    const newItem: ShoppingItem = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      description,
      isDone: false,
      isRepeating: 'none',
      createdAt: new Date(),
      addedBy: currentUser.email
    };

    setLists(prev => prev.map(list => 
      list.id === listId 
        ? { ...list, items: [...list.items, newItem] }
        : list
    ));
    console.log('Added item to list:', name);
  };

  const toggleItemDone = (listId: string, itemId: string) => {
    setLists(prev => prev.map(list => {
      if (list.id !== listId) return list;
      
      const item = list.items.find(i => i.id === itemId);
      if (!item) return list;

      if (item.isDone) {
        // If already done, undone it and remove from history
        return {
          ...list,
          items: list.items.map(i => 
            i.id === itemId 
              ? { ...i, isDone: false, completedAt: undefined }
              : i
          ),
          history: list.history.filter(h => h.id !== itemId)
        };
      } else {
        // Mark as done
        const updatedItem = { ...item, isDone: true, completedAt: new Date() };
        
        // Add to history
        const newHistory = [...list.history, updatedItem];
        
        // If repeating, schedule to reappear (for demo, we'll just keep it in items)
        const updatedItems = list.items.map(i => 
          i.id === itemId ? updatedItem : i
        );

        return {
          ...list,
          items: updatedItems,
          history: newHistory
        };
      }
    }));
    console.log('Toggled item done status');
  };

  const updateItemRepeating = (listId: string, itemId: string) => {
    const repeatOptions: ('none' | 'daily' | 'weekly' | 'monthly')[] = ['none', 'daily', 'weekly', 'monthly'];
    
    setLists(prev => prev.map(list => 
      list.id === listId 
        ? {
            ...list,
            items: list.items.map(item => {
              if (item.id === itemId) {
                const currentIndex = repeatOptions.indexOf(item.isRepeating);
                const nextIndex = (currentIndex + 1) % repeatOptions.length;
                return { ...item, isRepeating: repeatOptions[nextIndex] };
              }
              return item;
            })
          }
        : list
    ));
    console.log('Updated item repeating status');
  };

  const updateItemDescription = (listId: string, itemId: string, description: string) => {
    setLists(prev => prev.map(list => 
      list.id === listId 
        ? {
            ...list,
            items: list.items.map(item => 
              item.id === itemId ? { ...item, description } : item
            )
          }
        : list
    ));
    console.log('Updated item description');
  };

  const inviteMember = (listId: string, email: string) => {
    setLists(prev => prev.map(list => 
      list.id === listId && !list.members.includes(email)
        ? { ...list, members: [...list.members, email] }
        : list
    ));
    console.log('Invited member:', email);
    // In a real app, this would send an email invitation
  };

  const removeMember = (listId: string, email: string) => {
    setLists(prev => prev.map(list => 
      list.id === listId 
        ? { ...list, members: list.members.filter(m => m !== email) }
        : list
    ));
    console.log('Removed member:', email);
  };

  // Remove completed items after delay
  useEffect(() => {
    const interval = setInterval(() => {
      setLists(prev => prev.map(list => ({
        ...list,
        items: list.items.filter(item => !item.isDone || 
          (item.completedAt && Date.now() - item.completedAt.getTime() < 3000)
        )
      })));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    lists,
    currentUser,
    createList,
    addItemToList,
    toggleItemDone,
    updateItemRepeating,
    updateItemDescription,
    inviteMember,
    removeMember
  };
};
