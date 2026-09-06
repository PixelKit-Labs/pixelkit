/**
 * @file App.tsx
 * @description Application shell: fonts, scrims, wordmark header with a status chip, the four
 * screens, and the bottom navigation. Selection is an underline so labels never move.
 * Insets come from react-native-safe-area-context (React Native's SafeAreaView is iOS-only).
 */

import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Geist_400Regular, Geist_500Medium, Geist_600SemiBold, Geist_700Bold } from '@expo-google-fonts/geist';
import { GeistMono_400Regular, GeistMono_500Medium, GeistMono_600SemiBold } from '@expo-google-fonts/geist-mono';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { AILabScreen } from './src/screens/AILabScreen';
import { SensorsLabScreen } from './src/screens/SensorsLabScreen';
import { DocsScreen } from './src/screens/DocsScreen';
import { Scrims, Wordmark, StatChip } from './src/components/Decor';
import { useHaptics } from './src/hardware/useHaptics';
import { Colors, Fonts } from './src/theme/colors';
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
  const haptics = useHaptics();

  const select = (t: Tab) => {
    if (t === currentTab) return;
    void haptics.selection();
    setCurrentTab(t);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Scrims />

      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <Wordmark />
        <StatChip
          label={isPixelNativeAvailable ? 'native' : 'native'}
          value={isPixelNativeAvailable ? 'live' : 'off'}
          tone={isPixelNativeAvailable ? 'ok' : 'warn'}
          dot
        />
      </View>

      <View style={styles.screenContainer}>
        {currentTab === 'dashboard' && <DashboardScreen />}
        {currentTab === 'ai' && <AILabScreen />}
        {currentTab === 'sensors' && <SensorsLabScreen />}
        {currentTab === 'docs' && <DocsScreen />}
      </View>

      <View style={[styles.navWrapper, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <View style={styles.navBar}>
          {TABS.map(t => {
            const active = currentTab === t.key;
            return (
              <Pressable key={t.key} onPress={() => select(t.key)} accessibilityRole="tab" accessibilityState={{ selected: active }} style={styles.navItem}>
                <Text style={[styles.navText, active && styles.navTextActive]}>{t.title}</Text>
                <View style={[styles.navUnderline, active && styles.navUnderlineActive]} />
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function App() {
  useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
    GeistMono_400Regular,
    GeistMono_500Medium,
    GeistMono_600SemiBold,
  });
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
    paddingBottom: 10,
  },
  screenContainer: {
    flex: 1,
  },
  navWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(21,25,37,0.94)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    paddingHorizontal: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingTop: 6,
  },
  navText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.dark.textMuted,
  },
  navTextActive: {
    color: Colors.dark.text,
  },
  navUnderline: {
    marginTop: 6,
    height: 2,
    width: 22,
    borderRadius: 1,
    backgroundColor: 'transparent',
  },
  navUnderlineActive: {
    backgroundColor: Colors.dark.primary,
  },
});
