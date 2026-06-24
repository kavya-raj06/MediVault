import React, { useState } from 'react';
import { TextInput, StyleSheet, View, Text, TextInputProps, ViewStyle } from 'react-native';
import { Colors, Typography, useColors } from '../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({ label, containerStyle, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);
  const colors = useColors();

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.primaryPale,
            borderColor: colors.border,
            color: colors.textPrimary,
          },
          isFocused && { borderColor: colors.primary },
          props.editable === false && {
            backgroundColor: colors.surface,
            color: colors.textSecondary,
            borderColor: colors.primaryMuted,
          }
        ]}
        placeholderTextColor={colors.textSecondary}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    ...Typography.small,
    marginBottom: 6,
    marginLeft: 2,
  },
  input: {
    ...Typography.body,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
