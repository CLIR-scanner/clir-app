import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RecommendStackParamList, Product } from '../../types';
import { getPersonalizedRecommendations } from '../../services/recommend.service';
import { useUserStore } from '../../store/user.store';
import { Colors } from '../../constants/colors';
import { RISK_LABEL, RISK_COLOR, RISK_BG } from '../../constants/risk';
import { Strings } from '../../constants/strings';

type Props = {
  navigation: NativeStackNavigationProp<RecommendStackParamList, 'Recommend'>;
};

export default function RecommendScreen({ navigation }: Props) {
  const currentUserId = useUserStore(s => s.currentUser.id);
  const [personalized, setPersonalized] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getPersonalizedRecommendations(currentUserId)
      .then(data => { if (!cancelled) setPersonalized(data); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [currentUserId]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{Strings.recommendTitle}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Navigation cards */}
        <TouchableOpacity
          style={styles.navCard}
          onPress={() => navigation.navigate('WeekendPopular')}
          activeOpacity={0.7}>
          <View style={styles.navCardLeft}>
            <Text style={styles.navCardEmoji}>🔥</Text>
            <View>
              <Text style={styles.navCardTitle}>{Strings.recommendWeekendPopular}</Text>
              <Text style={styles.navCardSub}>안전한 인기 제품 모음</Text>
            </View>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navCard}
          onPress={() => navigation.navigate('SimilarUsersFavorites')}
          activeOpacity={0.7}>
          <View style={styles.navCardLeft}>
            <Text style={styles.navCardEmoji}>👥</Text>
            <View>
              <Text style={styles.navCardTitle}>{Strings.recommendSimilarUsers}</Text>
              <Text style={styles.navCardSub}>같은 알러지 프로필 사용자 추천</Text>
            </View>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {/* Personalized section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>나를 위한 추천</Text>

          {loading ? (
            <ActivityIndicator color={Colors.primary} style={styles.spinner} />
          ) : personalized.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>추천 제품이 없습니다</Text>
            </View>
          ) : (
            personalized.slice(0, 5).map(product => {
              const riskColor = RISK_COLOR[product.riskLevel];
              const riskBg = RISK_BG[product.riskLevel];
              return (
                <View key={product.id} style={styles.productCard}>
                  <View style={styles.productImagePlaceholder}>
                    <Text style={styles.productEmoji}>🛒</Text>
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                    <Text style={styles.productBrand}>{product.brand}</Text>
                  </View>
                  <View style={[styles.riskBadge, { backgroundColor: riskBg }]}>
                    <Text style={[styles.riskText, { color: riskColor }]}>
                      {RISK_LABEL[product.riskLevel]}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },

  content: { padding: 16 },

  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  navCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  navCardEmoji: { fontSize: 28 },
  navCardTitle: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  navCardSub: { fontSize: 13, color: Colors.textSecondary },
  chevron: { fontSize: 20, color: Colors.textSecondary },

  section: { marginTop: 8 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },

  spinner: { marginTop: 20 },

  emptyBox: { padding: 20, alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.textSecondary },

  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  productImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productEmoji: { fontSize: 20 },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  productBrand: { fontSize: 12, color: Colors.textSecondary },
  riskBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  riskText: { fontSize: 12, fontWeight: '700' },
});
