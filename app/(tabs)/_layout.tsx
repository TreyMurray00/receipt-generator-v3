import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#5a48f5' }}>
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Receipts', 
          headerShown: true,
          tabBarIcon: ({ color }) => <MaterialIcons name="receipt" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="create" 
        options={{ 
          title: 'New Receipt', 
          headerShown: true,
          tabBarIcon: ({ color }) => <MaterialIcons name="add-circle-outline" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="settings"
        options={{ 
          title: 'Settings', 
          headerShown: true,
          tabBarIcon: ({ color }) => <MaterialIcons name="settings" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="reports" 
        options={{ 
          title: 'Reports', 
          headerShown: true,
          tabBarIcon: ({ color }) => <MaterialIcons name="bar-chart" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="receipt/[id]" 
        options={{ 
          title: 'Receipt Details',
          headerShown: true,
          href: null,
        }} 
      />
    </Tabs>
  );
}
