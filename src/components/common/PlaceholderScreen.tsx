import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/colors';

interface Props {
  name: string;
}

export default function PlaceholderScreen({ name }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{name}</Text>
      <Text style={styles.sub}>{t('common.empty')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray900,
  },
  sub: {
    fontSize: 13,
    color: Colors.gray500,
    marginTop: 8,
  },
});
