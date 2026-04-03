import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Linking,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';
import BottomSheet, {BottomSheetView, BottomSheetBackdrop} from '@gorhom/bottom-sheet';
import {ScanStackParamList, Product, Ingredient, RiskLevel} from '../../types';
import {getProductById} from '../../services/scan.service';
import {useUserStore} from '../../store/user.store';
import {Colors} from '../../constants/colors';

type Props = {
  navigation: NativeStackNavigationProp<ScanStackParamList, 'ScanResult'>;
  route: RouteProp<ScanStackParamList, 'ScanResult'>;
};

const RISK_LABEL: Record<RiskLevel, string> = {
  danger: '위험',
  caution: '주의',
  safe: '안전',
};
const RISK_EMOJI: Record<RiskLevel, string> = {
  danger: '⚠️',
  caution: '⚡',
  safe: '✅',
};
const RISK_COLOR: Record<RiskLevel, string> = {
  danger: Colors.danger,
  caution: Colors.caution,
  safe: Colors.safe,
};
const RISK_BG: Record<RiskLevel, string> = {
  danger: Colors.dangerBg,
  caution: Colors.cautionBg,
  safe: Colors.safeBg,
};

const VERDICT_COPY: Record<RiskLevel, (name: string, allergies: string) => string> = {
  danger: (name, a) =>
    `${name}에 알러지 유발 성분이 포함되어 있습니다.\n프로필(${a})에 위험한 성분이 감지됐어요.`,
  caution: (name, a) =>
    `${name}은 주의가 필요합니다.\n(${a}) 관련 성분 또는 흔적이 포함될 수 있어요.`,
  safe: (name, _a) =>
    `${name}은 현재 프로필 기준으로 안전합니다.`,
};

function allergyLabel(ids: string[]): string {
  return ids
    .map(id =>
      id === 'ing-peanut' ? '땅콩' :
      id === 'ing-milk' ? '유제품' :
      id === 'ing-wheat' ? '밀' : id,
    )
    .join(', ');
}

