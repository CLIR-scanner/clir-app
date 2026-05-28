// Sentry.ErrorBoundary 의 fallback UI. 렌더 트리에서 unhandled 에러 발생 시 흰 화면 크래시
// 대신 이 화면을 보여주고, resetError() 로 같은 트리를 재마운트해 복구를 시도한다.
// Sentry 가 동일 에러를 이미 캡처하므로 여기서는 사용자 대면 복구만 담당.

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/colors';

interface Props {
  resetError: () => void;
}

export default function ErrorBoundaryFallback({ resetError }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <Text style={styles.emoji}>⚠️</Text>
        <Text style={styles.title}>{t('common.errorTitle')}</Text>
        <Text style={styles.message}>{t('common.errorMessage')}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={resetError}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t('common.retry')}
        >
          <Text style={styles.buttonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  emoji: { fontSize: 44, marginBottom: 4 },
  title: { fontSize: 20, fontFamily: 'Pretendard-Bold', color: Colors.black, textAlign: 'center' },
  message: { fontSize: 14, lineHeight: 21, color: Colors.gray700, textAlign: 'center', marginBottom: 12 },
  button: {
    minHeight: 48,
    paddingHorizontal: 32,
    justifyContent: 'center',
    borderRadius: 28,
    backgroundColor: '#044733',
  },
  buttonText: { fontSize: 16, fontFamily: 'Pretendard-SemiBold', color: Colors.white },
});
