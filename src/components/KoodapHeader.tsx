import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, font } from '../theme';

interface Props {
  subtitle?: string;
}

export function KoodapHeader({ subtitle }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View>
          <Text style={styles.name}>Koodap</Text>
          <Text style={styles.tagline}>Life Log — Ur Companion</Text>
        </View>
      </View>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    gap: 4,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 0,
  },
  name: {
    color: colors.text,
    fontSize: font.xl,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tagline: {
    color: colors.accent,
    fontSize: font.xs,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: colors.textSub,
    fontSize: font.sm,
    marginTop: 2,
  },
});