export default function ScanResultScreen({navigation, route}: Props) {
  const {productId} = route.params;
  const activeProfile = useUserStore(s => s.activeProfile);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['50%', '85%'], []);

  useEffect(() => {
    getProductById(productId)
      .then(setProduct)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [productId]);

  const openIngredientDetail = useCallback((ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    bottomSheetRef.current?.expand();
  }, []);

  const closeDetail = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    [],
  );

  // ─── 로딩 ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>성분 분석 중...</Text>
      </SafeAreaView>
    );
  }

  // ─── 에러 ────────────────────────────────────────────────────────────────
  if (error || !product) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorEmoji}>😵</Text>
        <Text style={styles.errorText}>{error ?? '제품 정보를 불러올 수 없습니다.'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>돌아가기</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const riskColor = RISK_COLOR[product.riskLevel];
  const riskBg = RISK_BG[product.riskLevel];
  const allergyText = allergyLabel(activeProfile.allergyProfile);
  const verdictText = VERDICT_COPY[product.riskLevel](product.name, allergyText);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{top: 10, left: 10, bottom: 10, right: 10}}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>스캔 결과</Text>
          <View style={{width: 28}} />
        </View>

        <FlatList
          data={product.ingredients}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              {/* 제품 정보 */}
              <View style={styles.productCard}>
                <View style={styles.productImagePlaceholder}>
                  <Text style={styles.productImageEmoji}>🛒</Text>
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productBrand}>{product.brand}</Text>
                  <Text style={styles.barcodeText}>{product.barcode}</Text>
                </View>
              </View>

              {/* 판정 배지 */}
              <View style={[styles.verdictCard, {backgroundColor: riskBg, borderColor: riskColor + '40'}]}>
                <View style={styles.verdictTop}>
                  <Text style={styles.verdictEmoji}>{RISK_EMOJI[product.riskLevel]}</Text>
                  <Text style={[styles.verdictLabel, {color: riskColor}]}>
                    {RISK_LABEL[product.riskLevel]}
                  </Text>
                </View>
                <Text style={styles.verdictText}>{verdictText}</Text>
                {product.riskIngredients.length > 0 && (
                  <View style={styles.riskIngredientList}>
                    {product.riskIngredients.map(ing => (
                      <View key={ing.id} style={[styles.riskChip, {backgroundColor: riskColor + '20'}]}>
                        <Text style={[styles.riskChipText, {color: riskColor}]}>{ing.nameKo}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {product.mayContainIngredients.length > 0 && (
                  <Text style={styles.mayContainText}>
                    May Contain: {product.mayContainIngredients.map(i => i.nameKo).join(', ')}
                  </Text>
                )}
              </View>

              {/* 대체 제품 (위험 시) */}
              {product.riskLevel === 'danger' && product.alternatives.length > 0 && (
                <View style={styles.alternativeCard}>
                  <Text style={styles.alternativeTitle}>💡 대체 제품 추천</Text>
                  {product.alternatives.map(alt => (
                    <View key={alt.id} style={styles.alternativeRow}>
                      <Text style={styles.alternativeName}>{alt.name}</Text>
                      <View style={[styles.safeBadge, {backgroundColor: Colors.safe + '20'}]}>
                        <Text style={[styles.safeBadgeText, {color: Colors.safe}]}>안전</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <Text style={styles.sectionTitle}>전체 성분 ({product.ingredients.length})</Text>
            </>
          }
          renderItem={({item}) => {
            const isRisk = product.riskIngredients.some(r => r.id === item.id);
            const isMay = product.mayContainIngredients.some(r => r.id === item.id);
            const dotColor = isRisk
              ? RISK_COLOR[product.riskLevel]
              : isMay
              ? Colors.caution
              : RISK_COLOR[item.riskLevel];

            return (
              <TouchableOpacity
                style={[styles.ingredientRow, (isRisk || isMay) && styles.ingredientRowHighlight]}
                onPress={() => openIngredientDetail(item)}
                activeOpacity={0.7}>
                <View style={[styles.dot, {backgroundColor: dotColor}]} />
                <View style={styles.ingredientInfo}>
                  <Text style={styles.ingredientNameKo}>{item.nameKo}</Text>
                  <Text style={styles.ingredientName}>{item.name}</Text>
                </View>
                {(isRisk || isMay) && (
                  <Text style={[styles.ingredientFlag, {color: dotColor}]}>
                    {isRisk ? '알러지' : 'May Contain'}
                  </Text>
                )}
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            );
          }}
        />
      </SafeAreaView>

      {/* 성분 상세 바텀시트 */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.sheetHandle}
        backgroundStyle={styles.sheetBg}>
        <BottomSheetView style={styles.sheetContent}>
          {selectedIngredient && (
            <>
              <View style={styles.sheetHeader}>
                <View>
                  <Text style={styles.sheetNameKo}>{selectedIngredient.nameKo}</Text>
                  <Text style={styles.sheetName}>{selectedIngredient.name}</Text>
                </View>
                <View
                  style={[
                    styles.riskBadge,
                    {backgroundColor: RISK_BG[selectedIngredient.riskLevel]},
                  ]}>
                  <Text style={[styles.riskBadgeText, {color: RISK_COLOR[selectedIngredient.riskLevel]}]}>
                    {RISK_LABEL[selectedIngredient.riskLevel]}
                  </Text>
                </View>
              </View>

              <Text style={styles.sheetDescription}>{selectedIngredient.description}</Text>

              {selectedIngredient.sources.length > 0 && (
                <View style={styles.sourcesSection}>
                  <Text style={styles.sourcesTitle}>📚 근거자료</Text>
                  {selectedIngredient.sources.map((url, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => Linking.openURL(url)}
                      style={styles.sourceLink}>
                      <Text style={styles.sourceLinkText} numberOfLines={1}>
                        🔗 {url}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity style={styles.closeButton} onPress={closeDetail}>
                <Text style={styles.closeButtonText}>닫기</Text>
              </TouchableOpacity>
            </>
          )}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: Colors.background},
  container: {flex: 1},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, padding: 24},
  loadingText: {marginTop: 12, fontSize: 15, color: Colors.textSecondary},
  errorEmoji: {fontSize: 48, marginBottom: 12},
  errorText: {fontSize: 15, color: Colors.text, textAlign: 'center', marginBottom: 20},

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  backArrow: {fontSize: 22, color: Colors.primary, fontWeight: '400'},
  headerTitle: {fontSize: 17, fontWeight: '600', color: Colors.text},
  backButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  backButtonText: {color: '#fff', fontWeight: '600', fontSize: 15},

  listContent: {padding: 16, paddingBottom: 40},

  // 제품 카드
  productCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  productImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  productImageEmoji: {fontSize: 28},
  productInfo: {flex: 1},
  productName: {fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: 2},
  productBrand: {fontSize: 13, color: Colors.textSecondary, marginBottom: 2},
  barcodeText: {fontSize: 11, color: Colors.separator},

  // 판정 카드
  verdictCard: {
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
  },
  verdictTop: {flexDirection: 'row', alignItems: 'center', marginBottom: 10},
  verdictEmoji: {fontSize: 26, marginRight: 8},
  verdictLabel: {fontSize: 22, fontWeight: '800'},
  verdictText: {fontSize: 14, color: Colors.text, lineHeight: 20, marginBottom: 12},
  riskIngredientList: {flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6},
  riskChip: {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20},
  riskChipText: {fontSize: 13, fontWeight: '600'},
  mayContainText: {fontSize: 12, color: Colors.textSecondary, marginTop: 4},

  // 대체 제품
  alternativeCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  alternativeTitle: {fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 10},
  alternativeRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  alternativeName: {fontSize: 14, color: Colors.text},
  safeBadge: {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20},
  safeBadgeText: {fontSize: 12, fontWeight: '600'},

  // 성분 목록
  sectionTitle: {fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 10},
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 14,
    marginBottom: 6,
  },
  ingredientRowHighlight: {
    borderWidth: 1,
    borderColor: Colors.caution + '60',
    backgroundColor: Colors.cautionBg,
  },
  dot: {width: 10, height: 10, borderRadius: 5, marginRight: 12},
  ingredientInfo: {flex: 1},
  ingredientNameKo: {fontSize: 15, fontWeight: '500', color: Colors.text},
  ingredientName: {fontSize: 12, color: Colors.textSecondary},
  ingredientFlag: {fontSize: 12, fontWeight: '600', marginRight: 6},
  chevron: {fontSize: 18, color: Colors.separator},

  // 바텀시트
  sheetHandle: {backgroundColor: Colors.separator, width: 40},
  sheetBg: {borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: Colors.card},
  sheetContent: {flex: 1, padding: 24},
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sheetNameKo: {fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 2},
  sheetName: {fontSize: 14, color: Colors.textSecondary},
  riskBadge: {paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20},
  riskBadgeText: {fontSize: 14, fontWeight: '700'},
  sheetDescription: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 24,
  },
  sourcesSection: {marginBottom: 24},
  sourcesTitle: {fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 10},
  sourceLink: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
    marginBottom: 6,
  },
  sourceLinkText: {fontSize: 13, color: Colors.primary},
  closeButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 'auto',
  },
  closeButtonText: {color: '#fff', fontSize: 16, fontWeight: '600'},
});
