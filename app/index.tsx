
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Colors from '@/constants/colors';

console.log("INDEX START - FILE LOADED");

export default function IndexScreen() {
  console.log("INDEX START - COMPONENT RENDER");

  const c = Colors.dark;

  console.log("INDEX - RENDERING STATIC UI");

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Text style={{ color: c.text, fontSize: 24 }}>APP BOOTED SUCCESSFULLY</Text>
      <Text style={{ color: c.textSecondary, fontSize: 16, marginTop: 10 }}>Import chain working - no crashes detected</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});