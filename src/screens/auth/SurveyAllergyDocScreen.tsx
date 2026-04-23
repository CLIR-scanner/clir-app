import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { AuthStackParamList, SurveyParams } from '../../types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SurveyAllergyDoc'>;
type Route = RouteProp<AuthStackParamList, 'SurveyAllergyDoc'>;

export default function SurveyAllergyDocScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const params = route.params;

  const [fileName, setFileName] = useState<string | null>(null);

  async function handlePickDocument() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      setFileName(result.assets[0].name);
    }
  }

  function handleContinue() {
    navigation.navigate('SurveyAllergyDocResult', params);
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{'←'}</Text>
        </TouchableOpacity>
        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
        </View>
      </View>

      {/* 본문 */}
      <View style={styles.body}>
        <Text style={styles.title}>Upload your document.</Text>
        <Text style={styles.subtitle}>
          Upload a medical document or take a photo so we can review it
          and identify ingredients you may need to avoid.
        </Text>

        <TouchableOpacity style={styles.uploadArea} onPress={handlePickDocument}>
          {fileName ? (
            <>
              <Text style={styles.uploadIcon}>✓</Text>
              <Text style={styles.uploadedName} numberOfLines={2}>{fileName}</Text>
              <Text style={styles.uploadHint}>tap to change</Text>
            </>
          ) : (
            <>
              <Text style={styles.uploadIcon}>↑</Text>
              <Text style={styles.uploadLabel}>Tap to upload</Text>
              <Text style={styles.uploadHint}>PDF or image</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* 하단 */}
      <View style={styles.footer}>
        <Text style={styles.disclaimer}>
          ** Your document is only used to help set up your allergy preferences.
        </Text>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const S = { bg: '#F9FFF3', primary: '#1C3A19', selectedFill: '#556C53', textLight: '#F9FFF3' };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: S.bg, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 40 },
  backText: { fontSize: 22, color: S.primary },
  progressBar: { flex: 1, height: 4, backgroundColor: '#D6E8D4', borderRadius: 2 },
  progressFill: { width: '80%', height: '100%', backgroundColor: S.primary, borderRadius: 2 },
  body: { flex: 1 },
  title: { fontSize: 28, fontWeight: '800', color: '#000000', lineHeight: 32, marginBottom: 12 },
  subtitle: { fontSize: 12, color: S.primary, lineHeight: 12 * 1.35, marginBottom: 32 },
  uploadArea: {
    borderWidth: 1,
    borderColor: S.primary,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: S.bg,
    gap: 8,
  },
  uploadIcon: { fontSize: 28, color: S.primary },
  uploadLabel: { fontSize: 15, fontWeight: '600', color: S.primary },
  uploadHint: { fontSize: 12, color: S.primary, opacity: 0.6 },
  uploadedName: { fontSize: 14, fontWeight: '600', color: S.primary, textAlign: 'center', paddingHorizontal: 16 },
  footer: { gap: 16 },
  disclaimer: { fontSize: 11, color: S.primary, lineHeight: 16, opacity: 0.6 },
  continueButton: { height: 53, backgroundColor: S.primary, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  continueText: { fontSize: 16, fontWeight: '700', color: S.textLight },
});
