
import { useState, useEffect } from 'react';
import { ShoppingList, ShoppingItem, InviteLink } from '../types/ShoppingList';
import { mockShoppingLists, mockUser } from '../data/mockData';
import { Alert, Linking } from 'react-native';

export const useShoppingLists = () => {
  const [lists, setLists] = useState<ShoppingList[]>(mockShoppingLists);
  const [currentUser] = useState(mockUser);
  const [inviteLinks, setInviteLinks] = useState<InviteLink[]>([]);

  const createList = (name: string, members: string[] = []) => {
    const newList: ShoppingList = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      items: [],
      members: [currentUser.email, ...members],
      owner: currentUser.email,
      createdAt: new Date(),
      history: []
    };
    setLists(prev => [...prev, newList]);
    console.log('Created new list:', name, 'with members:', members);
    
    // Send invitations to members
    members.forEach(email => {
      sendInvitation(newList.id, email);
    });
    
    return newList.id;
  };

  const addItemToList = (listId: string, name: string, description?: string) => {
    const list = lists.find(l => l.id === listId);
    if (!list) return;

    const maxOrder = Math.max(0, ...list.items.map(item => item.order));
    const newItem: ShoppingItem = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      description,
      isDone: false,
      isRepeating: 'none',
      createdAt: new Date(),
      addedBy: currentUser.email,
      order: maxOrder + 1
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
          history: list.history.filter(h => h.id !== itemId || h.completedAt?.getTime() !== item.completedAt?.getTime())
        };
      } else {
        // Mark as done
        const updatedItem = { ...item, isDone: true, completedAt: new Date() };
        
        // Add to history (sorted by most recent first)
        const newHistory = [updatedItem, ...list.history];
        
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

  const updateItemName = (listId: string, itemId: string, name: string) => {
    setLists(prev => prev.map(list => 
      list.id === listId 
        ? {
            ...list,
            items: list.items.map(item => 
              item.id === itemId ? { ...item, name } : item
            )
          }
        : list
    ));
    console.log('Updated item name to:', name);
  };

  const reorderItems = (listId: string, itemId: string, newOrder: number) => {
    setLists(prev => prev.map(list => {
      if (list.id !== listId) return list;
      
      const items = [...list.items];
      const itemIndex = items.findIndex(i => i.id === itemId);
      if (itemIndex === -1) return list;
      
      const item = items[itemIndex];
      items.splice(itemIndex, 1);
      
      const targetIndex = Math.max(0, Math.min(items.length, itemIndex + newOrder));
      items.splice(targetIndex, 0, item);
      
      // Update order values
      const updatedItems = items.map((item, index) => ({
        ...item,
        order: index
      }));
      
      return { ...list, items: updatedItems };
    }));
    console.log('Reordered items');
  };

  const addHistoryItemBackToList = (listId: string, historyItem: ShoppingItem) => {
    const list = lists.find(l => l.id === listId);
    if (!list) return;

    const maxOrder = Math.max(0, ...list.items.map(item => item.order));
    const newItem: ShoppingItem = {
      ...historyItem,
      id: Math.random().toString(36).substr(2, 9), // New ID
      isDone: false,
      completedAt: undefined,
      order: maxOrder + 1
    };

    setLists(prev => prev.map(list => 
      list.id === listId 
        ? { ...list, items: [...list.items, newItem] }
        : list
    ));
    console.log('Added history item back to list:', historyItem.name);
  };

  const clearHistory = (listId: string) => {
    setLists(prev => prev.map(list => 
      list.id === listId 
        ? { ...list, history: [] }
        : list
    ));
    console.log('Cleared history for list:', listId);
  };

  const sendInvitation = (listId: string, email: string) => {
    const token = Math.random().toString(36).substr(2, 15);
    const inviteLink: InviteLink = {
      id: Math.random().toString(36).substr(2, 9),
      listId,
      email,
      token,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };
    
    setInviteLinks(prev => [...prev, inviteLink]);
    
    // Create the invitation link
    const inviteUrl = `shoppinglist://invite?token=${token}`;
    
    // For real-time synchronization, you would need to enable Supabase
    // by pressing the Supabase button and connecting to a project.
    // This would allow users to join and use the list together with real-time sync.
    Alert.alert(
      'Invitation Created',
      `To enable real-time synchronization where others can join and use the list together, you need to enable Supabase by pressing the Supabase button and connecting to a project.\n\nFor now, the invitation link is: ${inviteUrl}`,
      [
        { text: 'OK' },
        { 
          text: 'Copy Link', 
          onPress: () => {
            // In a real app, you'd copy to clipboard
            console.log('Copied invite link:', inviteUrl);
          }
        }
      ]
    );
    
    console.log('Created invitation for:', email, 'for list:', listId);
  };

  const inviteMember = (listId: string, email: string) => {
    const list = lists.find(l => l.id === listId);
    if (!list) return;
    
    if (list.members.includes(email)) {
      Alert.alert('Already a Member', `${email} is already a member of this list`);
      return;
    }
    
    sendInvitation(listId, email);
  };

  const acceptInvitation = (token: string) => {
    const invite = inviteLinks.find(i => i.token === token && i.expiresAt > new Date());
    if (!invite) {
      Alert.alert('Invalid Invitation', 'This invitation link is invalid or has expired');
      return;
    }
    
    setLists(prev => prev.map(list => 
      list.id === invite.listId && !list.members.includes(currentUser.email)
        ? { ...list, members: [...list.members, currentUser.email] }
        : list
    ));
    
    // Remove the used invitation
    setInviteLinks(prev => prev.filter(i => i.id !== invite.id));
    
    Alert.alert('Invitation Accepted', 'You have been added to the shopping list!');
    console.log('Accepted invitation for list:', invite.listId);
  };

  const removeMember = (listId: string, email: string) => {
    setLists(prev => prev.map(list => 
      list.id === listId 
        ? { ...list, members: list.members.filter(m => m !== email) }
        : list
    ));
    console.log('Removed member:', email);
  };

  // Handle deep links for invitations
  useEffect(() => {
    const handleDeepLink = (url: string) => {
      const urlObj = new URL(url);
      if (urlObj.pathname === '/invite') {
        const token = urlObj.searchParams.get('token');
        if (token) {
          acceptInvitation(token);
        }
      }
    };

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Check if app was opened with a deep link
    Linking.getInitialURL().then(url => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => subscription?.remove();
  }, []);

  // Remove completed items after 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLists(prev => prev.map(list => ({
        ...list,
        items: list.items.filter(item => !item.isDone || 
          (item.completedAt && Date.now() - item.completedAt.getTime() < 30000) // 30 seconds
        )
      })));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle repeating items
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      
      setLists(prev => prev.map(list => {
        const itemsToReAdd: ShoppingItem[] = [];
        
        list.history.forEach(historyItem => {
          if (historyItem.isRepeating !== 'none' && historyItem.completedAt) {
            const completedTime = historyItem.completedAt.getTime();
            const timeDiff = now.getTime() - completedTime;
            
            let shouldReAdd = false;
            switch (historyItem.isRepeating) {
              case 'daily':
                shouldReAdd = timeDiff >= 24 * 60 * 60 * 1000; // 24 hours
                break;
              case 'weekly':
                shouldReAdd = timeDiff >= 7 * 24 * 60 * 60 * 1000; // 7 days
                break;
              case 'monthly':
                shouldReAdd = timeDiff >= 30 * 24 * 60 * 60 * 1000; // 30 days
                break;
            }
            
            if (shouldReAdd && !list.items.some(item => item.name === historyItem.name && !item.isDone)) {
              const maxOrder = Math.max(0, ...list.items.map(item => item.order));
              itemsToReAdd.push({
                ...historyItem,
                id: Math.random().toString(36).substr(2, 9),
                isDone: false,
                completedAt: undefined,
                order: maxOrder + itemsToReAdd.length + 1
              });
            }
          }
        });
        
        if (itemsToReAdd.length > 0) {
          return {
            ...list,
            items: [...list.items, ...itemsToReAdd]
          };
        }
        
        return list;
      }));
    }, 60000); // Check every minute

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
    updateItemName,
    reorderItems,
    addHistoryItemBackToList,
    clearHistory,
    inviteMember,
    removeMember,
    acceptInvitation
  };
};
