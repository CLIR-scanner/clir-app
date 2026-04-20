import React, { useEffect, useState, useRef } from 'react';
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
import { ScanStackParamList, Product, RiskLevel, Ingredient } from '../../types';
import { getIngredient, getAlternatives, getProductById } from '../../services/scan.service';
import { addFavorite, removeFavorite } from '../../services/list.service';
import { useListStore } from '../../store/list.store';
import { Colors } from '../../constants/colors';

type Props = NativeStackScreenProps<ScanStackParamList, 'HistoryProductDetail'>;

// ── Dummy data (Good verdict) ──────────────────────────────────────────────────
const DUMMY_GOOD_PRODUCT: Product = {
  id: 'prod-dummy-001',
  barcode: '0049000000443',
  name: 'Coca-Cola Classic',
  brand: 'The Coca-Cola Company',
  image: 'https://images.openfoodfacts.org/images/products/004/900/000/0443/front_en.7.400.jpg',
  isSafe: true,
  riskLevel: 'safe',
  riskIngredients: [],
  mayContainIngredients: [],
  alternatives: [],
  ingredients: [
    { id: 'off-caffeine',        name: 'Caffeine',                       nameKo: '카페인',              description: '', riskLevel: 'safe', sources: [] },
    { id: 'off-carbonated-water',name: 'Carbonated Water',               nameKo: '탄산수',              description: '', riskLevel: 'safe', sources: [] },
    { id: 'off-natural-flavors', name: 'Natural Flavors',                nameKo: '천연향',              description: '', riskLevel: 'safe', sources: [] },
    { id: 'off-hfcs',            name: 'High Fructose Corn Syrup or Sugar', nameKo: '액상과당 또는 설탕', description: '', riskLevel: 'safe', sources: [] },
    { id: 'off-phosphoric-acid', name: 'Phosphoric Acid',                nameKo: '인산',                description: '', riskLevel: 'safe', sources: [] },
    { id: 'off-caramel-color',   name: 'Caramel Color',                  nameKo: '캐러멜 색소',         description: '', riskLevel: 'safe', sources: [] },
  ] as unknown as Product['ingredients'],
};

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG         = '#F9FFF3';
const TITLE_CLR  = '#1A2E1A';

const VERDICT = {
  danger:  { dot: '#FF0000', label: 'Bad',  iconBg: '#FF0000', icon: '✕' },
  safe:    { dot: '#25FF81', label: 'Good', iconBg: '#25FF81', icon: '✓' },
  caution: { dot: '#FF9D00', label: 'Poor', iconBg: '#FF9D00', icon: '!' },
} satisfies Record<RiskLevel, { dot: string; label: string; iconBg: string; icon: string }>;

