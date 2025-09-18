
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useShoppingLists } from '../hooks/useShoppingLists';
import { useAuth } from '../hooks/useAuth';
import { commonStyles, colors } from '../styles/commonStyles';
import ShoppingListCard from '../components/ShoppingListCard';
import CreateListModal from '../components/CreateListModal';
import Button from '../components/Button';
import Icon from '../components/Icon';

export default function ListsScreen() {
  console.log('ListsScreen: Rendering');
  
  const { shoppingLists, createList, loading, isAuthenticated, user } = useShoppingLists();
  const { signOut } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['25%', '50%'], []);

  console.log('ListsScreen: State - loading:', loading, 'lists count:', shoppingLists?.length || 0, 'authenticated:', isAuthenticated);

  // Auto-redirect if only one list (but only after loading is complete)
  useEffect(() => {
    if (!loading && shoppingLists && shoppingLists.length === 1) {
      console.log('ListsScreen: Auto-redirecting to single list:', shoppingLists[0].id);
      router.replace(`/list/${shoppingLists[0].id}`);
    }
  }, [shoppingLists, loading]);

  const handleCreateList = async (name: string, members: string[]) => {
    console.log('ListsScreen: Creating list:', name, 'with members:', members);
    
    try {
      const newListId = await createList(name, members);
      setShowCreateModal(false);
      
      // Navigate to the new list immediately so user can add items
      if (newListId) {
        console.log('ListsScreen: Navigating to new list:', newListId);
        router.push(`/list/${newListId}`);
      } else {
        console.error('ListsScreen: Failed to create list - no ID returned');
        Alert.alert('Error', 'Failed to create list. Please try again.');
      }
    } catch (error) {
      console.error('ListsScreen: Error creating list:', error);
      Alert.alert('Error', 'Failed to create list. Please try again.');
      setShowCreateModal(false);
    }
  };

  const handleListPress = (listId: string) => {
    console.log('ListsScreen: Navigating to list:', listId);
    router.push(`/list/${listId}`);
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

  // Show loading only briefly
  if (loading) {
    console.log('ListsScreen: Showing loading state');
    return (
      <View style={[commonStyles.wrapper, styles.container]}>
        <View style={styles.loadingContainer}>
          <Icon name="basket-outline" size={48} color={colors.accent} />
          <Text style={[commonStyles.text, styles.loadingText]}>Loading shopping lists...</Text>
        </View>
      </View>
    );
  }

  // Show empty state if no lists
  if (!shoppingLists || shoppingLists.length === 0) {
    console.log('ListsScreen: Showing empty state');
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={[commonStyles.wrapper, styles.container]}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Shopping Lists</Text>
              {!isAuthenticated && (
                <View style={styles.offlineIndicator}>
                  <Icon name="wifi-off" size={16} color={colors.accent} />
                  <Text style={styles.offlineText}>Offline</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={openSettings}
              accessibilityRole="button"
              accessibilityLabel="Open settings"
            >
              <Icon name="settings" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.emptyState}>
            <Icon name="basket-outline" size={64} color={colors.grey} />
            <Text style={styles.emptyTitle}>No Shopping Lists</Text>
            <Text style={styles.emptySubtitle}>Create your first shopping list to get started</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowCreateModal(true)}
              accessibilityRole="button"
              accessibilityLabel="Create new shopping list"
            >
              <Icon name="add" size={24} color={colors.background} />
              <Text style={styles.createButtonText}>Create New List</Text>
            </TouchableOpacity>
          </View>
          
          {showCreateModal && (
            <CreateListModal
              onCreateList={handleCreateList}
              onCancel={() => setShowCreateModal(false)}
            />
          )}

          <BottomSheet
            ref={bottomSheetRef}
            index={-1}
            snapPoints={snapPoints}
            enablePanDownToClose={true}
            backgroundStyle={styles.bottomSheetBackground}
          >
            <BottomSheetView style={styles.bottomSheetContent}>
              <Text style={styles.bottomSheetTitle}>Settings</Text>
              
              {!isAuthenticated && (
                <View style={styles.offlineNotice}>
                  <Icon name="wifi-off" size={20} color={colors.accent} />
                  <Text style={styles.offlineText}>
                    You're in offline mode. Sign in to enable real-time collaboration and sync across devices.
                  </Text>
                </View>
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
        </View>
      </GestureHandlerRootView>
    );
  }

  console.log('ListsScreen: Showing lists:', shoppingLists.map(l => l.name));

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[commonStyles.wrapper, styles.container]}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Shopping Lists</Text>
            {!isAuthenticated && (
              <View style={styles.offlineIndicator}>
                <Icon name="wifi-off" size={16} color={colors.accent} />
                <Text style={styles.offlineText}>Offline</Text>
              </View>
            )}
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.newListButton}
              onPress={() => setShowCreateModal(true)}
              accessibilityRole="button"
              accessibilityLabel="Create new shopping list"
            >
              <Icon name="add" size={24} color={colors.background} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={openSettings}
              accessibilityRole="button"
              accessibilityLabel="Open settings"
            >
              <Icon name="settings" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {shoppingLists.map((list) => (
            <ShoppingListCard
              key={list.id}
              list={list}
              onPress={() => handleListPress(list.id)}
            />
          ))}
        </ScrollView>

        {showCreateModal && (
          <CreateListModal
            onCreateList={handleCreateList}
            onCancel={() => setShowCreateModal(false)}
          />
        )}

        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose={true}
          backgroundStyle={styles.bottomSheetBackground}
        >
          <BottomSheetView style={styles.bottomSheetContent}>
            <Text style={styles.bottomSheetTitle}>Settings</Text>
            
            {!isAuthenticated && (
              <View style={styles.offlineNotice}>
                <Icon name="wifi-off" size={20} color={colors.accent} />
                <Text style={styles.offlineNoticeText}>
                  You're in offline mode. Sign in to enable real-time collaboration and sync across devices.
                </Text>
              </View>
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
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
    backgroundColor: colors.background,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
  },
  offlineText: {
    fontSize: 12,
    color: colors.accent,
    marginLeft: 4,
    fontWeight: '500',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newListButton: {
    backgroundColor: colors.accent,
    borderRadius: 50,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
    elevation: 4,
    marginRight: 12,
  },
  settingsButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.7,
    marginBottom: 32,
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
    elevation: 4,
  },
  createButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
  offlineNoticeText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  accountSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.background,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
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
