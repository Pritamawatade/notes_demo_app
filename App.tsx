import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen } from './src/screens/HomeScreen';
import { EditorScreen } from './src/screens/EditorScreen';
import { TodoScreen } from './src/screens/TodoScreen';
import { initDatabase } from './src/database/db';
import { useTheme } from './src/theme/useTheme';
import { setupNotifications } from './src/utils/notifications';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size, focused }) => {
          const iconName =
            route.name === 'Notes'
              ? focused
                ? 'edit-note'
                : 'notes'
              : focused
                ? 'check-circle'
                : 'check-circle-outline';
          return <MaterialIcons name={iconName as any} size={size + 2} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
          marginBottom: Platform.OS === 'android' ? 6 : 0,
        },
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingTop: 8,
        },
      })}
    >
      <Tab.Screen name="Notes" component={HomeScreen} />
      <Tab.Screen name="Todos" component={TodoScreen} options={{ title: 'Tasks' }} />
    </Tab.Navigator>
  );
};

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const { theme, isDark } = useTheme();

  useEffect(() => {
    async function prepare() {
      try {
        await initDatabase();
        await setupNotifications();
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
      }
    }

    prepare();
  }, []);

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.background,
      card: theme.surface,
      text: theme.text,
      border: theme.border,
      primary: theme.primary,
    },
  };

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.background,
              elevation: 0,
              shadowOpacity: 0,
            },
            headerTintColor: theme.primary,
            headerTitleStyle: {
              fontWeight: '700',
              color: theme.text,
            },
            cardStyle: { backgroundColor: theme.background },
          }}
        >
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="Editor" component={EditorScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
