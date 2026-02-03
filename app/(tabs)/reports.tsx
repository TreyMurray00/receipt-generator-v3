import { db } from '@/db/client';
import { receipts } from '@/db/schema';
import { useThemeColor } from '@/hooks/use-theme-color';
import { desc } from 'drizzle-orm';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import { useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useCallback, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { Button, SegmentedControl, Text, Colors as UIColors, View } from 'react-native-ui-lib';

export default function ReportsScreen() {
  const [data, setData] = useState<typeof receipts.$inferSelect[]>([]);
  const [filteredData, setFilteredData] = useState<typeof receipts.$inferSelect[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState(0); // 0: Day, 1: Week, 2: Month, 3: All

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    setLoading(true);
    try {
      const res = await db.select().from(receipts).orderBy(desc(receipts.createdAt));
      setData(res);
      applyFilter(res, filterType);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function applyFilter(allData: typeof receipts.$inferSelect[], type: number) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    // Calculate start of week (Sunday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Calculate start of month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let filtered = allData;
    
    if (type === 0) { // Day
        filtered = allData.filter(item => item.createdAt >= startOfDay);
    } else if (type === 1) { // Week
        filtered = allData.filter(item => item.createdAt >= startOfWeek.getTime());
    } else if (type === 2) { // Month
        filtered = allData.filter(item => item.createdAt >= startOfMonth);
    }
    // Type 3 is All Time, so no filter needed

    setFilteredData(filtered);
    setFilterType(type);
  }

  const handleFilterChange = (index: number) => {
      applyFilter(data, index);
  };

  const totalAmount = filteredData.reduce((acc, item) => acc + item.totalAmount, 0);

  // Calculate generic stats for cards regardless of filter
  const todayTotal = data
    .filter(item => item.createdAt >= new Date().setHours(0,0,0,0))
    .reduce((acc, item) => acc + item.totalAmount, 0);
    
  const weekTotal = data
    .filter(item => {
        const now = new Date();
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0,0,0,0);
        return item.createdAt >= start.getTime();
    })
    .reduce((acc, item) => acc + item.totalAmount, 0);

  const monthTotal = data
    .filter(item => item.createdAt >= new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime())
    .reduce((acc, item) => acc + item.totalAmount, 0);


  async function exportPdf() {
    if (filteredData.length === 0) return Alert.alert("No Data", "No receipts to export for this period.");
    setLoading(true);
    try {
      const html = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica'; padding: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              h1 { margin-bottom: 5px; }
              .summary { margin-bottom: 20px; font-size: 14px; color: #555; }
            </style>
          </head>
          <body>
            <h1>Receipts Report</h1>
            <div class="summary">
                <p>Generated: ${new Date().toLocaleString()}</p>
                <p>Period: ${['Today', 'This Week', 'This Month', 'All Time'][filterType]}</p>
                <p>Total Amount: $${totalAmount.toFixed(2)}</p>
                <p>Total Receipts: ${filteredData.length}</p>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Receipt #</th>
                  <th>Customer</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${filteredData.map(item => `
                  <tr>
                    <td>${new Date(item.createdAt).toLocaleDateString()}</td>
                    <td>${item.receiptNumber}</td>
                    <td>${item.customerName || '-'}</td>
                    <td>$${item.totalAmount.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to export PDF");
    } finally {
      setLoading(false);
    }
  }

  async function exportCsv() {
    if (filteredData.length === 0) return Alert.alert("No Data", "No receipts to export for this period.");
    setLoading(true);
    try {
      let csv = 'Date,Time,Receipt Number,Customer Name,Total Amount\n';
      filteredData.forEach(item => {
        const d = new Date(item.createdAt);
        csv += `"${d.toLocaleDateString()}","${d.toLocaleTimeString()}","${item.receiptNumber}","${item.customerName || ''}","${item.totalAmount.toFixed(2)}"\n`;
      });

      const path = FileSystem.documentDirectory + 'receipts_export.csv';
      await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(path, { UTI: '.csv', mimeType: 'text/csv' });
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to export CSV");
    } finally {
      setLoading(false);
    }
  }

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardColor = useThemeColor({ light: '#f9f9f9', dark: '#1a1a1a' }, 'background');
  const secondaryTextColor = useThemeColor({ light: UIColors.grey40, dark: UIColors.grey30 }, 'text');
  const highlightColor = '#5a48f5';

  return (
    <View flex backgroundColor={backgroundColor}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text text50 marginB-20 color={textColor}>Overview</Text>
        
        {/* Stats Cards */}
        <View row spread marginB-20>
            <View flex-1 backgroundColor={cardColor} padding-10 style={{ borderRadius: 8, marginRight: 10 }}>
                <Text text90 color={secondaryTextColor}>TODAY</Text>
                <Text text60 color={textColor}>${todayTotal.toFixed(2)}</Text>
            </View>
            <View flex-1 backgroundColor={cardColor} padding-10 style={{ borderRadius: 8, marginRight: 10 }}>
                <Text text90 color={secondaryTextColor}>WEEK</Text>
                <Text text60 color={textColor}>${weekTotal.toFixed(2)}</Text>
            </View>
            <View flex-1 backgroundColor={cardColor} padding-10 style={{ borderRadius: 8 }}>
                <Text text90 color={secondaryTextColor}>MONTH</Text>
                <Text text60 color={textColor}>${monthTotal.toFixed(2)}</Text>
            </View>
        </View>

        <Text text50 marginB-10 color={textColor}>Export Reports</Text>
        
        <View marginB-20>
            <SegmentedControl
                segments={[{label: 'Day'}, {label: 'Week'}, {label: 'Month'}, {label: 'All'}]}
                initialIndex={filterType}
                onChangeIndex={handleFilterChange}
                backgroundColor={cardColor}
                activeColor={highlightColor}
                style={{ height: 40 }}
            />
            <View marginT-10 center>
                <Text text80 color={secondaryTextColor}>
                    Found {filteredData.length} records totaling ${totalAmount.toFixed(2)}
                </Text>
            </View>
        </View>

        <View>
            <Button 
                label={`Export ${['Day', 'Week', 'Month', 'All'][filterType]} PDF`} 
                onPress={exportPdf} 
                marginB-15 
                backgroundColor={highlightColor} 
            />
            <Button 
                label={`Export ${['Day', 'Week', 'Month', 'All'][filterType]} CSV`} 
                onPress={exportCsv} 
                outline 
                outlineColor={highlightColor} 
                color={highlightColor}
            />
        </View>

      </ScrollView>
    </View>
  );
}
