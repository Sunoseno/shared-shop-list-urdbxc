
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { ShoppingList, ShoppingItem } from '../types/ShoppingList';
import { Alert } from 'react-native';
import uuid from 'react-native-uuid';
import { mockShoppingLists, mockUser } from '../data/mockData';
import { useAuth } from './useAuth';

interface HistoryItem {
  id: string;
  list_id: string;
  original_item_id: string;
  name: string;
  description: string;
  completed_at: string;
  repeating: string;
}

export const useShoppingLists = () => {
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedItemTimeouts, setCompletedItemTimeouts] = useState<Map<string, NodeJS.Timeout>>(new Map());
  
  const { user, session } = useAuth();
  const isAuthenticated = !!session;

  // Fetch history items from Supabase
  const fetchHistoryItems = useCallback(async () => {
    if (!user?.email) {
      console.log('fetchHistoryItems: No user email, returning empty array');
      return [];
    }

    try {
      console.log('fetchHistoryItems: Fetching history for user:', user.email);
      
      // Get all accessible lists first
      console.log('fetchHistoryItems: Getting accessible lists...');
      const { data: accessibleLists, error: listsError } = await supabase
        .from('shopping_lists')
        .select('id');

      if (listsError) {
        console.error('fetchHistoryItems: Error fetching accessible lists:', listsError);
        return [];
      }

      if (!accessibleLists || accessibleLists.length === 0) {
        console.log('fetchHistoryItems: No accessible lists found');
        return [];
      }

      console.log('fetchHistoryItems: Found', accessibleLists.length, 'accessible lists');
      const listIds = accessibleLists.map(list => list.id);

      console.log('fetchHistoryItems: Fetching history items for list IDs:', listIds);
      const { data: history, error } = await supabase
        .from('history_items')
        .select('*')
        .in('list_id', listIds)
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('fetchHistoryItems: Error fetching history:', error);
        return [];
      }

      console.log('fetchHistoryItems: Found', history?.length || 0, 'history items');
      return history || [];
    } catch (error) {
      console.error('fetchHistoryItems: Error fetching history items:', error);
      return [];
    }
  }, [user?.email]);

  // Fetch shopping lists from Supabase
  const fetchSupabaseLists = useCallback(async () => {
    if (!user?.email) {
      console.log('fetchSupabaseLists: No user email, returning empty array');
      return [];
    }

    try {
      console.log('fetchSupabaseLists: Fetching lists from Supabase for user:', user.email);
      
      // Get all lists the user has access to (owned or member)
      // The RLS policy should now handle both cases without circular dependency
      console.log('fetchSupabaseLists: Querying shopping_lists table...');
      const { data: allLists, error: listsError } = await supabase
        .from('shopping_lists')
        .select('*')
        .order('created_at', { ascending: false });

      if (listsError) {
        console.error('fetchSupabaseLists: Error fetching lists:', listsError);
        console.error('fetchSupabaseLists: Error code:', listsError.code);
        console.error('fetchSupabaseLists: Error message:', listsError.message);
        throw listsError;
      }

      console.log('fetchSupabaseLists: Found accessible lists:', allLists?.length || 0);

      console.log('fetchSupabaseLists: Found accessible lists:', allLists?.length || 0);

      if (allLists.length === 0) {
        console.log('No lists found for user:', user.email);
        return [];
      }

      // Get items and members for each list
      const listsWithItems: ShoppingList[] = [];
      
      console.log('fetchSupabaseLists: Processing', allLists.length, 'lists...');
      
      for (const listData of allLists) {
        console.log('fetchSupabaseLists: Processing list:', listData.name, 'ID:', listData.id);
        
        // Get items for this list
        console.log('fetchSupabaseLists: Fetching items for list:', listData.id);
        const { data: items, error: itemsError } = await supabase
          .from('shopping_items')
          .select('*')
          .eq('list_id', listData.id)
          .order('order_index');

        if (itemsError) {
          console.error('fetchSupabaseLists: Error fetching items for list', listData.id, ':', itemsError);
          continue;
        }

        console.log('fetchSupabaseLists: Found', items?.length || 0, 'items for list:', listData.name);

        // Get members for this list
        // Due to RLS, users can only see their own membership record
        // So we'll get what we can and include the owner
        console.log('fetchSupabaseLists: Fetching members for list:', listData.id);
        const { data: visibleMembers, error: membersError } = await supabase
          .from('list_members')
          .select('email')
          .eq('list_id', listData.id);

        if (membersError) {
          console.error('fetchSupabaseLists: Error fetching members for list', listData.id, ':', membersError);
        }

        console.log('fetchSupabaseLists: Found', visibleMembers?.length || 0, 'visible members for list:', listData.name);

        // Always include the list owner and any visible members
        const members = [listData.owner];
        if (visibleMembers) {
          for (const member of visibleMembers) {
            if (!members.includes(member.email)) {
              members.push(member.email);
            }
          }
        }

        console.log('fetchSupabaseLists: Total members for list', listData.name, ':', members);

        // Get history items for this list
        console.log('fetchSupabaseLists: Fetching history for list:', listData.id);
        const { data: history, error: historyError } = await supabase
          .from('history_items')
          .select('*')
          .eq('list_id', listData.id)
          .order('completed_at', { ascending: false });

        if (historyError) {
          console.error('fetchSupabaseLists: Error fetching history for list', listData.id, ':', historyError);
        }

        console.log('fetchSupabaseLists: Found', history?.length || 0, 'history items for list:', listData.name);

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

        // Add history items as completed shopping items
        const historyAsItems: ShoppingItem[] = (history || []).map(histItem => ({
          id: `history-${histItem.id}`,
          name: histItem.name,
          description: histItem.description || '',
          done: true,
          repeating: histItem.repeating === 'none' ? null : histItem.repeating,
          createdAt: new Date(histItem.completed_at),
          doneAt: new Date(histItem.completed_at),
          order: 0,
        }));

        const finalList = {
          id: listData.id,
          name: listData.name,
          items: [...shoppingItems, ...historyAsItems],
          members: members,
          owner: listData.owner,
        };

        console.log('fetchSupabaseLists: Created final list object for:', listData.name, 'with', finalList.items.length, 'total items');
        listsWithItems.push(finalList);
      }

      console.log('fetchSupabaseLists: Completed processing. Total lists with items:', listsWithItems.length);
      return listsWithItems;
    } catch (error) {
      console.error('Error fetching Supabase lists:', error);
      return [];
    }
  }, [user?.email]);

  // Main fetch function
  const fetchShoppingLists = useCallback(async () => {
    console.log('fetchShoppingLists: Starting fetch...');
    console.log('fetchShoppingLists: isAuthenticated:', isAuthenticated);
    console.log('fetchShoppingLists: user email:', user?.email);
    setLoading(true);

    try {
      if (isAuthenticated && user?.email) {
        console.log('fetchShoppingLists: Fetching from Supabase for user:', user.email);
        const supabaseLists = await fetchSupabaseLists();
        console.log('fetchShoppingLists: Got lists from Supabase:', supabaseLists.length);
        
        const history = await fetchHistoryItems();
        console.log('fetchShoppingLists: Got history items:', history.length);
        
        setShoppingLists(supabaseLists);
        setHistoryItems(history);
        console.log('fetchShoppingLists: Successfully set', supabaseLists.length, 'lists from Supabase');
      } else {
        // Use mock data for unauthenticated users
        console.log('fetchShoppingLists: Using mock data - user not authenticated');
        setShoppingLists(mockShoppingLists);
        setHistoryItems([]);
      }
    } catch (error) {
      console.error('fetchShoppingLists: Error in fetchShoppingLists:', error);
      console.error('fetchShoppingLists: Error details:', error.message, error.code);
      Alert.alert('Error', `Failed to load shopping lists: ${error.message || 'Unknown error'}. Using offline mode.`);
      setShoppingLists(mockShoppingLists);
      setHistoryItems([]);
    } finally {
      setLoading(false);
      console.log('fetchShoppingLists: Fetch completed');
    }
  }, [isAuthenticated, user?.email, fetchSupabaseLists, fetchHistoryItems]);

  // Create new list - FIXED: Don't set ID manually, let database generate it
  const createList = useCallback(async (listName: string, initialMembers: string[] = []) => {
    console.log('Creating list:', listName, 'with members:', initialMembers);
    
    if (isAuthenticated && user?.email) {
      try {
        const userEmail = user.email;

        // Create the list - let database generate the ID
        const { data: newList, error: listError } = await supabase
          .from('shopping_lists')
          .insert({
            name: listName,
            owner: userEmail,
          })
          .select('id')
          .single();

        if (listError) {
          console.error('Error creating list:', listError);
          Alert.alert('Error', `Failed to create list: ${listError.message}`);
          return null;
        }

        if (!newList?.id) {
          console.error('No list ID returned from database');
          Alert.alert('Error', 'Failed to create list - no ID returned');
          return null;
        }

        const listId = newList.id;
        console.log('List created with ID:', listId);

        // Owner is automatically added as member by database trigger

        // Add initial members
        for (const email of initialMembers) {
          if (email && email !== userEmail) {
            try {
              await inviteMember(listId, email);
            } catch (memberError) {
              console.error('Error adding member:', email, memberError);
              // Continue with other members even if one fails
            }
          }
        }

        console.log('List created successfully with ID:', listId);
        await fetchShoppingLists();
        return listId;
      } catch (error) {
        console.error('Error creating list:', error);
        Alert.alert('Error', `Failed to create list: ${error.message || 'Unknown error'}`);
        return null;
      }
    } else {
      // Local creation for unauthenticated users
      const newListId = uuid.v4() as string;
      const newList: ShoppingList = {
        id: newListId,
        name: listName,
        items: [],
        members: [mockUser.email, ...initialMembers],
        owner: mockUser.email,
      };
      
      setShoppingLists(prevLists => [...prevLists, newList]);
      console.log('List created locally with ID:', newListId);
      return newListId;
    }
  }, [isAuthenticated, user?.email, fetchShoppingLists]);

  // Add item to list
  const addItem = useCallback(async (listId: string, itemName: string) => {
    console.log('Adding item:', itemName, 'to list:', listId);
    
    if (isAuthenticated && user?.email) {
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
  }, [isAuthenticated, user?.email, fetchShoppingLists]);

  // Move completed items to history (called after 10 seconds)
  const moveItemToHistory = useCallback(async (listId: string, itemId: string) => {
    console.log('Moving item to history:', itemId);
    
    if (isAuthenticated && user?.email) {
      try {
        // First, get the item details
        const { data: item, error: itemError } = await supabase
          .from('shopping_items')
          .select('*')
          .eq('id', itemId)
          .eq('done', true)
          .single();

        if (itemError || !item) {
          console.log('Item not found or not completed, skipping history move');
          return;
        }

        // Check if item has been completed for more than 10 seconds
        if (!item.done_at || (Date.now() - new Date(item.done_at).getTime()) < 10000) {
          console.log('Item not ready for history move yet');
          return;
        }

        // Move to history
        const { error: historyError } = await supabase
          .from('history_items')
          .insert({
            list_id: item.list_id,
            original_item_id: item.id,
            name: item.name,
            description: item.description || '',
            completed_at: item.done_at,
            repeating: item.repeating || 'none',
          });

        if (historyError) {
          console.error('Error adding to history:', historyError);
          return;
        }

        // Delete from shopping_items
        const { error: deleteError } = await supabase
          .from('shopping_items')
          .delete()
          .eq('id', itemId);

        if (deleteError) {
          console.error('Error deleting item:', deleteError);
          return;
        }

        console.log('Item moved to history successfully');
        await fetchShoppingLists();
      } catch (error) {
        console.error('Error in moveItemToHistory:', error);
      }
    } else {
      // For local storage, we handle this in the UI filtering
      console.log('Local mode: Item will be filtered as history in UI');
    }
  }, [isAuthenticated, user?.email, fetchShoppingLists]);

  // Toggle item done status with proper 10-second history handling
  const toggleItemDone = useCallback(async (listId: string, itemId: string) => {
    console.log('Toggling item done:', itemId);
    
    // Skip if this is a history item
    if (itemId.startsWith('history-')) {
      console.log('Cannot toggle history item');
      return;
    }
    
    if (isAuthenticated && user?.email) {
      try {
        // Get current item
        const { data: currentItem } = await supabase
          .from('shopping_items')
          .select('done, done_at')
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

        // Handle 10-second timeout for moving to history
        if (newDoneStatus) {
          // Clear any existing timeout for this item
          const existingTimeout = completedItemTimeouts.get(itemId);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }

          // Set new timeout to move to history after 10 seconds
          const timeout = setTimeout(async () => {
            console.log('Moving item to history after 10 seconds:', itemId);
            await moveItemToHistory(listId, itemId);
            setCompletedItemTimeouts(prev => {
              const newMap = new Map(prev);
              newMap.delete(itemId);
              return newMap;
            });
          }, 10000);

          setCompletedItemTimeouts(prev => {
            const newMap = new Map(prev);
            newMap.set(itemId, timeout);
            return newMap;
          });
        } else {
          // Item was unmarked, clear timeout
          const existingTimeout = completedItemTimeouts.get(itemId);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
            setCompletedItemTimeouts(prev => {
              const newMap = new Map(prev);
              newMap.delete(itemId);
              return newMap;
            });
          }
        }
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
                  
                  // Handle timeouts for local storage
                  if (newDoneStatus) {
                    // Clear any existing timeout
                    const existingTimeout = completedItemTimeouts.get(itemId);
                    if (existingTimeout) {
                      clearTimeout(existingTimeout);
                    }

                    // Set new timeout
                    const timeout = setTimeout(() => {
                      console.log('Moving local item to history after 10 seconds:', itemId);
                      setCompletedItemTimeouts(prev => {
                        const newMap = new Map(prev);
                        newMap.delete(itemId);
                        return newMap;
                      });
                    }, 10000);

                    setCompletedItemTimeouts(prev => {
                      const newMap = new Map(prev);
                      newMap.set(itemId, timeout);
                      return newMap;
                    });
                  } else {
                    // Clear timeout if unmarked
                    const existingTimeout = completedItemTimeouts.get(itemId);
                    if (existingTimeout) {
                      clearTimeout(existingTimeout);
                      setCompletedItemTimeouts(prev => {
                        const newMap = new Map(prev);
                        newMap.delete(itemId);
                        return newMap;
                      });
                    }
                  }

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
  }, [isAuthenticated, user?.email, fetchShoppingLists, completedItemTimeouts, moveItemToHistory]);

  // Add item back from history (creates a copy)
  const addItemBackFromHistory = useCallback(async (listId: string, historyItem: ShoppingItem) => {
    console.log('Adding item back from history:', historyItem.name);
    
    if (isAuthenticated && user?.email) {
      try {
        // Get current max order
        const { data: maxOrderData } = await supabase
          .from('shopping_items')
          .select('order_index')
          .eq('list_id', listId)
          .order('order_index', { ascending: false })
          .limit(1);

        const maxOrder = maxOrderData?.[0]?.order_index || 0;

        // Create new item (copy from history)
        const { error } = await supabase
          .from('shopping_items')
          .insert({
            list_id: listId,
            name: historyItem.name,
            description: historyItem.description || '',
            done: false,
            repeating: historyItem.repeating || 'none',
            order_index: maxOrder + 1,
          });

        if (error) {
          console.error('Error adding item back from history:', error);
          throw error;
        }

        console.log('Item added back from history successfully');
        await fetchShoppingLists();
      } catch (error) {
        console.error('Error adding item back from history:', error);
        Alert.alert('Error', 'Failed to add item back to list');
      }
    } else {
      // Local addition
      setShoppingLists(prevLists =>
        prevLists.map(list => {
          if (list.id === listId) {
            const maxOrder = Math.max(...(list.items || []).map(item => item.order || 0), 0);
            const newItem: ShoppingItem = {
              id: uuid.v4() as string,
              name: historyItem.name,
              description: historyItem.description || '',
              done: false,
              repeating: historyItem.repeating,
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
  }, [isAuthenticated, user?.email, fetchShoppingLists]);

  // Update item description
  const updateItemDescription = useCallback(async (listId: string, itemId: string, description: string) => {
    console.log('Updating item description:', itemId, description);
    
    // Skip if this is a history item
    if (itemId.startsWith('history-')) {
      console.log('Cannot update history item');
      return;
    }
    
    if (isAuthenticated && user?.email) {
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
  }, [isAuthenticated, user?.email, fetchShoppingLists]);

  // Update item name
  const updateItemName = useCallback(async (listId: string, itemId: string, newName: string) => {
    console.log('Updating item name:', itemId, newName);
    
    // Skip if this is a history item
    if (itemId.startsWith('history-')) {
      console.log('Cannot update history item');
      return;
    }
    
    if (isAuthenticated && user?.email) {
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
  }, [isAuthenticated, user?.email, fetchShoppingLists]);

  // Set item repeat
  const setItemRepeat = useCallback(async (listId: string, itemId: string) => {
    console.log('Setting item repeat:', itemId);
    
    // Skip if this is a history item
    if (itemId.startsWith('history-')) {
      console.log('Cannot update history item');
      return;
    }
    
    if (isAuthenticated && user?.email) {
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
  }, [isAuthenticated, user?.email, fetchShoppingLists]);

  // Remove item
  const removeItem = useCallback(async (listId: string, itemId: string) => {
    console.log('Removing item:', itemId);
    
    // Skip if this is a history item
    if (itemId.startsWith('history-')) {
      console.log('Cannot remove history item');
      return;
    }
    
    if (isAuthenticated && user?.email) {
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
  }, [isAuthenticated, user?.email, fetchShoppingLists]);

  // Invite member
  const inviteMember = useCallback(async (listId: string, email: string) => {
    console.log('Inviting member:', email, 'to list:', listId);
    
    if (isAuthenticated && user?.email) {
      try {
        // Check if already a member
        const { data: existingMember, error: checkError } = await supabase
          .from('list_members')
          .select('id')
          .eq('list_id', listId)
          .eq('email', email)
          .maybeSingle();

        if (checkError) {
          console.error('Error checking existing member:', checkError);
          throw checkError;
        }

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
          // Don't throw here, continue with adding member
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
          Alert.alert('Error', `Failed to add member: ${memberError.message}`);
          return;
        }

        console.log('Member invited successfully');
        Alert.alert('Success', `${email} has been added to the list`);
        await fetchShoppingLists();
      } catch (error) {
        console.error('Error inviting member:', error);
        Alert.alert('Error', `Failed to invite member: ${error.message || 'Unknown error'}`);
      }
    } else {
      // Local invite (show message about authentication)
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
  }, [isAuthenticated, user?.email, fetchShoppingLists]);

  // Remove member
  const removeMember = useCallback(async (listId: string, email: string) => {
    console.log('Removing member:', email, 'from list:', listId);
    
    if (isAuthenticated && user?.email) {
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
  }, [isAuthenticated, user?.email, fetchShoppingLists]);

  // Clear history
  const clearListHistory = useCallback(async (listId: string) => {
    console.log('Clearing history for list:', listId);
    
    if (isAuthenticated && user?.email) {
      try {
        // Delete from history_items table
        const { error: historyError } = await supabase
          .from('history_items')
          .delete()
          .eq('list_id', listId);

        if (historyError) {
          console.error('Error clearing history items:', historyError);
          throw historyError;
        }

        // Also delete any completed shopping_items that haven't been moved to history yet
        const { error: itemsError } = await supabase
          .from('shopping_items')
          .delete()
          .eq('list_id', listId)
          .eq('done', true);

        if (itemsError) {
          console.error('Error clearing completed items:', itemsError);
          throw itemsError;
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
  }, [isAuthenticated, user?.email, fetchShoppingLists]);

  // Update item order
  const updateItemOrder = useCallback(async (listId: string, itemId: string, newIndex: number) => {
    console.log('Updating item order:', itemId, 'to index:', newIndex);
    
    // Skip if this is a history item
    if (itemId.startsWith('history-')) {
      console.log('Cannot reorder history item');
      return;
    }
    
    if (isAuthenticated && user?.email) {
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
  }, [isAuthenticated, user?.email, fetchShoppingLists]);

  // Set up real-time subscriptions for Supabase
  useEffect(() => {
    if (!isAuthenticated || !user?.email) {
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

    // Subscribe to history_items changes
    const historySubscription = supabase
      .channel('history_items_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'history_items',
        },
        (payload) => {
          console.log('History change received:', payload);
          fetchShoppingLists();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscriptions');
      itemsSubscription.unsubscribe();
      listsSubscription.unsubscribe();
      membersSubscription.unsubscribe();
      historySubscription.unsubscribe();
    };
  }, [isAuthenticated, user?.email, fetchShoppingLists]);

  // Initial fetch
  useEffect(() => {
    fetchShoppingLists();
  }, [fetchShoppingLists]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      completedItemTimeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [completedItemTimeouts]);

  return {
    shoppingLists,
    loading,
    user: user || mockUser,
    isAuthenticated,
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
    addItemBackFromHistory,
    refreshLists: fetchShoppingLists,
  };
};
