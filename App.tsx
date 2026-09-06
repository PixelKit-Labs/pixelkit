/**
 * @file App.tsx
 * @description Primary application container for PixelForge.
 * Hosts the top branding bar, native-module status indicator, 4-tab screen switcher,
 * and bottom floating navigation pill bar. Edge-to-edge safe: insets come from
 * react-native-safe-area-context (React Native's built-in SafeAreaView is iOS-only).
 */

import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { AILabScreen } from './src/screens/AILabScreen';
import { SensorsLabScreen } from './src/screens/SensorsLabScreen';
import { DocsScreen } from './src/screens/DocsScreen';
import { HapticButton } from './src/components/HapticButton';
import { Colors } from './src/theme/colors';
import { isPixelNativeAvailable } from './modules/pixel-native';

type Tab = 'dashboard' | 'ai' | 'sensors' | 'docs';

const TABS: { key: Tab; title: string }[] = [
  { key: 'dashboard', title: 'Silicon' },
  { key: 'ai', title: 'AI Lab' },
  { key: 'sensors', title: 'Sensors' },
  { key: 'docs', title: 'Docs' },
];

function Shell() {
  const [currentTab, setCurrentTab] = useState<Tab>('dashboard');
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Top Header Bar (padded below the status bar / camera cutout) */}
      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <View style={styles.brandingRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>⚡</Text>
          </View>
          <View>
            <Text style={styles.appName}>PixelForge</Text>
            <Text style={styles.appTagline}>Hardware & AI Framework</Text>
          </View>
        </View>

        <View style={[styles.statusPill, !isPixelNativeAvailable && styles.statusPillWarn]}>
          <Text style={[styles.statusPillText, !isPixelNativeAvailable && styles.statusPillTextWarn]}>
            {isPixelNativeAvailable ? 'NATIVE LIVE' : 'JS ONLY'}
          </Text>
        </View>
      </View>

      {/* Main Screen Container */}
      <View style={styles.screenContainer}>
        {currentTab === 'dashboard' && <DashboardScreen />}
        {currentTab === 'ai' && <AILabScreen />}
        {currentTab === 'sensors' && <SensorsLabScreen />}
        {currentTab === 'docs' && <DocsScreen />}
      </View>

      {/* Bottom Floating Navigation Pill Bar (padded above the gesture bar) */}
      <View style={[styles.navBarWrapper, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <View style={styles.navBar}>
          {TABS.map(t => (
            <HapticButton
              key={t.key}
              title={t.title}
              onPress={() => setCurrentTab(t.key)}
              hapticType="selection"
              variant={currentTab === t.key ? 'primary' : 'outline'}
              style={styles.navButton}
              textStyle={{ fontSize: 12 }}
            />
          ))}
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.cardBorder,
    backgroundColor: Colors.dark.surface,
  },
  brandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  logoBadgeText: {
    fontSize: 18,
  },
  appName: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  appTagline: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  statusPill: {
    backgroundColor: `${Colors.dark.tensorGlow}20`,
    borderColor: Colors.dark.tensorGlow,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillWarn: {
    backgroundColor: `${Colors.dark.warning}20`,
    borderColor: Colors.dark.warning,
  },
  statusPillText: {
    color: Colors.dark.tensorGlow,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusPillTextWarn: {
    color: Colors.dark.warning,
  },
  screenContainer: {
    flex: 1,
  },
  navBarWrapper: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: Colors.dark.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.cardBorder,
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.card,
    borderRadius: 30,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  navButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginHorizontal: 2,
    borderRadius: 24,
  },
});
