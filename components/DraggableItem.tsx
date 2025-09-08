
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, PanGestureHandler, State } from 'react-native';
import Animated, { 
  useAnimatedGestureHandler, 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  runOnJS
} from 'react-native-reanimated';
import { ShoppingItem as ShoppingItemType } from '../types/ShoppingList';
import { colors } from '../styles/commonStyles';
import Icon from './Icon';

interface DraggableItemProps {
  item: ShoppingItemType;
  onToggleDone: () => void;
  onUpdateRepeating: () => void;
  onEditDescription: () => void;
  onShowDescription: () => void;
  onDragEnd: (newOrder: number) => void;
  isDragging: boolean;
  onDragStart: () => void;
}

export default function DraggableItem({ 
  item, 
  onToggleDone, 
  onUpdateRepeating, 
  onEditDescription,
  onShowDescription,
  onDragEnd,
  isDragging,
  onDragStart
}: DraggableItemProps) {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const getRepeatingIcon = () => {
    switch (item.isRepeating) {
      case 'daily': return 'D';
      case 'weekly': return 'W';
      case 'monthly': return 'M';
      default: return 'repeat-outline';
    }
  };

  const getRepeatingColor = () => {
    return item.isRepeating !== 'none' ? colors.accent : colors.grey;
  };

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      runOnJS(onDragStart)();
      scale.value = withSpring(1.05);
    },
    onActive: (event) => {
      translateY.value = event.translationY;
    },
    onEnd: () => {
      const newOrder = Math.round(translateY.value / 60); // Assuming 60px per item
      runOnJS(onDragEnd)(newOrder);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { scale: scale.value }
      ],
      zIndex: isDragging ? 1000 : 1,
    };
  });

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={[styles.container, item.isDone && styles.doneContainer, animatedStyle]}>
        <TouchableOpacity 
          style={styles.dragHandle}
          accessibilityLabel="Drag to reorder item"
        >
          <Icon name="reorder-two" size={20} color={colors.grey} />
        </TouchableOpacity>

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
            <TouchableOpacity onPress={onShowDescription}>
              <Text style={styles.description} numberOfLines={1}>
                {item.description}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onEditDescription}
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
            accessibilityLabel={`Set ${item.name} to repeat ${item.isRepeating === 'none' ? 'daily' : item.isRepeating === 'daily' ? 'weekly' : item.isRepeating === 'weekly' ? 'monthly' : 'never'}`}
          >
            {item.isRepeating !== 'none' ? (
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
      </Animated.View>
    </PanGestureHandler>
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
  dragHandle: {
    marginRight: 8,
    padding: 4,
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
