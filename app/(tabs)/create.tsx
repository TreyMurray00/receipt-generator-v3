import { db } from '@/db/client';
import { receipts, settings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { router, useFocusEffect } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import 'react-native-get-random-values';
import { Button, Text, TextField, TouchableOpacity, View } from 'react-native-ui-lib';
import { v4 as uuidv4 } from 'uuid';

export default function CreateReceipt() {
  const [customer, setCustomer] = useState('');
  const [lineItems, setLineItems] = useState<{id: string, desc: string, qty: string, price: string}[]>([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(() => {
    setLineItems([]);
  });

  function addItem() {
    setLineItems([...lineItems, { id: uuidv4(), desc: '', qty: '1', price: '0.00' }]);
  }

  function updateItem(id: string, field: keyof typeof lineItems[0], value: string) {
    setLineItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  }

  function removeItem(id: string) {
    setLineItems(prev => prev.filter(item => item.id !== id));
  }
  
  const total = lineItems.reduce((acc, item) => {
    return acc + (parseFloat(item.qty || '0') * parseFloat(item.price || '0'));
  }, 0);

  async function save() {
    if (!customer) return Alert.alert("Error", "Customer name is required");
    if (lineItems.length === 0) return Alert.alert("Error", "Add at least one item");

    setLoading(true);
    try {
      const settingsRes = await db.select().from(settings).where(eq(settings.id, 1));
      const currentSettings = settingsRes[0] || {};
      
      const newId = uuidv4();
      const receiptNum = uuidv4();


      
      await db.insert(receipts).values({
        id: newId,
        receiptNumber: receiptNum,
        createdAt: Date.now(),
        customerName: customer,
        items: JSON.stringify(lineItems),
        totalAmount: total,
        businessSnapshot: JSON.stringify(currentSettings)
      });

      router.replace(`/receipt/${newId}`);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to create receipt");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View flex bg-white>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <TextField
          placeholder="Customer Name"
          floatingPlaceholder
          value={customer}
          onChangeText={setCustomer}
          text70
          containerStyle={{ marginBottom: 20 }}
        />
        
        <Text text60 marginB-10>Items</Text>
        {lineItems.map((item) => (
          <View key={item.id} row spread marginB-10 style={{ alignItems: 'center' }}>
            <View flex-2 marginR-10>
              <TextField 
                placeholder="Description" 
                value={item.desc}
                onChangeText={v => updateItem(item.id, 'desc', v)}
                text80
                containerStyle={{ borderBottomWidth: 1, borderColor: '#eee' }}
              />
            </View>
            <View flex-1 marginR-5>
              <TextField 
                placeholder="Qty" 
                keyboardType="numeric"
                value={item.qty}
                onChangeText={v => updateItem(item.id, 'qty', v)}
                 text80
                 containerStyle={{ borderBottomWidth: 1, borderColor: '#eee' }}
              />
            </View>
            <View flex-1 marginR-5>
              <TextField 
                placeholder="Price" 
                keyboardType="numeric"
                value={item.price}
                onChangeText={v => updateItem(item.id, 'price', v)}
                 text80
                 containerStyle={{ borderBottomWidth: 1, borderColor: '#eee' }}
              />
            </View>
            <TouchableOpacity onPress={() => removeItem(item.id)}>
              <Text red10 text60>X</Text>
            </TouchableOpacity>
          </View>
        ))}
        
        <Button label="+ Add Item" outline size={Button.sizes.small} onPress={addItem} marginB-20 />
        
        <Text text50 marginT-20>Total: ${total.toFixed(2)}</Text>
      </ScrollView>
      
      <View padding-20 bg-white style={{ elevation: 5, borderTopWidth: 1, borderColor: '#eee' }}>
        <Button label={loading ? "Saving..." : "Create Receipt"} onPress={save} disabled={loading} size={Button.sizes.large} />
      </View>
    </View>
  );
}
