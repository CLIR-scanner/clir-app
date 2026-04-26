import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { MainTabParamList } from '../types';
import ScanNavigator from './ScanNavigator';
import SearchNavigator from './SearchNavigator';
import ListNavigator from './ListNavigator';
import RecommendNavigator from './RecommendNavigator';
import ProfileNavigator from './ProfileNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

// ── Tab bar item config (2 left + 2 right, center = scan button) ──────────────
type TabRoute = keyof MainTabParamList;

const LEFT_TABS:  { route: TabRoute; label: string }[] = [
  { route: 'SearchTab', label: 'SEARCH' },
  { route: 'ListTab',   label: 'LIST' },
];
const RIGHT_TABS: { route: TabRoute; label: string }[] = [
  { route: 'RecommendTab', label: 'COMMUNITY' },
  { route: 'ProfileTab',   label: 'PROFILE' },
];

// ── Custom tab bar ─────────────────────────────────────────────────────────────
function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets     = useSafeAreaInsets();
  const activeRoute = state.routes[state.index].name as TabRoute;

  // 스캔 화면 진입 시 하단 탭바 숨김
  if (activeRoute === 'ScanTab') return null;

  // 중첩 스택의 현재 화면 이름 추출 (탭바 숨김 여부 판단용)
  const nestedState = state.routes[state.index].state;
  const nestedRoute = nestedState
    ? nestedState.routes[nestedState.index ?? 0]?.name
    : null;

  // 설문조사 화면 진입 시 탭바 숨김
  if (nestedRoute === 'MultiProfileAdd') return null;

  function goTo(route: TabRoute) {
    navigation.navigate(route);
  }

  function goToScan() {
    // 직전 탭(현재 활성 탭)을 ScanScreen에 넘겨 뒤로가기 시 복귀하도록 함.
    // 이미 ScanTab이면 previousTab을 덮어쓰지 않음 — 같은 탭 재진입 방어.
    if (activeRoute === 'ScanTab') {
      navigation.navigate('ScanTab');
      return;
    }
    navigation.navigate('ScanTab', {
      screen: 'Scan',
      params: { previousTab: activeRoute },
    });
  }

  function renderTab(tab: { route: TabRoute; label: string }) {
    const isActive = activeRoute === tab.route;
    return (
      <TouchableOpacity
        key={tab.route}
        style={tabStyles.item}
        onPress={() => goTo(tab.route)}
        activeOpacity={0.7}
      >
        <Text style={[tabStyles.label, isActive && tabStyles.labelActive]}>
          {tab.label}
        </Text>
        {isActive && <View style={tabStyles.indicator} />}
      </TouchableOpacity>
    );
  }

  // 현재 탭의 중첩 스택에서 포커스된 화면 이름 추출
  const activeTabState = state.routes[state.index].state;
  const focusedStackRoute = activeTabState
    ? activeTabState.routes[activeTabState.index ?? 0]?.name
    : null;

const bottomPad = insets.bottom > 0 ? insets.bottom : 12;

  return (
    <View style={[tabStyles.bar, { paddingBottom: bottomPad }]}>
      {/* Left: SEARCH, LIST */}
      {LEFT_TABS.map(renderTab)}

      {/* Center floating scan button */}
      <View style={tabStyles.centerSlot}>
        <TouchableOpacity
          style={tabStyles.scanBtn}
          onPress={goToScan}
          activeOpacity={0.8}
        >
          <View style={tabStyles.scanCircle} />
        </TouchableOpacity>
      </View>

      {/* Right: COMMUNITY, PROFILE */}
      {RIGHT_TABS.map(renderTab)}
    </View>
  );
}

// ── Navigator ─────────────────────────────────────────────────────────────────
export default function MainNavigator() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
      initialRouteName="SearchTab"
    >
      <Tab.Screen name="ScanTab"      component={ScanNavigator}      options={{ title: t('tab.scan') }} />
      <Tab.Screen name="SearchTab"    component={SearchNavigator}    options={{ title: t('tab.search') }} />
      <Tab.Screen name="ListTab"      component={ListNavigator}      options={{ title: t('tab.list') }} />
      <Tab.Screen name="RecommendTab" component={RecommendNavigator} options={{ title: t('tab.recommend') }} />
      <Tab.Screen name="ProfileTab"   component={ProfileNavigator}   options={{ title: t('tab.profile') }} />
    </Tab.Navigator>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const tabStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',   // 아이콘 기준 위쪽 정렬, paddingBottom이 하단 여백을 담당
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    paddingTop: 10,
    paddingHorizontal: 4,
    // height 고정 제거 — paddingBottom을 통해 동적으로 결정
  },

  // Tab item
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: '#AAAAAA',
    letterSpacing: 0.4,
  },
  labelActive: {
    color: '#1A1A1A',
    fontWeight: '700',
  },
  indicator: {
    width: 18, height: 2,
    backgroundColor: '#1A1A1A',
    borderRadius: 1,
  },

  // Center slot & floating scan button
  centerSlot: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  scanBtn: {
    marginTop: -30,  // float above tab bar
  },
  scanCircle: {
    width: 54, height: 54,
    borderRadius: 27,
    backgroundColor: '#2D2D2D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
  },
});
