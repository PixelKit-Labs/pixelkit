/**
 * @file AILabScreen.tsx
 * @description Multimodal AI and Computer Vision test laboratory.
 * Features live Gemini 2.5 conversational chat, camera image capture with vision analysis,
 * TPU token throughput telemetry, and Titan M2 encrypted API key persistence.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useGemini } from '../ai/useGemini';
import { useVisionAI } from '../ai/useVisionAI';
import { useTPU } from '../ai/useTPU';
import { saveApiKey } from '../ai/geminiClient';
import { HapticButton } from '../components/HapticButton';
import { MetricCard } from '../components/MetricCard';
import { Colors } from '../theme/colors';

export const AILabScreen: React.FC = () => {
  const gemini = useGemini();
  const vision = useVisionAI();
  const tpu = useTPU();

  const [inputPrompt, setInputPrompt] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [keySavedMessage, setKeySavedMessage] = useState<string | null>(null);

  const handleSend = () => {
    if (!inputPrompt.trim() || gemini.isLoading) return;
    const prompt = inputPrompt;
    setInputPrompt('');
    gemini.sendMessage(prompt);
  };

  const handleSaveKey = async () => {
    if (!apiKeyInput.trim()) return;
    const success = await saveApiKey(apiKeyInput.trim());
    if (success) {
      gemini.setApiKey(apiKeyInput.trim());
      setKeySavedMessage('API Key securely stored in Titan M2 KeyStore.');
      setShowKeyInput(false);
      setApiKeyInput('');
      setTimeout(() => setKeySavedMessage(null), 3500);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header & Accelerator Status */}
        <View style={styles.header}>
          <Text style={styles.title}>Pixel AI & Vision Lab</Text>
          <Text style={styles.subtitle}>Powered by Google Gemini & Tensor TPU</Text>
        </View>

        {keySavedMessage && (
          <View style={styles.alertSuccess}>
            <Text style={styles.alertSuccessText}>{keySavedMessage}</Text>
          </View>
        )}

        {/* TPU Accelerator Quick Status */}
        <MetricCard
          title="On-Device Neural Engine"
          value={tpu.activeDelegate}
          subtitle={`Latency: ${tpu.lastInferenceLatencyMs} ms • ~${tpu.throughputTokensPerSec} tokens/sec`}
          badge={gemini.hasApiKey ? "Cloud + TPU Linked" : "Edge TPU Mode"}
          badgeColor={gemini.hasApiKey ? Colors.dark.success : Colors.dark.tensorGlow}
        />

        {/* API Key Configuration Toggle */}
        <HapticButton
          title={showKeyInput ? "Close Settings" : (gemini.hasApiKey ? "Change Gemini API Key" : "Configure Gemini API Key")}
          onPress={() => setShowKeyInput(!showKeyInput)}
          variant="outline"
          style={styles.keyButton}
        />

        {showKeyInput && (
          <View style={styles.keyContainer}>
            <Text style={styles.keyLabel}>Google Gemini API Key:</Text>
            <TextInput
              style={styles.keyTextInput}
              placeholder="Paste AIzaSy... key"
              placeholderTextColor={Colors.dark.textMuted}
              value={apiKeyInput}
              onChangeText={setApiKeyInput}
              autoCapitalize="none"
              secureTextEntry
            />
            <HapticButton
              title="Save Key to Titan M2"
              onPress={handleSaveKey}
              variant="primary"
              style={{ marginTop: 8 }}
            />
          </View>
        )}

        {/* Vision AI Camera Section */}
        <Text style={styles.sectionHeader}>Multimodal Vision Analysis</Text>
        <View style={styles.visionCard}>
          <Text style={styles.visionDesc}>
            Take a photo with the Pixel camera to analyze scenes, read text, or inspect objects.
          </Text>

          <View style={styles.visionButtons}>
            <HapticButton
              title="Capture Photo"
              onPress={() => vision.captureAndAnalyze(true)}
              disabled={vision.isAnalyzing}
              variant="primary"
              style={{ flex: 1, marginRight: 6 }}
            />
            <HapticButton
              title="Pick Photo"
              onPress={() => vision.captureAndAnalyze(false)}
              disabled={vision.isAnalyzing}
              variant="secondary"
              style={{ flex: 1, marginLeft: 6 }}
            />
          </View>

          {vision.isAnalyzing && (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={Colors.dark.primary} />
              <Text style={styles.loadingText}>Processing through Tensor Vision Pipeline...</Text>
            </View>
          )}

          {vision.selectedImageUri && (
            <Image source={{ uri: vision.selectedImageUri }} style={styles.previewImage} />
          )}

          {vision.analysis && (
            <View style={styles.analysisBox}>
              <Text style={styles.analysisText}>{vision.analysis.description}</Text>
              <View style={styles.labelsRow}>
                {vision.analysis.labels.map((label, idx) => (
                  <View key={idx} style={styles.labelChip}>
                    <Text style={styles.labelChipText}>{label}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.latencyFooter}>
                Latency: {vision.analysis.latencyMs} ms
              </Text>
            </View>
          )}
        </View>

        {/* Conversational AI Chat Stream */}
        <Text style={styles.sectionHeader}>Conversational AI Engine</Text>
        <View style={styles.chatContainer}>
          {gemini.messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                msg.role === 'user' ? styles.userBubble : styles.modelBubble,
              ]}
            >
              <Text style={styles.messageRole}>
                {msg.role === 'user' ? 'YOU' : 'PIXELFORGE AI'}
              </Text>
              <Text style={styles.messageContent}>{msg.content}</Text>
              {msg.latencyMs !== undefined && (
                <Text style={styles.messageLatency}>
                  {msg.latencyMs} ms {msg.tokenCount ? `• ${msg.tokenCount} tokens` : ''}
                </Text>
              )}
            </View>
          ))}

          {gemini.isLoading && (
            <View style={styles.loadingBubble}>
              <ActivityIndicator size="small" color={Colors.dark.primary} />
              <Text style={styles.thinkingText}>Thinking...</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Ask or command the AI..."
          placeholderTextColor={Colors.dark.textMuted}
          value={inputPrompt}
          onChangeText={setInputPrompt}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <HapticButton
          title="Send"
          onPress={handleSend}
          disabled={gemini.isLoading || !inputPrompt.trim()}
          variant="primary"
          style={styles.sendButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: Colors.dark.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  sectionHeader: {
    color: Colors.dark.primary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 18,
    marginBottom: 10,
    marginLeft: 4,
  },
  keyButton: {
    marginBottom: 12,
  },
  keyContainer: {
    backgroundColor: Colors.dark.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    marginBottom: 16,
  },
  keyLabel: {
    color: Colors.dark.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  keyTextInput: {
    backgroundColor: Colors.dark.card,
    color: Colors.dark.text,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  alertSuccess: {
    backgroundColor: '#0F3E22',
    borderColor: Colors.dark.success,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  alertSuccessText: {
    color: Colors.dark.success,
    fontSize: 13,
    fontWeight: '600',
  },
  visionCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    padding: 16,
    marginBottom: 16,
  },
  visionDesc: {
    color: Colors.dark.textMuted,
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  visionButtons: {
    flexDirection: 'row',
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginTop: 12,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  loadingText: {
    color: Colors.dark.primary,
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '500',
  },
  analysisBox: {
    backgroundColor: Colors.dark.surfaceVariant,
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  analysisText: {
    color: Colors.dark.text,
    fontSize: 13,
    lineHeight: 19,
  },
  labelsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  labelChip: {
    backgroundColor: Colors.dark.card,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginTop: 4,
  },
  labelChipText: {
    color: Colors.dark.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  latencyFooter: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    marginTop: 8,
    textAlign: 'right',
  },
  chatContainer: {
    marginBottom: 12,
  },
  messageBubble: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    maxWidth: '90%',
  },
  userBubble: {
    backgroundColor: Colors.dark.primaryContainer,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  modelBubble: {
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageRole: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.dark.textMuted,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  messageContent: {
    color: Colors.dark.text,
    fontSize: 14,
    lineHeight: 20,
  },
  messageLatency: {
    color: Colors.dark.textMuted,
    fontSize: 10,
    marginTop: 6,
    textAlign: 'right',
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    padding: 12,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  thinkingText: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: Colors.dark.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.cardBorder,
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    color: Colors.dark.text,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  sendButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
});
