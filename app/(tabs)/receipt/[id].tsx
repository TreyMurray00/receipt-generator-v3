import { db } from '@/db/client';
import { receipts } from '@/db/schema';
import { useThemeColor } from '@/hooks/use-theme-color';
import { eq } from 'drizzle-orm';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Button, Image, Text, Colors as UIColors, View } from 'react-native-ui-lib';

export default function ReceiptDetails() {
  const { id } = useLocalSearchParams();
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadReceipt();
  }, [id]);

  async function loadReceipt() {
    try {
      const res = await db.select().from(receipts).where(eq(receipts.id, id as string));
      if (res.length > 0) {
        setReceipt(res[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function generatePdf() {
    if (!receipt) return;
    
    try {
      const items = JSON.parse(receipt.items);
      const snapshot = JSON.parse(receipt.businessSnapshot || '{}');
      
      // Convert images to base64 if needed
      let logoHtml = '';
      if (snapshot.logoUri) {
         try {
             const base64 = await FileSystem.readAsStringAsync(snapshot.logoUri, { encoding: FileSystem.EncodingType.Base64 });
             logoHtml = `<img src="data:image/jpeg;base64,${base64}" style="width: 100px; height: auto;" />`;
         } catch (e) { console.warn("Logo load fail", e); }
      }
      
      let signatureHtml = '';
      if (snapshot.signatureUri) {
          try {
             const base64 = await FileSystem.readAsStringAsync(snapshot.signatureUri, { encoding: FileSystem.EncodingType.Base64 });
             signatureHtml = `<img src="data:image/png;base64,${base64}" style="width: 150px; height: auto;" />`;
          } catch (e) { console.warn("Sig load fail", e); }
      }

      const html = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica'; padding: 20px; }
              .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
              .business-info { text-align: right; }
              .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .total { margin-top: 20px; text-align: right; font-size: 18px; font-weight: bold; }
              .signature { margin-top: 50px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div>${logoHtml}</div>
              <div class="business-info">
                <h2>${snapshot.businessName || 'Business Name'}</h2>
                <p>${(snapshot.businessAddress || '').replace(/\n/g, '<br>')}</p>
              </div>
            </div>
            
            <hr />
            
            <div>
              <p><strong>Receipt #:</strong> ${receipt.receiptNumber}</p>
              <p><strong>Date:</strong> ${new Date(receipt.createdAt).toLocaleDateString()} ${new Date(receipt.createdAt).toLocaleTimeString()}</p>
              <p><strong>Customer:</strong> ${receipt.customerName}</p>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${items.map((item: any) => `
                  <tr>
                    <td>${item.desc}</td>
                    <td>${item.qty}</td>
                    <td>$${parseFloat(item.price).toFixed(2)}</td>
                    <td>$${(parseFloat(item.qty) * parseFloat(item.price)).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="total">
              Total Amount: $${receipt.totalAmount.toFixed(2)}
            </div>
            
            <div class="signature">
              <p>Authorized Signature:</p>
              ${signatureHtml}
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to generate PDF");
    }
  }

  async function handleDelete() {
    Alert.alert(
      "Delete Receipt",
      "Are you sure you want to delete this receipt? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
             try {
               await db.delete(receipts).where(eq(receipts.id, id as string));
               Alert.alert("Success", "Receipt deleted");
               router.back();
             } catch (e) {
               console.error(e);
               Alert.alert("Error", "Failed to delete receipt");
             }
          }
        }
      ]
    );
  }

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardColor = useThemeColor({ light: '#FFFFFF', dark: '#1a1a1a' }, 'background');
  const borderColor = useThemeColor({ light: UIColors.grey50, dark: '#333' }, 'background');
  const mutedTextColor = useThemeColor({ light: UIColors.grey40, dark: UIColors.grey30 }, 'text');
  const secondaryBgColor = useThemeColor({ light: UIColors.grey70, dark: '#222' }, 'background');

  if (loading) return <View flex center backgroundColor={backgroundColor}><ActivityIndicator size="large" /></View>;
  if (!receipt) return <View flex center backgroundColor={backgroundColor}><Text color={textColor}>Receipt not found</Text></View>;

  const snapshot = JSON.parse(receipt.businessSnapshot || '{}');
  const items = JSON.parse(receipt.items);

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }} style={{ backgroundColor }}>
      {/* Visual Preview */}
      <View backgroundColor={cardColor} padding-20 style={{ borderRadius: 8, elevation: 2, marginBottom: 20 }}>
        <View row spread marginB-20>
           {snapshot.logoUri && <Image source={{ uri: snapshot.logoUri }} style={{ width: 60, height: 60 }} resizeMode="contain"/>}
           <View right>
              <Text text60 color={textColor}>{snapshot.businessName}</Text>
              <Text grey40 color={mutedTextColor}>{snapshot.businessAddress}</Text>
           </View>
        </View>
        
        <View marginB-20>
          <Text text60 color={textColor}>Receipt #{receipt.receiptNumber}</Text>
          <Text grey40 color={mutedTextColor}>{new Date(receipt.createdAt).toDateString()}</Text>
        </View>

        <Text text70 marginB-10 color={textColor}>Bill To: {receipt.customerName}</Text>

        <View backgroundColor={secondaryBgColor} padding-10 marginB-10 style={{ borderRadius: 4 }}>
           {items.map((item: any, i: number) => (
             <View key={i} row spread marginB-5>
               <Text flex-2 color={textColor}>{item.desc} (x{item.qty})</Text>
               <Text color={textColor}>${(parseFloat(item.qty) * parseFloat(item.price)).toFixed(2)}</Text>
             </View>
           ))}
           <View height={1} backgroundColor={borderColor} marginV-10 />
           <View row spread>
             <Text text60 color={textColor}>Total</Text>
             <Text text60 color={textColor}>${receipt.totalAmount.toFixed(2)}</Text>
           </View>
        </View>
        
        {snapshot.signatureUri && (
             <Image source={{ uri: snapshot.signatureUri }} style={{ width: 100, height: 50, marginTop: 20 }} resizeMode="contain"/>
        )}
      </View>

      <Button label="Export PDF" onPress={generatePdf} size={Button.sizes.large} marginB-20 />
      <Button label="Delete Receipt" onPress={handleDelete} size={Button.sizes.large} outline outlineColor="red" color="red" />
    </ScrollView>
  );
}
