import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
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
import Skeleton from '../../components/common/Skeleton';
import {
  addQAAnswer,
  deleteQAAnswer,
  deleteQAQuestion,
  getQAQuestionDetail,
  updateQAAnswer,
  updateQAQuestion,
} from '../../services/recommend.service';
import { ApiError, clearAuthToken, UnauthorizedError } from '../../lib/api';
import { QAAnswer, QAQuestion, RecommendStackParamList } from '../../types';
import { useUserStore } from '../../store/user.store';
import QnaImageViewer from '../../components/QnaImageViewer';
import {
  reportQAQuestion,
  reportQAAnswer,
  blockUser,
} from '../../services/moderation.service';

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

/**
 * BE 에러 코드 → 사용자 노출 메시지. 노출 가능한 4xx/5xx 만 매핑.
 * 매핑되지 않은 코드는 ApiError.message 를 그대로 사용 (BE 한국어 메시지가 BE 응답에 들어있음).
 */
function formatApiError(err: unknown, fallback: string): string {
  if (!(err instanceof ApiError)) return fallback;
  switch (err.code) {
    case 'FORBIDDEN_QNA':
    case 'FORBIDDEN_ANSWER':
      return '본인이 작성한 글만 수정·삭제할 수 있습니다.';
    case 'QNA_NOT_FOUND':
      return '게시글이 이미 삭제되었거나 존재하지 않습니다.';
    case 'ANSWER_NOT_FOUND':
      return '답변이 이미 삭제되었거나 존재하지 않습니다.';
    case 'INVALID_INPUT':
    case 'INVALID_QUERY':
      return '요청 내용이 올바르지 않습니다.';
    case 'TOO_MANY_REQUESTS':
      return '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';
    case 'DB_UNAVAILABLE':
    case 'SERVICE_DISABLED':
      return '서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.';
    case 'NETWORK':
      return '네트워크에 연결할 수 없습니다.';
    case 'TIMEOUT':
      return '요청 시간이 초과되었습니다.';
    default:
      return err.message || fallback;
  }
}

/** 401 공통 처리. true 반환 시 호출부는 추가 작업 중단. */
function handleUnauthorized(err: unknown): boolean {
  if (err instanceof UnauthorizedError) {
    clearAuthToken();
    useUserStore.getState().logout();
    return true;
  }
  return false;
}

interface AnswerRowProps {
  item: QAAnswer;
  isMine: boolean;
  isEditing: boolean;
  editDraft: string;
  onEditDraftChange: (text: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onReport: () => void;
  onBlock: () => void;
  isSavingEdit: boolean;
}

function AnswerRow({
  item,
  isMine,
  isEditing,
  editDraft,
  onEditDraftChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onReport,
  onBlock,
  isSavingEdit,
}: AnswerRowProps) {
  return (
    <View style={styles.answerRow}>
      <View style={styles.answerAvatar}>
        <Text style={styles.answerAvatarText}>{item.author.slice(0, 1).toUpperCase()}</Text>
      </View>
      <View style={styles.answerBody}>
        <View style={styles.answerHeader}>
          <Text style={styles.answerAuthor} numberOfLines={1}>{item.author}</Text>
          <Text style={styles.answerDate}>{formatDate(item.createdAt)}</Text>
          {!isEditing && (
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => {
                const buttons = isMine
                  ? [
                      { text: '수정', onPress: onStartEdit },
                      { text: '삭제', onPress: onDelete, style: 'destructive' as const },
                      { text: '취소', style: 'cancel' as const },
                    ]
                  : [
                      { text: '신고', onPress: onReport, style: 'destructive' as const },
                      { text: '사용자 차단', onPress: onBlock, style: 'destructive' as const },
                      { text: '취소', style: 'cancel' as const },
                    ];
                Alert.alert(isMine ? '답변 관리' : '답변 신고', undefined, buttons);
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={isMine ? '답변 관리' : '답변 신고'}
            >
              <Text style={styles.moreButtonText}>···</Text>
            </TouchableOpacity>
          )}
        </View>

        {isEditing ? (
          <View>
            <TextInput
              style={styles.editInput}
              value={editDraft}
              onChangeText={onEditDraftChange}
              multiline
              maxLength={1000}
              autoFocus
            />
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.editActionBtn, styles.editActionCancel]}
                onPress={onCancelEdit}
                activeOpacity={0.75}
                disabled={isSavingEdit}
              >
                <Text style={styles.editActionCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.editActionBtn,
                  styles.editActionSave,
                  (!editDraft.trim() || isSavingEdit) && styles.editActionDisabled,
                ]}
                onPress={onSaveEdit}
                activeOpacity={0.75}
                disabled={!editDraft.trim() || isSavingEdit}
              >
                <Text style={styles.editActionSaveText}>
                  {isSavingEdit ? '저장 중...' : '저장'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={styles.answerText}>{item.body}</Text>
        )}
      </View>
    </View>
  );
}

