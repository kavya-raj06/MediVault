import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Shadows, Typography, useColors } from '../../constants/theme';
import { Home, FileText, Camera, Clock, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useStore } from '../../store/useStore';

// Custom button for the central Scan tab
const CustomScanButton = ({ children, onPress, colors }: any) => (
  <TouchableOpacity
    style={[styles.scanButtonContainer, { shadowColor: colors.primary }]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={[styles.scanButton, { backgroundColor: colors.primary }]}>
      {children}
    </View>
  </TouchableOpacity>
);

export default function TabLayout() {
  const router = useRouter();
  const colors = useColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.dark,
          borderTopWidth: 0,
          elevation: 0,
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          ...Typography.tiny,
          fontFamily: 'DMSans_500Medium',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: 'Records',
          tabBarIcon: ({ color }) => <FileText size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: '', // Empty label for the central button
          tabBarIcon: () => <Camera size={28} color={colors.textOnPrimary} />,
          tabBarButton: (props) => (
            <CustomScanButton
              {...props}
              colors={colors}
              onPress={() => {
                // Navigate to the scan flow instead of just the tab
                router.push('/scan-flow/capture');
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: 'Timeline',
          tabBarIcon: ({ color }) => <Clock size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  scanButtonContainer: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 4,
  },
  scanButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
