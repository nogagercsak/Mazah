import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Colors } from '@/constants/Colors';

const proto = Colors.proto;

interface SimpleTestModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SimpleTestModal({ visible, onClose }: SimpleTestModalProps) {
  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Simple Test Modal</Text>
          <Text style={styles.message}>This is a simple modal to test if modal functionality works.</Text>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: proto.background,
    padding: 20,
    margin: 20,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 300,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: proto.text,
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: proto.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: proto.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: proto.buttonText,
    fontSize: 16,
    fontWeight: '600',
  },
});