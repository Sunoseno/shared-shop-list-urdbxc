
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../styles/commonStyles';
import Button from './Button';
import Icon from './Icon';

interface EditDescriptionModalProps {
  itemName: string;
  currentDescription?: string;
  onSave: (description: string) => void;
  onCancel: () => void;
}

export default function EditDescriptionModal({ 
  itemName, 
  currentDescription, 
  onSave, 
  onCancel 
}: EditDescriptionModalProps) {
  const [description, setDescription] = useState(currentDescription || '');

  const handleSave = () => {
    onSave(description.trim());
  };

  return (
    <View style={styles.container}>
      <View style={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.title}>Edit Description</Text>
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <Icon name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.itemName}>{itemName}</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter description..."
            placeholderTextColor={colors.grey}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            accessibilityLabel="Item description input"
          />
        </View>

        <View style={styles.footer}>
          <Button
            text="Cancel"
            onPress={onCancel}
            style={styles.cancelButton}
            textStyle={styles.cancelButtonText}
          />
          <Button
            text="Save"
            onPress={handleSave}
            style={styles.saveButton}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.grey,
    minHeight: 100,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.background,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.background,
    marginRight: 8,
  },
  cancelButtonText: {
    color: colors.text,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.accent,
    marginLeft: 8,
  },
});
