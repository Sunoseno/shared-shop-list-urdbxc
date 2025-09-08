
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { ShoppingList, ShoppingItem } from '../types/ShoppingList';
import { useAuth } from './useAuth';
import { Alert } from 'react-native';
import uuid from 'react-native-uuid';

export const useSupabaseShoppingLists = () => {
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Fetch shopping lists
  const fetchShoppingLists = useCallback(async () => {
    if (!user) {
      console.log('No user, skipping fetch');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching shopping lists for user:', user.email);
      
      // Set timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.log('Supabase fetch timeout, setting loading to false');
        setLoading(false);
      }, 10000);

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
        .eq('email', user.email || user.id);

      clearTimeout(timeoutId);

      if (memberError) {
        console.error('Error fetching member lists:', memberError);
        setLoading(false);
        return;
      }

      console.log('Member lists:', memberLists);

      // Get items for each list
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
          repeating: item.repeating,
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

      console.log('Fetched lists with items:', listsWithItems);
      setShoppingLists(listsWithItems);
    } catch (error) {
      console.error('Error fetching shopping lists:', error);
      // Don't show alert for network errors, just log them
      console.log('Failed to load shopping lists, continuing with empty state');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create new list
  const createList = async (listName: string, initialMembers: string[] = []) => {
    if (!user) {
      console.log('No user, cannot create list');
      return;
    }

    try {
      console.log('Creating list:', listName, 'with members:', initialMembers);
      
      const listId = uuid.v4() as string;
      const userEmail = user.email || user.id;

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

      console.log('List created successfully');
      await fetchShoppingLists();
    } catch (error) {
      console.error('Error creating list:', error);
      Alert.alert('Error', 'Failed to create list');
    }
  };

  // Add item to list
  const addItem = async (listId: string, itemName: string) => {
    if (!user) {
      console.log('No user, cannot add item');
      return;
    }

    try {
      console.log('Adding item:', itemName, 'to list:', listId);
      
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
  };

  // Toggle item done status
  const toggleItemDone = async (listId: string, itemId: string) => {
    try {
      console.log('Toggling item done:', itemId);
      
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
  };

  // Update item description
  const updateItemDescription = async (listId: string, itemId: string, description: string) => {
    try {
      console.log('Updating item description:', itemId, description);
      
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
  };

  // Update item name
  const updateItemName = async (listId: string, itemId: string, newName: string) => {
    try {
      console.log('Updating item name:', itemId, newName);
      
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
  };

  // Set item repeat
  const setItemRepeat = async (listId: string, itemId: string) => {
    try {
      console.log('Setting item repeat:', itemId);
      
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
  };

  // Remove item
  const removeItem = async (listId: string, itemId: string) => {
    try {
      console.log('Removing item:', itemId);
      
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
  };

  // Invite member
  const inviteMember = async (listId: string, email: string) => {
    if (!user) {
      console.log('No user, cannot invite member');
      return;
    }

    try {
      console.log('Inviting member:', email, 'to list:', listId);
      
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
  };

  // Remove member
  const removeMember = async (listId: string, email: string) => {
    if (!user) {
      console.log('No user, cannot remove member');
      return;
    }

    try {
      console.log('Removing member:', email, 'from list:', listId);
      
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
  };

  // Clear history
  const clearListHistory = async (listId: string) => {
    try {
      console.log('Clearing history for list:', listId);
      
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
  };

  // Update item order
  const updateItemOrder = async (listId: string, itemId: string, newIndex: number) => {
    try {
      console.log('Updating item order:', itemId, 'to index:', newIndex);
      
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
  };

  // Set up real-time subscriptions only if user exists
  useEffect(() => {
    if (!user) {
      console.log('No user, skipping real-time setup');
      setLoading(false);
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
  }, [user, fetchShoppingLists]);

  // Initial fetch
  useEffect(() => {
    fetchShoppingLists();
  }, [fetchShoppingLists]);

  return {
    shoppingLists,
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
    refreshLists: fetchShoppingLists,
  };
};
