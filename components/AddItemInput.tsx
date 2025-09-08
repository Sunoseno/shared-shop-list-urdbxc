
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../styles/commonStyles';
import Icon from './Icon';

interface AddItemInputProps {
  onAddItem: (name: string) => void;
  placeholder?: string;
}

export default function AddItemInput({ onAddItem, placeholder = "Add new item..." }: AddItemInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (text.trim()) {
      onAddItem(text.trim());
      setText('');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={colors.grey}
        onSubmitEditing={handleSubmit}
        returnKeyType="done"
        accessibilityLabel="Add new item input field"
      />
      <TouchableOpacity 
        style={styles.addButton}
        onPress={handleSubmit}
        disabled={!text.trim()}
        accessibilityRole="button"
        accessibilityLabel="Add item to shopping list"
      >
        <Icon 
          name="add" 
          size={24} 
          color={text.trim() ? colors.accent : colors.grey} 
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 12,
    paddingRight: 8,
  },
  addButton: {
    padding: 8,
  },
});
