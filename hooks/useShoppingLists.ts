
import { ShoppingList, ShoppingItem } from '../types/ShoppingList';
import { mockShoppingLists, mockUser } from '../data/mockData';
import { Alert } from 'react-native';
import { useState, useEffect } from 'react';
import uuid from 'react-native-uuid';

export const useShoppingLists = () => {
  console.log('useShoppingLists: Initializing (offline mode)');
  
  // Always use local state for now to avoid Supabase issues
  const [localShoppingLists, setLocalShoppingLists] = useState<ShoppingList[]>(mockShoppingLists);
  const [loading, setLoading] = useState(false); // Start with false

  useEffect(() => {
    console.log('useShoppingLists: Setting up with mock data');
    setLoading(false);
  }, []);

  console.log('useShoppingLists: Current state - loading:', loading, 'lists:', localShoppingLists?.length || 0);

  const addItem = (listId: string, itemName: string) => {
    console.log('useShoppingLists: Adding item:', itemName, 'to list:', listId);
    setLocalShoppingLists(prevLists =>
      prevLists.map(list => {
        if (list.id === listId) {
          const maxOrder = Math.max(...(list.items || []).map(item => item.order || 0), 0);
          const newItem: ShoppingItem = {
            id: uuid.v4() as string,
            name: itemName,
            description: '',
            done: false,
            repeating: 'none',
            createdAt: new Date(),
            order: maxOrder + 1,
          };
          return {
            ...list,
            items: [...(list.items || []), newItem],
          };
        }
        return list;
      })
    );
  };

  const toggleItemDone = (listId: string, itemId: string) => {
    console.log('useShoppingLists: Toggling item:', itemId);
    setLocalShoppingLists(prevLists =>
      prevLists.map(list => {
        if (list.id === listId) {
          return {
            ...list,
            items: (list.items || []).map(item => {
              if (item.id === itemId) {
                const newDoneStatus = !item.done;
                return {
                  ...item,
                  done: newDoneStatus,
                  doneAt: newDoneStatus ? new Date() : undefined,
                };
              }
              return item;
            }),
          };
        }
        return list;
      })
    );

    // Auto-remove done items after 30 seconds
    setTimeout(() => {
      setLocalShoppingLists(prevLists =>
        prevLists.map(list => {
          if (list.id === listId) {
            return {
              ...list,
              items: (list.items || []).filter(item => !(item.id === itemId && item.done)),
            };
          }
          return list;
        })
      );
    }, 30000);
  };

  const updateItemDescription = (listId: string, itemId: string, description: string) => {
    console.log('useShoppingLists: Updating item description:', itemId, description);
    setLocalShoppingLists(prevLists =>
      prevLists.map(list => {
        if (list.id === listId) {
          return {
            ...list,
            items: (list.items || []).map(item =>
              item.id === itemId ? { ...item, description } : item
            ),
          };
        }
        return list;
      })
    );
  };

  const updateItemName = (listId: string, itemId: string, newName: string) => {
    console.log('useShoppingLists: Updating item name:', itemId, newName);
    setLocalShoppingLists(prevLists =>
      prevLists.map(list => {
        if (list.id === listId) {
          return {
            ...list,
            items: (list.items || []).map(item =>
              item.id === itemId ? { ...item, name: newName } : item
            ),
          };
        }
        return list;
      })
    );
  };

  const setItemRepeat = (listId: string, itemId: string) => {
    console.log('useShoppingLists: Setting item repeat:', itemId);
    setLocalShoppingLists(prevLists =>
      prevLists.map(list => {
        if (list.id === listId) {
          return {
            ...list,
            items: (list.items || []).map(item => {
              if (item.id === itemId) {
                const repeatOptions: ('none' | 'daily' | 'weekly' | 'monthly')[] = ['none', 'daily', 'weekly', 'monthly'];
                const currentIndex = repeatOptions.indexOf(item.repeating || 'none');
                const nextIndex = (currentIndex + 1) % repeatOptions.length;
                return { ...item, repeating: repeatOptions[nextIndex] };
              }
              return item;
            }),
          };
        }
        return list;
      })
    );
  };

  const removeItem = (listId: string, itemId: string) => {
    console.log('useShoppingLists: Removing item:', itemId);
    setLocalShoppingLists(prevLists =>
      prevLists.map(list => {
        if (list.id === listId) {
          return {
            ...list,
            items: (list.items || []).filter(item => item.id !== itemId),
          };
        }
        return list;
      })
    );
  };

  const createList = (listName: string, initialMembers: string[] = []) => {
    console.log('useShoppingLists: Creating list:', listName, 'with members:', initialMembers);
    const newList: ShoppingList = {
      id: uuid.v4() as string,
      name: listName,
      items: [],
      members: [mockUser.email, ...initialMembers],
      owner: mockUser.email,
    };
    setLocalShoppingLists(prevLists => [...prevLists, newList]);
  };

  const inviteMember = (listId: string, email: string) => {
    console.log('useShoppingLists: Inviting member:', email, 'to list:', listId);
    Alert.alert(
      'Offline Mode',
      'Email invitations are not available in offline mode. The app is currently running without backend connectivity.'
    );
  };

  const removeMember = (listId: string, email: string) => {
    console.log('useShoppingLists: Removing member:', email, 'from list:', listId);
    setLocalShoppingLists(prevLists =>
      prevLists.map(list => {
        if (list.id === listId) {
          return {
            ...list,
            members: (list.members || []).filter(member => member !== email),
          };
        }
        return list;
      })
    );
  };

  const clearListHistory = (listId: string) => {
    console.log('useShoppingLists: Clearing history for list:', listId);
    setLocalShoppingLists(prevLists =>
      prevLists.map(list => {
        if (list.id === listId) {
          return {
            ...list,
            items: (list.items || []).filter(item => !item.done),
          };
        }
        return list;
      })
    );
  };

  const updateItemOrder = (listId: string, itemId: string, newIndex: number) => {
    console.log('useShoppingLists: Updating item order:', itemId, 'to index:', newIndex);
    setLocalShoppingLists(prevLists =>
      prevLists.map(list => {
        if (list.id === listId) {
          return {
            ...list,
            items: (list.items || []).map(item =>
              item.id === itemId ? { ...item, order: newIndex } : item
            ),
          };
        }
        return list;
      })
    );
  };

  const refreshLists = () => {
    console.log('useShoppingLists: Refresh not needed for local lists');
  };

  return {
    shoppingLists: localShoppingLists,
    loading,
    addItem,
    toggleItemDone,
    updateItemDescription,
    updateItemName,
    setItemRepeat,
    removeItem,
    createList,
    inviteMember,
    removeMember,
    clearListHistory,
    updateItemOrder,
    refreshLists,
    isUsingSupabase: false,
    user: null,
  };
};
