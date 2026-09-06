import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { AILabScreen } from './src/screens/AILabScreen';
import { SensorsLabScreen } from './src/screens/SensorsLabScreen';
import { HapticButton } from './src/components/HapticButton';
import { Colors } from './src/theme/colors';

type Tab = 'dashboard' | 'ai' | 'sensors';

export default function App() {
  const [currentTab, setCurrentTab] = useState<Tab>('dashboard');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandingRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>⚡</Text>
          </View>
          <View>
            <Text style={styles.appName}>PixelForge</Text>
            <Text style={styles.appTagline}>Hardware & AI Framework</Text>
          </View>
        </View>

        <View style={styles.statusPill}>
          <Text style={styles.statusPillText}>TPU READY</Text>
        </View>
      </View>

      {/* Main Screen Container */}
      <View style={styles.screenContainer}>
        {currentTab === 'dashboard' && <DashboardScreen />}
        {currentTab === 'ai' && <AILabScreen />}
        {currentTab === 'sensors' && <SensorsLabScreen />}
      </View>

      {/* Bottom Floating Navigation Pill Bar */}
      <View style={styles.navBarWrapper}>
        <View style={styles.navBar}>
          <HapticButton
            title="Silicon HUD"
            onPress={() => setCurrentTab('dashboard')}
            variant={currentTab === 'dashboard' ? 'primary' : 'outline'}
            style={styles.navButton}
            textStyle={{ fontSize: 13 }}
          />
          <HapticButton
            title="AI Lab"
            onPress={() => setCurrentTab('ai')}
            variant={currentTab === 'ai' ? 'primary' : 'outline'}
            style={styles.navButton}
            textStyle={{ fontSize: 13 }}
          />
          <HapticButton
            title="Sensors"
            onPress={() => setCurrentTab('sensors')}
            variant={currentTab === 'sensors' ? 'primary' : 'outline'}
            style={styles.navButton}
            textStyle={{ fontSize: 13 }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
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
  statusPillText: {
    color: Colors.dark.tensorGlow,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  screenContainer: {
    flex: 1,
  },
  navBarWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 10,
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