function QuestionCardSkeleton() {
  return (
    <View style={styles.questionCard}>
      <Skeleton width={70} height={14} borderRadius={4} style={{ marginBottom: 12 }} />
      <Skeleton width="92%" height={22} borderRadius={4} style={{ marginBottom: 6 }} />
      <Skeleton width="68%" height={22} borderRadius={4} style={{ marginBottom: 12 }} />
      <Skeleton width={90} height={14} borderRadius={4} style={{ marginBottom: 18 }} />
      <Skeleton width="100%" height={14} borderRadius={4} style={{ marginBottom: 4 }} />
      <Skeleton width="95%" height={14} borderRadius={4} style={{ marginBottom: 4 }} />
      <Skeleton width="78%" height={14} borderRadius={4} />
    </View>
  );
}

function AnswerRowSkeleton() {
  return (
    <View style={styles.answerRow}>
      <Skeleton width={34} height={34} borderRadius={17} />
      <View style={styles.answerBody}>
        <View style={[styles.answerHeader, { marginBottom: 8 }]}>
          <Skeleton width={80} height={14} borderRadius={4} />
          <Skeleton width={56} height={11} borderRadius={4} />
        </View>
        <Skeleton width="100%" height={13} borderRadius={4} style={{ marginBottom: 4 }} />
        <Skeleton width="88%" height={13} borderRadius={4} style={{ marginBottom: 4 }} />
        <Skeleton width="60%" height={13} borderRadius={4} />
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  // 답변 인라인 편집 상태 — 단일 row 만 동시에 편집 가능.
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
  const [editAnswerDraft, setEditAnswerDraft] = useState('');
  const [isSavingAnswer,  setIsSavingAnswer]  = useState(false);

  // 질문 편집 Modal 상태.
  const [editQuestionOpen,    setEditQuestionOpen]    = useState(false);
  const [editQuestionTitle,   setEditQuestionTitle]   = useState('');
  const [editQuestionContent, setEditQuestionContent] = useState('');
  const [isSavingQuestion,    setIsSavingQuestion]    = useState(false);

  const currentUserName = useUserStore(s => s.currentUser.name);
  const currentUserId   = useUserStore(s => s.currentUser.id);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    getQAQuestionDetail(questionId)
      .then(result => {
        if (cancelled) return;
        setQuestion(result.question);
        setAnswers(result.answers);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (handleUnauthorized(err)) return;
        // 404 → 사용자가 이미 삭제된 글에 진입. 메시지 + 이전 화면 복귀.
        if (err instanceof ApiError && err.code === 'QNA_NOT_FOUND') {
          Alert.alert('알림', '게시글이 이미 삭제되었거나 존재하지 않습니다.', [
            { text: '확인', onPress: () => navigation.goBack() },
          ]);
          return;
        }
        setLoadError(formatApiError(err, '게시글을 불러올 수 없습니다.'));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [questionId, navigation]);

  const answerCount = useMemo(() => answers.length, [answers.length]);
  const isMyQuestion = !!question && !!currentUserId && question.userId === currentUserId;

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
    } catch (err: unknown) {
      if (handleUnauthorized(err)) return;
      Alert.alert('알림', formatApiError(err, '답변을 등록할 수 없습니다.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── 질문 관리 ───────────────────────────────────────────────────────────
  function openQuestionMenu() {
    if (!question) return;
    if (isMyQuestion) {
      Alert.alert(
        '게시글 관리',
        undefined,
        [
          {
            text: '수정',
            onPress: () => {
              setEditQuestionTitle(question.title);
              setEditQuestionContent(question.body);
              setEditQuestionOpen(true);
            },
          },
          {
            text: '삭제',
            style: 'destructive',
            onPress: confirmDeleteQuestion,
          },
          { text: '취소', style: 'cancel' },
        ],
      );
    } else {
      Alert.alert(
        '게시글 신고',
        undefined,
        [
          { text: '신고', style: 'destructive', onPress: () => promptReportQuestion(question) },
          { text: '사용자 차단', style: 'destructive', onPress: () => confirmBlockUser(question.userId) },
          { text: '취소', style: 'cancel' },
        ],
      );
    }
  }

  function promptReportQuestion(q: QAQuestion) {
    Alert.prompt?.(
      '게시글 신고',
      '신고 사유를 간단히 입력해 주세요. 24시간 내 검토됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '신고',
          style: 'destructive',
          onPress: async (text?: string) => {
            const reason = (text ?? '').trim();
            if (!reason) {
              Alert.alert('알림', '신고 사유를 입력해 주세요.');
              return;
            }
            try {
              await reportQAQuestion(q.id, reason);
              Alert.alert('알림', '신고가 접수되었습니다. 24시간 내 검토됩니다.');
            } catch (err: unknown) {
              if (handleUnauthorized(err)) return;
              if (err instanceof ApiError && err.code === 'ALREADY_REPORTED') {
                Alert.alert('알림', '이미 신고하신 항목입니다.');
                return;
              }
              Alert.alert('알림', formatApiError(err, '신고를 접수하지 못했습니다.'));
            }
          },
        },
      ],
      'plain-text',
    );
  }

  function promptReportAnswer(ans: QAAnswer) {
    Alert.prompt?.(
      '답변 신고',
      '신고 사유를 간단히 입력해 주세요. 24시간 내 검토됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '신고',
          style: 'destructive',
          onPress: async (text?: string) => {
            const reason = (text ?? '').trim();
            if (!reason) {
              Alert.alert('알림', '신고 사유를 입력해 주세요.');
              return;
            }
            try {
              await reportQAAnswer(ans.id, reason);
              Alert.alert('알림', '신고가 접수되었습니다. 24시간 내 검토됩니다.');
            } catch (err: unknown) {
              if (handleUnauthorized(err)) return;
              if (err instanceof ApiError && err.code === 'ALREADY_REPORTED') {
                Alert.alert('알림', '이미 신고하신 항목입니다.');
                return;
              }
              Alert.alert('알림', formatApiError(err, '신고를 접수하지 못했습니다.'));
            }
          },
        },
      ],
      'plain-text',
    );
  }

  function confirmBlockUser(targetUserId: string) {
    Alert.alert(
      '사용자 차단',
      '이 사용자의 게시글과 답변이 더 이상 보이지 않습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '차단',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockUser(targetUserId);
              Alert.alert('알림', '사용자를 차단했습니다.', [
                { text: '확인', onPress: () => navigation.goBack() },
              ]);
            } catch (err: unknown) {
              if (handleUnauthorized(err)) return;
              Alert.alert('알림', formatApiError(err, '차단에 실패했습니다.'));
            }
          },
        },
      ],
    );
  }

  function confirmDeleteQuestion() {
    Alert.alert(
      '게시글 삭제',
      '삭제하면 답변도 함께 삭제되며 되돌릴 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            if (!question) return;
            try {
              await deleteQAQuestion(question.id);
              navigation.goBack();
            } catch (err: unknown) {
              if (handleUnauthorized(err)) return;
              // 404 = 누가 이미 삭제 → goBack 으로 동일 처리
              if (err instanceof ApiError && err.code === 'QNA_NOT_FOUND') {
                navigation.goBack();
                return;
              }
              Alert.alert('알림', formatApiError(err, '삭제에 실패했습니다.'));
            }
          },
        },
      ],
    );
  }

  async function saveQuestionEdit() {
    if (!question) return;
    const title   = editQuestionTitle.trim();
    const content = editQuestionContent.trim();
    if (!title || !content) {
      Alert.alert('알림', '제목과 내용을 모두 입력해 주세요.');
      return;
    }
    if (title.length > 100 || content.length > 2000) {
      Alert.alert('알림', '제목은 100자, 내용은 2000자까지 입력할 수 있습니다.');
      return;
    }
    setIsSavingQuestion(true);
    try {
      const updated = await updateQAQuestion({ id: question.id, title, content });
      // BE 응답 (QnaPostSummary) 의 images 는 빈 배열 — 기존 signed URL 유지.
      setQuestion({ ...updated, images: question.images });
      setEditQuestionOpen(false);
    } catch (err: unknown) {
      if (handleUnauthorized(err)) return;
      // 404 = 누가 이미 삭제 → goBack
      if (err instanceof ApiError && err.code === 'QNA_NOT_FOUND') {
        setEditQuestionOpen(false);
        Alert.alert('알림', '게시글이 이미 삭제되었습니다.', [
          { text: '확인', onPress: () => navigation.goBack() },
        ]);
        return;
      }
      Alert.alert('알림', formatApiError(err, '수정에 실패했습니다.'));
    } finally {
      setIsSavingQuestion(false);
    }
  }

  // ── 답변 관리 ───────────────────────────────────────────────────────────
  function startEditAnswer(ans: QAAnswer) {
    setEditingAnswerId(ans.id);
    setEditAnswerDraft(ans.body);
  }
  function cancelEditAnswer() {
    setEditingAnswerId(null);
    setEditAnswerDraft('');
  }
  async function saveEditAnswer() {
    if (!editingAnswerId) return;
    const content = editAnswerDraft.trim();
    if (!content) return;
    if (content.length > 1000) {
      Alert.alert('알림', '답변은 1000자까지 입력할 수 있습니다.');
      return;
    }
    setIsSavingAnswer(true);
    try {
      const updated = await updateQAAnswer({ id: editingAnswerId, content });
      setAnswers(prev => prev.map(a => (a.id === updated.id ? updated : a)));
      setEditingAnswerId(null);
      setEditAnswerDraft('');
    } catch (err: unknown) {
      if (handleUnauthorized(err)) return;
      if (err instanceof ApiError && err.code === 'ANSWER_NOT_FOUND') {
        setAnswers(prev => prev.filter(a => a.id !== editingAnswerId));
        cancelEditAnswer();
        Alert.alert('알림', '답변이 이미 삭제되었습니다.');
        return;
      }
      Alert.alert('알림', formatApiError(err, '답변 수정에 실패했습니다.'));
    } finally {
      setIsSavingAnswer(false);
    }
  }
  function confirmDeleteAnswer(ans: QAAnswer) {
    Alert.alert(
      '답변 삭제',
      '삭제한 답변은 되돌릴 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteQAAnswer(ans.id);
              setAnswers(prev => prev.filter(a => a.id !== ans.id));
              if (editingAnswerId === ans.id) cancelEditAnswer();
            } catch (err: unknown) {
              if (handleUnauthorized(err)) return;
              if (err instanceof ApiError && err.code === 'ANSWER_NOT_FOUND') {
                setAnswers(prev => prev.filter(a => a.id !== ans.id));
                return;
              }
              Alert.alert('알림', formatApiError(err, '답변 삭제에 실패했습니다.'));
            }
          },
        },
      ],
    );
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
        loadError ? (
          <View style={styles.loadingWrap}>
            <Text style={styles.errorText}>{loadError}</Text>
          </View>
        ) : (
          // 실제 데이터 layout 과 동일한 paddingHorizontal/paddingTop 으로 감싸
          // 로드 완료 시 layout shift 가 없도록 한다.
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 120 }]}
          >
            <QuestionCardSkeleton />
            <View style={[styles.answerTitleRow, { marginTop: 4 }]}>
              <Skeleton width={70} height={18} borderRadius={4} />
              <Skeleton width={20} height={14} borderRadius={4} />
            </View>
            {[0, 1, 2].map(idx => (
              <View key={idx}>
                <AnswerRowSkeleton />
                {idx < 2 && <View style={styles.divider} />}
              </View>
            ))}
          </ScrollView>
        )
      ) : (
        <FlatList
          data={answers}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 120 }]}
          ListHeaderComponent={
            <View>
              <View style={[styles.questionCard, question.isNotice && styles.noticeCard]}>
                <View style={styles.questionTopRow}>
                  <Text style={styles.questionLabel}>{question.label}</Text>
                  {/* 공지글은 메뉴 미노출. 본인 글이면 수정/삭제, 타인 글이면 신고/차단. */}
                  {!question.isNotice && (
                    <TouchableOpacity
                      style={styles.moreButton}
                      onPress={openQuestionMenu}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={isMyQuestion ? '게시글 관리' : '게시글 신고'}
                    >
                      <Text style={styles.moreButtonText}>···</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.questionTitle}>{question.title}</Text>
                <Text style={styles.questionAuthor}>by {question.author}</Text>
                <Text style={styles.questionBody}>{question.body}</Text>

                {/* 첨부 이미지 — TTL 5분 signed URL. 만료 시 화면 재진입(QADetail 재호출) 로 갱신. */}
                {(question.images?.length ?? 0) > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.imageList}
                    style={styles.imageScroll}
                  >
                    {question.images!.map((uri, i) => (
                      <Pressable
                        key={uri}
                        style={styles.imageThumb}
                        onPress={() => setViewerIndex(i)}
                      >
                        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                      </Pressable>
                    ))}
                  </ScrollView>
                )}
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
          renderItem={({ item }) => {
            const isMine = !!currentUserId && item.userId === currentUserId;
            return (
              <AnswerRow
                item={item}
                isMine={isMine}
                isEditing={editingAnswerId === item.id}
                editDraft={editingAnswerId === item.id ? editAnswerDraft : ''}
                onEditDraftChange={setEditAnswerDraft}
                onStartEdit={() => startEditAnswer(item)}
                onSaveEdit={saveEditAnswer}
                onCancelEdit={cancelEditAnswer}
                onDelete={() => confirmDeleteAnswer(item)}
                onReport={() => promptReportAnswer(item)}
                onBlock={() => confirmBlockUser(item.userId)}
                isSavingEdit={isSavingAnswer && editingAnswerId === item.id}
              />
            );
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No answers yet. Be the first to reply.</Text>
          }
        />
      )}

      {/* 첨부 이미지 풀스크린 뷰어 — 스와이프·줌·인덱서 */}
      <QnaImageViewer
        visible={viewerIndex !== null}
        images={question?.images ?? []}
        initialIndex={viewerIndex ?? 0}
        onClose={() => setViewerIndex(null)}
      />

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

      {/* ── 질문 수정 Modal ─────────────────────────────────────────────── */}
      <Modal
        visible={editQuestionOpen}
        transparent
        animationType="fade"
        onRequestClose={() => !isSavingQuestion && setEditQuestionOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>게시글 수정</Text>
            <Text style={styles.modalCaption}>
              카테고리·첨부 이미지는 변경할 수 없습니다.
            </Text>

            <Text style={styles.modalLabel}>제목</Text>
            <TextInput
              style={styles.modalInput}
              value={editQuestionTitle}
              onChangeText={setEditQuestionTitle}
              maxLength={100}
              placeholder="제목"
              placeholderTextColor={C.muted}
            />

            <Text style={styles.modalLabel}>내용</Text>
            <TextInput
              style={[styles.modalInput, styles.modalInputMultiline]}
              value={editQuestionContent}
              onChangeText={setEditQuestionContent}
              multiline
              maxLength={2000}
              placeholder="내용"
              placeholderTextColor={C.muted}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnGhost]}
                onPress={() => setEditQuestionOpen(false)}
                disabled={isSavingQuestion}
                activeOpacity={0.75}
              >
                <Text style={styles.modalBtnGhostText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  styles.modalBtnPrimary,
                  isSavingQuestion && styles.editActionDisabled,
                ]}
                onPress={saveQuestionEdit}
                disabled={isSavingQuestion}
                activeOpacity={0.75}
              >
                <Text style={styles.modalBtnPrimaryText}>
                  {isSavingQuestion ? '저장 중...' : '저장'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    fontFamily: 'Pretendard-Regular',
  },
  headerTitle: {
    marginTop: 8,
    color: C.dark,
    fontSize: 20,
    fontFamily: 'Pretendard-Bold',
    letterSpacing: -0.38,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  errorText: {
    color: C.mid,
    fontSize: 14,
    fontFamily: 'Pretendard-SemiBold',
    textAlign: 'center',
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
  questionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  questionLabel: {
    color: C.muted,
    fontSize: 13,
    fontFamily: 'Pretendard-Regular',
    lineHeight: 18,
    marginBottom: 8,
  },
  questionTitle: {
    color: C.dark,
    fontSize: 20,
    fontFamily: 'Pretendard-ExtraBold',
    lineHeight: 27,
  },
  questionAuthor: {
    color: C.mid,
    fontSize: 12,
    fontFamily: 'Pretendard-Regular',
    marginTop: 6,
    marginBottom: 18,
  },
  questionBody: {
    color: C.mid,
    fontSize: 14,
    fontFamily: 'Pretendard-Regular',
    lineHeight: 21,
  },
  imageScroll: {
    marginTop: 16,
  },
  imageList: {
    gap: 8,
  },
  imageThumb: {
    width: 96,
    height: 96,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  moreButton: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  moreButtonText: {
    color: C.mid,
    fontSize: 18,
    lineHeight: 18,
    fontFamily: 'Pretendard-Bold',
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
    fontFamily: 'Pretendard-ExtraBold',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  guidelineTitle: {
    color: C.dark,
    fontSize: 18,
    fontFamily: 'Pretendard-ExtraBold',
    lineHeight: 24,
    marginBottom: 8,
  },
  guidelineIntro: {
    color: C.mid,
    fontSize: 13,
    fontFamily: 'Pretendard-Regular',
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
    fontFamily: 'Pretendard-ExtraBold',
  },
  guidelineText: {
    flex: 1,
    color: C.mid,
    fontSize: 13,
    fontFamily: 'Pretendard-SemiBold',
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
    fontFamily: 'Pretendard-SemiBold',
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
    fontFamily: 'Pretendard-ExtraBold',
    lineHeight: 22,
  },
  answerCount: {
    color: C.mid,
    fontSize: 13,
    fontFamily: 'Pretendard-Bold',
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
    fontFamily: 'Pretendard-ExtraBold',
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
    fontFamily: 'Pretendard-Bold',
  },
  answerDate: {
    color: C.muted,
    fontSize: 11,
    fontFamily: 'Pretendard-Regular',
  },
  answerText: {
    color: C.mid,
    fontSize: 13,
    fontFamily: 'Pretendard-Regular',
    lineHeight: 19,
  },
  editInput: {
    borderWidth: 1,
    borderColor: C.muted,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 64,
    maxHeight: 120,
    color: C.dark,
    fontSize: 13,
    fontFamily: 'Pretendard-Regular',
    backgroundColor: Colors.white,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  editActionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editActionCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: C.muted,
  },
  editActionCancelText: {
    color: C.mid,
    fontSize: 12,
    fontFamily: 'Pretendard-SemiBold',
  },
  editActionSave: {
    backgroundColor: C.dark,
  },
  editActionSaveText: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: 'Pretendard-ExtraBold',
  },
  editActionDisabled: {
    opacity: 0.4,
  },
  divider: {
    height: 1,
    backgroundColor: C.line,
  },
  emptyText: {
    color: C.mid,
    fontSize: 13,
    fontFamily: 'Pretendard-Regular',
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
    fontFamily: 'Pretendard-Regular',
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
    fontFamily: 'Pretendard-ExtraBold',
  },
  // ── Question edit modal ─────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    color: C.dark,
    fontSize: 18,
    fontFamily: 'Pretendard-ExtraBold',
    marginBottom: 4,
  },
  modalCaption: {
    color: C.mid,
    fontSize: 12,
    fontFamily: 'Pretendard-Regular',
    marginBottom: 14,
  },
  modalLabel: {
    color: C.dark,
    fontSize: 13,
    fontFamily: 'Pretendard-SemiBold',
    marginTop: 8,
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: C.muted,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: C.dark,
    fontFamily: 'Pretendard-Regular',
    backgroundColor: Colors.white,
  },
  modalInputMultiline: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  modalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalBtnGhost: {
    borderWidth: 1,
    borderColor: C.muted,
  },
  modalBtnGhostText: {
    color: C.mid,
    fontSize: 13,
    fontFamily: 'Pretendard-SemiBold',
  },
  modalBtnPrimary: {
    backgroundColor: C.dark,
  },
  modalBtnPrimaryText: {
    color: Colors.white,
    fontSize: 13,
    fontFamily: 'Pretendard-ExtraBold',
  },
});
