import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from 'react-native-ui-lib';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: Colors.primary }}>
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
    </Tabs>
  );
}
