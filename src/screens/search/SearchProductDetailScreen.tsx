import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SearchStackParamList, RiskLevel, Ingredient } from '../../types';
import { getIngredient } from '../../services/scan.service';
import { addFavorite } from '../../services/list.service';
import { useListStore } from '../../store/list.store';
import { ApiError } from '../../lib/api';

type Props = NativeStackScreenProps<SearchStackParamList, 'SearchProductDetail'>;

const BG        = '#F9FFF3';
const TITLE_CLR = '#1A2E1A';

const VERDICT = {
  danger:  { dot: '#FF0000', label: 'Bad',  iconBg: '#FF0000', icon: '✕' },
  safe:    { dot: '#25FF81', label: 'Good', iconBg: '#25FF81', icon: '✓' },
  caution: { dot: '#FF9D00', label: 'Poor', iconBg: '#FF9D00', icon: '!' },
} satisfies Record<RiskLevel, { dot: string; label: string; iconBg: string; icon: string }>;

export default function SearchProductDetailScreen({ navigation, route }: Props) {
  const { product } = route.params;
  const insets = useSafeAreaInsets();

  const [modalOpen,        setModalOpen]        = useState(false);
  const [detailIngredient, setDetailIngredient] = useState<Ingredient | null>(null);
  const [detailLoading,    setDetailLoading]    = useState(false);
  const cancelRef = useRef(false);

  const addFavoriteToStore = useListStore(s => s.addFavorite);
  const favorites          = useListStore(s => s.favorites);
  const [favorited,    setFavorited]    = useState(() => favorites.some(f => f.productId === product.id));
  const [favLoading,   setFavLoading]   = useState(false);

  async function handleFavorite() {
    if (favorited || favLoading) return;
    setFavLoading(true);
    try {
      const item = await addFavorite(product.id);
      addFavoriteToStore({ ...item, product });
      setFavorited(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setFavorited(true);
    } finally {
      setFavLoading(false);
    }
  }

  async function handleIngredientPress(ing: Ingredient) {
    const lookupId = ing.relatedAllergenId ?? ing.id;
    if (!lookupId.startsWith('ing-')) return;

    cancelRef.current = false;
    setModalOpen(true);
    setDetailIngredient(null);
    setDetailLoading(true);
    try {
      const detail = await getIngredient(lookupId);
      if (!cancelRef.current) setDetailIngredient(detail);
    } catch {
      if (!cancelRef.current) setModalOpen(false);
    } finally {
      if (!cancelRef.current) setDetailLoading(false);
    }
  }

  function closeModal() {
    cancelRef.current = true;
    setModalOpen(false);
    setDetailIngredient(null);
  }

  const v        = VERDICT[product.riskLevel] ?? VERDICT.safe;
  const isBad    = product.riskLevel === 'danger';
  const isPoor   = product.riskLevel === 'caution';
  const showRisk = isBad || isPoor;

  const riskBoxBg     = isBad ? '#FFECEC' : '#FFE9C5';
  const riskBoxBorder = isBad ? '#FF0000' : '#FF9D00';
  const riskTitle     = isBad ? 'Ingredients to avoid' : 'Suspected Allergens';

  const allIngredients = product.ingredients.map(i => i.name);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Product Detail</Text>
        <View style={styles.backBtn} />
      </View>

      {/* ── Scrollable content ─────────────────────────────────────────────── */}
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

        {/* Add to Favorites */}
        <TouchableOpacity
          style={[styles.favBtn, favorited && styles.favBtnDone]}
          onPress={handleFavorite}
          activeOpacity={0.8}
          disabled={favLoading || favorited}
        >
          {favLoading ? (
            <ActivityIndicator size="small" color={TITLE_CLR} />
          ) : (
            <>
              <Text style={[styles.favBtnHeart, favorited && styles.favBtnHeartDone]}>
                {favorited ? '♥' : '♡'}
              </Text>
              <Text style={[styles.favBtnText, favorited && styles.favBtnTextDone]}>
                {favorited ? 'Added to Favorites' : 'Add to Favorites'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* 3. Risk ingredients box (Bad / Poor only) */}
        {showRisk && (
          <View style={[styles.riskBox, { backgroundColor: riskBoxBg, borderColor: riskBoxBorder }]}>
            <View style={styles.riskHeader}>
              <View style={[styles.riskIconCircle, { borderColor: riskBoxBorder }]}>
                <Text style={[styles.riskIconText, { color: riskBoxBorder }]}>✕</Text>
              </View>
              <Text style={[styles.riskTitle, { color: riskBoxBorder }]}>{riskTitle}</Text>
            </View>

            <Text style={styles.riskWarning}>
              ** This product contains ingredients that may not be suitable for you.
            </Text>

            {(() => {
              const displayIngredients = isBad
                ? product.riskIngredients
                : product.mayContainIngredients;
              return displayIngredients.length > 0 ? (
                <>
                  {displayIngredients.map(ing => (
                    <TouchableOpacity
                      key={ing.id}
                      onPress={() => handleIngredientPress(ing)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.riskIngredient, styles.riskIngredientLink]}>
                        {ing.name} ›
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <Text style={styles.riskTapHint}>Tap an ingredient for details</Text>
                </>
              ) : (
                <Text style={styles.riskIngredient}>—</Text>
              );
            })()}
          </View>
        )}

        {/* 4. All Ingredients */}
        {allIngredients.length > 0 && (
          <View style={styles.section}>
            <View style={styles.pillWrap}>
              <View style={styles.pill}>
                <Text style={styles.pillText}>All Ingredients</Text>
              </View>
            </View>

            {allIngredients.map((name, idx) => (
              <Text key={`${idx}-${name}`} style={styles.ingredientItem}>{name}</Text>
            ))}

            <Text style={styles.disclaimer}>
              {'** For severe allergies,\nplease double-check all ingredients before consuming.'}
            </Text>
          </View>
        )}

      </ScrollView>

      {/* ── Ingredient detail bottom sheet ─────────────────────────────────── */}
      <Modal
        visible={modalOpen}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeModal}>
          <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            {detailLoading ? (
              <View style={styles.modalLoadingWrap}>
                <ActivityIndicator size="large" color={TITLE_CLR} />
              </View>
            ) : detailIngredient ? (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitles}>
                    <Text style={styles.modalName}>{detailIngredient.name}</Text>
                    <Text style={styles.modalNameKo}>{detailIngredient.nameKo}</Text>
                  </View>
                  <TouchableOpacity onPress={closeModal} style={styles.modalCloseBtn}>
                    <Text style={styles.modalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalDesc}>{detailIngredient.description}</Text>

                {detailIngredient.sources.length > 0 && (
                  <View style={styles.modalSources}>
                    <Text style={styles.modalSourcesTitle}>References</Text>
                    {detailIngredient.sources.map(s => (
                      <TouchableOpacity
                        key={s.url}
                        onPress={() => Linking.openURL(s.url)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.modalSourceLink}>↗ {s.title}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            ) : null}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:             { flex: 1, backgroundColor: BG },

  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn:          { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backArrow:        { fontSize: 22, color: TITLE_CLR },
  title:            { fontSize: 20, fontWeight: '700', color: TITLE_CLR },

  scroll:           { paddingHorizontal: 20, paddingTop: 8 },

  imgWrap:          { alignItems: 'center', marginBottom: 20 },
  imgBox:           { width: 200, height: 200, borderRadius: 20, backgroundColor: '#E8E8E8', overflow: 'hidden', borderWidth: 1, borderColor: '#D0D0D0' },

  nameRow:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 },
  verdictIcon:      { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  verdictIconText:  { fontSize: 15, color: '#fff', fontWeight: '900' },
  productName:      { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  brandName:        { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24 },

  // Favorites button
  favBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: TITLE_CLR,
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 28,
  },
  favBtnDone:      { backgroundColor: TITLE_CLR },
  favBtnHeart:     { fontSize: 15, color: TITLE_CLR },
  favBtnHeartDone: { color: '#fff' },
  favBtnText:      { fontSize: 14, fontWeight: '500', color: TITLE_CLR },
  favBtnTextDone:  { color: '#fff' },

  riskBox:          { borderWidth: 1.5, borderRadius: 16, padding: 16, marginBottom: 28 },
  riskHeader:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 10 },
  riskIconCircle:   { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  riskIconText:     { fontSize: 11, fontWeight: '900', lineHeight: 13 },
  riskTitle:        { fontSize: 16, fontWeight: '700' },
  riskWarning:      { fontSize: 11, color: '#555', textAlign: 'center', marginBottom: 12, lineHeight: 16 },
  riskIngredient:   { fontSize: 15, fontWeight: '700', color: '#1A1A1A', textAlign: 'center', marginBottom: 4 },
  riskIngredientLink: { textDecorationLine: 'underline' },
  riskTapHint:      { fontSize: 11, color: '#888', textAlign: 'center', marginTop: 8 },

  section:          { marginBottom: 28 },
  pillWrap:         { alignItems: 'center', marginBottom: 16 },
  pill:             { borderWidth: 1.5, borderColor: TITLE_CLR, borderRadius: 20, paddingVertical: 7, paddingHorizontal: 20 },
  pillText:         { fontSize: 14, fontWeight: '600', color: TITLE_CLR },

  ingredientItem:   { fontSize: 14, color: '#1A1A1A', textAlign: 'center', marginBottom: 6 },
  disclaimer:       { fontSize: 11, color: '#555', textAlign: 'left', lineHeight: 17, marginTop: 16 },

  modalOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet:       { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12, minHeight: 200 },
  modalHandle:      { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#D0D0D0', marginBottom: 16 },
  modalLoadingWrap: { paddingVertical: 40, alignItems: 'center' },
  modalHeader:      { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  modalTitles:      { flex: 1 },
  modalName:        { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  modalNameKo:      { fontSize: 14, color: '#666', marginTop: 2 },
  modalCloseBtn:    { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  modalCloseText:   { fontSize: 12, color: '#666' },
  modalDesc:        { fontSize: 14, color: '#333', lineHeight: 22, marginBottom: 20 },
  modalSources:     { borderTopWidth: 1, borderTopColor: '#E8E8E8', paddingTop: 16 },
  modalSourcesTitle:{ fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  modalSourceLink:  { fontSize: 13, color: '#1A7A3A', marginBottom: 8, lineHeight: 18 },
});
