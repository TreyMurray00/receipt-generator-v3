import { db } from '@/db/client';
import { receipts } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, DateTimePicker, Text, View } from 'react-native-ui-lib';

export default function Dashboard() {
  const [data, setData] = useState<typeof receipts.$inferSelect[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);

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

  const filteredData = data.filter(item => {
    if (!filterDate) return true;
    const itemDate = new Date(item.createdAt);
    return itemDate.getFullYear() === filterDate.getFullYear() &&
           itemDate.getMonth() === filterDate.getMonth() &&
           itemDate.getDate() === filterDate.getDate();
  });

  const renderItem = ({ item }: { item: typeof receipts.$inferSelect }) => {
    const displayId = item.receiptNumber && item.receiptNumber.length > 8 
      ? `#${item.receiptNumber.substring(0, 8)}...` 
      : `#${item.receiptNumber}`;

    return (
      <View 
        bg-white 
        padding-s4 
        marginB-s2 
        style={{ borderRadius: 8, elevation: 2 }}
      >
        <View row spread centerV>
          <View flex>
            <Text text60 numberOfLines={1}>{displayId}</Text>
            <Text text70 grey10 numberOfLines={1}>{item.customerName}</Text>
            <Text text80 grey30>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
          <View right marginL-s4 style={{ width: 100 }}>
            <Text text60 primary style={{ fontWeight: 'bold' }}>${item.totalAmount.toFixed(2)}</Text>
            <Button 
              label="View" 
              size={Button.sizes.xSmall} 
              outline 
              onPress={() => router.push(`/receipt/${item.id}`)} 
              marginT-s2
              style={{ width: 80 }}
            />
          </View>
        </View>
      </View>
    );
  };

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
          <>
            <View row spread centerV marginB-s4 bg-white padding-s2 style={{ borderRadius: 8 }}>
                <View flex>
                    <DateTimePicker
                        placeholder="Filter by Date"
                        mode="date"
                        value={filterDate}
                        onChange={(date: Date) => setFilterDate(date)}
                        renderInput={(props: any) => (
                            <Text text70 grey20 marginL-s2>
                                {filterDate ? filterDate.toLocaleDateString() : 'Filter by date...'}
                            </Text>
                        )}
                    />
                </View>
                {filterDate && (
                    <Button 
                        label="Clear" 
                        link 
                        size={Button.sizes.xSmall} 
                        onPress={() => setFilterDate(undefined)} 
                    />
                )}
            </View>
            <FlatList
              data={filteredData}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 80 }}
              ListEmptyComponent={() => (
                  <View center paddingT-s10>
                      <Text grey40>No receipts found for this date.</Text>
                  </View>
              )}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
