import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/colors';

export default function FilterTuneIcon({ active = false }: { active?: boolean }) {
  const color = active ? Colors.white : Colors.searchDarkGreen;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={[styles.line, { backgroundColor: color }]} />
        <View style={[styles.knob, styles.knobLeft, { borderColor: color, backgroundColor: Colors.searchBackground }]} />
      </View>
      <View style={styles.row}>
        <View style={[styles.line, { backgroundColor: color }]} />
        <View style={[styles.knob, styles.knobRight, { borderColor: color, backgroundColor: Colors.searchBackground }]} />
      </View>
      <View style={styles.row}>
        <View style={[styles.line, { backgroundColor: color }]} />
        <View style={[styles.knob, styles.knobCenter, { borderColor: color, backgroundColor: Colors.searchBackground }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 22,
    height: 18,
    justifyContent: 'space-between',
  },
  row: {
    height: 4,
    justifyContent: 'center',
  },
  line: {
    height: 1.5,
    borderRadius: 1,
  },
  knob: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1.2,
  },
  knobLeft: {
    left: 3,
  },
  knobRight: {
    right: 3,
  },
  knobCenter: {
    left: 8,
  },
});
