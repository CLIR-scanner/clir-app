import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { MainTabParamList } from '../types';
import ScanNavigator from './ScanNavigator';
import SearchNavigator from './SearchNavigator';
import ListNavigator from './ListNavigator';
import RecommendNavigator from './RecommendNavigator';
import ProfileNavigator from './ProfileNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();
type TabRoute = keyof MainTabParamList;

const LEFT_TABS:  { route: TabRoute }[] = [
  { route: 'SearchTab' },
  { route: 'ListTab' },
];
const RIGHT_TABS: { route: TabRoute }[] = [
  { route: 'RecommendTab' },
  { route: 'ProfileTab' },
];

// ── Tab icons (assets SVG → react-native-svg) ─────────────────────────────────

function SearchIcon({ active }: { active: boolean }) {
  return (
    <Svg width={33} height={33} viewBox="0 0 33 33" fill="none">
      <G opacity={active ? 1 : 0.6}>
        <Path
          d="M28.875 28.8753L22.9034 22.9037M22.9034 22.9037C23.9249 21.8822 24.7352 20.6695 25.288 19.3349C25.8408 18.0003 26.1253 16.5699 26.1253 15.1253C26.1253 13.6807 25.8408 12.2503 25.288 10.9157C24.7352 9.58104 23.9249 8.36838 22.9034 7.34691C21.8819 6.32544 20.6693 5.51516 19.3347 4.96235C18 4.40953 16.5696 4.125 15.125 4.125C13.6805 4.125 12.25 4.40953 10.9154 4.96235C9.5808 5.51516 8.36813 6.32544 7.34666 7.34691C5.28371 9.40986 4.12476 12.2078 4.12476 15.1253C4.12476 18.0427 5.28371 20.8407 7.34666 22.9037C9.40962 24.9666 12.2076 26.1256 15.125 26.1256C18.0425 26.1256 20.8405 24.9666 22.9034 22.9037Z"
          stroke="#1C3A19"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  );
}

function ListIcon({ active }: { active: boolean }) {
  return (
    <Svg width={40} height={40} viewBox="0 0 40 40" fill="none">
      <G opacity={active ? 1 : 0.6}>
        <Path
          d="M13.3334 9.99971H33.3334M6.66675 10.0164L6.68342 9.99805M6.66675 20.0164L6.68342 19.998M6.66675 30.0164L6.68342 29.998M13.3334 19.9997H33.3334M13.3334 29.9997H33.3334"
          stroke="#1C3A19"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  );
}

function CommunityIcon({ active }: { active: boolean }) {
  return (
    <Svg width={33} height={33} viewBox="0 0 33 33" fill="none">
      <G opacity={active ? 1 : 0.6}>
        <Path
          d="M16.4999 4.46875C14.4649 4.46875 12.5055 4.51 10.6644 4.58975C7.30939 4.73413 5.63189 4.80562 4.30364 6.1435C2.97676 7.48 2.91901 9.11213 2.80489 12.375C2.73236 14.4369 2.73236 16.5006 2.80489 18.5625C2.91901 21.8254 2.97676 23.4575 4.30364 24.794C5.63051 26.1319 7.30939 26.2034 10.6644 26.3478L10.9999 26.3615V29.59C11 29.7819 11.0551 29.9698 11.1587 30.1313C11.2623 30.2929 11.41 30.4214 11.5844 30.5015C11.7587 30.5817 11.9524 30.6102 12.1425 30.5837C12.3326 30.5571 12.511 30.4766 12.6568 30.3517L15.6543 27.7819C16.4064 27.1356 16.7831 26.8139 17.2314 26.6434C17.6796 26.4729 18.1884 26.4633 19.2073 26.444C20.2807 26.4229 21.3234 26.3908 22.3354 26.3478C25.6904 26.2034 27.3679 26.1319 28.6961 24.794C30.023 23.4575 30.0808 21.8254 30.1949 18.5625C30.2155 17.9988 30.2416 17.4267 30.2499 16.8438"
          stroke="#1C3A19"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M30.2495 12.375L28.0151 10.1406M16.6728 15.125H16.4995M11.17 15.125H10.9995M28.8745 6.875C28.8745 5.78098 28.4399 4.73177 27.6663 3.95818C26.8927 3.1846 25.8435 2.75 24.7495 2.75C23.6555 2.75 22.6063 3.1846 21.8327 3.95818C21.0591 4.73177 20.6245 5.78098 20.6245 6.875C20.6245 7.96902 21.0591 9.01823 21.8327 9.79182C22.6063 10.5654 23.6555 11 24.7495 11C25.8435 11 26.8927 10.5654 27.6663 9.79182C28.4399 9.01823 28.8745 7.96902 28.8745 6.875ZM16.8433 15.125C16.8433 15.2162 16.807 15.3036 16.7426 15.3681C16.6781 15.4325 16.5907 15.4688 16.4995 15.4688C16.4083 15.4688 16.3209 15.4325 16.2564 15.3681C16.192 15.3036 16.1558 15.2162 16.1558 15.125C16.1558 15.0338 16.192 14.9464 16.2564 14.8819C16.3209 14.8175 16.4083 14.7813 16.4995 14.7813C16.5907 14.7813 16.6781 14.8175 16.7426 14.8819C16.807 14.9464 16.8433 15.0338 16.8433 15.125ZM11.3433 15.125C11.3433 15.2162 11.307 15.3036 11.2426 15.3681C11.1781 15.4325 11.0907 15.4688 10.9995 15.4688C10.9083 15.4688 10.8209 15.4325 10.7564 15.3681C10.692 15.3036 10.6558 15.2162 10.6558 15.125C10.6558 15.0338 10.692 14.9464 10.7564 14.8819C10.8209 14.8175 10.9083 14.7813 10.9995 14.7813C11.0907 14.7813 11.1781 14.8175 11.2426 14.8819C11.307 14.9464 11.3433 15.0338 11.3433 15.125Z"
          stroke="#1C3A19"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <Svg width={36} height={36} viewBox="0 0 36 36" fill="none">
      <G opacity={active ? 1 : 0.6}>
        <Path
          d="M6 27C6 25.4087 6.63214 23.8826 7.75736 22.7574C8.88258 21.6321 10.4087 21 12 21H24C25.5913 21 27.1174 21.6321 28.2426 22.7574C29.3679 23.8826 30 25.4087 30 27C30 27.7956 29.6839 28.5587 29.1213 29.1213C28.5587 29.6839 27.7957 30 27 30H9C8.20435 30 7.44129 29.6839 6.87868 29.1213C6.31607 28.5587 6 27.7956 6 27Z"
          stroke="#1C3A19"
          strokeWidth={1.7}
          strokeLinejoin="round"
        />
        <Path
          d="M18 15C20.4853 15 22.5 12.9853 22.5 10.5C22.5 8.01472 20.4853 6 18 6C15.5147 6 13.5 8.01472 13.5 10.5C13.5 12.9853 15.5147 15 18 15Z"
          stroke="#1C3A19"
          strokeWidth={1.7}
        />
      </G>
    </Svg>
  );
}

