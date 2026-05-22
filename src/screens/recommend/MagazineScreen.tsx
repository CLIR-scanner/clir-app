import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Image,
  Keyboard,
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
import { getMagazineItems, toggleMagazineBookmark } from '../../services/recommend.service';
import { MagazineItem, RecommendStackParamList } from '../../types';
import { INITIAL_FILTER_CATEGORIES } from '../../components/common/FilterBottomSheet';

type Props = NativeStackScreenProps<RecommendStackParamList, 'MagazineScreen'>;

const C = {
  bg:    Colors.scanLightGreen,
  dark:  Colors.searchDarkGreen,
  mid:   Colors.searchMutedGreen,
  muted: Colors.scanMutedGreen,
  line:  '#D9D9D9',
  thumb: '#CFCFCF',
};

const CATEGORY_IDS = ['all', ...INITIAL_FILTER_CATEGORIES.map(c => c.id)];

export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours  = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 24) return `${hours} hours ago`;
  return `${Math.floor(hours / 24)} days ago`;
}

// ── BookmarkIcon (SVG) ────────────────────────────────────────────────────────

export function BookmarkIcon({
  filled,
  size = 21,
  color = C.dark,
}: {
  filled: boolean;
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 21 21" fill="none">
      <Path
        d="M5.25 17.0625V4.914C5.25 4.51092 5.38504 4.17462 5.65512 3.90512C5.92521 3.63562 6.2615 3.50058 6.664 3.5H14.3369C14.7394 3.5 15.0757 3.63504 15.3458 3.90512C15.6158 4.17521 15.7506 4.5115 15.75 4.914V17.0625L10.5 14.8076L5.25 17.0625ZM6.125 15.7063L10.5 13.825L14.875 15.7063V4.914C14.875 4.77925 14.819 4.65558 14.707 4.543C14.595 4.43042 14.4713 4.37442 14.336 4.375H6.664C6.52925 4.375 6.40558 4.431 6.293 4.543C6.18042 4.655 6.12442 4.77867 6.125 4.914V15.7063Z"
        fill={filled ? color : C.muted}
      />
    </Svg>
  );
}

// ── CategoryPill ──────────────────────────────────────────────────────────────

