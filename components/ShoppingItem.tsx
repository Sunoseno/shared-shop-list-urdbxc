
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { ShoppingItem as ShoppingItemType } from '../types/ShoppingList';
import { colors } from '../styles/commonStyles';
import Icon from './Icon';

interface ShoppingItemProps {
  item: ShoppingItemType;
  onToggleDone: () => void;
  onUpdateRepeating: () => void;
  onUpdateDescription: (description: string) => void;
  onShowDescription: () => void;
}

export default function ShoppingItem({ 
  item, 
  onToggleDone, 
  onUpdateRepeating, 
  onUpdateDescription,
  onShowDescription 
}: ShoppingItemProps) {
  const [showDescription, setShowDescription] = useState(false);

  const getRepeatingIcon = () => {
    switch (item.isRepeating) {
      case 'daily': return 'today';
      case 'weekly': return 'calendar';
      case 'monthly': return 'calendar-outline';
      default: return 'repeat-outline';
    }
  };

  const getRepeatingColor = () => {
    return item.isRepeating !== 'none' ? colors.accent : colors.grey;
  };

  const handleDescriptionPress = () => {
    if (item.description) {
      Alert.alert('Description', item.description);
    } else {
      Alert.prompt(
        'Add Description',
        'Enter a description for this item:',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Save', 
            onPress: (text) => {
              if (text) {
                onUpdateDescription(text);
              }
            }
          }
        ]
      );
    }
  };

  return (
    <View style={[styles.container, item.isDone && styles.doneContainer]}>
      <TouchableOpacity 
        style={styles.checkButton}
        onPress={onToggleDone}
        accessibilityRole="button"
        accessibilityLabel={`Mark ${item.name} as ${item.isDone ? 'not done' : 'done'}`}
      >
        <Icon 
          name={item.isDone ? "checkmark-circle" : "ellipse-outline"} 
          size={24} 
          color={item.isDone ? colors.accent : colors.grey} 
        />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={[styles.name, item.isDone && styles.doneName]}>
          {item.name}
        </Text>
        {item.description && (
          <Text style={styles.description} numberOfLines={1}>
            {item.description}
          </Text>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleDescriptionPress}
          accessibilityRole="button"
          accessibilityLabel={`${item.description ? 'View' : 'Add'} description for ${item.name}`}
        >
          <Icon 
            name={item.description ? "document-text" : "document-text-outline"} 
            size={20} 
            color={item.description ? colors.accent : colors.grey} 
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onUpdateRepeating}
          accessibilityRole="button"
          accessibilityLabel={`Set ${item.name} to repeat ${item.isRepeating === 'none' ? 'daily' : item.isRepeating === 'daily' ? 'weekly' : item.isRepeating === 'weekly' ? 'monthly' : 'never'}`}
        >
          <Icon 
            name={getRepeatingIcon()} 
            size={20} 
            color={getRepeatingColor()} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
    marginHorizontal: 16,
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  doneContainer: {
    opacity: 0.6,
  },
  checkButton: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  doneName: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  description: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: 8,
    padding: 4,
  },
});
