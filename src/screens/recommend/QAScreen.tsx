import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Keyboard,
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
import { getQAQuestions } from '../../services/recommend.service';
import { QAQuestion, RecommendStackParamList } from '../../types';

type Props = NativeStackScreenProps<RecommendStackParamList, 'QAScreen'>;

const C = {
  bg: Colors.searchBackground,
  dark: Colors.searchDarkGreen,
  mid: Colors.searchMutedGreen,
  muted: Colors.searchBorder,
  pale: Colors.profileCard,
  line: Colors.searchDivider,
};

function EyeIcon({ color = C.dark }: { color?: string }) {
  return (
    <View style={[styles.eye, { borderColor: color }]}>
      <View style={[styles.eyeDot, { backgroundColor: color }]} />
    </View>
  );
}

function CommentIcon({ color = C.dark }: { color?: string }) {
  return (
    <View style={[styles.commentIcon, { borderColor: color }]}>
      <View style={[styles.commentTail, { borderColor: color }]} />
    </View>
  );
}

function Meta({ views, answers, color = C.dark }: { views: number; answers: number; color?: string }) {
  return (
    <View style={styles.metaRow}>
      <View style={styles.metaItem}>
        <EyeIcon color={color} />
        <Text style={[styles.metaText, { color }]}>{views}</Text>
      </View>
      <View style={styles.metaItem}>
        <CommentIcon color={color} />
        <Text style={[styles.metaText, { color }]}>{answers}</Text>
      </View>
    </View>
  );
}

function FeaturedQuestionCard({ item, onPress }: { item: QAQuestion; onPress: () => void }) {
  const isNotice = item.isNotice === true;
  return (
    <TouchableOpacity
      style={[styles.featuredCard, isNotice ? styles.noticeCard : styles.askingCard]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.featuredLabel, isNotice ? styles.noticeMutedText : styles.askingMutedText]}>
        {item.label}
      </Text>
      <Text style={[styles.featuredTitle, isNotice ? styles.noticeTitle : styles.askingTitle]} numberOfLines={3}>
        {item.title}
        {isNotice ? '\n...' : ''}
      </Text>
      {isNotice ? (
        <Text style={styles.noticeAuthor}>{item.author}</Text>
      ) : (
        <Meta views={item.viewCount} answers={item.answerCount} color={C.mid} />
      )}
    </TouchableOpacity>
  );
}

function QuestionRow({ item, onPress }: { item: QAQuestion; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.questionRow} onPress={onPress} activeOpacity={0.75}>
      <Text style={styles.questionLabel}>{item.label}</Text>
      <Text style={styles.questionTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.questionBody} numberOfLines={2}>{item.body}</Text>
      <Meta views={item.viewCount} answers={item.answerCount} />
    </TouchableOpacity>
  );
}

export default function QAScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [questions, setQuestions] = useState<QAQuestion[]>([]);

  useEffect(() => {
    let cancelled = false;
    getQAQuestions().then(next => {
      if (!cancelled) setQuestions(next);
    });
    return () => { cancelled = true; };
  }, []);

  const featuredQuestions = questions.slice(0, 2);
  const listQuestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const source = questions.filter(item => !item.isNotice);
    if (!q) return source;
    return source.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.body.toLowerCase().includes(q) ||
      item.label.toLowerCase().includes(q),
    );
  }, [query, questions]);

  function handleClearSearch() {
    setQuery('');
    Keyboard.dismiss();
  }

  function openQuestion(questionId: string) {
    navigation.navigate('QADetail', { questionId });
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
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

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search Title"
            placeholderTextColor={C.muted}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {(query.length > 0 || isFocused) && (
            <TouchableOpacity
              onPress={handleClearSearch}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.clearButton}
              activeOpacity={0.7}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.emptySearchButton} />
      </View>

      <FlatList
        data={listQuestions}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 120 }]}
        ListHeaderComponent={
          <View>
            <Text style={styles.sectionTitle}>Popular Questions</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredList}
            >
              {featuredQuestions.map(item => (
                <FeaturedQuestionCard
                  key={item.id}
                  item={item}
                  onPress={() => openQuestion(item.id)}
                />
              ))}
            </ScrollView>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        renderItem={({ item }) => (
          <QuestionRow item={item} onPress={() => openQuestion(item.id)} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    height: 95,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 15,
    bottom: 26,
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 21,
    marginTop: 12,
  },
  searchBox: {
    flex: 1,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.dark,
    borderRadius: 10,
    paddingHorizontal: 17,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    color: C.dark,
    fontSize: 16,
    fontWeight: '600',
    padding: 0,
  },
  clearButton: {
    padding: 2,
  },
  clearButtonText: {
    fontSize: 12,
    color: C.mid,
  },
  emptySearchButton: {
    width: 42,
    height: 42,
    borderWidth: 1,
    borderColor: C.dark,
    borderRadius: 10,
  },
  sectionTitle: {
    marginLeft: 28,
    marginTop: 36,
    marginBottom: 9,
    color: C.dark,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  listContent: {
    paddingTop: 9,
  },
  featuredList: {
    paddingHorizontal: 25,
    gap: 18,
    paddingBottom: 56,
  },
  featuredCard: {
    width: 183,
    height: 183,
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingTop: 23,
  },
  noticeCard: {
    backgroundColor: C.dark,
  },
  askingCard: {
    backgroundColor: C.pale,
    borderWidth: 1,
    borderColor: C.muted,
  },
  featuredLabel: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  noticeMutedText: {
    color: C.muted,
  },
  askingMutedText: {
    color: C.muted,
  },
  featuredTitle: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: '700',
  },
  noticeTitle: {
    color: Colors.white,
    lineHeight: 28,
  },
  askingTitle: {
    color: C.dark,
    lineHeight: 25,
  },
  noticeAuthor: {
    position: 'absolute',
    left: 22,
    bottom: 19,
    color: C.muted,
    fontSize: 11,
    fontWeight: '300',
    lineHeight: 13,
  },
  questionRow: {
    paddingHorizontal: 32,
    paddingVertical: 15,
  },
  questionLabel: {
    color: C.muted,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    marginBottom: 9,
  },
  questionTitle: {
    color: Colors.black,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 5,
  },
  questionBody: {
    color: C.mid,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  eye: {
    width: 15,
    height: 10,
    borderWidth: 2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  commentIcon: {
    width: 13,
    height: 10,
    borderWidth: 1.5,
    borderRadius: 2,
  },
  commentTail: {
    position: 'absolute',
    left: 2,
    bottom: -4,
    width: 5,
    height: 5,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    transform: [{ rotate: '-20deg' }],
  },
  divider: {
    height: 1,
    marginHorizontal: 32,
    backgroundColor: C.line,
  },
});
