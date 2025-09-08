
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router, Redirect } from 'expo-router';
import { useShoppingLists } from '../hooks/useShoppingLists';
import { commonStyles, colors } from '../styles/commonStyles';
import ShoppingListCard from '../components/ShoppingListCard';
import CreateListModal from '../components/CreateListModal';
import Button from '../components/Button';

export default function ListsScreen() {
  const { shoppingLists, createList, loading } = useShoppingLists();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Auto-redirect if only one list
  useEffect(() => {
    if (!loading && shoppingLists && shoppingLists.length === 1) {
      console.log('Auto-redirecting to single list:', shoppingLists[0].id);
      router.replace(`/list/${shoppingLists[0].id}`);
    }
  }, [shoppingLists, loading]);

  const handleCreateList = (name: string, members: string[]) => {
    console.log('Creating list:', name, 'with members:', members);
    createList(name, members);
    setShowCreateModal(false);
  };

  const handleListPress = (listId: string) => {
    console.log('Navigating to list:', listId);
    router.push(`/list/${listId}`);
  };

  if (loading) {
    return (
      <View style={commonStyles.container}>
        <Text style={commonStyles.text}>Loading...</Text>
      </View>
    );
  }

  if (!shoppingLists || shoppingLists.length === 0) {
    return (
      <View style={commonStyles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Shopping Lists</Text>
          <Text style={styles.emptySubtitle}>Create your first shopping list to get started</Text>
          <Button
            text="Create New List"
            onPress={() => setShowCreateModal(true)}
            style={styles.createButton}
          />
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

  return (
    <View style={commonStyles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.title}>Shopping Lists</Text>
        <Button
          text="New List"
          onPress={() => setShowCreateModal(true)}
          style={styles.newListButton}
        />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  newListButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  scrollView: {
    flex: 1,
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
    backgroundColor: colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
});
