import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import Svg, { Path, Circle } from 'react-native-svg';
import { ProfileStackParamList } from '../../types';
import { useUserStore } from '../../store/user.store';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'PersonalName'>;

const BG         = '#F9FFF3';
const DARK_GREEN = '#1C3A19';
const MID_GREEN  = '#556C53';
const BORDER     = '#A9B6A8';

function CameraIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        stroke={DARK_GREEN} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      />
      <Circle cx={12} cy={13} r={4} stroke={DARK_GREEN} strokeWidth={2} />
    </Svg>
  );
}

function FieldRow({ label, value, noDivider }: { label: string; value: string; noDivider?: boolean }) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldValueRow}>
        <Text style={styles.fieldValueText}>{value || '—'}</Text>
      </View>
      {!noDivider && <View style={styles.fieldDivider} />}
    </View>
  );
}

export default function PersonalNameScreen() {
  const navigation         = useNavigation<Nav>();
  const insets             = useSafeAreaInsets();
  const { t }              = useTranslation();
  const currentUser        = useUserStore(s => s.currentUser);
  const updateActiveProfile = useUserStore(s => s.updateActiveProfile);

  const parts     = (currentUser.name ?? '').split(' ');
  const firstName = parts[0] ?? '';
  const lastName  = parts.slice(1).join(' ');
  const initial   = (currentUser.name || '?')[0].toUpperCase();

  const [photoUri, setPhotoUri] = useState<string | undefined>(currentUser.profileImage);

  async function handlePickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('profileUi.permissionRequired'), t('profileUi.photoPermissionMine'));
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
      updateActiveProfile({ profileImage: uri });
    }
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerSide}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Text style={styles.backBtn}>{'‹'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
        <View style={styles.headerSide} />
      </View>

      {/* ── Avatar ─────────────────────────────────────────────────────── */}
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={handlePickImage} activeOpacity={0.85}>
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

        <Text style={styles.displayName}>{currentUser.name || '—'}</Text>
      </View>

      {/* ── Personal Information ────────────────────────────────────────── */}
      <View style={styles.sectionPill}>
        <Text style={styles.sectionPillText}>{t('profileUi.personalInformation')}</Text>
      </View>

      <View style={styles.fieldsBlock}>
        <FieldRow label={t('personalName.firstName')} value={firstName} />
        <FieldRow label={t('personalName.lastName')}  value={lastName} />
        <FieldRow label={t('personalName.emailAddress')} value={currentUser.email || '—'} noDivider />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: BG },
  content: { paddingHorizontal: 26, gap: 18 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 4,
  },
  headerSide:  { flex: 1 },
  backBtn:     { fontSize: 32, lineHeight: 34, color: DARK_GREEN, fontWeight: '300' },
  headerTitle: { fontSize: 16, fontWeight: '500', color: DARK_GREEN, letterSpacing: -0.3, textAlign: 'center' },

  avatarSection: { alignItems: 'center', gap: 12 },
  avatarWrap:    { position: 'relative' },
  avatarCircle: {
    width: 94, height: 94, borderRadius: 47,
    backgroundColor: MID_GREEN, alignItems: 'center', justifyContent: 'center',
  },
  avatarImg:  { width: 94, height: 94, borderRadius: 47 },
  avatarText: { fontSize: 40, fontWeight: '800', color: '#FFFFFF', lineHeight: 46 },
  cameraBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 25, height: 25, borderRadius: 13,
    backgroundColor: BG, borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  displayName: {
    fontSize: 20, fontWeight: '700', color: '#000000',
    textAlign: 'center', lineHeight: 32,
  },

  sectionPill: {
    alignSelf: 'flex-start', borderWidth: 1, borderColor: DARK_GREEN,
    borderRadius: 10, paddingVertical: 5, paddingHorizontal: 17,
  },
  sectionPillText: { fontSize: 12, fontWeight: '800', color: DARK_GREEN },

  fieldsBlock: { gap: 0 },
  fieldLabel: {
    fontSize: 10, fontWeight: '500', color: MID_GREEN,
    lineHeight: 20, marginTop: 8,
  },
  fieldValueRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingBottom: 4,
  },
  fieldValueText: {
    flex: 1, fontSize: 13, fontWeight: '500',
    color: '#000000', paddingVertical: 4,
  },
  fieldDivider: { height: 1, backgroundColor: BORDER, marginBottom: 4 },
});
