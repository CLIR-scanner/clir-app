import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { SearchStackParamList, Product, Ingredient } from '../../types';
import { getIngredient, getProductById } from '../../services/scan.service';
import { addFavorite, removeFavorite, getFavorites } from '../../services/list.service';
import SevereDisclaimerBox from '../../components/common/SevereDisclaimerBox';
import FadeInImage from '../../components/common/FadeInImage';
import { useListStore } from '../../store/list.store';
import { useUserStore } from '../../store/user.store';
import { getIngredientDescription } from '../../lib/display-names';
import RiskBadgeIcon from '../../components/common/RiskBadgeIcon';
import { useResponsive } from '../../lib/responsive';

type Props = NativeStackScreenProps<SearchStackParamList, 'SearchProductDetail'>;

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG         = '#FDFFFD';
const DARK_GREEN = '#044733';
const MID_GREEN  = '#556C53';

export default function SearchProductDetailScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { product: initialProduct } = route.params;
  const insets  = useSafeAreaInsets();
  const { pad } = useResponsive();
  const currentLanguage = useUserStore(s => s.currentUser.language);

  const [product, setProduct] = useState<Product>(initialProduct);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    if (product.ingredients.length > 0 || !product.id) return;
    setIsLoadingDetails(true);
    getProductById(product.id)
      .then(fullProduct => { setProduct(fullProduct); })
      .catch(() => { /* silent */ })
      .finally(() => { setIsLoadingDetails(false); });
  }, [product.id]);

  // ── Favorites ─────────────────────────────────────────────────────────────
  const [favorited,  setFavorited]  = useState(() =>
    useListStore.getState().favorites.some(
      f => f.productId === product.id || f.product?.id === product.id,
    ),
  );
  const [favLoading, setFavLoading] = useState(false);
  const addFavoriteToStore      = useListStore(s => s.addFavorite);
  const removeFavoriteFromStore = useListStore(s => s.removeFavorite);
  const setFavoritesInStore     = useListStore(s => s.setFavorites);

  useEffect(() => {
    let cancelled = false;
    async function syncFavoritedState() {
      let current = useListStore.getState().favorites;
      if (current.length === 0) {
        try {
          current = await getFavorites();
          if (!cancelled) setFavoritesInStore(current);
        } catch {
          return;
        }
      }
      if (cancelled) return;
      const isFav = current.some(
        f => f.productId === product.id || f.product?.id === product.id,
      );
      setFavorited(isFav);
    }
    syncFavoritedState();
    return () => { cancelled = true; };
  }, [product.id, setFavoritesInStore]);

  async function handleFavorite() {
    if (favLoading) return;

    const prevFavorited = favorited;
    setFavorited(!prevFavorited);
    setFavLoading(true);

    try {
      if (prevFavorited) {
        let favItem = useListStore.getState().favorites.find(
          f => f.productId === product.id || f.product?.id === product.id,
        );
        if (!favItem) {
          const fresh = await getFavorites();
          setFavoritesInStore(fresh);
          favItem = fresh.find(
            f => f.productId === product.id || f.product?.id === product.id,
          );
        }
        if (favItem) {
          await removeFavorite(favItem.id);
          removeFavoriteFromStore(favItem.id);
        }
      } else {
        const item = await addFavorite(product.id);
        addFavoriteToStore({ ...item, product });
      }
    } catch {
      setFavorited(prevFavorited);
    } finally {
      setFavLoading(false);
    }
  }

  const [badgeLeft, setBadgeLeft] = useState(-100);

  // ── Ingredient detail modal ────────────────────────────────────────────────
  const [modalOpen,        setModalOpen]        = useState(false);
  const [detailIngredient, setDetailIngredient] = useState<Ingredient | null>(null);
  const [detailLoading,    setDetailLoading]    = useState(false);
  const cancelRef = useRef(false);

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

  const riskLevel    = product.riskLevel ?? 'safe';
  const isBad        = riskLevel === 'danger';
  const isPoor       = riskLevel === 'caution';
  const showRisk     = isBad || isPoor;
  const riskBoxBg    = isBad ? '#FFECEC' : '#FFF4E0';
  const riskBoxBorder= isBad ? '#FF3434' : '#FF9D00';
  const riskTitle    = isBad ? t('product.ingredientsToAvoid') : t('product.suspectedAllergens');

  const allIngredients = product.ingredients.map(i => i.name);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingHorizontal: pad.pageH }]}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={t('a11y.back')}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{t('product.detail')}</Text>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={handleFavorite}
          disabled={favLoading}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={favorited ? t('a11y.removeFavorite') : t('a11y.addFavorite')}
        >
          {favLoading
            ? <ActivityIndicator size="small" color="#FF3B3B" />
            : <Text style={[styles.heartIcon, favorited && styles.heartActive]}>
                {favorited ? '♥' : '♡'}
              </Text>
          }
        </TouchableOpacity>
      </View>

      {/* ── Scrollable content ──────────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingHorizontal: pad.pageH, paddingBottom: insets.bottom + 4, flexGrow: 1 },
        ]}
        showsVerticalScrollIndicator={false}
      >

        {isLoadingDetails && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={DARK_GREEN} />
          </View>
        )}

        {/* 1. Product image + 판정 마크(우측 아래) */}
        <View style={styles.imgWrap}>
          <View style={styles.imgBox}>
            {product.image ? (
              <FadeInImage source={{ uri: product.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : null}
            <View style={styles.imgBadge} pointerEvents="none">
              <RiskBadgeIcon level={riskLevel} size={52} />
            </View>
          </View>
        </View>

        {/* 2. Product name — 디바이스 가운데 정렬 */}
        <Text style={styles.productName}>{product.name}</Text>

        {/* Brand */}
        <Text style={styles.brandName}>{product.brand || '—'}</Text>

        {/* Severe-allergy disclaimer (공통 컴포넌트 — 맨 위 통일) */}
        <SevereDisclaimerBox />

        {/* 3-A. All Ingredients (Good only) */}
        {!showRisk && allIngredients.length > 0 && (
          <View style={[styles.ingredientSection, { marginHorizontal: pad.boxOuterH }]}>
            <View style={[styles.ingredientBox, { paddingHorizontal: pad.boxH }]}>
              {allIngredients.map((name, idx) => (
                <Text key={`${idx}-${name}`} style={styles.ingredientItem}>{name}</Text>
              ))}
            </View>
            <View style={styles.ingredientLabelWrap} pointerEvents="none">
              <View style={styles.ingredientLabel}>
                <Text style={styles.ingredientLabelText}>{t('product.allIngredients')}</Text>
              </View>
            </View>
          </View>
        )}

        {/* 3-B. Risk box (Bad / Poor) — fieldset style */}
        {showRisk && (
          <View style={[styles.riskSection, { marginHorizontal: pad.boxOuterH }]}>
            <View style={[styles.riskBoxOuter, { backgroundColor: riskBoxBg, borderColor: riskBoxBorder, paddingHorizontal: pad.boxH }]}>
              <Text
                style={styles.riskWarning}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {t('product.riskWarning')}
              </Text>

              {(() => {
                const displayIngredients = isBad ? product.riskIngredients : product.mayContainIngredients;
                return displayIngredients.length > 0 ? (
                  displayIngredients.map(ing => (
                    <TouchableOpacity key={ing.id} onPress={() => handleIngredientPress(ing)} activeOpacity={0.7}>
                      <Text style={styles.riskIngredient}>{ing.name}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.riskIngredient}>—</Text>
                );
              })()}
            </View>

            <View style={styles.riskLabelWrap} pointerEvents="none">
              <View style={[styles.riskLabel, { borderColor: riskBoxBorder }]}>
                <RiskBadgeIcon level={riskLevel} size={22} style={styles.riskLabelIcon} />
                <Text style={[styles.riskLabelText, { color: riskBoxBorder }]}>{riskTitle}</Text>
              </View>
            </View>
          </View>
        )}

        {/* 4. All Ingredients (Bad / Poor — bottom) */}
        {showRisk && allIngredients.length > 0 && (
          <View style={[styles.ingredientSection, { marginHorizontal: pad.boxOuterH }]}>
            <View style={[styles.ingredientBox, { paddingHorizontal: pad.boxH }]}>
              {allIngredients.map((name, idx) => (
                <Text key={`${idx}-${name}`} style={styles.ingredientItem}>{name}</Text>
              ))}
            </View>
            <View style={styles.ingredientLabelWrap} pointerEvents="none">
              <View style={styles.ingredientLabel}>
                <Text style={styles.ingredientLabelText}>{t('product.allIngredients')}</Text>
              </View>
            </View>
          </View>
        )}

      </ScrollView>

      {/* ── Ingredient detail modal ───────────────────────────────────────── */}
      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={closeModal}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeModal}>
          <TouchableOpacity activeOpacity={1} style={[styles.modalSheet, { paddingHorizontal: pad.pageH }]}>
            <View style={styles.modalHandle} />

            {detailLoading ? (
              <View style={styles.modalLoadingWrap}>
                <ActivityIndicator size="large" color={DARK_GREEN} />
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

                {(() => {
                  const desc = getIngredientDescription(detailIngredient, currentLanguage);
                  return desc ? <Text style={styles.modalDesc}>{desc}</Text> : null;
                })()}

                {detailIngredient.sources.length > 0 && (
                  <View style={styles.modalSources}>
                    <Text style={styles.modalSourcesTitle}>{t('product.references')}</Text>
                    {detailIngredient.sources.map(s => (
                      <TouchableOpacity key={s.url} onPress={() => Linking.openURL(s.url)} activeOpacity={0.7}>
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

// ── PILL_H: half height of the floating pill ────────────────────────────────
const PILL_H = 18;

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  // ── Header
  // header.paddingHorizontal 은 런타임에 pad.pageH 로 주입
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  iconBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backArrow:   { fontSize: 22, color: DARK_GREEN },
  heartIcon:   { fontSize: 22, color: '#CCCCCC' },
  heartActive: { color: '#FF3B3B' },
  headerTitle: { fontSize: 20, fontFamily: 'Pretendard-Bold', color: DARK_GREEN, lineHeight: 32 },

  // ── Scroll
  // scroll.paddingHorizontal 은 런타임에 pad.pageH 로 주입
  scroll: { paddingTop: 40 },

  // ── Product image
  imgWrap: { alignItems: 'center', marginBottom: 20 },
  imgBox: {
    width: 182, height: 182,
    borderRadius: 18,
    backgroundColor: '#E8E8E8',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: DARK_GREEN,
  },
  // 판정(good/poor/bad) 마크 — 이미지 우측 아래
  imgBadge: { position: 'absolute', right: 8, bottom: 8 },

  productName: { fontSize: 20, fontFamily: 'Pretendard-Bold', color: DARK_GREEN, letterSpacing: -0.38, textAlign: 'center', marginBottom: 6 },
  brandName:   { fontSize: 12, color: MID_GREEN, textAlign: 'center', marginBottom: 28, letterSpacing: -0.23 },

  // ── All Ingredients fieldset
  // marginHorizontal / paddingHorizontal 은 런타임에 pad.boxOuterH / pad.boxH 로 주입
  ingredientSection: { position: 'relative', marginBottom: 28, marginTop: PILL_H },
  ingredientBox: {
    borderWidth: 1,
    borderColor: DARK_GREEN,
    borderRadius: 22,
    paddingTop: PILL_H + 12,
    paddingBottom: 18,
    alignItems: 'center',
  },
  ingredientLabelWrap: { position: 'absolute', top: -PILL_H, left: 0, right: 0, alignItems: 'center' },
  ingredientLabel: {
    height: 36,
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: DARK_GREEN,
    borderRadius: 50,
    paddingHorizontal: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ingredientLabelText: { fontSize: 16, fontFamily: 'Pretendard-Bold', color: DARK_GREEN, letterSpacing: -0.3 },
  ingredientItem:      { fontSize: 13, fontFamily: 'Pretendard-Regular', color: DARK_GREEN, textAlign: 'center', lineHeight: 20, marginBottom: 4 },

  // ── Disclaimer

  // ── Risk box (fieldset. marginHorizontal / paddingHorizontal 은 런타임 주입)
  // marginBottom 20 = 경고문구 박스↔위험 박스 간격과 동일하게 통일 (위험 박스↔전체성분 박스).
  riskSection: { position: 'relative', marginBottom: 20, marginTop: PILL_H },
  riskBoxOuter: {
    borderWidth: 1,
    borderRadius: 16,
    paddingTop: PILL_H + 10,
    paddingBottom: 14,
    alignItems: 'center',
  },
  riskLabelWrap: { position: 'absolute', top: -PILL_H, left: 0, right: 0, alignItems: 'center' },
  riskLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG,
    borderWidth: 1,
    borderRadius: 50,
    paddingVertical: 3,
    paddingHorizontal: 19,
    gap: 10,
  },
  riskLabelIcon: { width: 22, height: 22 },
  riskLabelText: { fontSize: 16, fontFamily: 'Pretendard-SemiBold', letterSpacing: -0.3 },
  riskWarning: {
    fontSize: 10,
    fontFamily: 'Pretendard-Light',
    color: DARK_GREEN,
    textAlign: 'center',
    lineHeight: 13,
    marginBottom: 10,
    letterSpacing: -0.19,
  },
  riskIngredient: {
    fontSize: 16,
    fontFamily: 'Pretendard-ExtraBold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.3,
  },

  // ── Loading
  loadingWrap: { paddingVertical: 24, alignItems: 'center' },

  // ── Ingredient detail modal
  modalOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  // modalSheet.paddingHorizontal 은 런타임에 pad.pageH 로 주입
  modalSheet:       { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, paddingTop: 12, minHeight: 200 },
  modalHandle:      { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#D0D0D0', marginBottom: 16 },
  modalLoadingWrap: { paddingVertical: 40, alignItems: 'center' },
  modalHeader:      { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  modalTitles:      { flex: 1 },
  modalName:        { fontSize: 20, fontFamily: 'Pretendard-ExtraBold', color: '#1A1A1A' },
  modalNameKo:      { fontSize: 14, color: '#666', marginTop: 2 },
  modalCloseBtn:    { width: 28, height: 36, borderRadius: 14, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  modalCloseText:   { fontSize: 12, color: '#666' },
  modalDesc:        { fontSize: 14, color: '#333', lineHeight: 22, marginBottom: 20 },
  modalSources:     { borderTopWidth: 1, borderTopColor: '#E8E8E8', paddingTop: 16 },
  modalSourcesTitle:{ fontSize: 12, fontFamily: 'Pretendard-Bold', color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  modalSourceLink:  { fontSize: 13, color: '#1A7A3A', marginBottom: 8, lineHeight: 18 },
});
