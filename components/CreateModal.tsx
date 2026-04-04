import React from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface CreateModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateTodo: () => void;
  onCreateNote: () => void;
}

export default function CreateModal({
  visible,
  onClose,
  onCreateTodo,
  onCreateNote,
}: CreateModalProps) {
  const { theme } = useTheme();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View
          style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={[styles.dragHandle, { backgroundColor: theme.border }]} />

          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text, fontFamily: 'Inter_700Bold' }]}>
              Create New
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
              What would you like to add?
            </Text>
          </View>

          <View style={styles.cards}>
            <Pressable
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: theme.accent + '12',
                  borderColor: theme.accent + '40',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              onPress={onCreateTodo}
            >
              <View style={[styles.cardIcon, { backgroundColor: theme.accent }]}>
                <Ionicons name="checkmark-circle" size={22} color="#fff" />
              </View>
              <View style={styles.cardText}>
                <Text style={[styles.cardTitle, { color: theme.text, fontFamily: 'Inter_700Bold' }]}>
                  Create To-Do
                </Text>
                <Text style={[styles.cardDesc, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                  Track tasks and deadlines
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.accent} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: theme.accentSecondary + '12',
                  borderColor: theme.accentSecondary + '40',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              onPress={onCreateNote}
            >
              <View style={[styles.cardIcon, { backgroundColor: theme.accentSecondary }]}>
                <Ionicons name="document-text" size={22} color="#fff" />
              </View>
              <View style={styles.cardText}>
                <Text style={[styles.cardTitle, { color: theme.text, fontFamily: 'Inter_700Bold' }]}>
                  Create Note
                </Text>
                <Text style={[styles.cardDesc, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                  Capture thoughts and ideas
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.accentSecondary} />
            </Pressable>
          </View>

          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={[styles.cancelText, { color: theme.textTertiary, fontFamily: 'Inter_400Regular' }]}>
              Cancel
            </Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
    paddingBottom: 28,
  },
  sheet: {
    borderRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 20,
    alignItems: 'stretch',
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 4,
  },
  title: {
    fontSize: 22,
  },
  subtitle: {
    fontSize: 14,
  },
  cards: {
    gap: 12,
    marginBottom: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1.5,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 14,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardText: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    fontSize: 16,
  },
  cardDesc: {
    fontSize: 13,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelText: {
    fontSize: 15,
  },
});
