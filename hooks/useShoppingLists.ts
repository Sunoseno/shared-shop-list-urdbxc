
import { ShoppingList, ShoppingItem, InviteLink } from '../types/ShoppingList';
import { mockShoppingLists, mockUser } from '../data/mockData';
import { Alert, Linking } from 'react-native';
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useSupabaseShoppingLists } from './useSupabaseShoppingLists';
import uuid from 'react-native-uuid';

export const useShoppingLists = () => {
  const { user, loading: authLoading } = useAuth();
  const supabaseHook = useSupabaseShoppingLists();
  
  // Local state for offline/anonymous users
  const [localShoppingLists, setLocalShoppingLists] = useState<ShoppingList[]>(mockShoppingLists);

  // Use Supabase if user is authenticated, otherwise use local state
  const isUsingSupabase = !!user;
  
  const shoppingLists = isUsingSupabase ? (supabaseHook.shoppingLists || []) : localShoppingLists;
  const loading = isUsingSupabase ? supabaseHook.loading : false;

  // Local implementations for anonymous users
  const localAddItem = (listId: string, itemName: string) => {
    console.log('Adding item locally:', itemName, 'to list:', listId);
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

  const localToggleItemDone = (listId: string, itemId: string) => {
    console.log('Toggling item locally:', itemId);
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

  const localUpdateItemDescription = (listId: string, itemId: string, description: string) => {
    console.log('Updating item description locally:', itemId, description);
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

  const localUpdateItemName = (listId: string, itemId: string, newName: string) => {
    console.log('Updating item name locally:', itemId, newName);
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

  const localSetItemRepeat = (listId: string, itemId: string) => {
    console.log('Setting item repeat locally:', itemId);
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

  const localRemoveItem = (listId: string, itemId: string) => {
    console.log('Removing item locally:', itemId);
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

  const localCreateList = (listName: string, initialMembers: string[] = []) => {
    console.log('Creating list locally:', listName, 'with members:', initialMembers);
    const newList: ShoppingList = {
      id: uuid.v4() as string,
      name: listName,
      items: [],
      members: [mockUser.email, ...initialMembers],
      owner: mockUser.email,
    };
    setLocalShoppingLists(prevLists => [...prevLists, newList]);
  };

  const localInviteMember = (listId: string, email: string) => {
    console.log('Inviting member locally:', email, 'to list:', listId);
    Alert.alert(
      'Offline Mode',
      'Email invitations are not available in offline mode. Please sign in to invite members via email.'
    );
  };

  const localRemoveMember = (listId: string, email: string) => {
    console.log('Removing member locally:', email, 'from list:', listId);
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

  const localClearListHistory = (listId: string) => {
    console.log('Clearing history locally for list:', listId);
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

  const localUpdateItemOrder = (listId: string, itemId: string, newIndex: number) => {
    console.log('Updating item order locally:', itemId, 'to index:', newIndex);
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

  // Return appropriate functions based on authentication status
  return {
    shoppingLists,
    loading: authLoading || loading,
    addItem: isUsingSupabase ? supabaseHook.addItem : localAddItem,
    toggleItemDone: isUsingSupabase ? supabaseHook.toggleItemDone : localToggleItemDone,
    updateItemDescription: isUsingSupabase ? supabaseHook.updateItemDescription : localUpdateItemDescription,
    updateItemName: isUsingSupabase ? supabaseHook.updateItemName : localUpdateItemName,
    setItemRepeat: isUsingSupabase ? supabaseHook.setItemRepeat : localSetItemRepeat,
    removeItem: isUsingSupabase ? supabaseHook.removeItem : localRemoveItem,
    createList: isUsingSupabase ? supabaseHook.createList : localCreateList,
    inviteMember: isUsingSupabase ? supabaseHook.inviteMember : localInviteMember,
    removeMember: isUsingSupabase ? supabaseHook.removeMember : localRemoveMember,
    clearListHistory: isUsingSupabase ? supabaseHook.clearListHistory : localClearListHistory,
    updateItemOrder: isUsingSupabase ? supabaseHook.updateItemOrder : localUpdateItemOrder,
    refreshLists: isUsingSupabase ? supabaseHook.refreshLists : () => console.log('Refresh not needed for local lists'),
    isUsingSupabase,
    user,
  };
};