export default function HistoryProductDetailScreen({ navigation, route }: Props) {
  const { product: initialProduct, hideTitle = false } = route.params;
  const insets = useSafeAreaInsets();

  // ── Full product data — fetched if ingredients are missing ─
  const [product, setProduct] = useState<Product>(initialProduct ?? DUMMY_GOOD_PRODUCT);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // ── Alternatives state — initialized from route params, lazy-fetched if empty ─
  const [alts,        setAlts]        = useState<Product[]>(product.alternatives);
  const [altsLoading, setAltsLoading] = useState(false);

  useEffect(() => {
    // ── Fetch full product details if ingredients are missing ─
    if (product.ingredients.length > 0 || !product.id) return;
    
    setIsLoadingDetails(true);
    getProductById(product.id)
      .then(fullProduct => { setProduct(fullProduct); })
      .catch(() => { /* silent — use partial product data */ })
      .finally(() => { setIsLoadingDetails(false); });
  }, [product.id]);

  useEffect(() => {
    // product는 route.params에서 고정 — 스택 네비게이터는 화면마다 새 인스턴스를 생성하므로
    // deps 배열을 []로 두어도 product가 바뀌는 케이스는 발생하지 않음.
    // 즐겨찾기·이력 요약 객체는 alternatives: [] — 위험 제품이면 서버에서 lazy-fetch
    if (product.isSafe || alts.length > 0 || !product.id) return;
    setAltsLoading(true);
    getAlternatives(product.id)
      .then(fetched => { if (fetched.length > 0) setAlts(fetched); })
      .catch(() => { /* silent — 대체 제품 없음으로 표시 */ })
      .finally(() => { setAltsLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps — product는 route.params 고정값
  }, []);

  // ── Favorites state ───────────────────────────────────────────────────────
  // lazy initializer: 첫 렌더부터 스토어 기준으로 초기화 (Favorites 목록 진입 시 즉시 빨간 하트)
  const [favorited,  setFavorited]  = useState(() =>
    useListStore.getState().favorites.some(f => f.productId === product.id),
  );
  const [favLoading, setFavLoading] = useState(false);
  const addFavoriteToStore      = useListStore(s => s.addFavorite);
  const removeFavoriteFromStore = useListStore(s => s.removeFavorite);

  async function handleFavorite() {
    if (favLoading) return;
    setFavLoading(true);
    try {
      if (favorited) {
        const favItem = useListStore.getState().favorites.find(f => f.productId === product.id);
        console.log('삭제 시도 favItem:', favItem);
        console.log('현재 favorites:', useListStore.getState().favorites);
        if (favItem) {
          console.log('favItem.id (DELETE 경로에 사용):', favItem.id);
          console.log('favItem.productId:', favItem.productId);
          console.log('product.id (화면의 제품 ID):', product.id);
          await removeFavorite(favItem.id);
          removeFavoriteFromStore(favItem.id);
        }
        setFavorited(false);
      } else {
        const item = await addFavorite(product.id);
        console.log('추가된 item:', item);
        addFavoriteToStore({ ...item, product });
        setFavorited(true);
      }
    } catch(e) {
      console.log('에러:', e);
    }
    finally { setFavLoading(false); }
  }

  // ── Ingredient detail bottom sheet state ──────────────────────────────────
  const [modalOpen,        setModalOpen]        = useState(false);
  const [detailIngredient, setDetailIngredient] = useState<Ingredient | null>(null);
  const [detailLoading,    setDetailLoading]    = useState(false);
  const cancelRef = useRef(false);

  async function handleIngredientPress(ing: Ingredient) {
    // may-contain 성분은 relatedAllergenId(예: 'ing-peanut')로 조회, 나머지는 id 그대로
    const lookupId = ing.relatedAllergenId ?? ing.id;
    if (!lookupId.startsWith('ing-')) return; // off-* 일반 성분은 레지스트리 없음 → 스킵

    cancelRef.current = false;
    setModalOpen(true);
    setDetailIngredient(null);
    setDetailLoading(true);
    try {
      const detail = await getIngredient(lookupId);
      if (!cancelRef.current) setDetailIngredient(detail);
    } catch {
      if (!cancelRef.current) setModalOpen(false); // 조회 실패 시 모달 닫기
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

  // ── Risk box style depends on verdict ─────────────────────────────────────
  const riskBoxBg     = isBad ? '#FFECEC' : '#FFE9C5';
  const riskBoxBorder = isBad ? '#FF0000' : '#FF9D00';
  const riskTitle     = isBad ? 'Ingredients to avoid' : 'Suspected Allergens';

  // ── All ingredients list ───────────────────────────────────────────────────
  const allIngredients = product.ingredients.map(i => i.name);

  // ── Alternatives (up to 3) — lazy-fetched into alts state ────────────────
  const alternatives = alts.slice(0, 3);

  function handleAltPress(alt: Product) {
    navigation.push('HistoryProductDetail', { product: alt, hideTitle: true });
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

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

        {/* Loading indicator for fetching full product details */}
        {isLoadingDetails && (
          <View style={styles.loadingDetailWrap}>
            <ActivityIndicator size="small" color={TITLE_CLR} />
            <Text style={styles.loadingText}>로딩 중...</Text>
          </View>
        )}

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
        <View style={styles.favWrap}>
          <TouchableOpacity
            style={[styles.favBtn, favorited && styles.favBtnActive]}
            onPress={handleFavorite}
            disabled={favLoading}
            activeOpacity={0.7}
          >
            {favLoading ? (
              <ActivityIndicator size="small" color={Colors.danger} />
            ) : (
              <Text style={[styles.favBtnText, favorited && styles.favBtnTextActive]}>
                {favorited ? '♥' : '♡'} Add to Favorites
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 3-A. All Ingredients (Good only) — Brand Name 바로 아래 */}
        {!showRisk && allIngredients.length > 0 && (
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

        {/* 3-B. Risk ingredients box (Bad / Poor only) */}
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

            {(() => {
              // danger → riskIngredients(직접 알러겐), caution → mayContainIngredients(흔적 알러겐)
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

        {/* 4. Alternative Products — fetch 중엔 스피너, 완료 후 목록 표시 */}
        {altsLoading && (
          <View style={styles.altsLoadingWrap}>
            <ActivityIndicator size="small" color={TITLE_CLR} />
          </View>
        )}
        {!altsLoading && alternatives.length > 0 && (
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

        {/* 5. All Ingredients — Bad/Poor 전용 (하단) */}
        {showRisk && allIngredients.length > 0 && (
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

      {/* ── Ingredient detail bottom sheet ────────────────────────────────── */}
      <Modal
        visible={modalOpen}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeModal}>
          <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>
            {/* Handle bar */}
            <View style={styles.modalHandle} />

            {detailLoading ? (
              <View style={styles.modalLoadingWrap}>
                <ActivityIndicator size="large" color={TITLE_CLR} />
              </View>
            ) : detailIngredient ? (
              <>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitles}>
                    <Text style={styles.modalName}>{detailIngredient.name}</Text>
                    <Text style={styles.modalNameKo}>{detailIngredient.nameKo}</Text>
                  </View>
                  <TouchableOpacity onPress={closeModal} style={styles.modalCloseBtn}>
                    <Text style={styles.modalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Description */}
                <Text style={styles.modalDesc}>{detailIngredient.description}</Text>

                {/* Sources */}
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

  // Add to Favorites
  favWrap:          { alignItems: 'center', marginBottom: 20 },
  favBtn:           { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.gray300, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 16 },
  favBtnActive:     { borderColor: Colors.danger },
  favBtnText:       { fontSize: 13, color: Colors.gray700 },
  favBtnTextActive: { color: Colors.danger },

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

  // Alternatives loading
  altsLoadingWrap: { paddingVertical: 24, alignItems: 'center' },

  // Loading details
  loadingDetailWrap: { paddingVertical: 24, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 12, color: TITLE_CLR, marginTop: 8 },

  // All ingredients
  ingredientItem:      { fontSize: 14, color: '#1A1A1A', textAlign: 'center', marginBottom: 6 },
  disclaimer:          { fontSize: 11, color: '#555', textAlign: 'center', lineHeight: 17, marginTop: 16 },

  // Tappable risk ingredient
  riskIngredientLink:  { textDecorationLine: 'underline' },
  riskTapHint:         { fontSize: 11, color: '#888', textAlign: 'center', marginTop: 8 },

  // Ingredient detail modal
  modalOverlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet:          {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    minHeight: 200,
  },
  modalHandle:         { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#D0D0D0', marginBottom: 16 },
  modalLoadingWrap:    { paddingVertical: 40, alignItems: 'center' },
  modalHeader:         { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  modalTitles:         { flex: 1 },
  modalName:           { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  modalNameKo:         { fontSize: 14, color: '#666', marginTop: 2 },
  modalCloseBtn:       { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  modalCloseText:      { fontSize: 12, color: '#666' },
  modalDesc:           { fontSize: 14, color: '#333', lineHeight: 22, marginBottom: 20 },
  modalSources:        { borderTopWidth: 1, borderTopColor: '#E8E8E8', paddingTop: 16 },
  modalSourcesTitle:   { fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  modalSourceLink:     { fontSize: 13, color: '#1A7A3A', marginBottom: 8, lineHeight: 18 },
});
