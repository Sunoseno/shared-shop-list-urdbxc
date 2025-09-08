
import React, { useState, useRef, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useShoppingLists } from '../../hooks/useShoppingLists';
import { commonStyles, colors } from '../../styles/commonStyles';
import ShoppingItem from '../../components/ShoppingItem';
import AddItemInput from '../../components/AddItemInput';
import Button from '../../components/Button';
import Icon from '../../components/Icon';

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { 
    lists, 
    currentUser,
    addItemToList, 
    toggleItemDone, 
    updateItemRepeating, 
    updateItemDescription,
    inviteMember,
    removeMember
  } = useShoppingLists();

  const [showHistory, setShowHistory] = useState(false);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['25%', '50%', '90%'], []);

  const list = lists.find(l => l.id === id);

  if (!list) {
    return (
      <View style={commonStyles.container}>
        <Text style={commonStyles.text}>List not found</Text>
        <Button text="Go Back" onPress={() => router.back()} />
      </View>
    );
  }

  const activeItems = list.items.filter(item => !item.isDone);
  const completedItems = list.items.filter(item => item.isDone);
  const isOwner = list.owner === currentUser.email;

  const handleAddItem = (name: string) => {
    addItemToList(list.id, name);
  };

  const handleInviteMember = () => {
    Alert.prompt(
      'Invite Member',
      'Enter email address to invite:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send Invite', 
          onPress: (email) => {
            if (email && email.includes('@')) {
              inviteMember(list.id, email);
              Alert.alert('Invitation Sent', `An invitation has been sent to ${email}`);
            } else {
              Alert.alert('Invalid Email', 'Please enter a valid email address');
            }
          }
        }
      ]
    );
  };

  const handleRemoveMember = (email: string) => {
    if (email === currentUser.email) {
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
              {activeItems.length} active • {list.members.length} members
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

        <AddItemInput onAddItem={handleAddItem} />

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {activeItems.length === 0 && (
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
              onUpdateRepeating={() => updateItemRepeating(list.id, item.id)}
              onUpdateDescription={(desc) => updateItemDescription(list.id, item.id, desc)}
              onShowDescription={() => {
                if (item.description) {
                  Alert.alert('Description', item.description);
                }
              }}
            />
          ))}

          {completedItems.length > 0 && (
            <View style={styles.completedSection}>
              <Text style={styles.completedTitle}>Recently Completed</Text>
              {completedItems.map((item) => (
                <ShoppingItem
                  key={item.id}
                  item={item}
                  onToggleDone={() => toggleItemDone(list.id, item.id)}
                  onUpdateRepeating={() => updateItemRepeating(list.id, item.id)}
                  onUpdateDescription={(desc) => updateItemDescription(list.id, item.id, desc)}
                  onShowDescription={() => {
                    if (item.description) {
                      Alert.alert('Description', item.description);
                    }
                  }}
                />
              ))}
            </View>
          )}

          {list.history.length > 0 && (
            <View style={styles.buttonContainer}>
              <Button
                text={`View History (${list.history.length} items)`}
                onPress={() => setShowHistory(!showHistory)}
                style={styles.historyButton}
              />
            </View>
          )}

          {showHistory && (
            <View style={styles.historySection}>
              <Text style={styles.historyTitle}>History</Text>
              {list.history.map((item) => (
                <View key={`${item.id}-${item.completedAt}`} style={styles.historyItem}>
                  <Text style={styles.historyItemName}>{item.name}</Text>
                  <Text style={styles.historyItemDate}>
                    {item.completedAt?.toLocaleDateString()}
                  </Text>
                </View>
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
            
            <View style={styles.membersSection}>
              <Text style={styles.sectionTitle}>Members ({list.members.length})</Text>
              {list.members.map((email) => (
                <View key={email} style={styles.memberItem}>
                  <View style={styles.memberInfo}>
                    <Icon name="person" size={20} color={colors.text} />
                    <Text style={styles.memberEmail}>{email}</Text>
                    {email === list.owner && (
                      <Text style={styles.ownerBadge}>Owner</Text>
                    )}
                  </View>
                  {isOwner && email !== currentUser.email && (
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

            <Button
              text="Invite Member"
              onPress={handleInviteMember}
              style={styles.inviteButton}
            />
          </BottomSheetView>
        </BottomSheet>
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
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 6,
    marginVertical: 2,
  },
  historyItemName: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.8,
  },
  historyItemDate: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.6,
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
});
