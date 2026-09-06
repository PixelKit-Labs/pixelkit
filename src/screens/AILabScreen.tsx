/**
 * @file AILabScreen.tsx
 * @description Multimodal AI, voice, and vision laboratory. Cloud Gemini (chat, vision, transcription)
 * runs only with a configured API key; there is no simulated reply. Gemini Nano runs on-device through
 * the PixelNano module (ML Kit GenAI Prompt API on AICore); the conversation can target either engine.
 * The stack card reports what is verifiably installed (AICore, Private Compute Services, NPU flag).
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
import { useSpeechAI } from '../ai/useSpeechAI';
import { useTPU } from '../ai/useTPU';
import { useGeminiNano } from '../ai/useGeminiNano';
import { useHiLight } from '../hardware/useHiLight';
import { useHaptics, HapticEnvelopes } from '../hardware/useHaptics';
import { useCapabilities } from '../hardware/useCapabilities';
import { saveApiKey } from '../ai/geminiClient';
import { HapticButton } from '../components/HapticButton';
import { MetricCard } from '../components/MetricCard';
import { Colors, Type } from '../theme/colors';
import { SectionHeader } from '../components/Decor';

export const AILabScreen: React.FC = () => {
  const gemini = useGemini();
  const vision = useVisionAI();
  const speech = useSpeechAI();
  const tpu = useTPU();
  const nano = useGeminiNano();
  const hilight = useHiLight();
  const haptics = useHaptics();
  const caps = useCapabilities();

  /** Which model answers the conversation: cloud gemini-3.8-flash or on-device Gemini Nano. */
  const [engine, setEngine] = useState<'cloud' | 'nano'>('cloud');
  const activeMessages = engine === 'nano' ? nano.messages : gemini.messages;
  const isBusy = engine === 'nano' ? nano.isGenerating : gemini.isLoading;
  const ask = (prompt: string) => (engine === 'nano' ? nano.sendMessage(prompt) : gemini.sendMessage(prompt));

  const [inputPrompt, setInputPrompt] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [keySavedMessage, setKeySavedMessage] = useState<string | null>(null);

  const signalThinking = () => {
    hilight.triggerGeminiPulse(4500);
    haptics.playEnvelope(HapticEnvelopes.thinkingRamp);
  };

  const handleSend = () => {
    if (!inputPrompt.trim() || isBusy) return;
    const prompt = inputPrompt;
    setInputPrompt('');
    signalThinking();
    void ask(prompt);
  };

  const handleVoiceToggle = async () => {
    if (speech.isListening) {
      const result = await speech.stopListeningAndTranscribe();
      if (result?.transcript) {
        setInputPrompt(result.transcript);
        signalThinking();
        void ask(result.transcript);
      }
    } else {
      await speech.startListening();
    }
  };

  const handleSaveKey = async () => {
    if (!apiKeyInput.trim()) return;
    const success = await saveApiKey(apiKeyInput.trim());
    if (success) {
      gemini.setApiKey(apiKeyInput.trim());
      setKeySavedMessage('API key stored in SecureStore (hardware-backed keystore).');
      setShowKeyInput(false);
      setApiKeyInput('');
      setTimeout(() => setKeySavedMessage(null), 3500);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Pixel AI & Vision Lab</Text>
          <Text style={styles.subtitle}>Cloud {gemini.model} · Gemini Nano {nano.status}{tpu.aicoreInstalled ? ` · AICore ${tpu.aicoreVersion?.split('_')[2] ?? ''}` : ' · AICore not installed'}</Text>
        </View>

        {keySavedMessage && (
          <View style={styles.alertSuccess}><Text style={styles.alertSuccessText}>{keySavedMessage}</Text></View>
        )}

        <MetricCard
          title="On-device AI stack"
          value={tpu.aicoreInstalled ? 'AICore present' : 'AICore absent'}
          badge={caps.geminiNanoTier.toUpperCase()}
          badgeColor={tpu.aicoreInstalled ? Colors.dark.tensorGlow : Colors.dark.warning}
          subtitle={`AICore ${tpu.aicoreVersion ?? '—'} • PCS ${tpu.privateComputeServicesVersion ?? '—'} • NPU feature flag: ${tpu.hasNpuFeature == null ? '?' : tpu.hasNpuFeature ? 'yes' : 'no'}`}
          source={tpu.source}
        />

        <SectionHeader title="Gemini Nano (on-device, ML Kit Prompt API)" />
        <MetricCard
          title="Prompt API status"
          value={nano.status}
          badge={nano.info?.baseModelName ?? 'model —'}
          badgeColor={nano.isAvailable ? Colors.dark.success : Colors.dark.warning}
          subtitle={
            nano.info
              ? `token limit ${nano.info.tokenLimit ?? '—'} • system prompt ${nano.info.systemPromptAvailable == null ? '?' : nano.info.systemPromptAvailable ? 'yes' : 'no'} • thinking ${nano.info.thinkingModeAvailable == null ? '?' : nano.info.thinkingModeAvailable ? 'yes' : 'no'} • track ${nano.info.releaseStage}/${nano.info.preference}`
              : 'Status, model name and feature flags come from AICore once the module loads.'
          }
          source={nano.source}
        />
        <MetricCard
          title="Nano latency"
          value={nano.lastLatencyMs}
          unit="ms"
          badge={nano.lastFirstTokenMs != null ? `first token ${nano.lastFirstTokenMs} ms` : 'measured natively'}
          badgeColor={Colors.dark.primary}
          subtitle="Wall time of the last AICore call"
          source={nano.lastLatencyMs == null ? 'unavailable' : 'hardware'}
        />
        <MetricCard
          title="Decode rate"
          value={nano.lastDecodeTokensPerSec}
          unit="tok/s"
          badge={nano.lastOutputTokens != null ? `${nano.lastOutputTokens} tokens` : 'on-device tokenizer'}
          badgeColor={Colors.dark.primary}
          subtitle="Output tokens ÷ time after first token"
          source={nano.lastDecodeTokensPerSec == null ? 'unavailable' : 'derived'}
        />
        {nano.status === 'downloadable' && (
          <HapticButton
            title={nano.isDownloading ? `Downloading… ${nano.downloadedBytes != null ? `${(nano.downloadedBytes / 1e6).toFixed(0)} MB` : ''}` : 'Download Gemini Nano model'}
            onPress={() => { void nano.download(); }}
            disabled={nano.isDownloading}
            variant="primary"
            style={styles.keyButton}
          />
        )}
        {nano.isAvailable && (
          <HapticButton
            title={nano.isWarmingUp ? 'Warming up…' : nano.warmupMs != null ? `Warm up again (last ${nano.warmupMs} ms)` : 'Warm up model'}
            onPress={() => { void nano.warmup(); }}
            disabled={nano.isWarmingUp}
            variant="secondary"
            style={styles.keyButton}
          />
        )}
        {nano.error && <Text style={[styles.errorText, { marginBottom: 12 }]}>{nano.error}</Text>}
        {nano.source === 'unavailable' && (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>PixelNano module is not in this build. Gemini Nano needs the dev client or release APK on a Pixel with AICore.</Text>
          </View>
        )}

        <MetricCard
          title="CPU fallback matmul"
          value={tpu.cpuFallbackLatencyMs}
          unit="ms"
          badge="256×256 JS"
          badgeColor={Colors.dark.primary}
          subtitle="Real JS-thread compute; not TPU"
          source={tpu.cpuFallbackLatencyMs == null ? 'unavailable' : 'derived'}
        />
        <HapticButton
          title={tpu.isBenchmarking ? 'Running matmul…' : 'Run CPU fallback benchmark'}
          onPress={() => { void tpu.benchmarkTPU(); }}
          disabled={tpu.isBenchmarking}
          variant="secondary"
          style={styles.keyButton}
        />

        <HapticButton
          title={showKeyInput ? 'Close settings' : (gemini.hasApiKey ? 'Change Gemini API key' : 'Configure Gemini API key')}
          onPress={() => setShowKeyInput(!showKeyInput)}
          variant={gemini.hasApiKey ? 'outline' : 'primary'}
          style={styles.keyButton}
        />

        {showKeyInput && (
          <View style={styles.keyContainer}>
            <Text style={styles.keyLabel}>Google Gemini API key</Text>
            <TextInput
              style={styles.keyTextInput}
              placeholder="Paste AIzaSy… key"
              placeholderTextColor={Colors.dark.textMuted}
              value={apiKeyInput}
              onChangeText={setApiKeyInput}
              autoCapitalize="none"
              secureTextEntry
            />
            <HapticButton title="Save key to SecureStore" onPress={handleSaveKey} variant="primary" style={{ marginTop: 8 }} />
          </View>
        )}

        {!gemini.hasApiKey && (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>No API key. Chat, vision and transcription will return an error instead of a simulated answer.</Text>
          </View>
        )}

        <SectionHeader title="Voice → text (Gemini audio)" />
        <View style={styles.card}>
          <Text style={styles.cardDesc}>Records 16 kHz mono through the voice-recognition mic path, then transcribes with {speech.model}.</Text>
          <HapticButton
            title={speech.isListening ? `Listening… ${speech.voiceDecibels} dBFS (tap to finish)` : (speech.isTranscribing ? 'Transcribing…' : 'Start voice input')}
            onPress={handleVoiceToggle}
            disabled={speech.isTranscribing}
            variant={speech.isListening ? 'danger' : 'primary'}
            style={{ marginBottom: 10 }}
          />
          {speech.error && <Text style={styles.errorText}>{speech.error}</Text>}
          {speech.lastTranscript && (
            <View style={styles.transcriptBox}>
              <Text style={styles.transcriptLabel}>LAST TRANSCRIPT ({speech.lastTranscript.durationSeconds}s audio, {speech.lastTranscript.latencyMs} ms)</Text>
              <Text style={styles.transcriptText}>"{speech.lastTranscript.transcript || '(no speech detected)'}"</Text>
            </View>
          )}
        </View>

        <SectionHeader title="Vision (Gemini multimodal)" />
        <View style={styles.card}>
          <Text style={styles.cardDesc}>Capture or pick a photo; the description and labels come back as structured JSON from the model.</Text>
          <View style={styles.row}>
            <HapticButton title="Capture photo" onPress={() => vision.captureAndAnalyze(true)} disabled={vision.isAnalyzing} variant="primary" style={{ flex: 1, marginRight: 6 }} />
            <HapticButton title="Pick photo" onPress={() => vision.captureAndAnalyze(false)} disabled={vision.isAnalyzing} variant="secondary" style={{ flex: 1, marginLeft: 6 }} />
          </View>
          {vision.isAnalyzing && (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={Colors.dark.primary} />
              <Text style={styles.loadingText}>Analysing with {vision.model}…</Text>
            </View>
          )}
          {vision.error && <Text style={styles.errorText}>{vision.error}</Text>}
          {vision.selectedImageUri && <Image source={{ uri: vision.selectedImageUri }} style={styles.previewImage} />}
          {vision.analysis && (
            <View style={styles.analysisBox}>
              <Text style={styles.analysisText}>{vision.analysis.description}</Text>
              <View style={styles.labelsRow}>
                {vision.analysis.labels.map((label, idx) => (
                  <View key={idx} style={styles.labelChip}><Text style={styles.labelChipText}>{label}</Text></View>
                ))}
              </View>
              <Text style={styles.latencyFooter}>Latency {vision.analysis.latencyMs} ms</Text>
            </View>
          )}
        </View>

        <SectionHeader title="Conversation" />
        <View style={styles.engineRow}>
          <HapticButton
            title={`Cloud · ${gemini.model}`}
            onPress={() => setEngine('cloud')}
            variant={engine === 'cloud' ? 'primary' : 'outline'}
            style={{ flex: 1, marginRight: 6 }}
          />
          <HapticButton
            title={`On-device · Nano${nano.isAvailable ? '' : ` (${nano.status})`}`}
            onPress={() => setEngine('nano')}
            variant={engine === 'nano' ? 'primary' : 'outline'}
            style={{ flex: 1, marginLeft: 6 }}
          />
        </View>
        <View style={styles.chatContainer}>
          {activeMessages.length === 0 && (
            <Text style={styles.cardDesc}>
              {engine === 'nano'
                ? 'Ask something below. Replies come from Gemini Nano through AICore; latency and token counts are measured on this device.'
                : 'Ask something below. Replies are real Gemini responses with API-reported token counts.'}
            </Text>
          )}
          {activeMessages.map((msg) => (
            <View
              key={msg.id}
              style={[styles.messageBubble, msg.role === 'user' ? styles.userBubble : msg.role === 'system' ? styles.systemBubble : styles.modelBubble]}
            >
              <Text style={styles.messageRole}>{msg.role === 'user' ? 'YOU' : msg.role === 'system' ? 'ERROR' : engine === 'nano' ? 'NANO' : 'GEMINI'}</Text>
              <Text style={styles.messageContent}>{msg.content}</Text>
              {msg.latencyMs !== undefined && (
                <Text style={styles.messageLatency}>{msg.latencyMs} ms{msg.tokenCount ? ` • ${msg.tokenCount} tokens` : ''}</Text>
              )}
            </View>
          ))}
          {engine === 'nano' && nano.isGenerating && nano.partial.length > 0 && (
            <View style={[styles.messageBubble, styles.modelBubble]}>
              <Text style={styles.messageRole}>NANO · streaming</Text>
              <Text style={styles.messageContent}>{nano.partial}</Text>
            </View>
          )}
          {engine === 'nano' && nano.thoughts.length > 0 && (
            <View style={styles.transcriptBox}>
              <Text style={styles.transcriptLabel}>THOUGHTS ({nano.thoughts.length})</Text>
              <Text style={styles.transcriptText}>{nano.thoughts.join(' ')}</Text>
            </View>
          )}
          {isBusy && (
            <View style={styles.loadingBubble}>
              <ActivityIndicator size="small" color={Colors.dark.primary} />
              <Text style={styles.thinkingText}>{engine === 'nano' ? 'Gemini Nano generating…' : 'Thinking…'}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder={engine === 'nano' ? 'Ask Gemini Nano (on-device)…' : 'Ask Gemini…'}
          placeholderTextColor={Colors.dark.textMuted}
          value={inputPrompt}
          onChangeText={setInputPrompt}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <HapticButton
          title={speech.isListening ? '⏹' : '🎤'}
          onPress={handleVoiceToggle}
          variant={speech.isListening ? 'danger' : 'secondary'}
          style={styles.micButton}
          textStyle={{ fontSize: 16 }}
        />
        <HapticButton title="Send" onPress={handleSend} disabled={isBusy || !inputPrompt.trim()} variant="primary" style={styles.sendButton} />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  content: { padding: 16, paddingBottom: 24 },
  header: { marginBottom: 16 },
  title: { ...Type.title, color: Colors.dark.text },
  subtitle: { color: Colors.dark.textMuted, fontSize: 13, marginTop: 2 },
  row: { flexDirection: 'row' },
  keyButton: { marginBottom: 12 },
  keyContainer: {
    backgroundColor: Colors.dark.surface, padding: 16, borderRadius: 16, borderWidth: 1,
    borderColor: Colors.dark.cardBorder, marginBottom: 16,
  },
  keyLabel: { color: Colors.dark.text, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  keyTextInput: {
    backgroundColor: Colors.dark.card, color: Colors.dark.text, borderRadius: 10, padding: 12,
    fontSize: 14, borderWidth: 1, borderColor: Colors.dark.cardBorder,
  },
  alertSuccess: { backgroundColor: '#0F3E22', borderColor: Colors.dark.success, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 14 },
  alertSuccessText: { color: Colors.dark.success, fontSize: 13, fontWeight: '600' },
  notice: { backgroundColor: `${Colors.dark.warning}18`, borderColor: Colors.dark.warning, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  noticeText: { color: Colors.dark.warning, fontSize: 12, lineHeight: 17 },
  card: { backgroundColor: Colors.dark.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.dark.cardBorder, padding: 16, marginBottom: 16 },
  cardDesc: { color: Colors.dark.textMuted, fontSize: 13, marginBottom: 12, lineHeight: 18 },
  errorText: { color: Colors.dark.error, fontSize: 12, lineHeight: 17, marginTop: 4 },
  transcriptBox: { backgroundColor: Colors.dark.surfaceVariant, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.dark.cardBorder, marginTop: 8 },
  transcriptLabel: { color: Colors.dark.primary, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  transcriptText: { color: Colors.dark.text, fontSize: 13, fontStyle: 'italic', lineHeight: 18 },
  previewImage: { width: '100%', height: 180, borderRadius: 12, marginTop: 12 },
  loadingBox: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  loadingText: { color: Colors.dark.primary, marginLeft: 8, fontSize: 12, fontWeight: '500' },
  analysisBox: { backgroundColor: Colors.dark.surfaceVariant, padding: 12, borderRadius: 12, marginTop: 12 },
  analysisText: { color: Colors.dark.text, fontSize: 13, lineHeight: 19 },
  labelsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  labelChip: { backgroundColor: Colors.dark.card, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 6, marginTop: 4 },
  labelChipText: { color: Colors.dark.primary, fontSize: 11, fontWeight: '600' },
  latencyFooter: { color: Colors.dark.textMuted, fontSize: 11, marginTop: 8, textAlign: 'right' },
  engineRow: { flexDirection: 'row', marginBottom: 12 },
  chatContainer: { marginBottom: 12 },
  messageBubble: { borderRadius: 16, padding: 14, marginBottom: 10, maxWidth: '90%' },
  userBubble: { backgroundColor: Colors.dark.primaryContainer, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  modelBubble: { backgroundColor: Colors.dark.card, borderWidth: 1, borderColor: Colors.dark.cardBorder, alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  systemBubble: { backgroundColor: `${Colors.dark.error}18`, borderWidth: 1, borderColor: Colors.dark.error, alignSelf: 'stretch', maxWidth: '100%' },
  messageRole: { fontSize: 10, fontWeight: '700', color: Colors.dark.textMuted, marginBottom: 4, letterSpacing: 0.5 },
  messageContent: { color: Colors.dark.text, fontSize: 14, lineHeight: 20 },
  messageLatency: { color: Colors.dark.textMuted, fontSize: 10, marginTop: 6, textAlign: 'right' },
  loadingBubble: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.card, padding: 12, borderRadius: 16, alignSelf: 'flex-start' },
  thinkingText: { color: Colors.dark.textMuted, fontSize: 12, marginLeft: 8 },
  inputContainer: {
    flexDirection: 'row', padding: 12, paddingBottom: 96, backgroundColor: Colors.dark.surface, borderTopWidth: 1,
    borderTopColor: Colors.dark.cardBorder, alignItems: 'center',
  },
  textInput: {
    flex: 1, backgroundColor: Colors.dark.card, color: Colors.dark.text, borderRadius: 20, paddingHorizontal: 16,
    paddingVertical: 10, fontSize: 14, marginRight: 6, borderWidth: 1, borderColor: Colors.dark.cardBorder,
  },
  micButton: { paddingVertical: 10, paddingHorizontal: 12, marginRight: 6, borderRadius: 20 },
  sendButton: { paddingVertical: 10, paddingHorizontal: 18 },
});
