import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScanStackParamList, Product, RiskLevel } from '../../types';

type Props = NativeStackScreenProps<ScanStackParamList, 'HistoryProductDetail'>;

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG         = '#F9FFF3';
const TITLE_CLR  = '#1A2E1A';

const VERDICT = {
  danger:  { dot: '#FF0000', label: 'Bad',  iconBg: '#FF0000', icon: '✕' },
  safe:    { dot: '#25FF81', label: 'Good', iconBg: '#25FF81', icon: '✓' },
  caution: { dot: '#FF9D00', label: 'Poor', iconBg: '#FF9D00', icon: '!' },
} satisfies Record<RiskLevel, { dot: string; label: string; iconBg: string; icon: string }>;

export default function HistoryProductDetailScreen({ navigation, route }: Props) {
  const { product, hideTitle = false } = route.params;
  const insets = useSafeAreaInsets();

  const v        = VERDICT[product.riskLevel] ?? VERDICT.safe;
  const isBad    = product.riskLevel === 'danger';
  const isPoor   = product.riskLevel === 'caution';
  const showRisk = isBad || isPoor;

  // ── Risk box style depends on verdict ─────────────────────────────────────
  const riskBoxBg     = isBad ? '#FFECEC' : '#FFE9C5';
  const riskBoxBorder = isBad ? '#FF0000' : '#FF9D00';
  const riskTitle     = isBad ? 'Ingredients to avoid' : 'Suspected Allergens';
  const riskIngredients = product.riskIngredients.map(i => i.name);

  // ── All ingredients list ───────────────────────────────────────────────────
  const allIngredients = product.ingredients.map(i => i.name);

  // ── Alternatives (up to 3) ────────────────────────────────────────────────
  const alternatives = product.alternatives.slice(0, 3);

  function handleAltPress(alt: Product) {
    navigation.push('HistoryProductDetail', { product: alt, hideTitle: true });
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── Notch pill ────────────────────────────────────────────────────── */}
      <View style={styles.notchPill} />

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        {!hideTitle && <Text style={styles.title}>History</Text>}
        {hideTitle  && <View style={styles.titlePlaceholder} />}
        <View style={styles.backBtn} />
      </View>

      {/* ── Scrollable content ────────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* 1. Product image */}
        <View style={styles.imgWrap}>
          <View style={styles.imgBox}>
            {product.image ? (
              <Image
                source={{ uri: product.image }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
            ) : null}
          </View>
        </View>

        {/* 2. Product name + verdict icon */}
        <View style={styles.nameRow}>
          <View style={[styles.verdictIcon, { backgroundColor: v.iconBg }]}>
            <Text style={styles.verdictIconText}>{v.icon}</Text>
          </View>
          <Text style={styles.productName}>{product.name}</Text>
        </View>

        {/* Brand */}
        <Text style={styles.brandName}>{product.brand || '—'}</Text>

        {/* 3. Risk ingredients box (Bad / Poor only) */}
        {showRisk && (
          <View style={[styles.riskBox, { backgroundColor: riskBoxBg, borderColor: riskBoxBorder }]}>
            {/* Legend-style header */}
            <View style={styles.riskHeader}>
              <View style={[styles.riskIconCircle, { borderColor: riskBoxBorder }]}>
                <Text style={[styles.riskIconText, { color: riskBoxBorder }]}>✕</Text>
              </View>
              <Text style={[styles.riskTitle, { color: riskBoxBorder }]}>{riskTitle}</Text>
            </View>

            <Text style={styles.riskWarning}>
              ** This product contains ingredients that may not be suitable for you.
            </Text>

            {riskIngredients.length > 0 ? (
              riskIngredients.map(name => (
                <Text key={name} style={styles.riskIngredient}>{name}</Text>
              ))
            ) : (
              <Text style={styles.riskIngredient}>—</Text>
            )}
          </View>
        )}

        {/* 4. Alternative Products */}
        {alternatives.length > 0 && (
          <View style={styles.section}>
            <View style={styles.pillWrap}>
              <View style={styles.pill}>
                <Text style={styles.pillText}>Alternative Products</Text>
              </View>
            </View>

            {alternatives.map((alt, idx) => {
              const av      = VERDICT[alt.riskLevel] ?? VERDICT.safe;
              const isLast  = idx === alternatives.length - 1;
              return (
                <View key={alt.id}>
                  <TouchableOpacity
                    style={styles.altRow}
                    onPress={() => handleAltPress(alt)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.altThumb}>
                      {alt.image ? (
                        <Image
                          source={{ uri: alt.image }}
                          style={StyleSheet.absoluteFill}
                          resizeMode="cover"
                        />
                      ) : null}
                    </View>
                    <View style={styles.altInfo}>
                      <Text style={styles.altName} numberOfLines={1}>{alt.name}</Text>
                      <Text style={styles.altBrand} numberOfLines={1}>{alt.brand || '—'}</Text>
                      <View style={[styles.badge, { borderColor: av.dot }]}>
                        <View style={[styles.dot, { backgroundColor: av.dot }]} />
                        <Text style={[styles.badgeText, { color: av.dot }]}>{av.label}</Text>
                      </View>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>
                  {!isLast && <View style={styles.divider} />}
                </View>
              );
            })}
          </View>
        )}

        {/* 5. All Ingredients */}
        {allIngredients.length > 0 && (
          <View style={styles.section}>
            <View style={styles.pillWrap}>
              <View style={styles.pill}>
                <Text style={styles.pillText}>All Ingredients</Text>
              </View>
            </View>

            {allIngredients.map(name => (
              <Text key={name} style={styles.ingredientItem}>{name}</Text>
            ))}

            <Text style={styles.disclaimer}>
              {'** For severe allergies,\nplease double-check all ingredients before consuming.'}
            </Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:             { flex: 1, backgroundColor: BG },

  // Notch
  notchPill:        { alignSelf: 'center', width: 120, height: 30, backgroundColor: '#1A1A1A', borderRadius: 20, marginBottom: 4 },

  // Header
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn:          { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backArrow:        { fontSize: 22, color: TITLE_CLR },
  title:            { fontSize: 20, fontWeight: '700', color: TITLE_CLR },
  titlePlaceholder: { flex: 1 },

  // Scroll
  scroll:           { paddingHorizontal: 20, paddingTop: 8 },

  // Product image
  imgWrap:          { alignItems: 'center', marginBottom: 20 },
  imgBox:           {
    width: 200, height: 200,
    borderRadius: 20,
    backgroundColor: '#E8E8E8',
    overflow: 'hidden',
    borderWidth: 1, borderColor: '#D0D0D0',
  },

  // Name row
  nameRow:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 },
  verdictIcon:      { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  verdictIconText:  { fontSize: 15, color: '#fff', fontWeight: '900' },
  productName:      { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  brandName:        { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24 },

  // Risk box
  riskBox:          { borderWidth: 1.5, borderRadius: 16, padding: 16, marginBottom: 28 },
  riskHeader:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 10 },
  riskIconCircle:   { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  riskIconText:     { fontSize: 11, fontWeight: '900', lineHeight: 13 },
  riskTitle:        { fontSize: 16, fontWeight: '700' },
  riskWarning:      { fontSize: 11, color: '#555', textAlign: 'center', marginBottom: 12, lineHeight: 16 },
  riskIngredient:   { fontSize: 15, fontWeight: '700', color: '#1A1A1A', textAlign: 'center', marginBottom: 4 },

  // Section
  section:          { marginBottom: 28 },
  pillWrap:         { alignItems: 'center', marginBottom: 16 },
  pill:             { borderWidth: 1.5, borderColor: TITLE_CLR, borderRadius: 20, paddingVertical: 7, paddingHorizontal: 20 },
  pillText:         { fontSize: 14, fontWeight: '600', color: TITLE_CLR },

  // Alt row
  altRow:           { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  altThumb:         { width: 72, height: 72, borderRadius: 12, backgroundColor: '#D9D9D9', overflow: 'hidden', flexShrink: 0 },
  altInfo:          { flex: 1 },
  altName:          { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 3 },
  altBrand:         { fontSize: 13, color: '#666', marginBottom: 8 },
  badge:            { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderWidth: 1.5, borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10, gap: 5 },
  dot:              { width: 10, height: 10, borderRadius: 5 },
  badgeText:        { fontSize: 12, fontWeight: '600' },
  chevron:          { fontSize: 22, color: '#1A1A1A', fontWeight: '300' },
  divider:          { height: 1, backgroundColor: '#D0D0C8' },

  // All ingredients
  ingredientItem:   { fontSize: 14, color: '#1A1A1A', textAlign: 'center', marginBottom: 6 },
  disclaimer:       { fontSize: 11, color: '#555', textAlign: 'left', lineHeight: 17, marginTop: 16 },
});
