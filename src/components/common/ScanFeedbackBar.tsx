import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { submitScanFeedback } from '../../services/scan.service';

// 베타 v1 — 1탭 피드백. scanLogId 가 있을 때만 표시.
// 영어 inline (i18n v1.1 deferred). 참조: closed-beta/README.md "공통 규칙 #2"

interface Props {
  scanLogId?: string;
}

export default function ScanFeedbackBar({ scanLogId }: Props) {
  const [submitted, setSubmitted] = useState<'helpful' | 'notHelpful' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!scanLogId) return null;

  async function send(helpful: boolean) {
    if (submitted || submitting) return;
    setSubmitting(true);
    try {
      await submitScanFeedback(scanLogId!, helpful);
      setSubmitted(helpful ? 'helpful' : 'notHelpful');
    } catch {
      // 실패해도 사용자 흐름 막지 않음 — UX 우선.
      setSubmitted(helpful ? 'helpful' : 'notHelpful');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.thanks}>Thanks for the feedback</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => send(true)}
        disabled={submitting}
        activeOpacity={0.7}
      >
        <Text style={styles.btnText}>👍 Helpful</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => send(false)}
        disabled={submitting}
        activeOpacity={0.7}
      >
        <Text style={styles.btnText}>👎 Not helpful</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  btnText: {
    color: '#F9FFF3',
    fontSize: 13,
    fontWeight: '600',
  },
  thanks: {
    color: '#F9FFF3',
    fontSize: 13,
    fontStyle: 'italic',
    opacity: 0.8,
  },
});
