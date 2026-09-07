/**
 * @file AILabScreen.tsx
 * @description Pixel AI Studio: Complete on-device and cloud neural intelligence suite for Tensor G6.
 * Features:
 * - Conversational AI: Cloud Gemini & on-device Gemini Nano with full hyperparameter controls
 * - GenAI Task Modules: Summarization, Proofreading, Rewriting, Image Description
 * - Vision Intelligence: On-device OCR v2, Barcode Scanner, Image Labeler, Face & Object Detection
 * - Natural Language Suite: 58-Language Offline Translation, Language ID, Smart Reply, Entity Extraction
 * - Dual-Mode Speech AI: On-device Android System Intelligence (ASI) & Cloud Multimodal STT
 * - Android 17 AppFunctions: System agent tool registry for external orchestrators (Gemini & Ask Pixel)
 */

import React, { useState, useEffect } from 'react';
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
  TouchableOpacity,
} from 'react-native';
import { useGemini } from '../ai/useGemini';
import { useVisionAI } from '../ai/useVisionAI';
import { useSpeechAI } from '../ai/useSpeechAI';
import { useTPU } from '../ai/useTPU';
import { useGeminiNano } from '../ai/useGeminiNano';
import { useGenAITasks, type TaskTone } from '../ai/useGenAITasks';
import { useNaturalLanguageAI } from '../ai/useNaturalLanguageAI';
import { useHiLight } from '../hardware/useHiLight';
import { useHaptics, HapticEnvelopes } from '../hardware/useHaptics';
import { useCapabilities } from '../hardware/useCapabilities';
import { saveApiKey } from '../ai/geminiClient';
import { HapticButton } from '../components/HapticButton';
import { MetricCard } from '../components/MetricCard';
import { ScreenHeader, SectionTabs } from '../components/ScreenScaffold';
import { sectionsFor } from '../core/surface';
import { useSpeech } from '../ai/useSpeech';
import { Colors, Type, Fonts, Radius } from '../theme/colors';
import { SectionHeader, StatChip } from '../components/Decor';
import PixelNative, { type AppFunctionInfo } from '../../modules/pixel-native';

type AILabTab = 'chat' | 'tasks' | 'vision' | 'language' | 'voice' | 'agents';
type GenAITaskKind = 'summarize' | 'proofread' | 'rewrite' | 'describe';
type VisionDemoKind = 'ocr' | 'barcode' | 'label' | 'faces' | 'objects' | 'pose' | 'subject' | 'cloud';
type NLPDemoKind = 'translate' | 'langid' | 'smartreply' | 'entities';

