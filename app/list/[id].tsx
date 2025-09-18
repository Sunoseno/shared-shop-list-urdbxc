
import React, { useState, useRef, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity, TextInput } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useShoppingLists } from '../../hooks/useShoppingLists';
import { useAuth } from '../../hooks/useAuth';
import { commonStyles, colors } from '../../styles/commonStyles';
import ShoppingItem from '../../components/ShoppingItem';
import AddItemInput from '../../components/AddItemInput';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import EditDescriptionModal from '../../components/EditDescriptionModal';

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { 
    shoppingLists, 
    user,
    isAuthenticated,
    addItem, 
    toggleItemDone, 
    setItemRepeat, 
    updateItemDescription,
    updateItemName,
    updateItemOrder,
    clearListHistory,
    inviteMember,
    removeMember,
    addItemBackFromHistory
  } = useShoppingLists();

  const { signOut } = useAuth();

  const [showHistory, setShowHistory] = useState(false);
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [editingItem, setEditingItem] = useState<{ id: string; name: string; description?: string } | null>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['25%', '50%', '90%'], []);

  const list = shoppingLists?.find(l => l.id === id);

  if (!list) {
    return (
      <View style={commonStyles.container}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorTitle}>List not found</Text>
          <Text style={styles.errorSubtitle}>
            The shopping list you're looking for doesn't exist or you don't have access to it.
          </Text>
          <Button 
            text="Go Back" 
            onPress={() => router.back()} 
            style={styles.goBackButton}
          />
        </View>
      </View>
    );
  }

  // Filter items safely with null checks - 10 seconds for completed items
  const activeItems = (list.items || [])
    .filter(item => !item.done)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  
  const completedItems = (list.items || [])
    .filter(item => item.done && item.doneAt && (Date.now() - new Date(item.doneAt).getTime()) < 10000);
  
  const historyItems = (list.items || [])
    .filter(item => item.done && item.doneAt && (Date.now() - new Date(item.doneAt).getTime()) >= 10000)
    .sort((a, b) => {
      const aTime = a.doneAt ? new Date(a.doneAt).getTime() : 0;
      const bTime = b.doneAt ? new Date(b.doneAt).getTime() : 0;
      return bTime - aTime;
    });

  const currentUserEmail = user?.email || user?.id || 'anonymous';
  const isOwner = list.owner === currentUserEmail;

  const handleAddItem = (name: string) => {
    console.log('Adding item:', name, 'to list:', list.id);
    addItem(list.id, name);
  };

  const handleSendInvite = () => {
    if (inviteEmail.trim() && inviteEmail.includes('@')) {
      inviteMember(list.id, inviteEmail.trim());
      setInviteEmail('');
      setShowInviteInput(false);
    } else {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
    }
  };

  const handleRemoveMember = (email: string) => {
    if (email === currentUserEmail) {
      Alert.alert('Cannot Remove', 'You cannot remove yourself from the list');
      return;
    }
    
    Alert.alert(
      'Remove Member',
      `Remove ${email} from this list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => removeMember(list.id, email)
        }
      ]
    );
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all history? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => clearListHistory(list.id)
        }
      ]
    );
  };

  const handleEditDescription = (itemId: string, itemName: string, currentDescription?: string) => {
    setEditingItem({ id: itemId, name: itemName, description: currentDescription });
  };

  const handleSaveDescription = (description: string) => {
    if (editingItem) {
      updateItemDescription(list.id, editingItem.id, description);
      setEditingItem(null);
    }
  };

  const handleAddBackToList = (item: any) => {
    console.log('Adding item back to list:', item.name);
    // Create a copy of the item in the active list (keep original in history)
    addItemBackFromHistory(list.id, item);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? You will lose access to your synced lists.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/');
          }
        }
      ]
    );
  };

  const openSettings = () => {
    bottomSheetRef.current?.expand();
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={commonStyles.wrapper}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back to shopping lists"
          >
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{list.name}</Text>
            <Text style={styles.subtitle}>
              {activeItems.length} active • {(list.members || []).length} members
              {!isAuthenticated && ' • Offline Mode'}
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={openSettings}
            accessibilityRole="button"
            accessibilityLabel="Open list settings"
          >
            <Icon name="settings" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <AddItemInput onAddItem={handleAddItem} placeholder="Add item to list..." />

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {activeItems.length === 0 && completedItems.length === 0 && (
            <View style={styles.emptyState}>
              <Icon name="basket-outline" size={48} color={colors.grey} />
              <Text style={styles.emptyText}>No items in your list</Text>
              <Text style={styles.emptySubtext}>Add some items to get started!</Text>
            </View>
          )}

          {activeItems.map((item) => (
            <ShoppingItem
              key={item.id}
              item={item}
              onToggleDone={() => toggleItemDone(list.id, item.id)}
              onUpdateRepeating={() => setItemRepeat(list.id, item.id)}
              onUpdateDescription={(desc) => updateItemDescription(list.id, item.id, desc)}
              onUpdateName={(name) => updateItemName(list.id, item.id, name)}
              onShowDescription={() => {
                if (item.description) {
                  Alert.alert('Description', item.description);
                }
              }}
              onEditDescription={() => handleEditDescription(item.id, item.name, item.description)}
            />
          ))}

          {completedItems.length > 0 && (
            <View style={styles.completedSection}>
              <Text style={styles.completedTitle}>Recently Completed (moving to history in 10s)</Text>
              {completedItems.map((item) => (
                <ShoppingItem
                  key={item.id}
                  item={item}
                  onToggleDone={() => toggleItemDone(list.id, item.id)}
                  onUpdateRepeating={() => setItemRepeat(list.id, item.id)}
                  onUpdateDescription={(desc) => updateItemDescription(list.id, item.id, desc)}
                  onUpdateName={(name) => updateItemName(list.id, item.id, name)}
                  onShowDescription={() => {
                    if (item.description) {
                      Alert.alert('Description', item.description);
                    }
                  }}
                  onEditDescription={() => handleEditDescription(item.id, item.name, item.description)}
                />
              ))}
            </View>
          )}

          {historyItems.length > 0 && (
            <View style={styles.buttonContainer}>
              <Button
                text={`${showHistory ? 'Hide' : 'View'} History (${historyItems.length} items)`}
                onPress={() => setShowHistory(!showHistory)}
                style={styles.historyButton}
              />
            </View>
          )}

          {showHistory && (
            <View style={styles.historySection}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}>History</Text>
                <TouchableOpacity
                  style={styles.clearHistoryButton}
                  onPress={handleClearHistory}
                  accessibilityRole="button"
                  accessibilityLabel="Clear all history"
                >
                  <Icon name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
              {historyItems.map((item, index) => (
                <ShoppingItem
                  key={`${item.id}-${item.doneAt ? new Date(item.doneAt).getTime() : Date.now()}-${index}`}
                  item={item}
                  onToggleDone={() => {}}
                  onUpdateRepeating={() => {}}
                  onUpdateDescription={() => {}}
                  onUpdateName={() => {}}
                  onShowDescription={() => {
                    if (item.description) {
                      Alert.alert('Description', item.description);
                    }
                  }}
                  isHistoryItem={true}
                  onAddBackToList={() => handleAddBackToList(item)}
                />
              ))}
            </View>
          )}
        </ScrollView>

        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose={true}
          backgroundStyle={styles.bottomSheetBackground}
        >
          <BottomSheetView style={styles.bottomSheetContent}>
            <Text style={styles.bottomSheetTitle}>List Settings</Text>
            
            {!isAuthenticated && (
              <View style={styles.offlineNotice}>
                <Icon name="wifi-off" size={20} color={colors.accent} />
                <Text style={styles.offlineText}>
                  You're in offline mode. Sign in to enable real-time collaboration and sync across devices.
                </Text>
              </View>
            )}
            
            <View style={styles.membersSection}>
              <Text style={styles.sectionTitle}>Members ({(list.members || []).length})</Text>
              {(list.members || []).map((email) => (
                <View key={email} style={styles.memberItem}>
                  <View style={styles.memberInfo}>
                    <Icon name="person" size={20} color={colors.text} />
                    <Text style={styles.memberEmail}>{email}</Text>
                    {email === list.owner && (
                      <Text style={styles.ownerBadge}>Owner</Text>
                    )}
                  </View>
                  {isOwner && email !== currentUserEmail && (
                    <TouchableOpacity 
                      onPress={() => handleRemoveMember(email)}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${email} from list`}
                    >
                      <Icon name="remove-circle" size={20} color={colors.accent} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            {showInviteInput ? (
              <View style={styles.inviteInputContainer}>
                <TextInput
                  style={styles.inviteInput}
                  value={inviteEmail}
                  onChangeText={setInviteEmail}
                  placeholder="Enter email address"
                  placeholderTextColor={colors.grey}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  accessibilityLabel="Invite email input"
                />
                <View style={styles.inviteButtons}>
                  <Button
                    text="Cancel"
                    onPress={() => {
                      setShowInviteInput(false);
                      setInviteEmail('');
                    }}
                    style={styles.cancelInviteButton}
                    textStyle={styles.cancelInviteButtonText}
                  />
                  <Button
                    text="Send Invite"
                    onPress={handleSendInvite}
                    style={styles.sendInviteButton}
                  />
                </View>
              </View>
            ) : (
              <Button
                text="Invite Member"
                onPress={() => setShowInviteInput(true)}
                style={styles.inviteButton}
              />
            )}

            {/* Account Section */}
            <View style={styles.accountSection}>
              <Text style={styles.sectionTitle}>Account</Text>
              {isAuthenticated ? (
                <View>
                  <View style={styles.accountInfo}>
                    <Icon name="person-circle" size={20} color={colors.text} />
                    <Text style={styles.accountEmail}>{user?.email}</Text>
                  </View>
                  <Button
                    text="Sign Out"
                    onPress={handleLogout}
                    style={styles.logoutButton}
                    textStyle={styles.logoutButtonText}
                  />
                </View>
              ) : (
                <View style={styles.signInPrompt}>
                  <Text style={styles.signInText}>
                    Sign in to sync your lists across devices and collaborate with others.
                  </Text>
                  <Button
                    text="Sign In"
                    onPress={() => {
                      bottomSheetRef.current?.close();
                      router.push('/');
                    }}
                    style={styles.signInButton}
                  />
                </View>
              )}
            </View>
          </BottomSheetView>
        </BottomSheet>

        {editingItem && (
          <EditDescriptionModal
            itemName={editingItem.name}
            currentDescription={editingItem.description}
            onSave={handleSaveDescription}
            onCancel={() => setEditingItem(null)}
          />
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
    marginTop: 2,
  },
  settingsButton: {
    padding: 8,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.7,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
  },
  goBackButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 32,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
    marginTop: 4,
  },
  completedSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.backgroundAlt,
  },
  completedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginHorizontal: 16,
    marginBottom: 8,
    opacity: 0.8,
  },
  buttonContainer: {
    padding: 16,
  },
  historyButton: {
    backgroundColor: colors.backgroundAlt,
  },
  historySection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  clearHistoryButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: colors.backgroundAlt,
  },
  bottomSheetBackground: {
    backgroundColor: colors.backgroundAlt,
  },
  bottomSheetContent: {
    flex: 1,
    padding: 20,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  offlineText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  membersSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginVertical: 4,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberEmail: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  ownerBadge: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '600',
    marginLeft: 8,
  },
  inviteButton: {
    backgroundColor: colors.accent,
  },
  inviteInputContainer: {
    marginTop: 10,
  },
  inviteInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.grey,
    marginBottom: 12,
  },
  inviteButtons: {
    flexDirection: 'row',
  },
  cancelInviteButton: {
    flex: 1,
    backgroundColor: colors.background,
    marginRight: 8,
  },
  cancelInviteButtonText: {
    color: colors.text,
  },
  sendInviteButton: {
    flex: 1,
    backgroundColor: colors.accent,
    marginLeft: 8,
  },
  accountSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.background,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginBottom: 12,
  },
  accountEmail: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  logoutButton: {
    backgroundColor: colors.error,
  },
  logoutButtonText: {
    color: colors.background,
  },
  signInPrompt: {
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  signInText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 18,
    marginBottom: 12,
  },
  signInButton: {
    backgroundColor: colors.accent,
  },
});
