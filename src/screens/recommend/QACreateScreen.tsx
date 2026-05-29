import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../../constants/colors';
import { createQAQuestion } from '../../services/recommend.service';
import { qaFeed } from '../../lib/qaFeedSignal';
import { getProductSuggestions } from '../../services/search.service';
import { ApiError, clearAuthToken, UnauthorizedError } from '../../lib/api';
import { useUserStore } from '../../store/user.store';
import { QnaCategory, RecommendStackParamList } from '../../types';

type Props = NativeStackScreenProps<RecommendStackParamList, 'QACreate'>;

const C = {
  bg:    '#FFFFFF',
  dark:  '#044733',
  mid:   '#556C53',
  muted: '#A9B6A8',
  line:  '#E0E0E0',
};

/** 4 카테고리 — `all` 은 product/allergy/vegetarian 필터 어디에서나 노출되는 유니버설 값. */
const CATEGORIES: ReadonlyArray<QnaCategory> = ['all', 'product', 'allergy', 'vegetarian'];

const CAT_LABEL_KEY: Record<QnaCategory, string> = {
  all:        'recommendUi.qaCategoryAll',
  product:    'recommendUi.qaCategoryProduct',
  allergy:    'recommendUi.qaCategoryAllergy',
  vegetarian: 'recommendUi.qaCategoryVegetarian',
};

const MAX_PHOTOS = 4;
const PRODUCT_SEARCH_DEBOUNCE_MS = 300;

type ProductSuggestion = { productId: string; name: string; brand: string };

