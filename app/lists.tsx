
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useShoppingLists } from '../hooks/useShoppingLists';
import { commonStyles, colors } from '../styles/commonStyles';
import ShoppingListCard from '../components/ShoppingListCard';
import CreateListModal from '../components/CreateListModal';
import Icon from '../components/Icon';

export default function ListsScreen() {
  console.log('ListsScreen: Rendering');
  
  const { shoppingLists, createList, loading } = useShoppingLists();
  const [showCreateModal, setShowCreateModal] = useState(false);

  console.log('ListsScreen: State - loading:', loading, 'lists count:', shoppingLists?.length || 0);

  // Auto-redirect if only one list (but only after loading is complete)
  useEffect(() => {
    if (!loading && shoppingLists && shoppingLists.length === 1) {
      console.log('ListsScreen: Auto-redirecting to single list:', shoppingLists[0].id);
      router.replace(`/list/${shoppingLists[0].id}`);
    }
  }, [shoppingLists, loading]);

  const handleCreateList = (name: string, members: string[]) => {
    console.log('ListsScreen: Creating list:', name, 'with members:', members);
    const newListId = createList(name, members);
    setShowCreateModal(false);
    
    // Navigate to the new list immediately so user can add items
    if (newListId) {
      router.push(`/list/${newListId}`);
    }
  };

  const handleListPress = (listId: string) => {
    console.log('ListsScreen: Navigating to list:', listId);
    router.push(`/list/${listId}`);
  };

  // Show loading only briefly
  if (loading) {
    console.log('ListsScreen: Showing loading state');
    return (
      <View style={[commonStyles.wrapper, styles.container]}>
        <Text style={[commonStyles.text, styles.loadingText]}>Loading shopping lists...</Text>
      </View>
    );
  }

  // Show empty state if no lists
  if (!shoppingLists || shoppingLists.length === 0) {
    console.log('ListsScreen: Showing empty state');
    return (
      <View style={[commonStyles.wrapper, styles.container]}>
        <View style={styles.emptyState}>
          <Icon name="basket-outline" size={64} color={colors.grey} />
          <Text style={styles.emptyTitle}>No Shopping Lists</Text>
          <Text style={styles.emptySubtitle}>Create your first shopping list to get started</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
            accessibilityRole="button"
            accessibilityLabel="Create new shopping list"
          >
            <Icon name="add" size={24} color={colors.background} />
            <Text style={styles.createButtonText}>Create New List</Text>
          </TouchableOpacity>
        </View>
        
        {showCreateModal && (
          <CreateListModal
            onCreateList={handleCreateList}
            onCancel={() => setShowCreateModal(false)}
          />
        )}
      </View>
    );
  }

  console.log('ListsScreen: Showing lists:', shoppingLists.map(l => l.name));

  return (
    <View style={[commonStyles.wrapper, styles.container]}>
      <View style={styles.header}>
        <Text style={styles.title}>Shopping Lists</Text>
        <TouchableOpacity
          style={styles.newListButton}
          onPress={() => setShowCreateModal(true)}
          accessibilityRole="button"
          accessibilityLabel="Create new shopping list"
        >
          <Icon name="add" size={24} color={colors.background} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {shoppingLists.map((list) => (
          <ShoppingListCard
            key={list.id}
            list={list}
            onPress={() => handleListPress(list.id)}
          />
        ))}
      </ScrollView>

      {showCreateModal && (
        <CreateListModal
          onCreateList={handleCreateList}
          onCancel={() => setShowCreateModal(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  newListButton: {
    backgroundColor: colors.accent,
    borderRadius: 50,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
    elevation: 4,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.7,
    marginBottom: 32,
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
    elevation: 4,
  },
  createButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
