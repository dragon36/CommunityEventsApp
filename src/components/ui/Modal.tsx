import React, { useEffect, useRef } from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
  ViewStyle,
} from 'react-native';
import type { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';

export type ModalSize = 'small' | 'medium' | 'large' | 'full';

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: ModalSize;
  closeOnOverlayPress?: boolean;
  showCloseButton?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
  style?: ViewStyle;
}

const sizeStyles: Record<ModalSize, ViewStyle> = {
  small: { width: '80%', maxWidth: 320 },
  medium: { width: '90%', maxWidth: 400 },
  large: { width: '95%', maxWidth: 500 },
  full: { width: '100%', maxWidth: '100%', height: '100%' },
};

export function Modal({
  visible,
  onClose,
  title,
  children,
  size = 'medium',
  closeOnOverlayPress = true,
  showCloseButton = true,
  header,
  footer,
  style,
}: ModalProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 50, duration: 150, useNativeDriver: true }),
      ]).start(() => {
        // Animation complete
      });
    }
  }, [visible, fadeAnim, slideAnim]);

  const overlayStyle: ViewStyle = {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  };

  const modalContainerStyle: ViewStyle = {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    ...sizeStyles[size],
    maxHeight: '90%',
    overflow: 'hidden',
    transform: [{ translateY: slideAnim }],
  };

  const closeButtonStyle: ViewStyle = {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  };

  if (!visible) return null;

  return (
    <RNModal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback
        onPress={closeOnOverlayPress ? onClose : undefined}
        accessible={false}
      >
        <Animated.View style={[overlayStyle, { opacity: fadeAnim }]}>
          <View style={[modalContainerStyle, style]}>
            {showCloseButton && (
              <TouchableWithoutFeedback onPress={onClose}>
                <View style={closeButtonStyle}>
                  <Ionicons name="close-outline" size={28} color="#999999" />
                </View>
              </TouchableWithoutFeedback>
            )}

            {(header || title) && (
              <View style={styles.header}>
                {header || (
                  <>
                    <Text style={styles.title}>{title}</Text>
                  </>
                )}
              </View>
            )}

            <View style={styles.content}>{children}</View>

            {footer && <View style={styles.footer}>{footer}</View>}
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  content: {
    padding: 20,
    maxHeight: '70%',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
});

export default Modal;