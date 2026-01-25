import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { expoDb } from '../db/client';

const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS receipts (
    id text PRIMARY KEY NOT NULL,
    receipt_number integer,
    created_at integer NOT NULL,
    customer_name text,
    items text NOT NULL,
    total_amount real NOT NULL,
    business_snapshot text
);
CREATE UNIQUE INDEX IF NOT EXISTS receipt_number_idx ON receipts (receipt_number);
CREATE TABLE IF NOT EXISTS settings (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    business_name text,
    business_address text,
    logo_uri text,
    signature_uri text
);
`;

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    async function initDb() {
      try {
        await expoDb.execAsync(MIGRATION_SQL);
        setDbReady(true);
      } catch (e) {
        console.error("Migration failed", e);
      }
    }
    initDb();
  }, []);

  if (!dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ title: 'Receipts' }} />
          <Stack.Screen name="create" options={{ title: 'New Receipt' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
          <Stack.Screen name="receipt/[id]" options={{ title: 'Receipt Details' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
