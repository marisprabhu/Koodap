import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Text, View } from 'react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { SummaryScreen } from '../screens/SummaryScreen';
import { VoiceEnrollScreen } from '../screens/VoiceEnrollScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

function TimelineScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 40 }}>📋</Text>
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 12 }}>Timeline</Text>
      <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 6 }}>Coming in Phase 3</Text>
    </View>
  );
}

function TabIcon({ emoji, color, focused }: { emoji: string; color: string; focused: boolean }) {
  return (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: focused ? colors.primary + '25' : 'transparent',
    }}>
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
    </View>
  );
}

export function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.cardBorder,
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Record',
          tabBarIcon: ({ color, focused }) => <TabIcon emoji="🎙️" color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Timeline"
        component={TimelineScreen}
        options={{
          tabBarLabel: 'Timeline',
          tabBarIcon: ({ color, focused }) => <TabIcon emoji="📋" color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Summary"
        component={SummaryScreen}
        options={{
          tabBarLabel: 'Debrief',
          tabBarIcon: ({ color, focused }) => <TabIcon emoji="✨" color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Voices"
        component={VoiceEnrollScreen}
        options={{
          tabBarLabel: 'Voices',
          tabBarIcon: ({ color, focused }) => <TabIcon emoji="🎤" color={color} focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}
