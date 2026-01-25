import { desc } from 'drizzle-orm';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, FloatingButton, Text, View } from 'react-native-ui-lib';
import { db } from '../db/client';
import { receipts } from '../db/schema';

export default function Dashboard() {
  const [data, setData] = useState<typeof receipts.$inferSelect[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchReceipts();
    }, [])
  );

  async function fetchReceipts() {
    try {
      const result = await db.select().from(receipts).orderBy(desc(receipts.createdAt));
      setData(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const renderItem = ({ item }: { item: typeof receipts.$inferSelect }) => (
    <View 
      bg-white 
      padding-s4 
      marginB-s2 
      style={{ borderRadius: 8, elevation: 2 }}
    >
      <View row spread centerV>
        <View>
          <Text text60>#{item.receiptNumber}</Text>
          <Text text70 grey10>{item.customerName}</Text>
          <Text text80 grey30>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
        <View>
          <Text text60 primary>${item.totalAmount.toFixed(2)}</Text>
          <Button 
            label="View" 
            size={Button.sizes.xSmall} 
            outline 
            onPress={() => router.push(`/receipt/${item.id}`)} 
            marginT-s2
          />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f2f2f2' }}>
      <View flex padding-s4>
        {loading ? (
           <View flex center><ActivityIndicator size="large" /></View>
        ) : (!data || data.length === 0) ? (
          <View flex center>
            <Text text60 grey30>No receipts yet</Text>
            <Button 
                label="Configure Settings" 
                link 
                onPress={() => router.push('/settings')} 
                marginT-s4
            />
          </View>
        ) : (
          <FlatList
            data={data}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 80 }}
          />
        )}
        
        <FloatingButton
          visible={true}
          button={{
            label: "New Receipt",
            onPress: () => router.push('/create')
          }}
          bottomMargin={20}
        />
        
        <Button 
            label="Settings" 
            link 
            onPress={() => router.push('/settings')} 
            style={{ position: 'absolute', top: 10, right: 10 }}
        />
      </View>
    </SafeAreaView>
  );
}
