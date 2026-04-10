import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { AuthStackParamList, SurveyParams } from '../../types';
import { Colors } from '../../constants/colors';

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
    // TODO: 서버에 문서 업로드 후 분석 요청
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
              <Text style={styles.uploadChange}>tap to change</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 40,
  },
  backText: {
    fontSize: 22,
    color: Colors.black,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.gray100,
    borderRadius: 2,
  },
  progressFill: {
    width: '80%',
    height: '100%',
    backgroundColor: Colors.black,
    borderRadius: 2,
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.gray500,
    lineHeight: 20,
    marginBottom: 32,
  },
  uploadArea: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    gap: 8,
  },
  uploadIcon: {
    fontSize: 28,
    color: Colors.gray500,
  },
  uploadLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.black,
  },
  uploadHint: {
    fontSize: 12,
    color: Colors.gray500,
  },
  uploadedName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  uploadChange: {
    fontSize: 12,
    color: Colors.gray500,
  },
  footer: {
    gap: 16,
  },
  disclaimer: {
    fontSize: 12,
    color: Colors.gray500,
    lineHeight: 18,
  },
  continueButton: {
    backgroundColor: Colors.white,
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: 'center',
  },
  continueText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.black,
  },
});
