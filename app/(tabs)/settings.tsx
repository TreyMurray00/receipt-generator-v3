import { db } from '@/db/client';
import { settings } from '@/db/schema';
import { useThemeColor } from '@/hooks/use-theme-color';
import { eq } from 'drizzle-orm';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import SignatureScreen from 'react-native-signature-canvas';
import { Button, Image, Modal, Text, TextField, TouchableOpacity, Colors as UIColors, View } from 'react-native-ui-lib';

export default function SettingsScreen() {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  
  // Custom Signature Modal state
  const [signatureModalVisible, setSignatureModalVisible] = useState(false);
  const signatureRef = useRef<any>(null);

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
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      if (type === 'logo') setLogo(result.assets[0].uri);
      else setSignature(result.assets[0].uri);
    }
  }

  const handleSignatureOK = async (signatureBase64: string) => {
    // Save base64 to a file so it persists and we have a URI
    const path = FileSystem.documentDirectory + 'signature_' + Date.now() + '.png';
    try {
        await FileSystem.writeAsStringAsync(path, signatureBase64.replace('data:image/png;base64,', ''), { encoding: FileSystem.EncodingType.Base64 });
        setSignature(path);
        setSignatureModalVisible(false);
    } catch (e) {
        Alert.alert("Error", "Failed to save signature");
        console.error(e);
    }
  };

  const handleClear = () => {
    signatureRef.current?.clearSignature();
  };

  const handleConfirm = () => {
      signatureRef.current?.readSignature();
  };

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



  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardColor = useThemeColor({ light: UIColors.grey70, dark: '#1a1a1a' }, 'background');
  const borderColor = useThemeColor({ light: '#ddd', dark: '#333' }, 'background');
  const placeholderTextColor = useThemeColor({ light: UIColors.grey40, dark: UIColors.grey30 }, 'text');

  return (
    <View flex backgroundColor={backgroundColor}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }} scrollEnabled={scrollEnabled}>
        <Text text50 marginB-20 color={textColor}>Business Details</Text>
        
        <TextField
            label="Business Name"
            placeholder="Business Name"
            floatingPlaceholder
            value={name}
            onChangeText={setName}
            text70
            labelColor={textColor}
            placeholderTextColor={placeholderTextColor}
            floatingPlaceholderColor={{
                default: placeholderTextColor,
                focus: UIColors.primary
            }}
            color={textColor}
            containerStyle={{ marginBottom: 20 }}
        />
        
        <TextField
            label="Business Address"
            placeholder="Business Address"
            floatingPlaceholder
            value={address}
            onChangeText={setAddress}
            text70
            multiline
            labelColor={textColor}
            placeholderTextColor={placeholderTextColor}
            floatingPlaceholderColor={{
                default: placeholderTextColor,
                focus: UIColors.primary
            }}
            color={textColor}
            containerStyle={{ marginBottom: 20 }}
        />
        
        <Text text60 marginB-10 color={textColor}>Logo</Text>
        <TouchableOpacity onPress={() => pickImage('logo')}>
            <View 
            height={150} 
            backgroundColor={cardColor} 
            center 
            style={{ borderRadius: 8, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: borderColor }}
            >
            {logo ? (
                <Image source={{ uri: logo }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
            ) : (
                <Text grey40 color={placeholderTextColor}>Tap to select Logo</Text>
            )}
            </View>
        </TouchableOpacity>
        
        <Text text60 marginB-10 color={textColor}>Signature</Text>
        <View row marginB-10>
            <Button label="Upload Image" outline size={Button.sizes.xSmall} outlineColor={UIColors.primary} onPress={() => pickImage('signature')} marginR-10 />
            <Button label="Draw Signature" size={Button.sizes.xSmall} onPress={() => setSignatureModalVisible(true)} />
        </View>

        <View 
            height={100} 
            backgroundColor={cardColor} 
            center 
            style={{ borderRadius: 8, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: borderColor }}
            >
            {signature ? (
                <Image source={{ uri: signature }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
            ) : (
                <Text grey40 color={placeholderTextColor}>No signature selected</Text>
            )}
        </View>


        
        <Button 
            label={loading ? "Saving..." : "Save Settings"} 
            onPress={save} 
            disabled={loading}
            size={Button.sizes.large}
        />
        </ScrollView>

        <Modal visible={signatureModalVisible} animationType="slide">
            <View flex backgroundColor={backgroundColor} padding-20>
                <Text text50 marginB-20 color={textColor}>Draw Signature</Text>
                <View style={{ height: 300, borderWidth: 1, borderColor: textColor, marginBottom: 20 }}>
                    <SignatureScreen
                        ref={signatureRef}
                        onOK={handleSignatureOK}
                        webStyle={`.m-signature-pad--footer {display: none; margin: 0px;} .m-signature-pad { border: none; box-shadow: none; }`} 
                        backgroundColor="#ffffff"
                        penColor="#000000"
                        style={{ flex: 1, width: '100%', height: '100%' }}
                    />
                </View>
                <View row center>
                    <Button label="Clear" outline outlineColor={UIColors.primary} onPress={handleClear} marginR-10 />
                    <Button label="Save" onPress={handleConfirm} marginR-10 />
                    <Button label="Cancel" link linkColor={UIColors.primary} onPress={() => setSignatureModalVisible(false)} />
                </View>
            </View>
        </Modal>
    </View>
  );
}
