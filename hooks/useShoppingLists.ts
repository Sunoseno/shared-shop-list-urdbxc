
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
            repeating: null,
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

    // Auto-move to history after 10 seconds (changed from 30 seconds)
    setTimeout(() => {
      console.log('useShoppingLists: Moving item to history after 10 seconds:', itemId);
      // The item stays in the list but with done=true and doneAt timestamp
      // The UI will filter it appropriately based on the time difference
    }, 10000);
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
                const repeatOptions: (null | 'daily' | 'weekly' | 'monthly')[] = [null, 'daily', 'weekly', 'monthly'];
                const currentIndex = repeatOptions.indexOf(item.repeating);
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
    const newListId = uuid.v4() as string;
    const newList: ShoppingList = {
      id: newListId,
      name: listName,
      items: [],
      members: [mockUser.email, ...initialMembers],
      owner: mockUser.email,
    };
    setLocalShoppingLists(prevLists => [...prevLists, newList]);
    return newListId; // Return the ID so we can navigate to it
  };

  const inviteMember = (listId: string, email: string) => {
    console.log('useShoppingLists: Inviting member:', email, 'to list:', listId);
    
    // For now, show a message about enabling Supabase for real invites
    Alert.alert(
      'Email Invitations',
      'To enable email invitations and real-time collaboration, please enable Supabase by pressing the Supabase button and connecting to your project. For now, members will be added to the list locally.',
      [
        { text: 'OK', style: 'default' }
      ]
    );

    // Add member locally for demo purposes
    setLocalShoppingLists(prevLists =>
      prevLists.map(list => {
        if (list.id === listId) {
          const members = list.members || [];
          if (!members.includes(email)) {
            return {
              ...list,
              members: [...members, email],
            };
          }
        }
        return list;
      })
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
    user: mockUser,
  };
};
