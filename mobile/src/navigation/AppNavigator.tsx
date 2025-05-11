import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View } from 'react-native';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import EventsScreen from '../screens/events/EventsScreen';
import EventDetailsScreen from '../screens/events/EventDetailsScreen';
import ActivitiesScreen from '../screens/activities/ActivitiesScreen';
import ActivityDetailsScreen from '../screens/activities/ActivityDetailsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Icons
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Navigator
const AuthNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
  </Stack.Navigator>
);

// Dashboard Stack
const DashboardStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="DashboardScreen" component={DashboardScreen} options={{ title: 'Dashboard' }} />
  </Stack.Navigator>
);

// Events Stack
const EventsStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="EventsScreen" component={EventsScreen} options={{ title: 'Eventos' }} />
    <Stack.Screen 
      name="EventDetails" 
      component={EventDetailsScreen} 
      options={({ route }: any) => ({ 
        title: `Evento #${route.params?.eventNumber || ''}` 
      })} 
    />
  </Stack.Navigator>
);

// Activities Stack
const ActivitiesStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="ActivitiesScreen" component={ActivitiesScreen} options={{ title: 'Atividades' }} />
    <Stack.Screen 
      name="ActivityDetails" 
      component={ActivityDetailsScreen} 
      options={({ route }: any) => ({ 
        title: `Atividade #${route.params?.activityNumber || ''}` 
      })} 
    />
  </Stack.Navigator>
);

// Profile Stack
const ProfileStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={{ title: 'Perfil' }} />
  </Stack.Navigator>
);

// Main Tab Navigator
const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: '#3b82f6',
      tabBarInactiveTintColor: '#64748b',
      tabBarStyle: {
        paddingBottom: 5,
        paddingTop: 5,
        height: 60,
      },
      headerShown: false,
    }}
  >
    <Tab.Screen
      name="Dashboard"
      component={DashboardStack}
      options={{
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="Events"
      component={EventsStack}
      options={{
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="calendar" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="Activities"
      component={ActivitiesStack}
      options={{
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="file-document" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileStack}
      options={{
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="account" size={size} color={color} />
        ),
      }}
    />
  </Tab.Navigator>
);

const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={TabNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;