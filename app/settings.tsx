import { eq } from 'drizzle-orm';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { Button, Image, Text, TextField, TouchableOpacity, View } from 'react-native-ui-lib';
import { db } from '../db/client';
import { settings } from '../db/schema';

export default function SettingsScreen() {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const res = await db.select().from(settings).where(eq(settings.id, 1));
      if (res.length > 0) {
        const s = res[0];
        setName(s.businessName || '');
        setAddress(s.businessAddress || '');
        setLogo(s.logoUri);
        setSignature(s.signatureUri);
      }
    } catch (e) {
      console.error("Error loading settings:", e);
    }
  }

  async function pickImage(type: 'logo' | 'signature') {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      if (type === 'logo') setLogo(result.assets[0].uri);
      else setSignature(result.assets[0].uri);
    }
  }

  async function save() {
    setLoading(true);
    try {
      const existing = await db.select().from(settings).where(eq(settings.id, 1));
      if (existing.length > 0) {
        await db.update(settings).set({
          businessName: name,
          businessAddress: address,
          logoUri: logo,
          signatureUri: signature
        }).where(eq(settings.id, 1));
      } else {
        await db.insert(settings).values({
          id: 1,
          businessName: name,
          businessAddress: address,
          logoUri: logo,
          signatureUri: signature
        });
      }
      Alert.alert("Success", "Settings saved!");
      if (router.canGoBack()) router.back();
    } catch (e) {
      Alert.alert("Error", "Failed to save settings");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
      <Text text50 marginB-20>Business Details</Text>
      
      <TextField
        placeholder="Business Name"
        floatingPlaceholder
        value={name}
        onChangeText={setName}
        text70
        containerStyle={{ marginBottom: 20 }}
      />
      
      <TextField
        placeholder="Business Address"
        floatingPlaceholder
        value={address}
        onChangeText={setAddress}
        text70
        multiline
        containerStyle={{ marginBottom: 20 }}
      />
      
      <Text text60 marginB-10>Logo</Text>
      <TouchableOpacity onPress={() => pickImage('logo')}>
        <View 
          height={150} 
          bg-grey70 
          center 
          style={{ borderRadius: 8, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: '#ddd' }}
        >
          {logo ? (
            <Image source={{ uri: logo }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          ) : (
            <Text grey40>Tap to select Logo</Text>
          )}
        </View>
      </TouchableOpacity>
      
      <Text text60 marginB-10>Signature</Text>
      <TouchableOpacity onPress={() => pickImage('signature')}>
        <View 
          height={100} 
          bg-grey70 
          center 
          style={{ borderRadius: 8, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: '#ddd' }}
        >
          {signature ? (
             <Image source={{ uri: signature }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          ) : (
            <Text grey40>Tap to select Signature Image</Text>
          )}
        </View>
      </TouchableOpacity>
      
      <Button 
        label={loading ? "Saving..." : "Save Settings"} 
        onPress={save} 
        disabled={loading}
        size={Button.sizes.large}
      />
    </ScrollView>
  );
}
