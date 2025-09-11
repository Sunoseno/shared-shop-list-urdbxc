
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { ShoppingList, ShoppingItem } from '../types/ShoppingList';
import { Alert } from 'react-native';
import uuid from 'react-native-uuid';
import { mockShoppingLists, mockUser } from '../data/mockData';

export const useShoppingLists = () => {
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isUsingSupabase, setIsUsingSupabase] = useState(false);

  // Check if user is authenticated
  const checkAuth = useCallback(async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      console.log('Auth check result:', { user: user?.email, error });
      
      if (user) {
        setUser(user);
        setIsUsingSupabase(true);
        return user;
      } else {
        // Use anonymous user for now
        setUser(mockUser);
        setIsUsingSupabase(false);
        return mockUser;
      }
    } catch (error) {
      console.log('Auth check failed, using mock user:', error);
      setUser(mockUser);
      setIsUsingSupabase(false);
      return mockUser;
    }
  }, []);

  // Fetch shopping lists from Supabase
  const fetchSupabaseLists = useCallback(async (currentUser: any) => {
    if (!currentUser) return [];

    try {
      console.log('Fetching lists from Supabase for user:', currentUser.email);
      
      // Get lists where user is a member
      const { data: memberLists, error: memberError } = await supabase
        .from('list_members')
        .select(`
          list_id,
          shopping_lists!inner (
            id,
            name,
            owner,
            created_at,
            updated_at
          )
        `)
        .eq('email', currentUser.email || currentUser.id);

      if (memberError) {
        console.error('Error fetching member lists:', memberError);
        return [];
      }

      console.log('Member lists:', memberLists);

      // Get items and members for each list
      const listsWithItems: ShoppingList[] = [];
      
      for (const memberList of memberLists || []) {
        const listData = memberList.shopping_lists;
        
        // Get items for this list
        const { data: items, error: itemsError } = await supabase
          .from('shopping_items')
          .select('*')
          .eq('list_id', listData.id)
          .order('order_index');

        if (itemsError) {
          console.error('Error fetching items:', itemsError);
          continue;
        }

        // Get members for this list
        const { data: members, error: membersError } = await supabase
          .from('list_members')
          .select('email')
          .eq('list_id', listData.id);

        if (membersError) {
          console.error('Error fetching members:', membersError);
          continue;
        }

        const shoppingItems: ShoppingItem[] = (items || []).map(item => ({
          id: item.id,
          name: item.name,
          description: item.description || '',
          done: item.done,
          repeating: item.repeating === 'none' ? null : item.repeating,
          createdAt: new Date(item.created_at),
          doneAt: item.done_at ? new Date(item.done_at) : undefined,
          order: item.order_index,
        }));

        listsWithItems.push({
          id: listData.id,
          name: listData.name,
          items: shoppingItems,
          members: (members || []).map(m => m.email),
          owner: listData.owner,
        });
      }

      console.log('Fetched lists with items:', listsWithItems.length);
      return listsWithItems;
    } catch (error) {
      console.error('Error fetching Supabase lists:', error);
      return [];
    }
  }, []);

  // Main fetch function
  const fetchShoppingLists = useCallback(async () => {
    console.log('Fetching shopping lists...');
    setLoading(true);

    try {
      const currentUser = await checkAuth();
      
      if (isUsingSupabase && currentUser && currentUser.email !== mockUser.email) {
        const supabaseLists = await fetchSupabaseLists(currentUser);
        setShoppingLists(supabaseLists);
      } else {
        // Use mock data
        console.log('Using mock data');
        setShoppingLists(mockShoppingLists);
      }
    } catch (error) {
      console.error('Error in fetchShoppingLists:', error);
      setShoppingLists(mockShoppingLists);
    } finally {
      setLoading(false);
    }
  }, [checkAuth, fetchSupabaseLists, isUsingSupabase]);

  // Create new list
  const createList = useCallback(async (listName: string, initialMembers: string[] = []) => {
    console.log('Creating list:', listName, 'with members:', initialMembers);
    
    if (isUsingSupabase && user && user.email !== mockUser.email) {
      try {
        const listId = uuid.v4() as string;
        const userEmail = user.email;

        // Create the list
        const { error: listError } = await supabase
          .from('shopping_lists')
          .insert({
            id: listId,
            name: listName,
            owner: userEmail,
          });

        if (listError) {
          console.error('Error creating list:', listError);
          throw listError;
        }

        // Add owner as member
        const { error: ownerError } = await supabase
          .from('list_members')
          .insert({
            list_id: listId,
            email: userEmail,
            role: 'owner',
          });

        if (ownerError) {
          console.error('Error adding owner as member:', ownerError);
          throw ownerError;
        }

        // Add initial members
        for (const email of initialMembers) {
          if (email && email !== userEmail) {
            await inviteMember(listId, email);
          }
        }

        console.log('List created successfully with ID:', listId);
        await fetchShoppingLists();
        return listId;
      } catch (error) {
        console.error('Error creating list:', error);
        Alert.alert('Error', 'Failed to create list');
        return null;
      }
    } else {
      // Local creation
      const newListId = uuid.v4() as string;
      const newList: ShoppingList = {
        id: newListId,
        name: listName,
        items: [],
        members: [user?.email || mockUser.email, ...initialMembers],
        owner: user?.email || mockUser.email,
      };
      
      setShoppingLists(prevLists => [...prevLists, newList]);
      console.log('List created locally with ID:', newListId);
      return newListId;
    }
  }, [isUsingSupabase, user, fetchShoppingLists]);

  // Add item to list
  const addItem = useCallback(async (listId: string, itemName: string) => {
    console.log('Adding item:', itemName, 'to list:', listId);
    
    if (isUsingSupabase && user && user.email !== mockUser.email) {
      try {
        // Get current max order
        const { data: maxOrderData } = await supabase
          .from('shopping_items')
          .select('order_index')
          .eq('list_id', listId)
          .order('order_index', { ascending: false })
          .limit(1);

        const maxOrder = maxOrderData?.[0]?.order_index || 0;

        const { error } = await supabase
          .from('shopping_items')
          .insert({
            list_id: listId,
            name: itemName,
            description: '',
            done: false,
            repeating: 'none',
            order_index: maxOrder + 1,
          });

        if (error) {
          console.error('Error adding item:', error);
          throw error;
        }

        console.log('Item added successfully');
        await fetchShoppingLists();
      } catch (error) {
        console.error('Error adding item:', error);
        Alert.alert('Error', 'Failed to add item');
      }
    } else {
      // Local addition
      setShoppingLists(prevLists =>
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
    }
  }, [isUsingSupabase, user, fetchShoppingLists]);

  // Toggle item done status with proper history handling
  const toggleItemDone = useCallback(async (listId: string, itemId: string) => {
    console.log('Toggling item done:', itemId);
    
    if (isUsingSupabase && user && user.email !== mockUser.email) {
      try {
        // Get current item
        const { data: currentItem } = await supabase
          .from('shopping_items')
          .select('done')
          .eq('id', itemId)
          .single();

        if (!currentItem) {
          console.error('Item not found');
          return;
        }

        const newDoneStatus = !currentItem.done;
        const doneAt = newDoneStatus ? new Date().toISOString() : null;

        const { error } = await supabase
          .from('shopping_items')
          .update({
            done: newDoneStatus,
            done_at: doneAt,
            updated_at: new Date().toISOString(),
          })
          .eq('id', itemId);

        if (error) {
          console.error('Error toggling item:', error);
          throw error;
        }

        console.log('Item toggled successfully');
        await fetchShoppingLists();
      } catch (error) {
        console.error('Error toggling item:', error);
        Alert.alert('Error', 'Failed to update item');
      }
    } else {
      // Local toggle with history handling
      setShoppingLists(prevLists =>
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
    }
  }, [isUsingSupabase, user, fetchShoppingLists]);

  // Update item description
  const updateItemDescription = useCallback(async (listId: string, itemId: string, description: string) => {
    console.log('Updating item description:', itemId, description);
    
    if (isUsingSupabase && user && user.email !== mockUser.email) {
      try {
        const { error } = await supabase
          .from('shopping_items')
          .update({
            description,
            updated_at: new Date().toISOString(),
          })
          .eq('id', itemId);

        if (error) {
          console.error('Error updating description:', error);
          throw error;
        }

        console.log('Description updated successfully');
        await fetchShoppingLists();
      } catch (error) {
        console.error('Error updating description:', error);
        Alert.alert('Error', 'Failed to update description');
      }
    } else {
      // Local update
      setShoppingLists(prevLists =>
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
    }
  }, [isUsingSupabase, user, fetchShoppingLists]);

  // Update item name
  const updateItemName = useCallback(async (listId: string, itemId: string, newName: string) => {
    console.log('Updating item name:', itemId, newName);
    
    if (isUsingSupabase && user && user.email !== mockUser.email) {
      try {
        const { error } = await supabase
          .from('shopping_items')
          .update({
            name: newName,
            updated_at: new Date().toISOString(),
          })
          .eq('id', itemId);

        if (error) {
          console.error('Error updating name:', error);
          throw error;
        }

        console.log('Name updated successfully');
        await fetchShoppingLists();
      } catch (error) {
        console.error('Error updating name:', error);
        Alert.alert('Error', 'Failed to update name');
      }
    } else {
      // Local update
      setShoppingLists(prevLists =>
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
    }
  }, [isUsingSupabase, user, fetchShoppingLists]);

  // Set item repeat
  const setItemRepeat = useCallback(async (listId: string, itemId: string) => {
    console.log('Setting item repeat:', itemId);
    
    if (isUsingSupabase && user && user.email !== mockUser.email) {
      try {
        // Get current repeating status
        const { data: currentItem } = await supabase
          .from('shopping_items')
          .select('repeating')
          .eq('id', itemId)
          .single();

        if (!currentItem) {
          console.error('Item not found');
          return;
        }

        const repeatOptions: ('none' | 'daily' | 'weekly' | 'monthly')[] = ['none', 'daily', 'weekly', 'monthly'];
        const currentIndex = repeatOptions.indexOf(currentItem.repeating);
        const nextIndex = (currentIndex + 1) % repeatOptions.length;
        const newRepeating = repeatOptions[nextIndex];

        const { error } = await supabase
          .from('shopping_items')
          .update({
            repeating: newRepeating,
            updated_at: new Date().toISOString(),
          })
          .eq('id', itemId);

        if (error) {
          console.error('Error updating repeat:', error);
          throw error;
        }

        console.log('Repeat updated successfully');
        await fetchShoppingLists();
      } catch (error) {
        console.error('Error updating repeat:', error);
        Alert.alert('Error', 'Failed to update repeat');
      }
    } else {
      // Local update
      setShoppingLists(prevLists =>
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
    }
  }, [isUsingSupabase, user, fetchShoppingLists]);

  // Remove item
  const removeItem = useCallback(async (listId: string, itemId: string) => {
    console.log('Removing item:', itemId);
    
    if (isUsingSupabase && user && user.email !== mockUser.email) {
      try {
        const { error } = await supabase
          .from('shopping_items')
          .delete()
          .eq('id', itemId);

        if (error) {
          console.error('Error removing item:', error);
          throw error;
        }

        console.log('Item removed successfully');
        await fetchShoppingLists();
      } catch (error) {
        console.error('Error removing item:', error);
        Alert.alert('Error', 'Failed to remove item');
      }
    } else {
      // Local removal
      setShoppingLists(prevLists =>
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
    }
  }, [isUsingSupabase, user, fetchShoppingLists]);

  // Invite member
  const inviteMember = useCallback(async (listId: string, email: string) => {
    console.log('Inviting member:', email, 'to list:', listId);
    
    if (isUsingSupabase && user && user.email !== mockUser.email) {
      try {
        // Check if already a member
        const { data: existingMember } = await supabase
          .from('list_members')
          .select('id')
          .eq('list_id', listId)
          .eq('email', email)
          .single();

        if (existingMember) {
          Alert.alert('Info', 'User is already a member of this list');
          return;
        }

        // Create invitation token
        const token = uuid.v4() as string;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

        const { error: inviteError } = await supabase
          .from('invitations')
          .insert({
            list_id: listId,
            email,
            token,
            expires_at: expiresAt.toISOString(),
            used: false,
          });

        if (inviteError) {
          console.error('Error creating invitation:', inviteError);
          throw inviteError;
        }

        // For now, automatically add the member (in a real app, you'd send an email)
        const { error: memberError } = await supabase
          .from('list_members')
          .insert({
            list_id: listId,
            email,
            role: 'member',
          });

        if (memberError) {
          console.error('Error adding member:', memberError);
          throw memberError;
        }

        console.log('Member invited successfully');
        Alert.alert('Success', `${email} has been added to the list`);
        await fetchShoppingLists();
      } catch (error) {
        console.error('Error inviting member:', error);
        Alert.alert('Error', 'Failed to invite member');
      }
    } else {
      // Local invite (show message about Supabase)
      Alert.alert(
        'Email Invitations',
        'To enable email invitations and real-time collaboration, please sign in with your email. For now, members will be added to the list locally.',
        [{ text: 'OK', style: 'default' }]
      );

      // Add member locally for demo purposes
      setShoppingLists(prevLists =>
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
    }
  }, [isUsingSupabase, user, fetchShoppingLists]);

  // Remove member
  const removeMember = useCallback(async (listId: string, email: string) => {
    console.log('Removing member:', email, 'from list:', listId);
    
    if (isUsingSupabase && user && user.email !== mockUser.email) {
      try {
        const { error } = await supabase
          .from('list_members')
          .delete()
          .eq('list_id', listId)
          .eq('email', email);

        if (error) {
          console.error('Error removing member:', error);
          throw error;
        }

        console.log('Member removed successfully');
        await fetchShoppingLists();
      } catch (error) {
        console.error('Error removing member:', error);
        Alert.alert('Error', 'Failed to remove member');
      }
    } else {
      // Local removal
      setShoppingLists(prevLists =>
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
    }
  }, [isUsingSupabase, user, fetchShoppingLists]);

  // Clear history
  const clearListHistory = useCallback(async (listId: string) => {
    console.log('Clearing history for list:', listId);
    
    if (isUsingSupabase && user && user.email !== mockUser.email) {
      try {
        const { error } = await supabase
          .from('shopping_items')
          .delete()
          .eq('list_id', listId)
          .eq('done', true);

        if (error) {
          console.error('Error clearing history:', error);
          throw error;
        }

        console.log('History cleared successfully');
        await fetchShoppingLists();
      } catch (error) {
        console.error('Error clearing history:', error);
        Alert.alert('Error', 'Failed to clear history');
      }
    } else {
      // Local clear
      setShoppingLists(prevLists =>
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
    }
  }, [isUsingSupabase, user, fetchShoppingLists]);

  // Update item order
  const updateItemOrder = useCallback(async (listId: string, itemId: string, newIndex: number) => {
    console.log('Updating item order:', itemId, 'to index:', newIndex);
    
    if (isUsingSupabase && user && user.email !== mockUser.email) {
      try {
        const { error } = await supabase
          .from('shopping_items')
          .update({
            order_index: newIndex,
            updated_at: new Date().toISOString(),
          })
          .eq('id', itemId);

        if (error) {
          console.error('Error updating order:', error);
          throw error;
        }

        console.log('Order updated successfully');
        await fetchShoppingLists();
      } catch (error) {
        console.error('Error updating order:', error);
        Alert.alert('Error', 'Failed to update order');
      }
    } else {
      // Local update
      setShoppingLists(prevLists =>
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
    }
  }, [isUsingSupabase, user, fetchShoppingLists]);

  // Set up real-time subscriptions for Supabase
  useEffect(() => {
    if (!isUsingSupabase || !user || user.email === mockUser.email) {
      return;
    }

    console.log('Setting up real-time subscriptions');

    // Subscribe to shopping_items changes
    const itemsSubscription = supabase
      .channel('shopping_items_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_items',
        },
        (payload) => {
          console.log('Items change received:', payload);
          fetchShoppingLists();
        }
      )
      .subscribe();

    // Subscribe to shopping_lists changes
    const listsSubscription = supabase
      .channel('shopping_lists_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_lists',
        },
        (payload) => {
          console.log('Lists change received:', payload);
          fetchShoppingLists();
        }
      )
      .subscribe();

    // Subscribe to list_members changes
    const membersSubscription = supabase
      .channel('list_members_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'list_members',
        },
        (payload) => {
          console.log('Members change received:', payload);
          fetchShoppingLists();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscriptions');
      itemsSubscription.unsubscribe();
      listsSubscription.unsubscribe();
      membersSubscription.unsubscribe();
    };
  }, [isUsingSupabase, user, fetchShoppingLists]);

  // Initial fetch
  useEffect(() => {
    fetchShoppingLists();
  }, [fetchShoppingLists]);

  return {
    shoppingLists,
    loading,
    user,
    isUsingSupabase,
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
    refreshLists: fetchShoppingLists,
  };
};
