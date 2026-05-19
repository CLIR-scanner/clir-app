import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/colors';
import { getMagazineItem, toggleMagazineBookmark } from '../../services/recommend.service';
import { MagazineItem, RecommendStackParamList } from '../../types';
import { BookmarkIcon, relativeTime } from './MagazineScreen';

type Props = NativeStackScreenProps<RecommendStackParamList, 'MagazineDetail'>;

const C = {
  bg:    Colors.scanLightGreen,
  dark:  Colors.searchDarkGreen,
  mid:   Colors.searchMutedGreen,
  muted: Colors.scanMutedGreen,
  line:  '#D9D9D9',
  thumb: '#CFCFCF',
};

// ── Share icon ────────────────────────────────────────────────────────────────

function ShareIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"
        stroke={C.dark}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ── Category badge ────────────────────────────────────────────────────────────

function CategoryBadge({ label }: { label: string }) {
  return (
    <View style={badgeSt.wrap}>
      <Text style={badgeSt.text}>{label.toUpperCase()}</Text>
    </View>
  );
}

const badgeSt = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: C.mid,
    borderRadius: 50,
    paddingHorizontal: 14,
    paddingVertical: 3,
    marginBottom: 10,
  },
  text: { fontSize: 11, fontFamily: 'Pretendard-SemiBold', color: C.mid, letterSpacing: 0.5 },
});

// ── MagazineDetailScreen ──────────────────────────────────────────────────────

export default function MagazineDetailScreen({ navigation, route }: Props) {
  const { articleId } = route.params;
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [article, setArticle] = useState<MagazineItem | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const bmScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let cancelled = false;
    getMagazineItem(articleId).then(data => {
      if (!cancelled && data) {
        setArticle(data);
        setBookmarked(data.isBookmarked === true);
      }
    });
    return () => { cancelled = true; };
  }, [articleId]);

  function handleBookmark() {
    Animated.sequence([
      Animated.timing(bmScale, { toValue: 1.35, duration: 90,  useNativeDriver: true }),
      Animated.timing(bmScale, { toValue: 1,    duration: 110, useNativeDriver: true }),
    ]).start();
    if (!article) return;
    toggleMagazineBookmark(article.id).then(next => setBookmarked(next));
  }

  if (!article) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingWrap}>
          <View style={styles.loadingBar} />
          <View style={[styles.loadingBar, { width: '75%', marginTop: 10 }]} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('recommendUi.magazineTitle')}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={handleBookmark}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Animated.View style={{ transform: [{ scale: bmScale }] }}>
              <BookmarkIcon filled={bookmarked} size={24} />
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <ShareIcon />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Content ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 48 }]}
      >
        {/* Hero image */}
        <View style={styles.heroWrap}>
          <Image source={{ uri: article.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <View style={styles.heroOverlay} />
        </View>

        {/* Article body */}
        <View style={styles.articleBody}>
          {article.category && <CategoryBadge label={article.category} />}

          <Text style={styles.articleTitle}>{article.title}</Text>

          <Text style={styles.articleTime}>{relativeTime(article.publishedAt)}</Text>

          <View style={styles.divider} />

          <Text style={styles.articleContent}>{article.body}</Text>

          {/* Extended mock content paragraphs */}
          <Text style={styles.articleContent}>
            {`Understanding what goes into our food is more important than ever. With increasing cases of food-related allergies and intolerances, having reliable tools and resources to decode ingredient labels is essential for everyday life.`}
          </Text>
          <Text style={styles.articleContent}>
            {`Whether you're shopping for yourself or for a family member with specific dietary needs, knowing what to look for on a label can make a real difference. The key is building the habit of reading before you eat — not after.`}
          </Text>
          <Text style={styles.articleContent}>
            {`At Clir, our mission is to make that process effortless. By scanning product barcodes or ingredient lists, you can instantly see which items match your profile and which to avoid. The app adapts to your sensitivity level so the information is always relevant to your specific situation.`}
          </Text>

          <View style={styles.divider} />

          <View style={styles.footer}>
            <Text style={styles.footerLabel}>{t('recommendUi.magazine')}</Text>
            <TouchableOpacity
              onPress={handleBookmark}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
              style={styles.footerBookmark}
            >
              <Animated.View style={{ transform: [{ scale: bmScale }] }}>
                <BookmarkIcon filled={bookmarked} size={20} />
              </Animated.View>
              <Text style={styles.footerBookmarkText}>
                {bookmarked ? t('recommendUi.magazineBookmark') : t('recommendUi.magazineBookmark')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    height: 95,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  backBtn: {
    position: 'absolute',
    left: 15,
    bottom: 14,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon:    { color: C.dark, fontSize: 28, lineHeight: 30, fontFamily: 'Pretendard-Regular' },
  headerTitle: { color: C.dark, fontSize: 20, fontFamily: 'Pretendard-Bold', letterSpacing: -0.38 },
  headerRight: {
    position: 'absolute',
    right: 20,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },

  scroll: { flexGrow: 1 },

  heroWrap: {
    height: 240,
    backgroundColor: C.thumb,
    overflow: 'hidden',
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 0,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },

  articleBody: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  articleTitle: {
    fontSize: 22,
    fontFamily: 'Pretendard-ExtraBold',
    color: C.dark,
    lineHeight: 30,
    letterSpacing: -0.42,
    marginBottom: 8,
  },
  articleTime: {
    fontSize: 11,
    fontFamily: 'Pretendard-Regular',
    color: C.muted,
    letterSpacing: -0.19,
    marginBottom: 20,
  },

  divider: {
    height: 1,
    backgroundColor: C.line,
    marginVertical: 20,
  },

  articleContent: {
    fontSize: 15,
    fontFamily: 'Pretendard-Regular',
    color: C.mid,
    lineHeight: 24,
    letterSpacing: -0.285,
    marginBottom: 18,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  footerLabel: {
    fontSize: 13,
    fontFamily: 'Pretendard-Bold',
    color: C.dark,
    letterSpacing: -0.247,
  },
  footerBookmark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerBookmarkText: {
    fontSize: 13,
    fontFamily: 'Pretendard-Regular',
    color: C.dark,
    letterSpacing: -0.247,
  },

  // Loading skeleton
  loadingWrap: { paddingHorizontal: 24, paddingTop: 24 },
  loadingBar:  { height: 16, borderRadius: 8, backgroundColor: C.line, width: '100%' },
});
