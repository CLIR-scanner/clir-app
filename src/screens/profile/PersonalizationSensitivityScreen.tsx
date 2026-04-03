import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList, SensitivityLevel } from '../../types';
import { useUserStore } from '../../store/user.store';
import { Colors } from '../../constants/colors';
import { Strings } from '../../constants/strings';

type Props = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'PersonalizationSensitivity'>;
};

type Option = {
  value: SensitivityLevel;
  label: string;
  desc: string;
  emoji: string;
};

const OPTIONS: Option[] = [
  {
    value: 'strict',
    label: Strings.sensitivityStrict,
    desc: Strings.sensitivityStrictDesc,
    emoji: '🛡️',
  },
  {
    value: 'normal',
    label: Strings.sensitivityNormal,
    desc: Strings.sensitivityNormalDesc,
    emoji: '✅',
  },
];

export default function PersonalizationSensitivityScreen({ navigation }: Props) {
  const sensitivityLevel = useUserStore(s => s.activeProfile.sensitivityLevel);
  const updateActiveProfile = useUserStore(s => s.updateActiveProfile);

  const select = (value: SensitivityLevel) => {
    updateActiveProfile({ sensitivityLevel: value });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{Strings.sensitivityTitle}</Text>
        <View style={{ width: 52 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>
          may contain(혼입 가능) 성분을 어떻게 처리할지 선택하세요.
        </Text>

        <View style={styles.optionList}>
          {OPTIONS.map((opt, idx) => {
            const selected = sensitivityLevel === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.optionCard,
                  idx < OPTIONS.length - 1 && styles.optionCardBorder,
                  selected && styles.optionCardSelected,
                ]}
                onPress={() => select(opt.value)}
                activeOpacity={0.7}>
                <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                <View style={styles.optionInfo}>
                  <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.optionDesc}>{opt.desc}</Text>
                </View>
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>💡 엄격 모드란?</Text>
          <Text style={styles.infoText}>
            동일 시설에서 가공된 식품의 알러겐 흔적까지 감지해 경고합니다.{'\n'}
            심한 알러지가 있는 분들께 권장합니다.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  backBtn: { width: 52 },
  backText: { fontSize: 17, color: Colors.primary },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.text },

  content: { padding: 16 },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },

  optionList: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  optionCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  optionCardSelected: { backgroundColor: '#F0F8FF' },

  optionEmoji: { fontSize: 28, width: 36, textAlign: 'center' },
  optionInfo: { flex: 1 },
  optionLabel: { fontSize: 17, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  optionLabelSelected: { color: Colors.primary },
  optionDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.separator,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: Colors.primary },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },

  infoBox: {
    backgroundColor: Colors.cautionBg,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  infoTitle: { fontSize: 14, fontWeight: '600', color: Colors.caution },
  infoText: { fontSize: 13, color: Colors.text, lineHeight: 20 },
});
