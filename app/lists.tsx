
import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router, Redirect } from 'expo-router';
import { useShoppingLists } from '../hooks/useShoppingLists';
import { commonStyles, colors } from '../styles/commonStyles';
import ShoppingListCard from '../components/ShoppingListCard';
import Button from '../components/Button';

export default function ListsScreen() {
  const { lists, createList } = useShoppingLists();

  useEffect(() => {
    console.log('Lists screen loaded with', lists.length, 'lists');
  }, [lists]);

  // If there's only one list, redirect to it
  if (lists.length === 1) {
    return <Redirect href={`/list/${lists[0].id}`} />;
  }

  const handleCreateList = () => {
    const listId = createList(`Shopping List ${lists.length + 1}`);
    router.push(`/list/${listId}`);
  };

  const handleListPress = (listId: string) => {
    router.push(`/list/${listId}`);
  };

  return (
    <View style={commonStyles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.title}>My Shopping Lists</Text>
        <Text style={styles.subtitle}>
          {lists.length} {lists.length === 1 ? 'list' : 'lists'}
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {lists.map((list) => (
          <ShoppingListCard
            key={list.id}
            list={list}
            onPress={() => handleListPress(list.id)}
          />
        ))}
        
        <View style={styles.buttonContainer}>
          <Button
            text="Create New List"
            onPress={handleCreateList}
            style={styles.createButton}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.7,
  },
  scrollView: {
    flex: 1,
  },
  buttonContainer: {
    padding: 16,
    paddingTop: 8,
  },
  createButton: {
    backgroundColor: colors.accent,
    marginBottom: 20,
  },
});
