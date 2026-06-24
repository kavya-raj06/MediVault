import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors, Shadows, Typography, useColors } from '../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'disabled';
  isLoading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  isLoading = false,
  style,
  textStyle,
  icon
}) => {
  const colors = useColors();

  const getContainerStyle = () => {
    switch (variant) {
      case 'primary':
        return [styles.container, { backgroundColor: colors.primary }];
      case 'secondary':
        return [styles.container, { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.primary }];
      case 'ghost':
        return [styles.container, { backgroundColor: colors.primaryMuted }];
      case 'disabled':
        return [styles.container, { backgroundColor: colors.primaryMuted }];
      default:
        return [styles.container, { backgroundColor: colors.primary }];
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'primary':
        return [styles.text, { color: colors.textOnPrimary }];
      case 'secondary':
        return [styles.text, { color: colors.primary }];
      case 'ghost':
        return [styles.text, { color: colors.primary }];
      case 'disabled':
        return [styles.text, { color: colors.textDisabled }];
      default:
        return [styles.text, { color: colors.textOnPrimary }];
    }
  };

  return (
    <TouchableOpacity
      style={[getContainerStyle(), style]}
      onPress={onPress}
      disabled={variant === 'disabled' || isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.textOnPrimary : colors.primary} />
      ) : (
        <>
          {icon}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  text: {
    ...Typography.body,
    fontFamily: 'DMSans_600SemiBold',
  },
});