export default function QACreateScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<QnaCategory>('all');
  const [title, setTitle]     = useState('');
  const [content, setContent] = useState('');
  const [photos, setPhotos]   = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // relatedProductId picker — category === 'product' 일 때만 활성.
  const [productQuery,       setProductQuery]       = useState('');
  const [productSelected,    setProductSelected]    = useState<ProductSuggestion | null>(null);
  const [productSuggestions, setProductSuggestions] = useState<ProductSuggestion[]>([]);

  // 키보드-aware: input focus 시 picker section 을 화면 상단 가까이로 스크롤.
  const scrollRef = useRef<ScrollView>(null);
  const productSectionY = useRef(0);

  // 검색 debounce — 300ms 후 /search/suggestions 호출.
  useEffect(() => {
    if (selectedCategory !== 'product') {
      setProductSuggestions([]);
      return;
    }
    // 이미 선택된 항목 그대로면 noise 호출 방지.
    if (productSelected && productQuery === productSelected.name) {
      setProductSuggestions([]);
      return;
    }
    const handle = setTimeout(async () => {
      const items = await getProductSuggestions(productQuery).catch(() => []);
      setProductSuggestions(items);
    }, PRODUCT_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [productQuery, selectedCategory, productSelected]);

  // 카테고리가 product 가 아니게 되면 picker 상태 초기화.
  useEffect(() => {
    if (selectedCategory !== 'product') {
      setProductQuery('');
      setProductSelected(null);
      setProductSuggestions([]);
    }
  }, [selectedCategory]);

  const canSubmit = title.trim().length > 0 && content.trim().length > 0 && !isSubmitting;

  async function handleAddPhoto() {
    if (photos.length >= MAX_PHOTOS) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotos(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, MAX_PHOTOS));
    }
  }

  function handleRemovePhoto(index: number) {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  }

  /**
   * createQAQuestion 의 BE 에러 코드 → 한국어 메시지.
   * 매핑되지 않은 코드는 ApiError.message 그대로 (BE 가 한국어 메시지를 포함).
   */
  function formatCreateError(err: unknown): string {
    if (!(err instanceof ApiError)) {
      return err instanceof Error ? err.message : '글 등록에 실패했습니다.';
    }
    switch (err.code) {
      case 'IMAGE_TOO_LARGE':
        return '이미지는 5MB 이하만 업로드 가능합니다.';
      case 'INVALID_FILE_TYPE':
        return 'jpg/png/webp 이미지만 업로드할 수 있습니다.';
      case 'PRODUCT_NOT_FOUND':
        return '선택한 제품 정보를 찾을 수 없습니다. 제품을 다시 선택해 주세요.';
      case 'INVALID_INPUT':
        return '제목·내용·카테고리를 확인해 주세요.';
      case 'TOO_MANY_REQUESTS':
        return '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';
      case 'STORAGE_UNAVAILABLE':
      case 'DB_UNAVAILABLE':
      case 'SERVICE_DISABLED':
        return '서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.';
      case 'NETWORK':
        return '네트워크에 연결할 수 없습니다.';
      case 'TIMEOUT':
        return '요청 시간이 초과되었습니다. 다시 시도해 주세요.';
      default:
        return err.message || '글 등록에 실패했습니다.';
    }
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      await createQAQuestion({
        title: title.trim(),
        content: content.trim(),
        category: selectedCategory,
        photos,
        relatedProductId:
          selectedCategory === 'product' && productSelected
            ? productSelected.productId
            : undefined,
      });
      // Q&A 목록을 보여주는 화면들이 다음 focus 때 새 글을 재조회하도록 신호.
      qaFeed.bump();
      navigation.goBack();
    } catch (err: unknown) {
      // CLIR/CLAUDE.md 의 401 처리 패턴 (WeekendPopularScreen 답습).
      // app-level listener 가 logout 시 Auth 스택으로 reset 한다.
      if (err instanceof UnauthorizedError) {
        clearAuthToken();
        useUserStore.getState().logout();
        return;
      }
      Alert.alert('알림', formatCreateError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={t('a11y.back')}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ask Question</Text>
        <TouchableOpacity
          style={[styles.postBtn, !canSubmit && styles.postBtnDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.8}
          disabled={!canSubmit}
        >
          {isSubmitting
            ? <ActivityIndicator size="small" color={Colors.white} />
            : <Text style={styles.postBtnText}>Post</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >

        {/* ── Choose Categories ── */}
        <Text style={styles.sectionLabel}>Choose Categories</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          style={styles.categoryRow}
        >
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat)}
              activeOpacity={0.75}
            >
              <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
                {t(CAT_LABEL_KEY[cat])}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Related Product (category === 'product' 일 때만) ── */}
        {selectedCategory === 'product' && (
          <View
            style={styles.productPickerWrap}
            onLayout={e => { productSectionY.current = e.nativeEvent.layout.y; }}
          >
            <Text style={[styles.sectionLabel, { marginTop: 40 }]}>Related Product</Text>
            <View style={styles.productInputBox}>
              <TextInput
                style={styles.productInput}
                placeholder={t('recommendUi.searchProductPlaceholder')}
                placeholderTextColor={C.muted}
                value={productQuery}
                onChangeText={text => {
                  setProductQuery(text);
                  // 사용자가 다시 입력하면 이전 선택 무효화 (검색 재개).
                  if (productSelected && text !== productSelected.name) setProductSelected(null);
                }}
                onFocus={() => {
                  // 키보드 애니메이션 시작 직후 picker section 을 화면 상단으로 스크롤.
                  // dropdown 이 키보드에 가리지 않도록 보장. KeyboardAvoidingView 와 보완관계.
                  setTimeout(() => {
                    scrollRef.current?.scrollTo({
                      y: Math.max(0, productSectionY.current - 20),
                      animated: true,
                    });
                  }, 150);
                }}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {productSelected && (
                <TouchableOpacity
                  onPress={() => {
                    setProductSelected(null);
                    setProductQuery('');
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={t('a11y.remove')}
                >
                  <Text style={styles.productClear}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            {!productSelected && productSuggestions.length > 0 && (
              <View style={styles.productSuggestList}>
                {productSuggestions.map(s => (
                  <TouchableOpacity
                    key={s.productId}
                    style={styles.productSuggestRow}
                    onPress={() => {
                      setProductSelected(s);
                      setProductQuery(s.name);
                      setProductSuggestions([]);
                      Keyboard.dismiss();
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.productSuggestName} numberOfLines={1}>{s.name}</Text>
                    {!!s.brand && (
                      <Text style={styles.productSuggestBrand} numberOfLines={1}>{s.brand}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── Post ── */}
        <Text style={[styles.sectionLabel, { marginTop: 40 }]}>Post</Text>

        <TextInput
          style={styles.titleInput}
          placeholder={t('recommendUi.qaTitlePlaceholder')}
          placeholderTextColor={C.muted}
          value={title}
          onChangeText={setTitle}
          maxLength={20}
          returnKeyType="next"
          autoCorrect={false}
        />
        <View style={styles.inputDivider} />

        <TextInput
          style={styles.contentInput}
          placeholder={t('recommendUi.qaBodyPlaceholder')}
          placeholderTextColor={C.muted}
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
          autoCorrect={false}
          maxLength={2000}
        />

        {/* ── Add Photos ── */}
        <View style={styles.photoDivider} />
        <View style={styles.photoHeader}>
          <Text style={styles.sectionLabel}>Add Photos</Text>
          <Text style={styles.photoCount}>{photos.length}/{MAX_PHOTOS}</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.photoList}
          style={styles.photoScrollRow}
        >
          {photos.map((uri, index) => (
            <TouchableOpacity
              key={uri}
              style={styles.photoThumb}
              onPress={() => handleRemovePhoto(index)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`${t('a11y.remove')} ${index + 1}`}
            >
              <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <View style={styles.photoRemove}>
                <Text style={styles.photoRemoveText}>✕</Text>
              </View>
            </TouchableOpacity>
          ))}
          {photos.length < MAX_PHOTOS && (
            <TouchableOpacity style={styles.photoAddBtn} onPress={handleAddPhoto} activeOpacity={0.75}>
              <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                <Path d="M12 5v14M5 12h14" stroke={C.muted} strokeWidth={1.5} strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>
          )}
        </ScrollView>

      </ScrollView>
    </View>
    </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },

  header: {
    height: 95,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    left: 15,
    bottom: 26,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: C.dark, fontSize: 28, lineHeight: 30, fontFamily: 'Pretendard-Regular' },
  headerTitle: {
    marginTop: 8,
    color: C.dark,
    fontSize: 20,
    fontFamily: 'Pretendard-Bold',
    letterSpacing: -0.38,
  },
  postBtn: {
    position: 'absolute',
    right: 20,
    bottom: 22,
    backgroundColor: C.dark,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  postBtnDisabled: { opacity: 0.4 },
  postBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: 'Pretendard-Bold',
    letterSpacing: -0.228,
  },

  scroll: { flex: 1 },

  sectionLabel: {
    marginLeft: 28,
    color: C.dark,
    fontSize: 16,
    fontFamily: 'Pretendard-ExtraBold',
    lineHeight: 21.6,
  },

  categoryRow: { marginTop: 12 },
  categoryList: {
    paddingHorizontal: 28,
    gap: 5,
  },
  categoryChip: {
    height: 30,
    borderWidth: 1,
    borderColor: C.mid,
    borderRadius: 50,
    paddingHorizontal: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipActive: {
    backgroundColor: C.dark,
    borderColor: C.dark,
  },
  categoryText: {
    fontSize: 13,
    fontFamily: 'Pretendard-Regular',
    color: C.dark,
    letterSpacing: -0.228,
  },
  categoryTextActive: {
    color: Colors.white,
    fontFamily: 'Pretendard-Bold',
  },

  productPickerWrap: {
    marginHorizontal: 28,
  },
  productInputBox: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.mid,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  productInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Pretendard-Regular',
    color: C.dark,
    padding: 0,
  },
  productClear: {
    fontSize: 14,
    color: C.muted,
  },
  productSuggestList: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 10,
    overflow: 'hidden',
  },
  productSuggestRow: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  productSuggestName: {
    fontSize: 14,
    fontFamily: 'Pretendard-SemiBold',
    color: C.dark,
  },
  productSuggestBrand: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: 'Pretendard-Regular',
    color: C.mid,
  },
  titleInput: {
    marginTop: 20,
    marginHorizontal: 28,
    fontSize: 16,
    fontFamily: 'Pretendard-Regular',
    color: C.dark,
    padding: 0,
  },
  inputDivider: {
    height: 1,
    marginHorizontal: 28,
    backgroundColor: C.line,
    marginTop: 8,
  },
  contentInput: {
    marginTop: 16,
    marginHorizontal: 28,
    fontSize: 16,
    fontFamily: 'Pretendard-Regular',
    color: C.dark,
    minHeight: 320,
    padding: 0,
  },

  photoDivider: {
    height: 1,
    marginHorizontal: 27,
    backgroundColor: C.line,
    marginTop: 8,
  },
  photoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginRight: 28,
  },
  photoCount: {
    fontSize: 16,
    fontFamily: 'Pretendard-Regular',
    color: C.dark,
  },
  photoScrollRow: { marginTop: 12 },
  photoList: { paddingHorizontal: 28, gap: 10 },
  photoThumb: {
    width: 81,
    height: 81,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  photoRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveText: { color: '#FFFFFF', fontSize: 10, lineHeight: 12 },
  photoAddBtn: {
    width: 81,
    height: 81,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bg,
  },
});
