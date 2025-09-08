
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../styles/commonStyles';
import Button from './Button';
import Icon from './Icon';

interface CreateListModalProps {
  onCreateList: (name: string, members: string[]) => void;
  onCancel: () => void;
}

export default function CreateListModal({ onCreateList, onCancel }: CreateListModalProps) {
  const [listName, setListName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [members, setMembers] = useState<string[]>([]);

  const handleAddMember = () => {
    if (memberEmail.trim() && memberEmail.includes('@')) {
      if (!members.includes(memberEmail.trim())) {
        setMembers([...members, memberEmail.trim()]);
        setMemberEmail('');
      } else {
        Alert.alert('Already Added', 'This member is already in the list');
      }
    } else {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
    }
  };

  const handleRemoveMember = (email: string) => {
    setMembers(members.filter(m => m !== email));
  };

  const handleCreate = () => {
    if (!listName.trim()) {
      Alert.alert('List Name Required', 'Please enter a name for your list');
      return;
    }
    onCreateList(listName.trim(), members);
  };

  return (
    <View style={styles.container}>
      <View style={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.title}>Create New List</Text>
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <Icon name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.label}>List Name</Text>
            <TextInput
              style={styles.input}
              value={listName}
              onChangeText={setListName}
              placeholder="Enter list name"
              placeholderTextColor={colors.grey}
              accessibilityLabel="List name input"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Add Members (Optional)</Text>
            <View style={styles.memberInputContainer}>
              <TextInput
                style={[styles.input, styles.memberInput]}
                value={memberEmail}
                onChangeText={setMemberEmail}
                placeholder="Enter email address"
                placeholderTextColor={colors.grey}
                keyboardType="email-address"
                autoCapitalize="none"
                accessibilityLabel="Member email input"
              />
              <TouchableOpacity 
                style={styles.addButton} 
                onPress={handleAddMember}
                accessibilityLabel="Add member"
              >
                <Icon name="add" size={20} color={colors.background} />
              </TouchableOpacity>
            </View>

            {members.length > 0 && (
              <View style={styles.membersList}>
                <Text style={styles.membersTitle}>Members to invite:</Text>
                {members.map((email) => (
                  <View key={email} style={styles.memberItem}>
                    <Icon name="person" size={16} color={colors.text} />
                    <Text style={styles.memberEmail}>{email}</Text>
                    <TouchableOpacity 
                      onPress={() => handleRemoveMember(email)}
                      accessibilityLabel={`Remove ${email}`}
                    >
                      <Icon name="close-circle" size={16} color={colors.accent} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            text="Cancel"
            onPress={onCancel}
            style={styles.cancelButton}
            textStyle={styles.cancelButtonText}
          />
          <Button
            text="Create List"
            onPress={handleCreate}
            style={styles.createButton}
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
    maxHeight: '80%',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.grey,
  },
  memberInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberInput: {
    flex: 1,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  membersList: {
    marginTop: 12,
  },
  membersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 6,
    padding: 8,
    marginVertical: 2,
  },
  memberEmail: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
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
  createButton: {
    flex: 1,
    backgroundColor: colors.accent,
    marginLeft: 8,
  },
});
