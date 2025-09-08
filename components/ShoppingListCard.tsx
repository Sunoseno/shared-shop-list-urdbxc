
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ShoppingList } from '../types/ShoppingList';
import { colors } from '../styles/commonStyles';
import Icon from './Icon';

interface ShoppingListCardProps {
  list: ShoppingList;
  onPress: () => void;
}

export default function ShoppingListCard({ list, onPress }: ShoppingListCardProps) {
  const activeItemsCount = list.items.filter(item => !item.isDone).length;
  const completedItemsCount = list.items.filter(item => item.isDone).length;

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Shopping list ${list.name} with ${activeItemsCount} active items and ${completedItemsCount} completed items`}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{list.name}</Text>
        <Icon name="chevron-forward" size={20} color={colors.text} />
      </View>
      
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Icon name="list" size={16} color={colors.accent} />
          <Text style={styles.statText}>{activeItemsCount} active</Text>
        </View>
        <View style={styles.stat}>
          <Icon name="checkmark-circle" size={16} color={colors.grey} />
          <Text style={styles.statText}>{completedItemsCount} done</Text>
        </View>
        <View style={styles.stat}>
          <Icon name="people" size={16} color={colors.accent} />
          <Text style={styles.statText}>{list.members.length} members</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statText: {
    fontSize: 12,
    color: colors.text,
    marginLeft: 4,
    opacity: 0.8,
  },
});