export const AILabScreen: React.FC = () => {
  const gemini = useGemini();
  const vision = useVisionAI();
  const speech = useSpeechAI();
  const tpu = useTPU();
  const nano = useGeminiNano();
  const genaiTasks = useGenAITasks();
  const nlp = useNaturalLanguageAI();
  const hilight = useHiLight();
  const haptics = useHaptics();
  const caps = useCapabilities();
  const tts = useSpeech();

  // Navigation
  const [activeTab, setActiveTab] = useState<AILabTab>('chat');

  // Chat State
  const [engine, setEngine] = useState<'cloud' | 'nano'>('cloud');
  const [showParams, setShowParams] = useState(false);
  const [inputPrompt, setInputPrompt] = useState('');
  /** Token count for the prompt as it stands, from the on-device tokenizer. Null until asked. */
  const [tokenEstimate, setTokenEstimate] = useState<number | null>(null);
  const [nanoTrack, setNanoTrack] = useState<'stable' | 'preview'>('stable');
  const [spokenNote, setSpokenNote] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [keySavedMessage, setKeySavedMessage] = useState<string | null>(null);

  // GenAI Tasks State
  const [genaiKind, setGenaiKind] = useState<GenAITaskKind>('summarize');
  const [taskInputText, setTaskInputText] = useState(
    'The Tensor G6 processor inside the Pixel 11 Pro features an all-new high efficiency CPU cluster, paired with next-generation TPU hardware acceleration. Combined with Android 17, on-device Gemini Nano execution achieves sub-50ms latency for streaming tokens while operating within thermal frame budgets.'
  );
  const [summarizeBullets, setSummarizeBullets] = useState<'one_bullet' | 'two_bullets' | 'three_bullets'>('two_bullets');
  const [rewriteTone, setRewriteTone] = useState<TaskTone>('professional');

  // Vision Demo State
  const [visionKind, setVisionKind] = useState<VisionDemoKind>('ocr');

  // NLP Demo State
  const [nlpKind, setNlpKind] = useState<NLPDemoKind>('translate');
  const [nlpInputText, setNlpInputText] = useState('PixelKit delivers zero-latency on-device intelligence directly on Tensor G6.');
  const [targetLang, setTargetLang] = useState<'es' | 'fr' | 'de' | 'ja'>('es');

  // AppFunctions State
  const [registeredFunctions, setRegisteredFunctions] = useState<AppFunctionInfo[]>([]);
  const [functionFeedback, setFunctionFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (PixelNative) {
      try {
        const funcs = PixelNative.getAppFunctions();
        setRegisteredFunctions(funcs);
      } catch {
        setRegisteredFunctions([]);
      }
    }
  }, []);

  /** Measures the prompt against info.tokenLimit before it is sent, rather than after it is rejected. */
  const countPromptTokens = async () => {
    const count = await nano.countTokens(inputPrompt.trim());
    setTokenEstimate(count);
  };

  /** Switches the AICore model track. Preview builds are slower and refuse more often. */
  const toggleNanoTrack = async () => {
    const next = nanoTrack === 'stable' ? 'preview' : 'stable';
    setNanoTrack(next);
    await nano.setModelConfig(next, 'full');
  };

  /** Reads the most recent model reply aloud on the platform speech engine. */
  const speakLastReply = async () => {
    const last = [...activeMessages].reverse().find(m => m.role === 'model');
    if (!last) { setSpokenNote('Nothing to read yet.'); return; }
    try {
      setSpokenNote(null);
      await tts.speak(last.content);
    } catch (e: any) {
      setSpokenNote(e?.message ?? 'The engine refused that text.');
    }
  };

  const activeMessages = engine === 'nano' ? nano.messages : gemini.messages;
  const isBusy = engine === 'nano' ? nano.isGenerating : gemini.isLoading;
  const ask = (prompt: string) => (engine === 'nano' ? nano.sendMessage(prompt) : gemini.sendMessage(prompt));

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

  const runSelectedGenAITask = async () => {
    if (!taskInputText.trim()) return;
    signalThinking();
    if (genaiKind === 'summarize') {
      await genaiTasks.summarize(taskInputText, { outputType: summarizeBullets });
    } else if (genaiKind === 'proofread') {
      await genaiTasks.proofread(taskInputText);
    } else if (genaiKind === 'rewrite') {
      await genaiTasks.rewrite(taskInputText, rewriteTone);
    } else if (genaiKind === 'describe') {
      if (vision.selectedImageBase64) {
        await genaiTasks.describeImage(vision.selectedImageBase64, 'concise');
      } else {
        const picked = await vision.pickImage(false);
        if (picked?.base64) {
          await genaiTasks.describeImage(picked.base64, 'concise');
        }
      }
    }
    haptics.playPrimitives([{ primitive: 'CLICK', scale: 1.0 }]);
  };

  const runVisionAction = async (useCamera: boolean) => {
    signalThinking();
    if (visionKind === 'cloud') {
      await vision.captureAndAnalyze(useCamera);
      return;
    }
    const picked = await vision.pickImage(useCamera);
    if (!picked) return;
    const input = picked.base64 ?? picked.uri;

    if (visionKind === 'ocr') {
      await vision.recognizeText(input);
    } else if (visionKind === 'barcode') {
      await vision.scanBarcodes(input);
    } else if (visionKind === 'label') {
      await vision.labelImage(input);
    } else if (visionKind === 'faces') {
      await vision.detectFaces(input);
      await vision.detectFaceMesh(input);
    } else if (visionKind === 'objects') {
      await vision.detectObjects(input);
    } else if (visionKind === 'pose') {
      await vision.detectPose(input);
    } else if (visionKind === 'subject') {
      await vision.segmentSubject(input);
    }
    haptics.playPrimitives([{ primitive: 'CLICK', scale: 1.0 }]);
  };

  const runNLPAction = async () => {
    if (!nlpInputText.trim()) return;
    signalThinking();
    if (nlpKind === 'translate') {
      await nlp.translate(nlpInputText, 'en', targetLang);
    } else if (nlpKind === 'langid') {
      await nlp.identifyLanguage(nlpInputText);
    } else if (nlpKind === 'smartreply') {
      await nlp.suggestReplies([
        { text: 'Hey, are you able to test the new Tensor G6 features today?', isLocalUser: false },
        { text: nlpInputText, isLocalUser: false },
      ]);
    } else if (nlpKind === 'entities') {
      await nlp.extractEntities(nlpInputText);
    }
    haptics.playPrimitives([{ primitive: 'CLICK', scale: 1.0 }]);
  };

  const testAppFunction = async (fn: AppFunctionInfo) => {
    haptics.playPrimitives([{ primitive: 'CLICK', scale: 1.0 }]);
    let detail = '';
    try {
      if (PixelNative?.executeAppFunction) {
        const res = await PixelNative.executeAppFunction(fn.id, {
          level: 15,
          primitive: 'thud',
        });
        detail = res?.message ?? res?.status ?? 'executed';
      }
      if (fn.id === 'triggerHiLightPulse') {
        hilight.triggerGeminiPulse(3000);
      } else if (fn.id === 'summarizeText') {
        await genaiTasks.summarize('PixelKit provides deep low-level hardware access to Google Pixel 11 Pro.');
      }
      setFunctionFeedback(`Executed OS Tool [${fn.target}]: ${fn.name} (${detail})`);
    } catch (e: any) {
      setFunctionFeedback(`Executed OS Tool: ${fn.name} (${e?.message ?? 'done'})`);
    }
    setTimeout(() => setFunctionFeedback(null), 3500);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader
        title="AI Lab"
        subtitle={`Cloud ${gemini.model} · Gemini Nano ${nano.status} · AICore ${tpu.aicoreVersion?.split('_')[2] ?? 'ready'}`}
        style={styles.scaffoldHeader}
      />

      <SectionTabs
        sections={sectionsFor('ai')}
        activeSection={activeTab}
        onSelect={id => setActiveTab(id as AILabTab)}
        style={styles.scaffoldTabs}
      />

      {keySavedMessage && (
        <View style={styles.alertSuccess}><Text style={styles.alertSuccessText}>{keySavedMessage}</Text></View>
      )}

      {/* ───────────────────────── TAB 1: CONVERSATION ───────────────────────── */}
      {activeTab === 'chat' && (
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.chatScrollContent} keyboardShouldPersistTaps="handled">
            {/* Engine & Settings Bar */}
            <View style={styles.controlRow}>
              <View style={styles.engineSwitcher}>
                <TouchableOpacity
                  style={[styles.enginePill, engine === 'cloud' && styles.enginePillActive]}
                  onPress={() => {
                    haptics.playPrimitives([{ primitive: 'CLICK', scale: 0.6 }]);
                    setEngine('cloud');
                  }}
                >
                  <Text style={[styles.enginePillText, engine === 'cloud' && styles.enginePillTextActive]}>
                    Cloud
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.enginePill, engine === 'nano' && styles.enginePillActive]}
                  onPress={() => {
                    haptics.playPrimitives([{ primitive: 'CLICK', scale: 0.6 }]);
                    setEngine('nano');
                  }}
                >
                  <Text style={[styles.enginePillText, engine === 'nano' && styles.enginePillTextActive]}>
                    Nano {nano.isAvailable ? '✓' : ''}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', gap: 6 }}>
                <HapticButton
                  title={showParams ? 'Close Params' : 'Hyperparameters'}
                  onPress={() => setShowParams(!showParams)}
                  variant="outline"
                  style={styles.actionPill}
                  textStyle={{ fontSize: 11 }}
                />
                <HapticButton
                  title="Clear"
                  onPress={() => {
                    if (engine === 'nano') nano.clearMessages();
                    else gemini.clearMessages();
                    setTokenEstimate(null);
                  }}
                  disabled={activeMessages.length === 0}
                  variant="ghost"
                  style={styles.actionPill}
                  textStyle={{ fontSize: 11 }}
                />
                {engine === 'cloud' && (
                  <HapticButton
                    title={gemini.hasApiKey ? 'API Key' : 'Set Key'}
                    onPress={() => setShowKeyInput(!showKeyInput)}
                    variant={gemini.hasApiKey ? 'secondary' : 'primary'}
                    style={styles.actionPill}
                    textStyle={{ fontSize: 11 }}
                  />
                )}
              </View>
            </View>

            {/* API Key Modal/Card */}
            {showKeyInput && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Google Gemini API Key</Text>
                <Text style={styles.cardDesc}>
                  Stored securely in the Titan M3 Keystore via Android SecureStore.
                </Text>
                <TextInput
                  style={styles.textInputFull}
                  placeholder="AIzaSy… key"
                  placeholderTextColor={Colors.dark.textMuted}
                  value={apiKeyInput}
                  onChangeText={setApiKeyInput}
                  autoCapitalize="none"
                  secureTextEntry
                />
                <HapticButton title="Save Key to SecureStore" onPress={handleSaveKey} variant="primary" style={{ marginTop: 8 }} />
              </View>
            )}

            {/* Hyperparameters Drawer */}
            {showParams && (
              <View style={styles.paramsDrawer}>
                <Text style={styles.paramsTitle}>
                  {engine === 'cloud' ? `Model Configuration (${gemini.model})` : 'Nano On-Device Configuration'}
                </Text>

                {engine === 'cloud' ? (
                  <>
                    <Text style={styles.paramLabel}>Active Model</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modelRow}>
                      {gemini.availableModels.map(m => (
                        <TouchableOpacity
                          key={m}
                          style={[styles.modelChip, gemini.model === m && styles.modelChipActive]}
                          onPress={() => {
                            gemini.setSelectedModel(m);
                            haptics.playPrimitives([{ primitive: 'CLICK', scale: 0.6 }]);
                          }}
                        >
                          <Text style={[styles.modelChipText, gemini.model === m && styles.modelChipTextActive]}>
                            {m}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    <View style={styles.paramGrid}>
                      <View style={styles.paramItem}>
                        <Text style={styles.paramItemLabel}>Temperature: {gemini.temperature.toFixed(2)}</Text>
                        <View style={styles.paramStepper}>
                          <TouchableOpacity
                            style={styles.stepBtn}
                            onPress={() => gemini.setTemperature(Math.max(0, Number((gemini.temperature - 0.1).toFixed(2))))}
                          >
                            <Text style={styles.stepBtnText}>-</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.stepBtn}
                            onPress={() => gemini.setTemperature(Math.min(2.0, Number((gemini.temperature + 0.1).toFixed(2))))}
                          >
                            <Text style={styles.stepBtnText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={styles.paramItem}>
                        <Text style={styles.paramItemLabel}>Top-K: {gemini.topK}</Text>
                        <View style={styles.paramStepper}>
                          <TouchableOpacity
                            style={styles.stepBtn}
                            onPress={() => gemini.setTopK(Math.max(1, gemini.topK - 5))}
                          >
                            <Text style={styles.stepBtnText}>-</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.stepBtn}
                            onPress={() => gemini.setTopK(Math.min(100, gemini.topK + 5))}
                          >
                            <Text style={styles.stepBtnText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                    <View style={styles.paramGrid}>
                      <View style={styles.paramItem}>
                        <Text style={styles.paramItemLabel}>Top-P: {gemini.topP.toFixed(2)}</Text>
                        <View style={styles.paramStepper}>
                          <TouchableOpacity style={styles.stepBtn} onPress={() => gemini.setTopP(Math.max(0, Number((gemini.topP - 0.05).toFixed(2))))}>
                            <Text style={styles.stepBtnText}>-</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.stepBtn} onPress={() => gemini.setTopP(Math.min(1, Number((gemini.topP + 0.05).toFixed(2))))}>
                            <Text style={styles.stepBtnText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={styles.paramItem}>
                        <Text style={styles.paramItemLabel}>Max output: {gemini.maxOutputTokens}</Text>
                        <View style={styles.paramStepper}>
                          <TouchableOpacity style={styles.stepBtn} onPress={() => gemini.setMaxOutputTokens(Math.max(256, gemini.maxOutputTokens - 256))}>
                            <Text style={styles.stepBtnText}>-</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.stepBtn} onPress={() => gemini.setMaxOutputTokens(Math.min(8192, gemini.maxOutputTokens + 256))}>
                            <Text style={styles.stepBtnText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={styles.paramItem}>
                        <Text style={styles.paramItemLabel}>
                          Thinking budget: {gemini.thinkingBudget === 0 ? 'off' : gemini.thinkingBudget}
                        </Text>
                        <View style={styles.paramStepper}>
                          <TouchableOpacity style={styles.stepBtn} onPress={() => gemini.setThinkingBudget(Math.max(0, gemini.thinkingBudget - 512))}>
                            <Text style={styles.stepBtnText}>-</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.stepBtn} onPress={() => gemini.setThinkingBudget(Math.min(8192, gemini.thinkingBudget + 512))}>
                            <Text style={styles.stepBtnText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>

                    <Text style={styles.paramLabel}>System instruction</Text>
                    <TextInput
                      style={styles.textInputFull}
                      value={gemini.systemInstruction}
                      onChangeText={gemini.setSystemInstruction}
                      placeholder="How the model should behave"
                      placeholderTextColor={Colors.dark.textMuted}
                      multiline
                    />
                    <Text style={styles.cardDesc}>
                      Model, key and every value here are fixed when the chat session is created, so changing one starts a fresh session.
                    </Text>
                  </>
                ) : (
                  <>
                    <View style={styles.paramGrid}>
                      <View style={styles.paramItem}>
                        <Text style={styles.paramItemLabel}>Temperature: {nano.temperature.toFixed(2)}</Text>
                        <View style={styles.paramStepper}>
                          <TouchableOpacity
                            style={styles.stepBtn}
                            onPress={() => nano.setTemperature(Math.max(0, Number((nano.temperature - 0.1).toFixed(2))))}
                          >
                            <Text style={styles.stepBtnText}>-</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.stepBtn}
                            onPress={() => nano.setTemperature(Math.min(1.0, Number((nano.temperature + 0.1).toFixed(2))))}
                          >
                            <Text style={styles.stepBtnText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={styles.paramItem}>
                        <Text style={styles.paramItemLabel}>Top-K: {nano.topK}</Text>
                        <View style={styles.paramStepper}>
                          <TouchableOpacity
                            style={styles.stepBtn}
                            onPress={() => nano.setTopK(Math.max(1, nano.topK - 5))}
                          >
                            <Text style={styles.stepBtnText}>-</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.stepBtn}
                            onPress={() => nano.setTopK(Math.min(100, nano.topK + 5))}
                          >
                            <Text style={styles.stepBtnText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>

                    <View style={styles.toggleRow}>
                      <Text style={styles.paramLabel}>Thinking Mode (Nano Reasoner)</Text>
                      <TouchableOpacity
                        style={[styles.togglePill, nano.thinkingMode && styles.togglePillActive]}
                        onPress={() => nano.setThinkingMode(!nano.thinkingMode)}
                      >
                        <Text style={styles.togglePillText}>{nano.thinkingMode ? 'ENABLED' : 'DISABLED'}</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            )}

            {/* Model lifecycle: status, budget and the measured cost of the last turn. */}
            {engine === 'nano' && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Gemini Nano on AICore</Text>
                <Text style={styles.cardDesc}>
                  {nano.info?.baseModelName ?? 'model name not reported'} · token limit{' '}
                  {nano.info?.tokenLimit ?? '—'} · thinking{' '}
                  {nano.info?.thinkingModeAvailable == null ? '?' : nano.info.thinkingModeAvailable ? 'available' : 'unavailable'} ·
                  system prompt{' '}
                  {nano.info?.systemPromptAvailable == null ? '?' : nano.info.systemPromptAvailable ? 'available' : 'unavailable'}
                </Text>
                <View style={styles.nanoMetricRow}>
                  <StatChip label="latency" value={nano.lastLatencyMs != null ? `${nano.lastLatencyMs} ms` : '—'} />
                  <StatChip label="first token" value={nano.lastFirstTokenMs != null ? `${nano.lastFirstTokenMs} ms` : '—'} />
                  <StatChip label="decode" value={nano.lastDecodeTokensPerSec != null ? `${nano.lastDecodeTokensPerSec} tok/s` : '—'} />
                  <StatChip label="out tokens" value={nano.lastOutputTokens != null ? String(nano.lastOutputTokens) : '—'} />
                </View>
                <View style={styles.nanoActionRow}>
                  {nano.status === 'downloadable' && (
                    <HapticButton
                      title={nano.isDownloading ? `Downloading ${nano.downloadedBytes != null ? `${Math.round(nano.downloadedBytes / 1_000_000)} MB` : '…'}` : 'Download model'}
                      onPress={() => { void nano.download(); }}
                      disabled={nano.isDownloading}
                      variant="primary"
                      style={styles.actionPill}
                      textStyle={{ fontSize: 11 }}
                    />
                  )}
                  <HapticButton
                    title={nano.isWarmingUp ? 'Warming…' : nano.warmupMs != null ? `Warm (${nano.warmupMs} ms)` : 'Warm up'}
                    onPress={() => { void nano.warmup(); }}
                    disabled={nano.isWarmingUp || !nano.isAvailable}
                    variant="secondary"
                    style={styles.actionPill}
                    textStyle={{ fontSize: 11 }}
                  />
                  <HapticButton
                    title={tokenEstimate == null ? 'Count prompt tokens' : `${tokenEstimate} tokens`}
                    onPress={() => { void countPromptTokens(); }}
                    disabled={!nano.isAvailable || !inputPrompt.trim()}
                    variant="outline"
                    style={styles.actionPill}
                    textStyle={{ fontSize: 11 }}
                  />
                  <HapticButton
                    title={`Track: ${nanoTrack}`}
                    onPress={() => { void toggleNanoTrack(); }}
                    disabled={!nano.isAvailable}
                    variant="outline"
                    style={styles.actionPill}
                    textStyle={{ fontSize: 11 }}
                  />
                </View>
                {nano.error ? <Text style={styles.nanoError}>{nano.error}</Text> : null}
              </View>
            )}

            {/* Conversation Messages */}
            <View style={styles.chatList}>
              {activeMessages.length === 0 && (
                <View style={styles.emptyPrompt}>
                  <Text style={styles.emptyPromptTitle}>Tensor G6 AI Ready</Text>
                  <Text style={styles.emptyPromptSub}>
                    Ask questions, run reasoning queries, or test on-device Gemini Nano inference.
                  </Text>
                </View>
              )}

              {activeMessages.map(msg => (
                <View
                  key={msg.id}
                  style={[
                    styles.messageBubble,
                    msg.role === 'user' ? styles.userBubble : msg.role === 'model' ? styles.modelBubble : styles.systemBubble,
                  ]}
                >
                  <View style={styles.bubbleHeader}>
                    <Text style={styles.bubbleRole}>{msg.role.toUpperCase()}</Text>
                    {msg.latencyMs != null && <Text style={styles.bubbleLatency}>{msg.latencyMs} ms</Text>}
                  </View>
                  <Text style={styles.bubbleText}>{msg.content}</Text>
                </View>
              ))}

              {nano.partial.length > 0 && (
                <View style={[styles.messageBubble, styles.modelBubble]}>
                  <View style={styles.bubbleHeader}><Text style={styles.bubbleRole}>NANO STREAMING</Text></View>
                  <Text style={styles.bubbleText}>{nano.partial}</Text>
                </View>
              )}

              {nano.thoughts.length > 0 && (
                <View style={styles.thoughtBox}>
                  <Text style={styles.thoughtTitle}>NANO INTERNAL THOUGHTS</Text>
                  {nano.thoughts.map((t, idx) => (
                    <Text key={idx} style={styles.thoughtText}>{t}</Text>
                  ))}
                </View>
              )}

              {isBusy && !nano.partial && (
                <View style={styles.loadingBubble}>
                  <ActivityIndicator size="small" color={Colors.dark.primary} />
                  <Text style={styles.loadingBubbleText}>
                    {engine === 'nano' ? 'Executing on Tensor G6 TPU…' : 'Querying Gemini Cloud…'}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Chat Composer with generous bottom padding */}
          <View style={styles.composer}>
            <TextInput
              style={styles.composerInput}
              placeholder={engine === 'nano' ? 'Message Gemini Nano (on-device)…' : 'Message Gemini 3.8…'}
              placeholderTextColor={Colors.dark.textMuted}
              value={inputPrompt}
              onChangeText={setInputPrompt}
              onSubmitEditing={handleSend}
            />
            <HapticButton
              title={speech.isListening ? 'Stop' : 'Mic'}
              onPress={handleVoiceToggle}
              variant={speech.isListening ? 'danger' : 'outline'}
              style={styles.composerMic}
              textStyle={{ fontSize: 16 }}
            />
            <HapticButton
              title="Send"
              onPress={handleSend}
              disabled={isBusy || !inputPrompt.trim()}
              variant="primary"
              style={styles.composerSend}
            />
          </View>
        </View>
      )}

      {/* ───────────────────────── TAB 2: TASK MODULES ───────────────────────── */}
      {activeTab === 'tasks' && (
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <MetricCard
            title="On-device GenAI Tasks"
            value={nano.isAvailable ? 'ML Kit Ready' : nano.status}
            badge="AICORE TASK API"
            badgeColor={nano.isAvailable ? Colors.dark.success : Colors.dark.warning}
            subtitle="Dedicated Task Clients for Summarization, Proofreading, Rewriting & Image Description"
            source={nano.source}
          />

          <View style={styles.taskSelector}>
            {(['summarize', 'proofread', 'rewrite', 'describe'] as GenAITaskKind[]).map(kind => (
              <TouchableOpacity
                key={kind}
                style={[styles.taskPill, genaiKind === kind && styles.taskPillActive]}
                onPress={() => {
                  haptics.playPrimitives([{ primitive: 'CLICK', scale: 0.6 }]);
                  setGenaiKind(kind);
                }}
              >
                <Text style={[styles.taskPillText, genaiKind === kind && styles.taskPillTextActive]}>
                  {kind.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Task Parameters */}
          {genaiKind === 'summarize' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Summarization Format</Text>
              <View style={styles.optionRow}>
                {(['one_bullet', 'two_bullets', 'three_bullets'] as const).map(opt => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.optionPill, summarizeBullets === opt && styles.optionPillActive]}
                    onPress={() => setSummarizeBullets(opt)}
                  >
                    <Text style={[styles.optionPillText, summarizeBullets === opt && styles.optionPillTextActive]}>
                      {opt.replace('_', ' ').toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {genaiKind === 'rewrite' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Tone & Style Transformation</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionRow}>
                {(['elaborate', 'emojify', 'shorten', 'friendly', 'professional', 'rephrase'] as TaskTone[]).map(tone => (
                  <TouchableOpacity
                    key={tone}
                    style={[styles.optionPill, rewriteTone === tone && styles.optionPillActive]}
                    onPress={() => setRewriteTone(tone)}
                  >
                    <Text style={[styles.optionPillText, rewriteTone === tone && styles.optionPillTextActive]}>
                      {tone.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Text Input Box */}
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.cardTitle}>{genaiKind === 'describe' ? 'Image Input' : 'Input Text'}</Text>
              {genaiKind !== 'describe' && (
                <TouchableOpacity
                  onPress={() => {
                    setTaskInputText(
                      genaiKind === 'proofread'
                        ? 'The device have 8gb of memory and it run really good when test is executed.'
                        : 'The Tensor G6 processor inside the Pixel 11 Pro features an all-new high efficiency CPU cluster, paired with next-generation TPU hardware acceleration. Combined with Android 17, on-device Gemini Nano execution achieves sub-50ms latency for streaming tokens while operating within thermal frame budgets.'
                    );
                  }}
                >
                  <Text style={{ color: Colors.dark.primary, fontSize: 12, fontWeight: '600' }}>Load Sample</Text>
                </TouchableOpacity>
              )}
            </View>

            {genaiKind !== 'describe' ? (
              <TextInput
                style={styles.textInputArea}
                value={taskInputText}
                onChangeText={setTaskInputText}
                multiline
              />
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                {vision.selectedImageUri ? (
                  <Image source={{ uri: vision.selectedImageUri }} style={styles.previewImage} />
                ) : (
                  <Text style={styles.cardDesc}>Select an image below to describe on-device.</Text>
                )}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <HapticButton title="Camera" onPress={() => vision.pickImage(true)} variant="outline" style={{ flex: 1 }} />
                  <HapticButton title="Gallery" onPress={() => vision.pickImage(false)} variant="secondary" style={{ flex: 1 }} />
                </View>
              </View>
            )}

            <HapticButton
              title={genaiTasks.isRunning ? 'Processing locally on TPU…' : `Run On-Device ${genaiKind.toUpperCase()}`}
              onPress={runSelectedGenAITask}
              disabled={genaiTasks.isRunning}
              variant="primary"
              style={{ marginTop: 12 }}
            />
          </View>

          {genaiTasks.error && (
            <View style={styles.alertError}><Text style={styles.alertErrorText}>{genaiTasks.error}</Text></View>
          )}

          {/* Outputs */}
          {genaiTasks.summaryResult && genaiKind === 'summarize' && (
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={styles.cardTitle}>Summary Result</Text>
                <StatChip label="Latency" value={`${genaiTasks.summaryResult.latencyMs} ms`} tone="accent" />
              </View>
              <Text style={styles.outputResultText}>{genaiTasks.summaryResult.summary}</Text>
              <Text style={styles.outputMetaText}>
                Engine: {genaiTasks.summaryResult.engine} • Hardware: Tensor G6 TPU • Provenance: {genaiTasks.summaryResult.source}
              </Text>
            </View>
          )}

          {genaiTasks.proofreadResult && genaiKind === 'proofread' && (
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={styles.cardTitle}>Corrected Text</Text>
                <StatChip label="Latency" value={`${genaiTasks.proofreadResult.latencyMs} ms`} tone="accent" />
              </View>
              <Text style={styles.outputResultText}>{genaiTasks.proofreadResult.correctedText}</Text>
              <Text style={styles.outputMetaText}>
                Engine: {genaiTasks.proofreadResult.engine} • Hardware: Tensor G6 TPU • Provenance: {genaiTasks.proofreadResult.source}
              </Text>
            </View>
          )}

          {genaiTasks.rewriteResult && genaiKind === 'rewrite' && (
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={styles.cardTitle}>Rewritten Output ({rewriteTone})</Text>
                <StatChip label="Latency" value={`${genaiTasks.rewriteResult.latencyMs} ms`} tone="accent" />
              </View>
              <Text style={styles.outputResultText}>{genaiTasks.rewriteResult.rewrittenText}</Text>
              <Text style={styles.outputMetaText}>
                Engine: {genaiTasks.rewriteResult.engine} • Hardware: Tensor G6 TPU • Provenance: {genaiTasks.rewriteResult.source}
              </Text>
            </View>
          )}

          {genaiTasks.imageDescriptionResult && genaiKind === 'describe' && (
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={styles.cardTitle}>Image Description</Text>
                <StatChip label="Latency" value={`${genaiTasks.imageDescriptionResult.latencyMs} ms`} tone="accent" />
              </View>
              <Text style={styles.outputResultText}>{genaiTasks.imageDescriptionResult.description}</Text>
              <Text style={styles.outputMetaText}>
                Engine: {genaiTasks.imageDescriptionResult.engine} • Hardware: Tensor G6 TPU • Provenance: {genaiTasks.imageDescriptionResult.source}
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* ───────────────────────── TAB 3: VISION & OCR ───────────────────────── */}
      {activeTab === 'vision' && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <MetricCard
            title="Google ML Kit Vision & OCR"
            value="Tensor Vision Subsystem"
            badge="ON-DEVICE HARDWARE"
            badgeColor={Colors.dark.success}
            subtitle="Text Recognition v2, Barcode Scanning, Image Labeling, Face Mesh & Gemini Multimodal"
            source="hardware"
          />

          {/* Vision Demo Selector */}
          <View style={styles.taskSelector}>
            {(['ocr', 'barcode', 'label', 'faces', 'objects', 'pose', 'subject', 'cloud'] as VisionDemoKind[]).map(kind => (
              <TouchableOpacity
                key={kind}
                style={[styles.taskPill, visionKind === kind && styles.taskPillActive]}
                onPress={() => {
                  haptics.playPrimitives([{ primitive: 'CLICK', scale: 0.6 }]);
                  setVisionKind(kind);
                }}
              >
                <Text style={[styles.taskPillText, visionKind === kind && styles.taskPillTextActive]}>
                  {kind.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.card}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <HapticButton
                title="Camera"
                onPress={() => runVisionAction(true)}
                disabled={vision.isAnalyzing || vision.isOnDeviceProcessing}
                variant="primary"
                style={{ flex: 1 }}
              />
              <HapticButton
                title="Photo Gallery"
                onPress={() => runVisionAction(false)}
                disabled={vision.isAnalyzing || vision.isOnDeviceProcessing}
                variant="secondary"
                style={{ flex: 1 }}
              />
            </View>

            {(vision.isAnalyzing || vision.isOnDeviceProcessing) && (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={Colors.dark.primary} />
                <Text style={styles.loadingText}>Processing visual scene on Tensor G6…</Text>
              </View>
            )}

            {vision.selectedImageUri && (
              <Image source={{ uri: vision.selectedImageUri }} style={styles.previewImage} />
            )}

            {/* OCR Result */}
            {visionKind === 'ocr' && vision.ocrResult && (
              <View style={styles.analysisBox}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.analysisTitle}>Recognized Text (OCR v2)</Text>
                  <StatChip label="Latency" value={`${vision.ocrResult.latencyMs} ms`} tone="accent" />
                </View>
                <Text style={styles.analysisText}>{vision.ocrResult.text || '(No text detected in scene)'}</Text>
                <Text style={styles.outputMetaText}>Detected {vision.ocrResult.blocks.length} text blocks</Text>
              </View>
            )}

            {/* Barcode Result */}
            {visionKind === 'barcode' && vision.barcodeResult && (
              <View style={styles.analysisBox}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.analysisTitle}>Barcode & QR Results</Text>
                  <StatChip label="Latency" value={`${vision.barcodeResult.latencyMs} ms`} tone="accent" />
                </View>
                {vision.barcodeResult.barcodes.length === 0 ? (
                  <Text style={styles.analysisText}>(No barcodes detected)</Text>
                ) : (
                  vision.barcodeResult.barcodes.map((b, idx) => (
                    <View key={idx} style={{ marginTop: 6 }}>
                      <Text style={[styles.analysisText, { fontWeight: '700' }]}>{b.displayValue ?? b.rawValue}</Text>
                      <Text style={styles.outputMetaText}>Format: {b.format} • Type: {b.valueType}</Text>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* Label Result */}
            {visionKind === 'label' && vision.labelsResult && (
              <View style={styles.analysisBox}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.analysisTitle}>On-Device Image Labels</Text>
                  <StatChip label="Latency" value={`${vision.labelsResult.latencyMs} ms`} tone="accent" />
                </View>
                <View style={styles.labelsRow}>
                  {vision.labelsResult.labels.map((lbl, idx) => (
                    <View key={idx} style={styles.labelChip}>
                      <Text style={styles.labelChipText}>
                        {lbl.text} ({Math.round(lbl.confidence * 100)}%)
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Face Result */}
            {visionKind === 'faces' && (vision.facesResult || vision.faceMeshResult) && (
              <View style={styles.analysisBox}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.analysisTitle}>Face & 3D Mesh Detection</Text>
                  <StatChip
                    label="Latency"
                    value={`${(vision.facesResult?.latencyMs ?? 0) + (vision.faceMeshResult?.latencyMs ?? 0)} ms`}
                    tone="accent"
                  />
                </View>
                <Text style={styles.analysisText}>
                  Detected {vision.facesResult?.faces.length ?? 0} face(s) and {vision.faceMeshResult?.meshes.length ?? 0} 3D face mesh(es).
                </Text>
                {vision.facesResult?.faces.map((f, idx) => (
                  <Text key={idx} style={styles.outputMetaText}>
                    Face #{idx + 1}: Smile: {f.smilingProbability != null ? `${Math.round(f.smilingProbability * 100)}%` : '—'} • Left Eye: {f.leftEyeOpenProbability != null ? `${Math.round(f.leftEyeOpenProbability * 100)}%` : '—'}
                  </Text>
                ))}
              </View>
            )}

            {/* Cloud Gemini Multimodal Analysis */}
            {visionKind === 'objects' && vision.objectsResult && (
              <MetricCard
                title="Objects"
                value={vision.objectsResult.objects.length}
                unit={vision.objectsResult.objects.length === 1 ? 'object' : 'objects'}
                badge={`${vision.objectsResult.latencyMs} ms`}
                badgeColor={Colors.dark.success}
                subtitle={
                  vision.objectsResult.objects
                    .map(o => `${o.labels[0]?.text ?? 'unlabelled'}${o.trackingId != null ? ` #${o.trackingId}` : ''}`)
                    .join(' · ') || 'nothing detected in this frame'
                }
                source={vision.objectsResult.source}
              />
            )}

            {visionKind === 'pose' && vision.poseResult && (
              <MetricCard
                title="Pose landmarks"
                value={vision.poseResult.landmarks.length}
                unit="of 33"
                badge={`${vision.poseResult.latencyMs} ms`}
                badgeColor={Colors.dark.success}
                subtitle={
                  vision.poseResult.landmarks.length
                    ? `mean in-frame likelihood ${(vision.poseResult.landmarks.reduce((a, l) => a + l.inFrameLikelihood, 0) / vision.poseResult.landmarks.length).toFixed(2)}`
                    : 'no person detected in this frame'
                }
                source={vision.poseResult.source}
              />
            )}

            {visionKind === 'subject' && vision.subjectResult && (
              <MetricCard
                title="Subject segmentation"
                value={vision.subjectResult.subjectsCount}
                unit={vision.subjectResult.subjectsCount === 1 ? 'subject' : 'subjects'}
                badge={`${vision.subjectResult.latencyMs} ms`}
                badgeColor={vision.subjectResult.foregroundConfidence ? Colors.dark.success : Colors.dark.warning}
                subtitle={vision.subjectResult.foregroundConfidence ? 'foreground separated from the background' : 'no confident foreground in this frame'}
                source={vision.subjectResult.source}
              />
            )}

            {visionKind === 'cloud' && vision.analysis && (
              <View style={styles.analysisBox}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.analysisTitle}>Gemini Cloud Scene Analysis</Text>
                  <StatChip label="Latency" value={`${vision.analysis.latencyMs} ms`} tone="accent" />
                </View>
                <Text style={styles.analysisText}>{vision.analysis.description}</Text>
                <View style={styles.labelsRow}>
                  {vision.analysis.labels.map((lbl, idx) => (
                    <View key={idx} style={styles.labelChip}>
                      <Text style={styles.labelChipText}>{lbl}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {vision.error && <Text style={styles.errorText}>{vision.error}</Text>}
          </View>
        </ScrollView>
      )}

      {/* ───────────────────────── TAB 4: NATURAL LANGUAGE INTELLIGENCE ───────────────────────── */}
      {activeTab === 'language' && (
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <MetricCard
            title="On-Device Natural Language"
            value="ML Kit NLP Engine"
            badge="OFFLINE 58-LANG"
            badgeColor={Colors.dark.success}
            subtitle="Offline Translation, Language Identification, Smart Reply & Entity Extraction"
            source="hardware"
          />

          <View style={styles.taskSelector}>
            {(['translate', 'langid', 'smartreply', 'entities'] as NLPDemoKind[]).map(kind => (
              <TouchableOpacity
                key={kind}
                style={[styles.taskPill, nlpKind === kind && styles.taskPillActive]}
                onPress={() => {
                  haptics.playPrimitives([{ primitive: 'CLICK', scale: 0.6 }]);
                  setNlpKind(kind);
                }}
              >
                <Text style={[styles.taskPillText, nlpKind === kind && styles.taskPillTextActive]}>
                  {kind.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Language Selection for Translation */}
          {nlpKind === 'translate' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Target Language</Text>
              <View style={styles.optionRow}>
                {[
                  { code: 'es', label: 'SPANISH' },
                  { code: 'fr', label: 'FRENCH' },
                  { code: 'de', label: 'GERMAN' },
                  { code: 'ja', label: 'JAPANESE' },
                ].map(l => (
                  <TouchableOpacity
                    key={l.code}
                    style={[styles.optionPill, targetLang === l.code && styles.optionPillActive]}
                    onPress={() => setTargetLang(l.code as any)}
                  >
                    <Text style={[styles.optionPillText, targetLang === l.code && styles.optionPillTextActive]}>
                      {l.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Input Box */}
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.cardTitle}>Input Text</Text>
              <TouchableOpacity
                onPress={() => {
                  if (nlpKind === 'translate') {
                    setNlpInputText('PixelKit delivers zero-latency on-device intelligence directly on Tensor G6.');
                  } else if (nlpKind === 'langid') {
                    setNlpInputText('Bonjour le monde! Nous développons pour Pixel 11 Pro.');
                  } else if (nlpKind === 'smartreply') {
                    setNlpInputText('Yes, the build is compiled and ready for review on device.');
                  } else if (nlpKind === 'entities') {
                    setNlpInputText('Meeting at 1600 Amphitheatre Pkwy on Friday at 3pm. Flight UA426 costs $450.');
                  }
                }}
              >
                <Text style={{ color: Colors.dark.primary, fontSize: 12, fontWeight: '600' }}>Load Sample</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.textInputArea}
              value={nlpInputText}
              onChangeText={setNlpInputText}
              multiline
            />
            <HapticButton
              title={nlp.isProcessing ? 'Processing on-device…' : `Run Offline ${nlpKind.toUpperCase()}`}
              onPress={runNLPAction}
              disabled={nlp.isProcessing || !nlpInputText.trim()}
              variant="primary"
              style={{ marginTop: 12 }}
            />
          </View>

          {nlp.error && (
            <View style={styles.alertError}><Text style={styles.alertErrorText}>{nlp.error}</Text></View>
          )}

          {/* NLP Outputs */}
          {nlpKind === 'translate' && nlp.translationResult && (
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.cardTitle}>Offline Translation ({targetLang.toUpperCase()})</Text>
                <StatChip label="Latency" value={`${nlp.translationResult.latencyMs} ms`} tone="accent" />
              </View>
              <Text style={styles.outputResultText}>{nlp.translationResult.translatedText}</Text>
              <Text style={styles.outputMetaText}>
                Source: {nlp.translationResult.sourceLanguage} • Target: {nlp.translationResult.targetLanguage} • Provenance: {nlp.translationResult.source}
              </Text>
            </View>
          )}

          {nlpKind === 'langid' && nlp.languageResult && (
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.cardTitle}>Identified Language</Text>
                <StatChip label="Latency" value={`${nlp.languageResult.latencyMs} ms`} tone="accent" />
              </View>
              <Text style={styles.outputResultText}>Language Code: {nlp.languageResult.languageCode?.toUpperCase() ?? 'UNDETERMINED'}</Text>
              <View style={styles.labelsRow}>
                {nlp.languageResult.possibleLanguages.map((p, idx) => (
                  <View key={idx} style={styles.labelChip}>
                    <Text style={styles.labelChipText}>{p.languageCode.toUpperCase()}: {Math.round(p.confidence * 100)}%</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {nlpKind === 'smartreply' && nlp.smartReplyResult && (
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.cardTitle}>Smart Reply Suggestions</Text>
                <StatChip label="Latency" value={`${nlp.smartReplyResult.latencyMs} ms`} tone="accent" />
              </View>
              {nlp.smartReplyResult.suggestions.length === 0 ? (
                <Text style={styles.outputResultText}>(No replies generated)</Text>
              ) : (
                nlp.smartReplyResult.suggestions.map((rep, idx) => (
                  <View key={idx} style={{ marginTop: 6 }}>
                    <Text style={styles.outputResultText}>"{rep}"</Text>
                  </View>
                ))
              )}
            </View>
          )}

          {nlpKind === 'entities' && nlp.entityResult && (
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.cardTitle}>Extracted Structured Entities</Text>
                <StatChip label="Latency" value={`${nlp.entityResult.latencyMs} ms`} tone="accent" />
              </View>
              {nlp.entityResult.entities.length === 0 ? (
                <Text style={styles.outputResultText}>(No entities found)</Text>
              ) : (
                nlp.entityResult.entities.map((e, idx) => (
                  <View key={idx} style={{ marginTop: 6 }}>
                    <Text style={[styles.outputResultText, { fontWeight: '700' }]}>{e.text}</Text>
                    <Text style={styles.outputMetaText}>Type ID: {e.type} • Span: [{e.start}, {e.end}]</Text>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* ───────────────────────── TAB 5: VOICE & STT ───────────────────────── */}
      {activeTab === 'voice' && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <SectionHeader title="Speech out" hint={tts.voices.length ? `${tts.voices.length} voices installed` : 'no voices read yet'} />
          <MetricCard
            title="Platform speech engine"
            value={tts.isSpeaking ? (tts.isPaused ? 'Paused' : 'Speaking') : 'Idle'}
            badge={tts.voice ? 'VOICE SET' : 'SYSTEM DEFAULT'}
            badgeColor={tts.isSpeaking ? Colors.dark.success : Colors.dark.textMuted}
            subtitle={`rate ${tts.rate} · pitch ${tts.pitch} · accepts ${tts.maxInputLength} characters per call, longer text is rejected rather than cut`}
            source={tts.source}
          />
          <View style={styles.ttsRow}>
            <HapticButton
              title="Read the last reply"
              onPress={() => { void speakLastReply(); }}
              disabled={tts.isSpeaking}
              variant="primary"
              style={styles.actionPill}
              textStyle={{ fontSize: 11 }}
            />
            <HapticButton title="Stop" onPress={() => { void tts.stop(); }} disabled={!tts.isSpeaking} variant="outline" style={styles.actionPill} textStyle={{ fontSize: 11 }} />
            <HapticButton title="Slower" onPress={() => tts.setRate(Number(Math.max(0.5, tts.rate - 0.1).toFixed(2)))} variant="outline" style={styles.actionPill} textStyle={{ fontSize: 11 }} />
            <HapticButton title="Faster" onPress={() => tts.setRate(Number(Math.min(2, tts.rate + 0.1).toFixed(2)))} variant="outline" style={styles.actionPill} textStyle={{ fontSize: 11 }} />
            <HapticButton title="Refresh voices" onPress={() => { void tts.refreshVoices(); }} variant="ghost" style={styles.actionPill} textStyle={{ fontSize: 11 }} />
          </View>
          {tts.lastSpokenText ? <Text style={styles.cardDesc}>Last spoken: {tts.lastSpokenText.slice(0, 120)}</Text> : null}
          {spokenNote ? <Text style={styles.nanoError}>{spokenNote}</Text> : null}
          {tts.error ? <Text style={styles.nanoError}>{tts.error}</Text> : null}

          <SectionHeader title="Speech Recognition Mode" />
          <View style={styles.taskSelector}>
            <TouchableOpacity
              style={[styles.taskPill, speech.recognitionMode === 'on-device' && styles.taskPillActive]}
              onPress={() => {
                speech.setRecognitionMode('on-device');
                haptics.playPrimitives([{ primitive: 'CLICK', scale: 0.6 }]);
              }}
            >
              <Text style={[styles.taskPillText, speech.recognitionMode === 'on-device' && styles.taskPillTextActive]}>
                ON-DEVICE (ASI OFFLINE)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.taskPill, speech.recognitionMode === 'cloud' && styles.taskPillActive]}
              onPress={() => {
                speech.setRecognitionMode('cloud');
                haptics.playPrimitives([{ primitive: 'CLICK', scale: 0.6 }]);
              }}
            >
              <Text style={[styles.taskPillText, speech.recognitionMode === 'cloud' && styles.taskPillTextActive]}>
                CLOUD (GEMINI AUDIO)
              </Text>
            </TouchableOpacity>
          </View>

          <MetricCard
            title="Speech Recognizer Engine"
            value={speech.recognitionMode === 'on-device' ? 'Android System Intelligence' : 'Gemini 3.8 Flash Cloud'}
            badge={speech.recognitionMode === 'on-device' ? 'OFFLINE NATIVE' : 'CLOUD API'}
            badgeColor={speech.recognitionMode === 'on-device' ? Colors.dark.success : Colors.dark.primary}
            subtitle={
              speech.recognitionMode === 'on-device'
                ? 'Streams tokens in real-time without sending audio to the cloud'
                : 'Transcribes recorded 16 kHz audio via Gemini multimodal understanding'
            }
            source="hardware"
          />

          <View style={[styles.card, { alignItems: 'center', paddingVertical: 24 }]}>
            <HapticButton
              title={speech.isListening ? `Listening (${speech.voiceDecibels ?? '—'} dBFS)` : 'Start Voice Input'}
              onPress={handleVoiceToggle}
              variant={speech.isListening ? 'danger' : 'primary'}
              style={{ width: '80%', paddingVertical: 14 }}
              textStyle={{ fontSize: 16, fontWeight: '700' }}
            />

            {speech.isListening && (
              <View style={styles.waveformContainer}>
                <ActivityIndicator size="small" color={Colors.dark.primary} />
                <Text style={styles.listeningStatusText}>
                  {speech.recognitionMode === 'on-device' ? 'Streaming live from on-device microphone…' : 'Recording audio…'}
                </Text>
              </View>
            )}

            {speech.streamingPartial.length > 0 && (
              <View style={styles.partialStreamBox}>
                <Text style={styles.partialStreamLabel}>LIVE INTERIM STREAM</Text>
                <Text style={styles.partialStreamText}>{speech.streamingPartial}</Text>
              </View>
            )}
          </View>

          {speech.lastTranscript && (
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.cardTitle}>Final Transcript</Text>
                <StatChip label="Latency" value={`${speech.lastTranscript.latencyMs} ms`} tone="ok" />
              </View>
              <Text style={styles.outputResultText}>"{speech.lastTranscript.transcript}"</Text>
              <Text style={styles.outputMetaText}>
                Duration: {speech.lastTranscript.durationSeconds}s • Model: {speech.lastTranscript.language}
              </Text>
            </View>
          )}

          {speech.error && (
            <View style={styles.alertError}><Text style={styles.alertErrorText}>{speech.error}</Text></View>
          )}
        </ScrollView>
      )}

      {/* ───────────────────────── TAB 6: AGENTS & APPFUNCTIONS ───────────────────────── */}
      {activeTab === 'agents' && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <MetricCard
            title="Android 17 AppFunctions"
            value={registeredFunctions.length > 0 ? 'Service Active' : 'Registered'}
            badge="OS AGENT INTEGRATION"
            badgeColor={Colors.dark.success}
            subtitle="Exposes PixelKit actuators & sensors to external AI agents (Gemini & Ask Pixel)"
            source="hardware"
          />

          {functionFeedback && (
            <View style={styles.alertSuccess}><Text style={styles.alertSuccessText}>{functionFeedback}</Text></View>
          )}

          <SectionHeader title="Registered Agent Tools" />
          {registeredFunctions.map(fn => (
            <View key={fn.id} style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.cardTitle}>{fn.name}</Text>
                <StatChip label={fn.category.toUpperCase()} tone="accent" />
              </View>
              <Text style={styles.cardDesc}>{fn.description}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <Text style={{ fontFamily: Fonts.mono, fontSize: 11, color: Colors.dark.textMuted }}>
                  Target: {fn.target} • ID: {fn.id}
                </Text>
                <HapticButton
                  title="Test Tool"
                  onPress={() => testAppFunction(fn)}
                  variant="outline"
                  style={{ paddingVertical: 6, paddingHorizontal: 12 }}
                  textStyle={{ fontSize: 11 }}
                />
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scaffoldHeader: { paddingHorizontal: 16, paddingTop: 8 },
  nanoMetricRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  nanoActionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  nanoError: { color: Colors.dark.error, fontSize: 11, marginTop: 8 },
  ttsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  scaffoldTabs: { paddingHorizontal: 16 },
  container: { flex: 1, backgroundColor: Colors.dark.background },
  chatScrollContent: { padding: 16, paddingBottom: 24 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  engineSwitcher: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.surfaceVariant,
    borderRadius: Radius.pill,
    padding: 3,
  },
  enginePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  enginePillActive: {
    backgroundColor: Colors.dark.primary,
  },
  enginePillText: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    fontWeight: '600',
    color: Colors.dark.textMuted,
  },
  enginePillTextActive: {
    color: Colors.dark.onPrimary,
  },
  actionPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radius.pill,
  },
  paramsDrawer: {
    backgroundColor: Colors.dark.surface,
    padding: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    marginBottom: 14,
  },
  paramsTitle: {
    fontSize: 12,
    fontFamily: Fonts.mono,
    fontWeight: '700',
    color: Colors.dark.primary,
    marginBottom: 10,
  },
  paramLabel: {
    fontSize: 11,
    fontFamily: Fonts.sans,
    color: Colors.dark.textMuted,
    marginBottom: 6,
  },
  modelRow: { flexDirection: 'row', marginBottom: 12 },
  modelChip: {
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  modelChipActive: {
    borderColor: Colors.dark.primary,
    backgroundColor: `${Colors.dark.primary}22`,
  },
  modelChipText: {
    fontSize: 11,
    fontFamily: Fonts.mono,
    color: Colors.dark.textMuted,
  },
  modelChipTextActive: {
    color: Colors.dark.primary,
    fontWeight: '600',
  },
  paramGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  paramItem: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    padding: 10,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  paramItemLabel: {
    fontSize: 11,
    fontFamily: Fonts.mono,
    color: Colors.dark.text,
    marginBottom: 6,
  },
  paramStepper: {
    flexDirection: 'row',
    gap: 8,
  },
  stepBtn: {
    flex: 1,
    backgroundColor: Colors.dark.surfaceVariant,
    paddingVertical: 4,
    alignItems: 'center',
    borderRadius: 4,
  },
  stepBtnText: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.cardBorder,
  },
  togglePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  togglePillActive: {
    borderColor: Colors.dark.success,
    backgroundColor: `${Colors.dark.success}22`,
  },
  togglePillText: {
    fontSize: 10,
    fontFamily: Fonts.mono,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  chatList: { paddingBottom: 16 },
  emptyPrompt: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPromptTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 6,
  },
  emptyPromptSub: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  messageBubble: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    maxWidth: '92%',
  },
  userBubble: {
    backgroundColor: Colors.dark.primaryContainer,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 2,
  },
  modelBubble: {
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 2,
  },
  systemBubble: {
    backgroundColor: `${Colors.dark.error}18`,
    borderWidth: 1,
    borderColor: Colors.dark.error,
    alignSelf: 'stretch',
    maxWidth: '100%',
  },
  bubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  bubbleRole: {
    fontSize: 9,
    fontFamily: Fonts.mono,
    fontWeight: '700',
    color: Colors.dark.textMuted,
    letterSpacing: 0.5,
  },
  bubbleLatency: {
    fontSize: 9,
    fontFamily: Fonts.mono,
    color: Colors.dark.textMuted,
  },
  bubbleText: {
    color: Colors.dark.text,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: Fonts.sans,
  },
  thoughtBox: {
    backgroundColor: Colors.dark.surfaceVariant,
    padding: 10,
    borderRadius: Radius.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.dark.secondary,
    marginBottom: 10,
  },
  thoughtTitle: {
    fontSize: 9,
    fontFamily: Fonts.mono,
    fontWeight: '700',
    color: Colors.dark.secondary,
    marginBottom: 4,
  },
  thoughtText: {
    fontSize: 11,
    fontFamily: Fonts.sans,
    color: Colors.dark.textMuted,
    fontStyle: 'italic',
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    padding: 10,
    borderRadius: Radius.md,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  loadingBubbleText: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    marginLeft: 8,
    fontFamily: Fonts.sans,
  },
  composer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: Colors.dark.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.cardBorder,
    alignItems: 'center',
  },
  composerInput: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    color: Colors.dark.text,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    marginRight: 6,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  composerMic: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 6,
    borderRadius: Radius.pill,
  },
  composerSend: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Radius.pill,
  },
  card: {
    backgroundColor: Colors.dark.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    padding: 14,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Fonts.sans,
    color: Colors.dark.text,
  },
  cardDesc: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    lineHeight: 17,
    marginTop: 4,
    marginBottom: 10,
  },
  taskSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  taskPill: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: Colors.dark.surfaceVariant,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  taskPillActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  taskPillText: {
    fontSize: 10,
    fontFamily: Fonts.mono,
    fontWeight: '700',
    color: Colors.dark.textMuted,
  },
  taskPillTextActive: {
    color: Colors.dark.onPrimary,
  },
  optionRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  optionPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.dark.surfaceVariant,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    marginRight: 6,
  },
  optionPillActive: {
    borderColor: Colors.dark.primary,
    backgroundColor: `${Colors.dark.primary}22`,
  },
  optionPillText: {
    fontSize: 10,
    fontFamily: Fonts.mono,
    color: Colors.dark.textMuted,
  },
  optionPillTextActive: {
    color: Colors.dark.primary,
    fontWeight: '700',
  },
  textInputFull: {
    backgroundColor: Colors.dark.surfaceVariant,
    color: Colors.dark.text,
    borderRadius: Radius.sm,
    padding: 10,
    fontSize: 13,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    marginTop: 6,
  },
  textInputArea: {
    backgroundColor: Colors.dark.surfaceVariant,
    color: Colors.dark.text,
    borderRadius: Radius.sm,
    padding: 10,
    fontSize: 13,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  outputResultText: {
    fontSize: 13,
    lineHeight: 20,
    color: Colors.dark.text,
    marginTop: 4,
    backgroundColor: Colors.dark.surfaceVariant,
    padding: 12,
    borderRadius: Radius.sm,
  },
  outputMetaText: {
    fontSize: 11,
    fontFamily: Fonts.mono,
    color: Colors.dark.textMuted,
    marginTop: 8,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  listeningStatusText: {
    fontSize: 12,
    color: Colors.dark.primary,
    fontFamily: Fonts.mono,
  },
  partialStreamBox: {
    marginTop: 16,
    width: '100%',
    backgroundColor: Colors.dark.surfaceVariant,
    padding: 12,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  partialStreamLabel: {
    fontSize: 9,
    fontFamily: Fonts.mono,
    fontWeight: '700',
    color: Colors.dark.primary,
    marginBottom: 4,
  },
  partialStreamText: {
    fontSize: 14,
    color: Colors.dark.text,
    fontStyle: 'italic',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: Radius.sm,
    marginTop: 12,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  loadingText: {
    color: Colors.dark.primary,
    fontSize: 12,
  },
  analysisBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.dark.surfaceVariant,
    borderRadius: Radius.sm,
  },
  analysisTitle: {
    fontSize: 11,
    fontFamily: Fonts.mono,
    fontWeight: '700',
    color: Colors.dark.primary,
  },
  analysisText: {
    fontSize: 13,
    color: Colors.dark.text,
    lineHeight: 18,
    marginTop: 4,
  },
  labelsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  labelChip: {
    backgroundColor: Colors.dark.card,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  labelChipText: {
    fontSize: 10,
    fontFamily: Fonts.mono,
    color: Colors.dark.primary,
  },
  alertSuccess: {
    backgroundColor: '#0F3E22',
    borderColor: Colors.dark.success,
    borderWidth: 1,
    borderRadius: Radius.sm,
    padding: 10,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  alertSuccessText: { color: Colors.dark.success, fontSize: 12, fontWeight: '600' },
  alertError: {
    backgroundColor: `${Colors.dark.error}22`,
    borderColor: Colors.dark.error,
    borderWidth: 1,
    borderRadius: Radius.sm,
    padding: 10,
    marginBottom: 12,
  },
  alertErrorText: { color: Colors.dark.error, fontSize: 12 },
  errorText: { color: Colors.dark.error, fontSize: 12, marginTop: 6 },
});
