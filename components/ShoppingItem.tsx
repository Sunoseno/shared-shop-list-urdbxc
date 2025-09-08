
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import { ShoppingItem as ShoppingItemType } from '../types/ShoppingList';
import { colors } from '../styles/commonStyles';
import Icon from './Icon';

interface ShoppingItemProps {
  item: ShoppingItemType;
  onToggleDone: () => void;
  onUpdateRepeating: () => void;
  onUpdateDescription: (description: string) => void;
  onUpdateName: (name: string) => void;
  onShowDescription: () => void;
  onEditDescription?: () => void;
  isHistoryItem?: boolean;
  onAddBackToList?: () => void;
}

export default function ShoppingItem({ 
  item, 
  onToggleDone, 
  onUpdateRepeating, 
  onUpdateDescription,
  onUpdateName,
  onShowDescription,
  onEditDescription,
  isHistoryItem = false,
  onAddBackToList
}: ShoppingItemProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(item.name);

  const getRepeatingIcon = () => {
    switch (item.repeating) {
      case 'daily': return 'D';
      case 'weekly': return 'W';
      case 'monthly': return 'M';
      default: return 'repeat-outline';
    }
  };

  const getRepeatingColor = () => {
    return item.repeating !== 'none' && item.repeating !== null ? colors.accent : colors.grey;
  };

  const handleDescriptionPress = () => {
    // Do nothing when clicking on description text
    console.log('Description clicked - no action');
  };

  const handleNamePress = () => {
    if (!isHistoryItem) {
      setIsEditingName(true);
      setEditedName(item.name);
    }
  };

  const handleNameSave = () => {
    if (editedName.trim() && editedName.trim() !== item.name) {
      onUpdateName(editedName.trim());
    }
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setEditedName(item.name);
    setIsEditingName(false);
  };

  const handleBackgroundPress = () => {
    if (isHistoryItem && onAddBackToList) {
      onAddBackToList();
    } else if (!isHistoryItem) {
      onToggleDone();
    }
  };

  const handleDescriptionIconPress = () => {
    if (onEditDescription) {
      onEditDescription();
    } else if (item.description) {
      onShowDescription();
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

  // Handle both old and new data structures
  const isDone = item.done !== undefined ? item.done : (item as any).isDone;
  const repeating = item.repeating !== undefined ? item.repeating : (item as any).isRepeating;
  const completedAt = item.doneAt !== undefined ? item.doneAt : (item as any).completedAt;

  return (
    <TouchableOpacity 
      style={[styles.container, isDone && styles.doneContainer]}
      onPress={handleBackgroundPress}
      accessibilityLabel={
        isHistoryItem 
          ? `Add ${item.name} back to list` 
          : `Mark ${item.name} as ${isDone ? 'not done' : 'done'}`
      }
    >
      {!isHistoryItem && (
        <TouchableOpacity 
          style={styles.checkButton}
          onPress={onToggleDone}
          accessibilityRole="button"
          accessibilityLabel={`Mark ${item.name} as ${isDone ? 'not done' : 'done'}`}
        >
          <Icon 
            name={isDone ? "checkmark-circle" : "ellipse-outline"} 
            size={24} 
            color={isDone ? colors.accent : colors.grey} 
          />
        </TouchableOpacity>
      )}

      <View style={styles.content}>
        {isEditingName ? (
          <View style={styles.nameEditContainer}>
            <TextInput
              style={styles.nameInput}
              value={editedName}
              onChangeText={setEditedName}
              onBlur={handleNameSave}
              onSubmitEditing={handleNameSave}
              autoFocus
              selectTextOnFocus
              accessibilityLabel="Edit item name"
            />
            <TouchableOpacity onPress={handleNameCancel} style={styles.cancelButton}>
              <Icon name="close" size={16} color={colors.grey} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            onPress={handleNamePress}
            style={styles.nameContainer}
            accessibilityLabel={`Edit name: ${item.name}`}
          >
            <Text style={[styles.name, isDone && styles.doneName]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
        
        {item.description && (
          <View style={styles.descriptionContainer}>
            <Text 
              style={styles.description} 
              numberOfLines={1}
              onPress={handleDescriptionPress}
            >
              {item.description}
            </Text>
          </View>
        )}
        
        {isHistoryItem && completedAt && (
          <Text style={styles.completedDate}>
            Completed: {new Date(completedAt).toLocaleDateString()} at {new Date(completedAt).toLocaleTimeString()}
          </Text>
        )}
      </View>

      {!isHistoryItem && (
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleDescriptionIconPress}
            accessibilityRole="button"
            accessibilityLabel={`${item.description ? 'Edit' : 'Add'} description for ${item.name}`}
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
            accessibilityLabel={`Set ${item.name} to repeat ${repeating === 'none' || repeating === null ? 'daily' : repeating === 'daily' ? 'weekly' : repeating === 'weekly' ? 'monthly' : 'never'}`}
          >
            {repeating !== 'none' && repeating !== null ? (
              <View style={styles.repeatTextContainer}>
                <Text style={[styles.repeatText, { color: getRepeatingColor() }]}>
                  {getRepeatingIcon()}
                </Text>
              </View>
            ) : (
              <Icon 
                name="repeat-outline" 
                size={20} 
                color={getRepeatingColor()} 
              />
            )}
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
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
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  nameEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    backgroundColor: colors.background,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  cancelButton: {
    marginLeft: 8,
    padding: 4,
  },
  descriptionContainer: {
    marginTop: 2,
  },
  description: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
  },
  completedDate: {
    fontSize: 10,
    color: colors.grey,
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
  repeatTextContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  repeatText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
