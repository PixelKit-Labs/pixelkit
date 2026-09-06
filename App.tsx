/**
 * @file App.tsx
 * @description Primary application container for PixelForge.
 * Deep-indigo shell with an ambient violet glow, brand mark, native-module status chip, 4-tab screen
 * switcher, and a floating glass navigation pill. Edge-to-edge safe: insets come from
 * react-native-safe-area-context (React Native's built-in SafeAreaView is iOS-only).
 */

import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { AILabScreen } from './src/screens/AILabScreen';
import { SensorsLabScreen } from './src/screens/SensorsLabScreen';
import { DocsScreen } from './src/screens/DocsScreen';
import { GlowBackdrop } from './src/components/Decor';
import { useHaptics } from './src/hardware/useHaptics';
import { Colors, Gradients, Radius, Type } from './src/theme/colors';
import { isPixelNativeAvailable } from './modules/pixel-native';

type Tab = 'dashboard' | 'ai' | 'sensors' | 'docs';

const TABS: { key: Tab; title: string; glyph: string }[] = [
  { key: 'dashboard', title: 'Silicon', glyph: '◈' },
  { key: 'ai', title: 'AI Lab', glyph: '✦' },
  { key: 'sensors', title: 'Sensors', glyph: '◎' },
  { key: 'docs', title: 'Docs', glyph: '≡' },
];

function Shell() {
  const [currentTab, setCurrentTab] = useState<Tab>('dashboard');
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const select = (t: Tab) => {
    if (t === currentTab) return;
    void haptics.selection();
    setCurrentTab(t);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <GlowBackdrop height={360} />

      {/* Header */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <View style={styles.brandingRow}>
          <LinearGradient colors={[...Gradients.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>⚡</Text>
          </LinearGradient>
          <View>
            <Text style={styles.appName}>PixelForge</Text>
            <Text style={styles.appTagline}>Hardware & AI framework</Text>
          </View>
        </View>

        <View style={[styles.statusPill, !isPixelNativeAvailable && styles.statusPillWarn]}>
          <View style={[styles.statusDot, { backgroundColor: isPixelNativeAvailable ? Colors.dark.success : Colors.dark.warning }]} />
          <Text style={[styles.statusPillText, !isPixelNativeAvailable && styles.statusPillTextWarn]}>
            {isPixelNativeAvailable ? 'Native live' : 'JS only'}
          </Text>
        </View>
      </View>

      {/* Screen */}
      <View style={styles.screenContainer}>
        {currentTab === 'dashboard' && <DashboardScreen />}
        {currentTab === 'ai' && <AILabScreen />}
        {currentTab === 'sensors' && <SensorsLabScreen />}
        {currentTab === 'docs' && <DocsScreen />}
      </View>

      {/* Floating glass nav */}
      <View style={[styles.navWrapper, { paddingBottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
        <View style={styles.navBar}>
          {TABS.map(t => {
            const active = currentTab === t.key;
            return (
              <Pressable key={t.key} onPress={() => select(t.key)} style={({ pressed }) => [styles.navItem, pressed && { opacity: 0.8 }]}>
                {active && (
                  <LinearGradient colors={[...Gradients.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                )}
                <Text style={[styles.navGlyph, active && styles.navGlyphActive]}>{t.glyph}</Text>
                <Text style={[styles.navText, active && styles.navTextActive]}>{t.title}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Shell />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  brandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoBadgeText: {
    fontSize: 18,
  },
  appName: {
    ...Type.heading,
    fontSize: 18,
    color: Colors.dark.text,
  },
  appTagline: {
    ...Type.caption,
    fontSize: 11,
    color: Colors.dark.textMuted,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  statusPillWarn: {
    borderColor: `${Colors.dark.warning}66`,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 7,
  },
  statusPillText: {
    ...Type.micro,
    fontSize: 11,
    color: Colors.dark.text,
  },
  statusPillTextWarn: {
    color: Colors.dark.warning,
  },
  screenContainer: {
    flex: 1,
  },
  navWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(14,11,28,0.92)',
    borderRadius: Radius.pill,
    padding: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  navGlyph: {
    fontSize: 14,
    color: Colors.dark.textMuted,
    marginBottom: 1,
  },
  navGlyphActive: {
    color: '#FFFFFF',
  },
  navText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.dark.textMuted,
  },
  navTextActive: {
    color: '#FFFFFF',
  },
});
