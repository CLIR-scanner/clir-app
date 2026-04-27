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
import { addFavorite, removeFavorite, getFavorites } from '../../services/list.service';
import { useListStore } from '../../store/list.store';
import { useUserStore } from '../../store/user.store';
import RiskBadgeIcon from '../../components/common/RiskBadgeIcon';

type Props = NativeStackScreenProps<ScanStackParamList, 'HistoryProductDetail'>;

// ── Dummy data (Good verdict) ─────────────────────────────────────────────────
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
    { id: 'off-caffeine',         name: 'Caffeine',                        nameKo: '카페인',              description: '', riskLevel: 'safe', sources: [] },
    { id: 'off-carbonated-water', name: 'Carbonated Water',                nameKo: '탄산수',              description: '', riskLevel: 'safe', sources: [] },
    { id: 'off-natural-flavors',  name: 'Natural Flavors',                 nameKo: '천연향',              description: '', riskLevel: 'safe', sources: [] },
    { id: 'off-hfcs',             name: 'High Fructose Corn Syrup or Sugar', nameKo: '액상과당 또는 설탕', description: '', riskLevel: 'safe', sources: [] },
    { id: 'off-phosphoric-acid',  name: 'Phosphoric Acid',                 nameKo: '인산',                description: '', riskLevel: 'safe', sources: [] },
    { id: 'off-caramel-color',    name: 'Caramel Color',                   nameKo: '캐러멜 색소',         description: '', riskLevel: 'safe', sources: [] },
  ] as unknown as Product['ingredients'],
};

// ── Design tokens (Figma: node 223:9111) ─────────────────────────────────────
const BG         = '#F9FFF3';
const DARK_GREEN = '#1C3A19';
const MID_GREEN  = '#556C53';

const VERDICT_BORDER: Record<RiskLevel, string> = {
  safe:    '#25FF81',
  caution: '#FF9D00',
  danger:  '#FF3434',
};

const VERDICT_LABEL: Record<RiskLevel, string> = {
  safe:    'Good',
  caution: 'Poor',
  danger:  'Bad',
};