// scan.svg — 배경 없이 아이콘만, 크게
function ScanIcon() {
  return (
    <Svg width={72} height={72} viewBox="0 0 83 83" fill="none">
      <Path
        d="M8.18311 41.4672C8.18311 59.8258 23.1086 74.7512 41.4672 74.7512V54.2489C34.6814 54.2489 29.169 48.7365 29.169 41.9507C29.169 35.165 34.6814 29.6525 41.4672 29.6525V8.18311C23.1086 8.18311 8.18311 23.1086 8.18311 41.4672Z"
        fill="#556C53"
      />
      <Path
        d="M44.2715 33.8266V34.8743V49.0099V50.0576C48.7523 50.0576 52.3951 46.4149 52.3951 41.9341C52.3951 37.4532 48.7523 33.8105 44.2715 33.8105V33.8266Z"
        fill="#556C53"
      />
      <Path
        d="M44.4229 53.7755C51.202 53.7755 56.6975 48.4108 56.6975 41.7931C56.6975 35.1754 51.202 29.8107 44.4229 29.8107"
        stroke="#556C53"
        strokeWidth={2.11268}
      />
    </Svg>
  );
}

function getIcon(route: TabRoute, active: boolean) {
  switch (route) {
    case 'SearchTab':    return <SearchIcon    active={active} />;
    case 'ListTab':      return <ListIcon      active={active} />;
    case 'RecommendTab': return <CommunityIcon active={active} />;
    case 'ProfileTab':   return <ProfileIcon   active={active} />;
    default:             return null;
  }
}

// ── Custom tab bar ─────────────────────────────────────────────────────────────

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets      = useSafeAreaInsets();
  const activeRoute = state.routes[state.index].name as TabRoute;

  if (activeRoute === 'ScanTab') return null;

  const nestedState = state.routes[state.index].state;
  const nestedRoute = nestedState
    ? nestedState.routes[nestedState.index ?? 0]?.name
    : null;
  if (nestedRoute === 'MultiProfileAdd') return null;

  function goTo(route: TabRoute) { navigation.navigate(route); }

  function goToScan() {
    if (activeRoute === 'ScanTab') { navigation.navigate('ScanTab'); return; }
    navigation.navigate('ScanTab', {
      screen: 'Scan',
      params: { previousTab: activeRoute },
    });
  }

  function renderTab(tab: { route: TabRoute }) {
    const isActive = activeRoute === tab.route;
    return (
      <TouchableOpacity
        key={tab.route}
        style={tabStyles.item}
        onPress={() => goTo(tab.route)}
        activeOpacity={0.7}
      >
        {getIcon(tab.route, isActive)}
      </TouchableOpacity>
    );
  }

  const bottomPad = insets.bottom > 0 ? insets.bottom : 12;

  return (
    <View style={[tabStyles.bar, { paddingBottom: bottomPad }]}>
      {LEFT_TABS.map(renderTab)}

      {/* Center floating scan button */}
      <View style={tabStyles.centerSlot}>
        <TouchableOpacity
          style={tabStyles.scanBtn}
          onPress={goToScan}
          activeOpacity={0.8}
        >
          <View style={tabStyles.scanCircle}>
            <ScanIcon />
          </View>
        </TouchableOpacity>
      </View>

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
    alignItems: 'flex-start',
    backgroundColor: '#F9FFF3',
    paddingTop: 12,
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 2,
  },
  centerSlot: {
    width: 76,
    alignItems: 'center',
  },
  scanBtn: {
    marginTop: -30,
  },
  scanCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#F9FFF3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
});
