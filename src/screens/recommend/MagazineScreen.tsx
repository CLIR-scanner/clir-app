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
  size = 22,
  color = C.dark,
}: {
  filled: boolean;
  size?: number;
  color?: string;
}) {
  // viewBox 0 0 14 20 — ribbon with pointed bottom
  const w = size * (14 / 20);
  return (
    <Svg width={w} height={size} viewBox="0 0 14 20">
      <Path
        d="M1 0 H13 Q14 0 14 1 V20 L7 15 L0 20 V1 Q0 0 1 0 Z"
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
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
  pill:       { borderWidth: 1, borderColor: C.mid, borderRadius: 50, minWidth: 96, height: 25,
                paddingHorizontal: 19, alignItems: 'center', justifyContent: 'center' },
  pillActive: { backgroundColor: C.mid },
  text:       { fontSize: 12, fontWeight: '500', color: C.dark, letterSpacing: -0.228 },
  textActive: { color: Colors.white, fontWeight: '700' },
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
  title:    { fontSize: 15, fontWeight: '700', color: C.dark,  lineHeight: 21, letterSpacing: -0.285 },
  bodyText: { fontSize: 13, fontWeight: '400', color: C.mid,   lineHeight: 19, letterSpacing: -0.247 },
  footer:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  time:     { fontSize: 10, fontWeight: '400', color: C.muted, letterSpacing: -0.19 },
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
                <Image source={{ uri: featured.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
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
  backIcon:    { color: C.dark, fontSize: 28, lineHeight: 30, fontWeight: '400' },
  headerTitle: { marginTop: 8, color: C.dark, fontSize: 20, fontWeight: '700', letterSpacing: -0.38 },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 14,
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
  searchInput: { flex: 1, color: C.dark, fontSize: 16, fontWeight: '600', padding: 0 },
  clearBtn: { fontSize: 12, color: C.mid },

  listContent: { paddingHorizontal: 24 },

  heroWrap: {
    height: 196,
    borderRadius: 15,
    backgroundColor: C.thumb,
    overflow: 'hidden',
    marginBottom: 20,
  },

  sectionLabel: { marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: C.dark, lineHeight: 32, letterSpacing: -0.38 },

  pillRow: { gap: 5, marginBottom: 22 },
});
