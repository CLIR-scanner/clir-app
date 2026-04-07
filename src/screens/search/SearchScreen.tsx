import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SearchStackParamList } from '../../types';
import { getRecentSearches } from '../../services/search.service';
import { useUserStore } from '../../store/user.store';
import { Colors } from '../../constants/colors';
import { Strings } from '../../constants/strings';

type Props = {
  navigation: NativeStackNavigationProp<SearchStackParamList, 'Search'>;
};

export default function SearchScreen({ navigation }: Props) {
  const currentUserId = useUserStore(s => s.currentUser.id);
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    getRecentSearches(currentUserId)
      .then(setRecentSearches)
      .finally(() => setLoadingRecent(false));
  }, [currentUserId]);

  const handleSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    navigation.navigate('SearchResult', { query: trimmed });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{Strings.tabSearch}</Text>
      </View>

      <View style={styles.searchBarWrap}>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.searchInput}
            placeholder={Strings.searchPlaceholder}
            placeholderTextColor={Colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => handleSearch(query)}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => setQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={() => handleSearch(query)}>
          <Text style={styles.searchBtnText}>검색</Text>
        </TouchableOpacity>
      </View>

      {loadingRecent ? (
        <ActivityIndicator style={styles.spinner} color={Colors.primary} />
      ) : recentSearches.length > 0 ? (
        <View style={styles.recentSection}>
          <Text style={styles.recentLabel}>최근 검색</Text>
          <FlatList
            data={recentSearches}
            keyExtractor={(item, idx) => `recent-${idx}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.recentRow}
                onPress={() => {
                  setQuery(item);
                  handleSearch(item);
                }}
                activeOpacity={0.6}>
                <Text style={styles.recentIcon}>🕐</Text>
                <Text style={styles.recentText}>{item}</Text>
                <Text style={styles.recentArrow}>›</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            style={styles.recentList}
          />
        </View>
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyText}>
            제품명, 브랜드, 성분으로 검색하세요
          </Text>
        </View>
      )}
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

  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    gap: 8,
  },
  inputWrap: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  searchInput: {
    height: 44,
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingRight: 36,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  clearBtn: {
    position: 'absolute',
    right: 8,
    padding: 4,
  },
  clearBtnText: { fontSize: 14, color: Colors.textSecondary },
  searchBtn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  searchBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  spinner: { marginTop: 40 },

  recentSection: { flex: 1 },
  recentLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: 20,
    marginBottom: 6,
  },
  recentList: {
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  recentIcon: { fontSize: 16 },
  recentText: { flex: 1, fontSize: 15, color: Colors.text },
  recentArrow: { fontSize: 18, color: Colors.textSecondary },
  separator: { height: 1, backgroundColor: Colors.separator, marginLeft: 44 },

  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center' },
});