function CategoryPill({
  id, selected, onPress,
}: { id: string; selected: boolean; onPress: () => void }) {
  const { t } = useTranslation();
  const label = id === 'all'
    ? t('recommendUi.allCategories')
    : t(`search.categoriesList.${id}`, id);
  return (
    <TouchableOpacity
      style={[pillSt.pill, selected && pillSt.pillActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[pillSt.text, selected && pillSt.textActive]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const pillSt = StyleSheet.create({
  pill:       { borderWidth: 1, borderColor: C.mid, borderRadius: 50, minWidth: 96, height: 30,
                paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  pillActive: { backgroundColor: C.dark, borderColor: C.dark },
  text:       { fontSize: 13, fontFamily: 'Pretendard-Regular', color: C.dark, letterSpacing: -0.228 },
  textActive: { color: Colors.white, fontFamily: 'Pretendard-Bold' },
});

// ── MagazineCard ──────────────────────────────────────────────────────────────

function MagazineCard({
  item,
  onPress,
  onBookmark,
}: {
  item: MagazineItem;
  onPress: () => void;
  onBookmark: (id: string) => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  function handleBookmark() {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.3, duration: 90,  useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1,   duration: 110, useNativeDriver: true }),
    ]).start();
    onBookmark(item.id);
  }

  return (
    <TouchableOpacity style={cardSt.wrap} onPress={onPress} activeOpacity={0.88}>
      <View style={cardSt.imgBox}>
        <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      </View>
      <View style={cardSt.body}>
        <Text style={cardSt.title}>{item.title}</Text>
        <Text style={cardSt.bodyText} numberOfLines={4}>{item.body}</Text>
        <View style={cardSt.footer}>
          <Text style={cardSt.time}>{relativeTime(item.publishedAt)}</Text>
          <TouchableOpacity
            onPress={handleBookmark}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Animated.View style={{ transform: [{ scale }] }}>
              <BookmarkIcon filled={item.isBookmarked === true} />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const cardSt = StyleSheet.create({
  wrap:     { marginBottom: 28 },
  imgBox:   { height: 243, borderRadius: 15, backgroundColor: C.thumb, overflow: 'hidden', marginBottom: 12 },
  body:     { gap: 4 },
  title:    { fontSize: 15, fontFamily: 'Pretendard-Bold', color: C.dark,  lineHeight: 21, letterSpacing: -0.285 },
  bodyText: { fontSize: 13, fontFamily: 'Pretendard-Regular', color: C.mid,   lineHeight: 19, letterSpacing: -0.247 },
  footer:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  time:     { fontSize: 10, fontFamily: 'Pretendard-Regular', color: C.muted, letterSpacing: -0.19 },
});

// ── MagazineScreen ────────────────────────────────────────────────────────────

export default function MagazineScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [items,    setItems]    = useState<MagazineItem[]>([]);
  const [query,    setQuery]    = useState('');
  const [focused,  setFocused]  = useState(false);
  const [category, setCategory] = useState('all');

  useEffect(() => {
    let cancelled = false;
    getMagazineItems().then(data => {
      if (!cancelled) setItems(data);
    });
    return () => { cancelled = true; };
  }, []);

  const featured = items[0] ?? null;

  const filtered = useMemo(() => {
    const base = category === 'all' ? items : items.filter(i => i.category === category);
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter(i =>
      i.title.toLowerCase().includes(q) || i.body.toLowerCase().includes(q),
    );
  }, [items, category, query]);

  function handleBookmark(id: string) {
    toggleMagazineBookmark(id).then(next => {
      setItems(prev => prev.map(m => m.id === id ? { ...m, isBookmarked: next } : m));
    });
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
      </View>

      {/* ── Search bar ── */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search Title"
            placeholderTextColor={C.muted}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {(query.length > 0 || focused) && (
            <TouchableOpacity
              onPress={() => { setQuery(''); Keyboard.dismiss(); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 48 }]}
        ListHeaderComponent={
          <View>
            {featured && (
              <TouchableOpacity
                style={styles.heroWrap}
                onPress={() => navigation.navigate('MagazineDetail', { articleId: featured.id })}
                activeOpacity={0.9}
              >
                <Image source={{ uri: 'https://loremflickr.com/800/380/healthy,food,grocery?lock=77' }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                <View style={styles.heroOverlay} />
                <Text style={styles.heroTag}>{t('recommendUi.featured')}</Text>
                <Text style={styles.heroTitle}>{t('recommendUi.bannerTitle')}</Text>
                <Text style={styles.heroSub}>{t('recommendUi.featuredSubtitle')}</Text>
              </TouchableOpacity>
            )}

            <View style={styles.sectionLabel}>
              <Text style={styles.sectionTitle}>{t('recommendUi.magazine')}</Text>
            </View>
            <FlatList
              data={CATEGORY_IDS}
              keyExtractor={id => id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillRow}
              renderItem={({ item: id }) => (
                <CategoryPill id={id} selected={category === id} onPress={() => setCategory(id)} />
              )}
            />
          </View>
        }
        renderItem={({ item }) => (
          <MagazineCard
            item={item}
            onPress={() => navigation.navigate('MagazineDetail', { articleId: item.id })}
            onBookmark={handleBookmark}
          />
        )}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: { height: 95, alignItems: 'center', justifyContent: 'center' },
  backBtn: {
    position: 'absolute',
    left: 15,
    bottom: 26,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon:    { color: C.dark, fontSize: 28, lineHeight: 30, fontFamily: 'Pretendard-Regular' },
  headerTitle: { marginTop: 8, color: C.dark, fontSize: 20, fontFamily: 'Pretendard-Bold', letterSpacing: -0.38 },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    marginBottom: 14,
  },
  searchBox: {
    flex: 1,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.dark,
    borderRadius: 10,
    paddingHorizontal: 16,
    gap: 6,
  },
  searchInput: { flex: 1, color: C.muted, fontSize: 16, fontFamily: 'Pretendard-SemiBold', padding: 0 },
  clearBtn: { fontSize: 12, color: C.mid },

  listContent: { paddingHorizontal: 24 },

  heroWrap: {
    height: 190,
    borderRadius: 9,
    backgroundColor: C.thumb,
    overflow: 'hidden',
    marginBottom: 20,
    justifyContent: 'flex-end',
    padding: 18,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  heroTag: {
    fontSize: 10,
    fontFamily: 'Pretendard-Bold',
    color: '#25FF81',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: 'Pretendard-ExtraBold',
    color: '#FFFFFF',
    lineHeight: 28,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
  },

  sectionLabel: { marginBottom: 6 },
  sectionTitle: { fontSize: 16, fontFamily: 'Pretendard-Bold', color: C.dark, lineHeight: 32, letterSpacing: -0.38 },

  pillRow: { gap: 5, marginBottom: 22 },
});
