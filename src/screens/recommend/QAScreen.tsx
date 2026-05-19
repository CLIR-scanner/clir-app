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
import Svg, { Path } from 'react-native-svg';
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
    <Svg width={16} height={11} viewBox="0 0 16 11" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15.3475 5.25C15.3475 4.93587 15.1778 4.73025 14.8383 4.31725C13.5958 2.80875 10.8553 0 7.67375 0C4.49225 0 1.75175 2.80875 0.50925 4.31725C0.16975 4.73025 0 4.93587 0 5.25C0 5.56413 0.16975 5.76975 0.50925 6.18275C1.75175 7.69125 4.49225 10.5 7.67375 10.5C10.8553 10.5 13.5958 7.69125 14.8383 6.18275C15.1778 5.76975 15.3475 5.56413 15.3475 5.25ZM7.67375 7.875C8.36994 7.875 9.03762 7.59844 9.52991 7.10616C10.0222 6.61387 10.2988 5.94619 10.2988 5.25C10.2988 4.55381 10.0222 3.88613 9.52991 3.39384C9.03762 2.90156 8.36994 2.625 7.67375 2.625C6.97756 2.625 6.30988 2.90156 5.81759 3.39384C5.32531 3.88613 5.04875 4.55381 5.04875 5.25C5.04875 5.94619 5.32531 6.61387 5.81759 7.10616C6.30988 7.59844 6.97756 7.875 7.67375 7.875Z"
        fill={color}
      />
    </Svg>
  );
}

function CommentIcon({ color = C.dark }: { color?: string }) {
  return (
    <Svg width={13} height={12} viewBox="0 0 13 12" fill="none">
      <Path
        d="M0.802063 4.25093C0.802063 3.57078 0.802063 3.08393 0.834145 2.70295C0.864624 2.32678 0.922372 2.08857 1.02022 1.89688L0.306388 1.53274C0.141163 1.85597 0.0689773 2.21209 0.0336865 2.63798C-1.46408e-07 3.05907 0 3.58442 0 4.25093H0.802063ZM0.802063 5.21341V4.25093H0V5.21341H0.802063ZM0 5.21341V9.22373H0.802063V5.21341H0ZM0 9.22373V10.7589H0.802063V9.22373H0ZM0 10.7589C0 11.4374 0.820511 11.7775 1.30095 11.2971L0.733888 10.73C0.740789 10.7254 0.748365 10.7219 0.756345 10.7196L0.777199 10.7212C0.783857 10.725 0.789514 10.7303 0.793699 10.7367C0.797884 10.7431 0.800477 10.7505 0.801261 10.7581L0 10.7589ZM1.30095 11.2971L2.85615 9.74186L2.28909 9.1748L0.733086 10.7308L1.30095 11.2971ZM8.58207 8.82269H3.13927V9.62476H8.58207V8.82269ZM10.9361 8.60453C10.7444 8.70238 10.5062 8.76013 10.1301 8.79141C9.74827 8.82269 9.26222 8.82269 8.58207 8.82269V9.62476C9.24939 9.62476 9.77394 9.62476 10.195 9.59027C10.6209 9.55578 10.977 9.48359 11.3003 9.31917L10.9361 8.60453ZM11.812 7.72788C11.6198 8.10495 11.3132 8.41233 10.9361 8.60453L11.3003 9.31917C11.8287 9.05 12.2583 8.62041 12.5274 8.09201L11.812 7.72788ZM12.0309 5.37382C12.0309 6.05397 12.0309 6.54082 11.9989 6.9218C11.9684 7.29797 11.9106 7.53618 11.812 7.72788L12.5274 8.09201C12.6918 7.76878 12.764 7.41267 12.7985 6.98677C12.833 6.56569 12.833 6.04034 12.833 5.37382H12.0309ZM12.0309 4.25093V5.37382H12.833V4.25093H12.0309ZM11.812 1.89688C11.9098 2.08857 11.9684 2.32678 11.9997 2.70295C12.0309 3.08393 12.0309 3.57078 12.0309 4.25093H12.833C12.833 3.58362 12.833 3.05907 12.7985 2.63798C12.764 2.21209 12.6918 1.85597 12.5274 1.53274L11.812 1.89688ZM10.9361 1.02022C11.3133 1.21264 11.6199 1.51951 11.812 1.89688L12.5274 1.53274C12.2583 1.00434 11.8287 0.574756 11.3003 0.305586L10.9361 1.02022ZM8.58207 0.802063C9.26222 0.802063 9.74827 0.802063 10.1301 0.834146C10.5062 0.864624 10.7444 0.922372 10.9361 1.02022L11.3003 0.305586C10.977 0.140361 10.6209 0.0689773 10.195 0.0336865C9.77394 -1.46408e-07 9.24859 0 8.58207 0V0.802063ZM4.25093 0.802063H8.58207V0H4.25093V0.802063ZM1.89688 1.02022C2.08857 0.923174 2.32678 0.864624 2.70295 0.833344C3.08393 0.802063 3.57078 0.802063 4.25093 0.802063V0C3.58362 0 3.05907 1.76287e-07 2.63799 0.0344889C2.21209 0.0689776 1.85597 0.141163 1.53274 0.305586L1.89688 1.02022ZM1.02022 1.89688C1.2125 1.51939 1.51939 1.2125 1.89688 1.02022L1.53274 0.305586C1.00447 0.574547 0.575694 1.00464 0.306388 1.53274L1.02022 1.89688ZM2.85615 9.74186C2.9313 9.66689 3.03312 9.62478 3.13927 9.62476V8.82269C2.8203 8.82297 2.5145 8.94991 2.28909 9.1756L2.85615 9.74186Z"
        fill={color}
      />
      <Path
        d="M3.60938 3.60938H9.22382M3.60938 6.01556H7.61969"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
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
    fontFamily: 'Pretendard-Regular',
  },
  headerTitle: {
    marginTop: 8,
    color: C.dark,
    fontSize: 20,
    fontFamily: 'Pretendard-Bold',
    letterSpacing: -0.38,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontFamily: 'Pretendard-SemiBold',
    padding: 0,
  },
  clearButton: {
    padding: 2,
  },
  clearButtonText: {
    fontSize: 12,
    color: C.mid,
  },
  sectionTitle: {
    marginLeft: 28,
    marginTop: 36,
    marginBottom: 9,
    color: C.dark,
    fontSize: 16,
    fontFamily: 'Pretendard-ExtraBold',
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
    fontFamily: 'Pretendard-Regular',
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
    fontFamily: 'Pretendard-Bold',
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
    fontFamily: 'Pretendard-Light',
    lineHeight: 13,
  },
  questionRow: {
    paddingHorizontal: 32,
    paddingVertical: 15,
  },
  questionLabel: {
    color: C.muted,
    fontSize: 13,
    fontFamily: 'Pretendard-Regular',
    lineHeight: 18,
    marginBottom: 9,
  },
  questionTitle: {
    color: Colors.black,
    fontSize: 16,
    fontFamily: 'Pretendard-Bold',
    lineHeight: 22,
    marginBottom: 5,
  },
  questionBody: {
    color: C.mid,
    fontSize: 13,
    fontFamily: 'Pretendard-Regular',
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
    fontFamily: 'Pretendard-Regular',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    marginHorizontal: 32,
    backgroundColor: C.line,
  },
});