export default function HistoryProductDetailScreen({ navigation, route }: Props) {
  const { product: initialProduct, hideTitle = false } = route.params;
  const insets = useSafeAreaInsets();

  const [product, setProduct] = useState<Product>(initialProduct ?? DUMMY_GOOD_PRODUCT);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const [alts,        setAlts]        = useState<Product[]>(product.alternatives);
  const [altsLoading, setAltsLoading] = useState(false);

  const profileVersion = useUserStore(s => s.profileVersion);

  // 프로필 변경 시 → 강제 재조회. mount 시엔 ingredients 가 비어있을 때만 fetch.
  // BE /products/by-id/:id 가 활성 프로필 기준 verdict + riskIngredients 를 다시 계산해 반환.
  const didInitialFetch = useRef(false);
  useEffect(() => {
    if (!product.id) return;
    const needFetch = !didInitialFetch.current
      ? product.ingredients.length === 0
      : true; // 이후 호출은 무조건 재조회
    if (!needFetch) { didInitialFetch.current = true; return; }
    setIsLoadingDetails(true);
    getProductById(product.id)
      .then(fullProduct => { setProduct(fullProduct); })
      .catch(() => { /* silent */ })
      .finally(() => {
        setIsLoadingDetails(false);
        didInitialFetch.current = true;
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id, profileVersion]);

  // 대체 제품도 프로필 변경 시 재조회. safe 가 되면 빈 배열로 비우기 위해 setAlts([]) 명시.
  useEffect(() => {
    if (!product.id) return;
    if (product.isSafe) { setAlts([]); return; }
    setAltsLoading(true);
    getAlternatives(product.id)
      .then(fetched => { setAlts(fetched); })
      .catch(() => { /* silent */ })
      .finally(() => { setAltsLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id, product.isSafe, profileVersion]);

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

  // ── Sync favorited state on mount — 스토어가 비어있으면 API에서 조회
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

    // Optimistic update — UI를 먼저 바꾸고 API 호출, 실패 시 롤백
    const prevFavorited = favorited;
    setFavorited(!prevFavorited);
    setFavLoading(true);

    try {
      if (prevFavorited) {
        // 즐겨찾기 해제
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
        // 즐겨찾기 추가
        const item = await addFavorite(product.id);
        addFavoriteToStore({ ...item, product });
      }
    } catch(e) {
      console.log('favorite error:', e);
      setFavorited(prevFavorited); // 실패 시 이전 상태로 롤백
    } finally {
      setFavLoading(false);
    }
  }

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
  const riskTitle    = isBad ? 'Ingredients to avoid' : 'Suspected Allergens';

  const allIngredients = product.ingredients.map(i => i.name);
  const alternatives   = alts.slice(0, 3);

  function handleAltPress(alt: Product) {
    navigation.push('HistoryProductDetail', { product: alt, hideTitle: true });
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        {!hideTitle
          ? <Text style={styles.headerTitle}>History</Text>
          : <View style={{ flex: 1 }} />
        }

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={handleFavorite}
          disabled={favLoading}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {favLoading
            ? <ActivityIndicator size="small" color="#FF3B3B" />
            : <Text style={[styles.heartIcon, favorited && styles.heartActive]}>
                {favorited ? '♥' : '♡'}
              </Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {isLoadingDetails && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={DARK_GREEN} />
          </View>
        )}

        <View style={styles.imgWrap}>
          <View style={styles.imgBox}>
            {product.image ? (
              <Image source={{ uri: product.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : null}
          </View>
        </View>

        <View style={styles.nameRow}>
          <View style={[styles.verdictCircle, { borderColor: VERDICT_BORDER[riskLevel] }]}>
            <RiskBadgeIcon level={riskLevel} size={17} style={styles.verdictImg} />
          </View>
          <Text style={styles.productName}>{product.name}</Text>
        </View>

        <Text style={styles.brandName}>{product.brand || '—'}</Text>

        {!showRisk && allIngredients.length > 0 && (
          <View style={styles.ingredientSection}>
            <View style={styles.ingredientBox}>
              {allIngredients.map((name, idx) => (
                <Text key={`${idx}-${name}`} style={styles.ingredientItem}>{name}</Text>
              ))}
            </View>
            <View style={styles.ingredientLabelWrap} pointerEvents="none">
              <View style={styles.ingredientLabel}>
                <Text style={styles.ingredientLabelText}>All Ingredients</Text>
              </View>
            </View>
          </View>
        )}

        {showRisk && (
          <View style={styles.riskSection}>
            <View style={[styles.riskBoxOuter, { backgroundColor: riskBoxBg, borderColor: riskBoxBorder }]}>
              <Text style={styles.riskWarning} numberOfLines={1} adjustsFontSizeToFit>
                ** This product contains ingredients that may not be suitable for you.
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

        {altsLoading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={DARK_GREEN} />
          </View>
        )}
        {!altsLoading && alternatives.length > 0 && (
          <View style={styles.section}>
            <View style={styles.altPillWrap}>
              <View style={styles.altPill}>
                <Text style={styles.altPillText}>Alternative Products</Text>
              </View>
            </View>

            {alternatives.map((alt, idx) => {
              const altRisk = alt.riskLevel ?? 'safe';
              const isLast  = idx === alternatives.length - 1;
              return (
                <View key={alt.id}>
                  <TouchableOpacity style={styles.altRow} onPress={() => handleAltPress(alt)} activeOpacity={0.7}>
                    <View style={styles.altThumb}>
                      {alt.image ? (
                        <Image source={{ uri: alt.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                      ) : null}
                    </View>
                    <View style={styles.altInfo}>
                      <Text style={styles.altName} numberOfLines={1}>{alt.name}</Text>
                      <Text style={styles.altBrand} numberOfLines={1}>{alt.brand || '—'}</Text>
                      <View style={styles.altBadge}>
                        <RiskBadgeIcon level={altRisk} size={16} style={styles.altBadgeIcon} />
                        <Text style={styles.altBadgeText}>{VERDICT_LABEL[altRisk]}</Text>
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

        {showRisk && allIngredients.length > 0 && (
          <View style={styles.ingredientSection}>
            <View style={styles.ingredientBox}>
              {allIngredients.map((name, idx) => (
                <Text key={`${idx}-${name}`} style={styles.ingredientItem}>{name}</Text>
              ))}
            </View>
            <View style={styles.ingredientLabelWrap} pointerEvents="none">
              <View style={styles.ingredientLabel}>
                <Text style={styles.ingredientLabelText}>All Ingredients</Text>
              </View>
            </View>
          </View>
        )}

        {allIngredients.length > 0 && (
          <Text style={styles.disclaimer}>
            {'** For severe allergies,\n      please double-check all ingredients before consuming.'}
          </Text>
        )}
      </ScrollView>

      {/* ── Ingredient detail modal ───────────────────────────────────────── */}
      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={closeModal}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeModal}>
          <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>
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

                <Text style={styles.modalDesc}>{detailIngredient.description}</Text>

                {detailIngredient.sources.length > 0 && (
                  <View style={styles.modalSources}>
                    <Text style={styles.modalSourcesTitle}>References</Text>
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
const PILL_H = 16;

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  iconBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backArrow:   { fontSize: 22, color: DARK_GREEN },
  heartIcon:   { fontSize: 22, color: '#CCCCCC' },
  heartActive: { color: '#FF3B3B' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: DARK_GREEN, lineHeight: 32 },

  // ── Scroll
  scroll: { paddingHorizontal: 24, paddingTop: 8 },

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

  // ── Name row
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 6,
  },
  verdictCircle: {
    width: 30, height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verdictImg:  { width: 17, height: 17 },
  productName: { fontSize: 20, fontWeight: '700', color: DARK_GREEN, letterSpacing: -0.38 },
  brandName:   { fontSize: 12, color: MID_GREEN, textAlign: 'center', marginBottom: 28, letterSpacing: -0.23 },

  // ── All Ingredients fieldset-style box
  ingredientSection: {
    position: 'relative',
    marginBottom: 28,
    marginTop: PILL_H,
  },
  ingredientBox: {
    borderWidth: 1,
    borderColor: DARK_GREEN,
    borderRadius: 22,
    paddingTop: PILL_H + 16,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  ingredientLabelWrap: {
    position: 'absolute',
    top: -PILL_H,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  ingredientLabel: {
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: DARK_GREEN,
    borderRadius: 50,
    paddingVertical: 3,
    paddingHorizontal: 19,
  },
  ingredientLabelText: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK_GREEN,
    letterSpacing: -0.3,
  },
  ingredientItem: {
    fontSize: 13,
    fontWeight: '500',
    color: MID_GREEN,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 4,
  },

  // ── Disclaimer
  disclaimer: {
    fontSize: 10,
    fontWeight: '700',
    color: '#333',
    textAlign: 'left',
    lineHeight: 14,
    marginBottom: 20,
    paddingHorizontal: 4,
  },

  // ── Risk box (fieldset style — pill floats on top border)
  riskSection: {
    position: 'relative',
    marginBottom: 28,
    marginTop: PILL_H,
  },
  riskBoxOuter: {
    borderWidth: 1,
    borderRadius: 16,
    paddingTop: PILL_H + 14,
    paddingBottom: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  riskLabelWrap: {
    position: 'absolute',
    top: -PILL_H,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
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
  riskLabelText: { fontSize: 16, fontWeight: '600', letterSpacing: -0.3 },
  riskWarning: {
    fontSize: 10,
    fontWeight: '300',
    color: DARK_GREEN,
    textAlign: 'center',
    lineHeight: 13,
    marginBottom: 10,
    letterSpacing: -0.19,
  },
  riskIngredient: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  riskTapHint: { fontSize: 11, color: '#888', textAlign: 'center', marginTop: 8 },

  // ── Alternative products
  section:     { marginBottom: 28 },
  altPillWrap: { alignItems: 'center', marginBottom: 16 },
  altPill:     { borderWidth: 1, borderColor: DARK_GREEN, borderRadius: 20, paddingVertical: 7, paddingHorizontal: 20 },
  altPillText: { fontSize: 14, fontWeight: '600', color: DARK_GREEN },

  altRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 16 },
  altThumb:    { width: 80, height: 80, borderRadius: 11, backgroundColor: '#D9D9D9', overflow: 'hidden', flexShrink: 0 },
  altInfo:     { flex: 1, gap: 4 },
  altName:     { fontSize: 16, fontWeight: '700', color: MID_GREEN },
  altBrand:    { fontSize: 12, color: MID_GREEN },
  altBadge:    { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderWidth: 1, borderColor: MID_GREEN, borderRadius: 28, paddingVertical: 5, paddingLeft: 11, paddingRight: 18, gap: 6 },
  altBadgeIcon: { width: 16, height: 16 },
  altBadgeText: { fontSize: 12, color: MID_GREEN },
  chevron:     { fontSize: 22, color: DARK_GREEN },
  divider:     { height: StyleSheet.hairlineWidth, backgroundColor: '#D0D0C8' },

  // ── Loading
  loadingWrap: { paddingVertical: 24, alignItems: 'center' },

  // ── Ingredient detail modal
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
