import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/colors';
import { addQAAnswer, getQAQuestionDetail } from '../../services/recommend.service';
import { QAAnswer, QAQuestion, RecommendStackParamList } from '../../types';
import { useUserStore } from '../../store/user.store';

type Props = NativeStackScreenProps<RecommendStackParamList, 'QADetail'>;

const C = {
  bg: Colors.searchBackground,
  dark: Colors.searchDarkGreen,
  mid: Colors.searchMutedGreen,
  muted: Colors.searchBorder,
  pale: Colors.profileCard,
  line: Colors.searchDivider,
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

function AnswerRow({ item }: { item: QAAnswer }) {
  return (
    <View style={styles.answerRow}>
      <View style={styles.answerAvatar}>
        <Text style={styles.answerAvatarText}>{item.author.slice(0, 1).toUpperCase()}</Text>
      </View>
      <View style={styles.answerBody}>
        <View style={styles.answerHeader}>
          <Text style={styles.answerAuthor} numberOfLines={1}>{item.author}</Text>
          <Text style={styles.answerDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <Text style={styles.answerText}>{item.body}</Text>
      </View>
    </View>
  );
}

const GUIDELINE_KEYS = [
  'recommendUi.guidelineRuleProduct',
  'recommendUi.guidelineRuleLabel',
  'recommendUi.guidelineRuleContext',
  'recommendUi.guidelineRuleEmergency',
];

export default function QADetailScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { questionId } = route.params;
  const [question, setQuestion] = useState<QAQuestion | null>(null);
  const [answers, setAnswers] = useState<QAAnswer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentUserName = useUserStore(s => s.currentUser.name);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getQAQuestionDetail(questionId)
      .then(result => {
        if (cancelled) return;
        setQuestion(result.question);
        setAnswers(result.answers);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [questionId]);

  const answerCount = useMemo(() => answers.length, [answers.length]);

  async function handleSubmit() {
    const body = draft.trim();
    if (!body || isSubmitting || !question) return;

    setIsSubmitting(true);
    try {
      const answer = await addQAAnswer({
        questionId: question.id,
        author: currentUserName || 'Me',
        body,
      });
      setAnswers(prev => [...prev, answer]);
      setDraft('');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('recommendUi.qa')}</Text>
      </View>

      {isLoading || !question ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={C.dark} />
        </View>
      ) : (
        <FlatList
          data={answers}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 120 }]}
          ListHeaderComponent={
            <View>
              <View style={[styles.questionCard, question.isNotice && styles.noticeCard]}>
                <Text style={styles.questionLabel}>{question.label}</Text>
                <Text style={styles.questionTitle}>{question.title}</Text>
                <Text style={styles.questionAuthor}>by {question.author}</Text>
                <Text style={styles.questionBody}>{question.body}</Text>
              </View>

              {question.isNotice && (
                <View style={styles.guidelineBox}>
                  <Text style={styles.guidelineEyebrow}>NOTICE</Text>
                  <Text style={styles.guidelineTitle}>{t('recommendUi.guidelineTitle')}</Text>
                  <Text style={styles.guidelineIntro}>
                    {t('recommendUi.guidelineIntro')}
                  </Text>
                  {GUIDELINE_KEYS.map((key, index) => (
                    <View key={key} style={styles.guidelineRow}>
                      <Text style={styles.guidelineNumber}>{index + 1}</Text>
                      <Text style={styles.guidelineText}>{t(key)}</Text>
                    </View>
                  ))}
                  <View style={styles.guidelineFooter}>
                    <Text style={styles.guidelineFooterText}>
                      {t('recommendUi.guidelineFooter')}
                    </Text>
                  </View>
                </View>
              )}

              {!question.isNotice && (
                <View style={styles.answerTitleRow}>
                  <Text style={styles.answerSectionTitle}>Answers</Text>
                  <Text style={styles.answerCount}>{answerCount}</Text>
                </View>
              )}
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.divider} />}
          renderItem={({ item }) => <AnswerRow item={item} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No answers yet. Be the first to reply.</Text>
          }
        />
      )}

      {!question?.isNotice && (
        <View style={[styles.replyBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TextInput
            style={styles.replyInput}
            value={draft}
            onChangeText={setDraft}
            placeholder="Write a reply"
            placeholderTextColor={C.muted}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!draft.trim() || isSubmitting) && styles.sendButtonDisabled]}
            onPress={handleSubmit}
            disabled={!draft.trim() || isSubmitting}
            activeOpacity={0.75}
          >
            <Text style={styles.sendButtonText}>{isSubmitting ? '...' : 'Send'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    height: 82,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 15,
    bottom: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: C.dark,
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '400',
  },
  headerTitle: {
    marginTop: 8,
    color: C.dark,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.38,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 28,
    paddingTop: 16,
  },
  questionCard: {
    borderWidth: 1,
    borderColor: C.muted,
    borderRadius: 16,
    backgroundColor: C.pale,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 28,
  },
  noticeCard: {
    backgroundColor: C.dark,
    borderColor: C.dark,
  },
  questionLabel: {
    color: C.muted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 8,
  },
  questionTitle: {
    color: C.dark,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 27,
  },
  questionAuthor: {
    color: C.mid,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
    marginBottom: 18,
  },
  questionBody: {
    color: C.mid,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 21,
  },
  guidelineBox: {
    borderWidth: 1,
    borderColor: C.muted,
    borderRadius: 18,
    backgroundColor: C.pale,
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 28,
  },
  guidelineEyebrow: {
    color: C.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  guidelineTitle: {
    color: C.dark,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    marginBottom: 8,
  },
  guidelineIntro: {
    color: C.mid,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 18,
  },
  guidelineRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  guidelineNumber: {
    width: 24,
    color: C.dark,
    fontSize: 14,
    fontWeight: '800',
  },
  guidelineText: {
    flex: 1,
    color: C.mid,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },
  guidelineFooter: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: C.bg,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  guidelineFooterText: {
    color: C.dark,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  answerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  answerSectionTitle: {
    color: C.dark,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  answerCount: {
    color: C.mid,
    fontSize: 13,
    fontWeight: '700',
  },
  answerRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 16,
  },
  answerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerAvatarText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  answerBody: {
    flex: 1,
    minWidth: 0,
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 5,
  },
  answerAuthor: {
    flex: 1,
    color: C.dark,
    fontSize: 14,
    fontWeight: '700',
  },
  answerDate: {
    color: C.muted,
    fontSize: 11,
    fontWeight: '500',
  },
  answerText: {
    color: C.mid,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 19,
  },
  divider: {
    height: 1,
    backgroundColor: C.line,
  },
  emptyText: {
    color: C.mid,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 28,
  },
  replyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingTop: 10,
    paddingHorizontal: 18,
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  replyInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 96,
    borderWidth: 1,
    borderColor: C.muted,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: C.dark,
    fontSize: 14,
    fontWeight: '500',
  },
  sendButton: {
    height: 42,
    borderRadius: 12,
    backgroundColor: C.dark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  sendButtonDisabled: {
    opacity: 0.35,
  },
  sendButtonText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
});
