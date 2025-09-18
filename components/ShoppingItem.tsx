
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
      case 'daily': return 'calendar';
      case 'weekly': return 'calendar-outline';
      case 'monthly': return 'calendar-clear-outline';
      default: return 'repeat-outline';
    }
  };

  const getRepeatingColor = () => {
    switch (item.repeating) {
      case 'daily': return colors.success;
      case 'weekly': return colors.accent;
      case 'monthly': return colors.warning;
      default: return colors.grey;
    }
  };

  const handleDescriptionPress = () => {
    if (item.description && item.description.trim()) {
      onShowDescription();
    } else if (onEditDescription && !isHistoryItem) {
      onEditDescription();
    }
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
    if (onEditDescription && !isHistoryItem) {
      onEditDescription();
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        item.done && styles.doneContainer,
        isHistoryItem && styles.historyContainer
      ]}
      onPress={handleBackgroundPress}
      accessibilityRole="button"
      accessibilityLabel={
        isHistoryItem 
          ? `Add ${item.name} back to list`
          : `Mark ${item.name} as ${item.done ? 'not done' : 'done'}`
      }
    >
      <View style={styles.leftSection}>
        <TouchableOpacity
          style={[styles.checkbox, item.done && styles.checkedBox]}
          onPress={isHistoryItem ? undefined : onToggleDone}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: item.done }}
          accessibilityLabel={`Mark ${item.name} as ${item.done ? 'not done' : 'done'}`}
        >
          {item.done && (
            <Icon name="checkmark" size={16} color={colors.background} />
          )}
        </TouchableOpacity>

        <View style={styles.contentSection}>
          {isEditingName ? (
            <View style={styles.nameEditContainer}>
              <TextInput
                style={styles.nameInput}
                value={editedName}
                onChangeText={setEditedName}
                onSubmitEditing={handleNameSave}
                onBlur={handleNameCancel}
                autoFocus
                selectTextOnFocus
                accessibilityLabel="Edit item name"
              />
            </View>
          ) : (
            <TouchableOpacity onPress={handleNamePress} style={styles.nameContainer}>
              <Text style={[styles.itemName, item.done && styles.doneText]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}

          {item.description && item.description.trim() && (
            <TouchableOpacity onPress={handleDescriptionPress}>
              <Text style={[styles.description, item.done && styles.doneText]} numberOfLines={2}>
                {item.description}
              </Text>
            </TouchableOpacity>
          )}

          {isHistoryItem && item.doneAt && (
            <Text style={styles.timestamp}>
              Completed {formatTimestamp(item.doneAt)}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.rightSection}>
        {isHistoryItem ? (
          <TouchableOpacity
            style={styles.addBackButton}
            onPress={onAddBackToList}
            accessibilityRole="button"
            accessibilityLabel={`Add ${item.name} back to shopping list`}
          >
            <Icon name="add-circle-outline" size={24} color={colors.accent} />
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={styles.iconButton}
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
              style={styles.iconButton}
              onPress={onUpdateRepeating}
              accessibilityRole="button"
              accessibilityLabel={`Set repeat schedule for ${item.name}. Currently ${item.repeating || 'not repeating'}`}
            >
              <Icon 
                name={getRepeatingIcon()} 
                size={20} 
                color={getRepeatingColor()} 
              />
            </TouchableOpacity>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    backgroundColor: colors.background,
    borderRadius: 12,
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  doneContainer: {
    opacity: 0.7,
  },
  historyContainer: {
    backgroundColor: colors.backgroundAlt,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.grey,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkedBox: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  contentSection: {
    flex: 1,
  },
  nameContainer: {
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 20,
  },
  doneText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  nameEditContainer: {
    marginBottom: 4,
  },
  nameInput: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  description: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.8,
    lineHeight: 18,
    marginTop: 2,
  },
  timestamp: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.6,
    marginTop: 4,
    fontStyle: 'italic',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  iconButton: {
    padding: 8,
    marginLeft: 4,
  },
  addBackButton: {
    padding: 8,
  },
});
