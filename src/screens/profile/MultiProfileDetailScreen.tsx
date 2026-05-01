import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, Image, TextInput, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { ProfileStackParamList } from '../../types';
import { useUserStore } from '../../store/user.store';
import { getAllergenDisplay } from '../../services/allergen.service';

type Nav   = NativeStackNavigationProp<ProfileStackParamList, 'MultiProfileDetail'>;
type Route = RouteProp<ProfileStackParamList, 'MultiProfileDetail'>;

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG         = '#F9FFF3';
const DARK_GREEN = '#1C3A19';
const MID_GREEN  = '#556C53';
const BORDER     = '#A9B6A8';
const CARD_FILL  = '#E9F0E4';
const STRICT_CLR = '#FF3434';
const STRICT_BG  = '#FFECEC';

// ── Icons ─────────────────────────────────────────────────────────────────────
function CameraIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        stroke={DARK_GREEN} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={12} cy={13} r={4} stroke={DARK_GREEN} strokeWidth={2} />
    </Svg>
  );
}

function PencilIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
        stroke={MID_GREEN} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"
        stroke={MID_GREEN} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function MultiProfileDetailScreen() {
  const navigation        = useNavigation<Nav>();
  const route             = useRoute<Route>();
  const { t }             = useTranslation();
  const insets            = useSafeAreaInsets();
  const { profileId }     = route.params;

  const currentUser        = useUserStore(s => s.currentUser);
  const activeProfile      = useUserStore(s => s.activeProfile);
  const switchProfile      = useUserStore(s => s.switchProfile);
  const deleteMultiProfile = useUserStore(s => s.deleteMultiProfile);
  const updateMultiProfile = useUserStore(s => s.updateMultiProfile);

  const isMainProfile = profileId === currentUser.id;
  const profile = isMainProfile
    ? currentUser
    : currentUser.multiProfiles.find(p => p.id === profileId);

  // ── Photo ──────────────────────────────────────────────────────────────────
  const [photoUri, setPhotoUri] = useState<string | undefined>(profile?.profileImage);
  const [saving,   setSaving]   = useState(false);

  // ── Name editing ───────────────────────────────────────────────────────────
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName,    setEditedName]    = useState(profile?.name ?? '');
  const nameRef = useRef<TextInput>(null);

  if (!profile) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>{'‹'}</Text>
        </TouchableOpacity>
        <Text style={styles.notFound}>{t('multiProfileDetail.notFound')}</Text>
      </View>
    );
  }

  const isActive = activeProfile.id === profileId;

  async function handlePickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('profileUi.permissionRequired'), t('profileUi.photoPermissionProfile'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPhotoUri(uri);
      if (!isMainProfile) updateMultiProfile(profileId, { profileImage: uri });
    }
  }

  async function handleSaveName() {
    const trimmed = editedName.trim();
    if (!trimmed) { Alert.alert(t('common.error'), t('profileUi.enterName')); return; }
    setSaving(true);
    try {
      if (!isMainProfile) updateMultiProfile(profileId, { name: trimmed });
      setIsEditingName(false);
    } finally {
      setSaving(false);
    }
  }

  function handleSwitch() {
    switchProfile(profileId);
    navigation.goBack();
  }

  function handleDelete() {
    Alert.alert(
      t('multiProfile.deleteTitle'),
      t('multiProfile.deleteMsg', { name: profile!.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            if (isActive) switchProfile(currentUser.id);
            deleteMultiProfile(profileId);
            navigation.goBack();
          },
        },
      ],
    );
  }

  const initial = (editedName || profile.name || '?')[0].toUpperCase();
  const isStrict = profile.sensitivityLevel === 'strict';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.backArrow}>{'‹'}</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{t('multiProfileDetail.headerTitle')}</Text>

        {isMainProfile ? (
          <Text style={styles.mainLabel}>{t('multiProfileDetail.badgeMain')}</Text>
        ) : (
          <TouchableOpacity onPress={handleDelete}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.deleteLabel}>{t('multiProfileDetail.deleteBtn')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Avatar ───────────────────────────────────────────────────────── */}
        <View style={styles.heroSection}>
          <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.85}>
            <View style={styles.avatarWrap}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>
              )}
              <View style={styles.cameraBadge}>
                <CameraIcon />
              </View>
            </View>
          </TouchableOpacity>

          {/* Name display / edit */}
          {isEditingName ? (
            <TextInput
              ref={nameRef}
              style={styles.nameInput}
              value={editedName}
              onChangeText={setEditedName}
              placeholder={t('profileUi.profileName')}
              placeholderTextColor={BORDER}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleSaveName}
              textAlign="center"
              autoFocus
            />
          ) : (
            <View style={styles.nameRow}>
              <Text style={styles.profileName}>{editedName || profile.name}</Text>
              {!isMainProfile && (
                <TouchableOpacity
                  onPress={() => { setIsEditingName(true); setTimeout(() => nameRef.current?.focus(), 50); }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}
                >
                  <PencilIcon />
                </TouchableOpacity>
              )}
            </View>
          )}

          {isEditingName && (
            <TouchableOpacity
              style={[styles.saveNameBtn, saving && { opacity: 0.5 }]}
              onPress={handleSaveName}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.saveNameBtnText}>{t('common.save')}</Text>
              }
            </TouchableOpacity>
          )}

          {isActive && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>{t('common.currentlyActive')}</Text>
            </View>
          )}
        </View>

        {/* ── Sensitivity card ─────────────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>{t('profileUi.sensitivity')}</Text>
            <View style={[styles.sensitivityBadge,
              isStrict ? styles.sensitivityStrict : styles.sensitivityNormal]}>
              <Text style={[styles.sensitivityText,
                isStrict ? styles.sensitivityTextStrict : styles.sensitivityTextNormal]}>
                {isStrict ? t('profileUi.strictMode') : t('profileUi.normalMode')}
              </Text>
            </View>
          </View>
          <Text style={styles.cardDesc}>
            {isStrict
              ? t('multiProfileDetail.strictDesc')
              : t('multiProfileDetail.normalDesc')}
          </Text>
        </View>

        {/* ── Allergy card ─────────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{t('profileUi.myAllergy')}</Text>
          {profile.allergyProfile.length === 0 ? (
            <Text style={styles.emptyText}>{t('profileUi.noAllergensSet')}</Text>
          ) : (
            <View style={styles.chips}>
              {profile.allergyProfile.map(item => (
                <View key={item} style={styles.chip}>
                  <Text style={styles.chipText}>{getAllergenDisplay(item).name}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Dietary card ─────────────────────────────────────────────────── */}
        {profile.dietaryRestrictions.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>{t('profileUi.dietPreference')}</Text>
            <View style={styles.chips}>
              {profile.dietaryRestrictions.map(item => (
                <View key={item} style={[styles.chip, styles.chipDiet]}>
                  <Text style={styles.chipText}>{item.replace(/_/g, ' ')}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

      </ScrollView>

      {/* ── Set active button ─────────────────────────────────────────────── */}
      {!isActive && (
        <TouchableOpacity
          style={[styles.switchBtn, { marginBottom: insets.bottom + 12 }]}
          onPress={handleSwitch}
          activeOpacity={0.8}
        >
          <Text style={styles.switchBtnText}>{t('profileUi.setActiveProfile')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: BG },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: 24, gap: 12 },

  // ── Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 12,
  },
  backBtn:     { width: 36, height: 36, justifyContent: 'center' },
  backArrow:   { fontSize: 32, color: DARK_GREEN, fontWeight: '300', lineHeight: 34 },
  headerTitle: { fontSize: 16, fontWeight: '500', color: DARK_GREEN, letterSpacing: -0.3 },
  mainLabel:   { fontSize: 13, fontWeight: '600', color: MID_GREEN, width: 48, textAlign: 'right' },
  deleteLabel: { fontSize: 13, fontWeight: '600', color: STRICT_CLR, width: 48, textAlign: 'right' },

  // ── Hero
  heroSection: { alignItems: 'center', paddingVertical: 20, gap: 10 },
  avatarWrap:  { position: 'relative' },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: MID_GREEN, alignItems: 'center', justifyContent: 'center',
  },
  avatarImg:   { width: 80, height: 80, borderRadius: 40 },
  avatarText:  { fontSize: 32, fontWeight: '800', color: '#FFFFFF' },
  cameraBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: BG, borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  profileName: { fontSize: 20, fontWeight: '700', color: DARK_GREEN, textAlign: 'center' },
  nameInput: {
    fontSize: 20, fontWeight: '700', color: DARK_GREEN, textAlign: 'center',
    borderBottomWidth: 1.5, borderBottomColor: DARK_GREEN,
    minWidth: 120, padding: 0, margin: 0, includeFontPadding: false,
  },
  saveNameBtn: {
    backgroundColor: DARK_GREEN, borderRadius: 20,
    paddingVertical: 6, paddingHorizontal: 20, marginTop: 2,
  },
  saveNameBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  activeBadge: {
    backgroundColor: DARK_GREEN, borderRadius: 100,
    paddingVertical: 4, paddingHorizontal: 14,
  },
  activeBadgeText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },

  // ── Cards
  card: {
    backgroundColor: BG, borderWidth: 1, borderColor: BORDER,
    borderRadius: 15, padding: 18, gap: 10,
  },
  cardRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLabel: { fontSize: 16, fontWeight: '600', color: DARK_GREEN },
  cardDesc:  { fontSize: 12, color: MID_GREEN, lineHeight: 18 },

  // ── Sensitivity badge
  sensitivityBadge: { borderWidth: 1, borderRadius: 20, paddingVertical: 3, paddingHorizontal: 14 },
  sensitivityStrict: { backgroundColor: STRICT_BG, borderColor: STRICT_CLR },
  sensitivityNormal: { backgroundColor: CARD_FILL, borderColor: BORDER },
  sensitivityText:   { fontSize: 13, fontWeight: '500' },
  sensitivityTextStrict: { color: STRICT_CLR },
  sensitivityTextNormal: { color: MID_GREEN },

  // ── Chips
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: CARD_FILL, borderWidth: 1, borderColor: BORDER,
    borderRadius: 20, paddingVertical: 3, paddingHorizontal: 14,
  },
  chipDiet: { borderColor: MID_GREEN },
  chipText: { fontSize: 12, color: MID_GREEN },
  emptyText: { fontSize: 13, color: BORDER },

  // ── Bottom
  switchBtn: {
    backgroundColor: DARK_GREEN, borderRadius: 100,
    paddingVertical: 18, alignItems: 'center',
    marginHorizontal: 24, marginTop: 8,
  },
  switchBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

  notFound: { fontSize: 15, color: MID_GREEN, textAlign: 'center', marginTop: 60 },
});
