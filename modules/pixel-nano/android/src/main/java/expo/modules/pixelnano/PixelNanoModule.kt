package expo.modules.pixelnano

import android.content.Context
import android.os.SystemClock
import android.util.Base64
import com.google.mlkit.genai.common.DownloadStatus
import com.google.mlkit.genai.common.FeatureStatus
import com.google.mlkit.genai.common.GenAiException
import com.google.mlkit.genai.common.StreamingCallback
import com.google.mlkit.genai.prompt.Candidate
import com.google.mlkit.genai.prompt.GenerateContentRequest
import com.google.mlkit.genai.prompt.GenerateContentResponse
import com.google.mlkit.genai.prompt.Generation
import com.google.mlkit.genai.prompt.GenerativeModel
import com.google.mlkit.genai.prompt.ImagePart
import com.google.mlkit.genai.prompt.ModelPreference
import com.google.mlkit.genai.prompt.ModelReleaseStage
import com.google.mlkit.genai.prompt.SystemInstruction
import com.google.mlkit.genai.prompt.TextPart
import com.google.mlkit.genai.prompt.generateContentRequest
import com.google.mlkit.genai.prompt.generationConfig
import com.google.mlkit.genai.prompt.modelConfig
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

/** Error surfaced to JS as `E_NANO_<code>` where code is a GenAiException.ErrorCode name. */
class NanoException(code: String, message: String, cause: Throwable?) :
  CodedException("E_NANO_$code", message, cause)

/**
 * PixelNano: Gemini Nano on-device inference through the ML Kit GenAI Prompt API (AICore).
 *
 * Every function talks to the real AICore service. Status, model name, token limit and feature
 * flags come from `GenerativeModel`; latency is measured around the actual call. Nothing here
 * fabricates a reply: when the model is unavailable the call throws `E_NANO_NOT_AVAILABLE`.
 *
 * Verified against genai-prompt 1.0.0-beta4: `checkStatus()` returns a `FeatureStatus` int,
 * `generateContentRequest(...)` has fixed-arity overloads (text; system+text; image+text;
 * system+image+text), streaming uses `StreamingCallback.onNewText/onNewThought`.
 */
class PixelNanoModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw NanoException("NO_CONTEXT", "React context lost", null)

  private var model: GenerativeModel? = null
  private var releaseStage: Int = ModelReleaseStage.STABLE
  private var preference: Int = ModelPreference.FULL

  /** AICore enforces a per-app quota and rejects concurrent requests with BUSY; serialise them. */
  private val gate = Mutex()

  private fun client(): GenerativeModel =
    model ?: Generation.getClient(generationConfig {
      modelConfig = modelConfig {
        this.releaseStage = this@PixelNanoModule.releaseStage
        this.preference = this@PixelNanoModule.preference
      }
    }).also { model = it }

  private fun statusName(s: Int): String = when (s) {
    FeatureStatus.AVAILABLE -> "available"
    FeatureStatus.DOWNLOADABLE -> "downloadable"
    FeatureStatus.DOWNLOADING -> "downloading"
    else -> "unavailable"
  }

  private fun finishName(r: Int?): String = when (r) {
    Candidate.FinishReason.STOP -> "STOP"
    Candidate.FinishReason.MAX_TOKENS -> "MAX_TOKENS"
    null -> "UNKNOWN"
    else -> "OTHER"
  }

  private fun codeName(e: GenAiException): String = when (e.errorCode) {
    GenAiException.ErrorCode.NOT_AVAILABLE -> "NOT_AVAILABLE"
    GenAiException.ErrorCode.BUSY -> "BUSY"
    GenAiException.ErrorCode.CANCELLED -> "CANCELLED"
    GenAiException.ErrorCode.REQUEST_TOO_LARGE -> "REQUEST_TOO_LARGE"
    GenAiException.ErrorCode.REQUEST_TOO_SMALL -> "REQUEST_TOO_SMALL"
    GenAiException.ErrorCode.REQUEST_PROCESSING_ERROR -> "REQUEST_PROCESSING_ERROR"
    GenAiException.ErrorCode.RESPONSE_PROCESSING_ERROR -> "RESPONSE_PROCESSING_ERROR"
    GenAiException.ErrorCode.RESPONSE_GENERATION_ERROR -> "RESPONSE_GENERATION_ERROR"
    GenAiException.ErrorCode.NOT_SUPPORTED -> "NOT_SUPPORTED"
    GenAiException.ErrorCode.PER_APP_BATTERY_USE_QUOTA_EXCEEDED -> "BATTERY_QUOTA_EXCEEDED"
    GenAiException.ErrorCode.BACKGROUND_USE_BLOCKED -> "BACKGROUND_USE_BLOCKED"
    GenAiException.ErrorCode.NOT_ENOUGH_DISK_SPACE -> "NOT_ENOUGH_DISK_SPACE"
    GenAiException.ErrorCode.NEEDS_SYSTEM_UPDATE -> "NEEDS_SYSTEM_UPDATE"
    GenAiException.ErrorCode.AICORE_INCOMPATIBLE -> "AICORE_INCOMPATIBLE"
    GenAiException.ErrorCode.INVALID_INPUT_IMAGE -> "INVALID_INPUT_IMAGE"
    else -> "UNKNOWN"
  }

  private inline fun <T> guarded(block: () -> T): T = try {
    block()
  } catch (e: GenAiException) {
    throw NanoException(codeName(e), e.message ?: codeName(e), e)
  }

  private fun num(o: Map<String, Any?>?, key: String): Double? = (o?.get(key) as? Number)?.toDouble()

  /** Builds the request from a prompt plus optional systemInstruction / imageBase64 / sampling options. */
  private fun buildRequest(prompt: String, o: Map<String, Any?>?): GenerateContentRequest {
    val text = TextPart(prompt)
    val system = (o?.get("systemInstruction") as? String)?.takeIf { it.isNotBlank() }?.let { SystemInstruction(it) }
    val image = (o?.get("imageBase64") as? String)?.takeIf { it.isNotBlank() }?.let {
      ImagePart(Base64.decode(it, Base64.DEFAULT))
    }
    val configure: GenerateContentRequest.Builder.() -> Unit = {
      num(o, "temperature")?.let { temperature = it.toFloat() }
      num(o, "topK")?.let { topK = it.toInt() }
      num(o, "candidateCount")?.let { candidateCount = it.toInt() }
      num(o, "maxOutputTokens")?.let { maxOutputTokens = it.toInt() }
      num(o, "seed")?.let { seed = it.toInt() }
      enableThinking = o?.get("thinking") == true
    }
    return when {
      system != null && image != null -> generateContentRequest(system, image, text, configure)
      system != null -> generateContentRequest(system, text, configure)
      image != null -> generateContentRequest(image, text, configure)
      else -> generateContentRequest(text, configure)
    }
  }

  private fun resultMap(res: GenerateContentResponse, latencyMs: Long, firstTokenMs: Long?): Map<String, Any?> {
    val candidate = res.candidates.firstOrNull()
    return mapOf(
      "text" to (candidate?.text ?: ""),
      "finishReason" to finishName(candidate?.finishReason),
      "thoughts" to res.thoughtProcess.map { it.text },
      "latencyMs" to latencyMs,
      "firstTokenMs" to firstTokenMs,
    )
  }

  private suspend fun ensureAvailable() {
    val s = client().checkStatus()
    if (s != FeatureStatus.AVAILABLE) throw NanoException("NOT_AVAILABLE", "Gemini Nano is ${statusName(s)} on this device", null)
  }

  override fun definition() = ModuleDefinition {
    Name("PixelNano")

    Events("onDownloadProgress", "onToken", "onThought")

    // ───────────────────────── Availability & model facts ─────────────────────────
    AsyncFunction("checkStatus") Coroutine { ->
      guarded { statusName(client().checkStatus()) }
    }

    /** Facts reported by AICore for the model it will serve this app. Unknown fields are null. */
    AsyncFunction("getModelInfo") Coroutine { ->
      val c = client()
      val status = guarded { c.checkStatus() }
      mapOf(
        "status" to statusName(status),
        "baseModelName" to runCatching { c.getBaseModelName() }.getOrNull(),
        "tokenLimit" to runCatching { c.getTokenLimit() }.getOrNull(),
        "thinkingModeAvailable" to runCatching { c.isThinkingModeAvailable() }.getOrNull(),
        "systemPromptAvailable" to runCatching { c.isSystemPromptAvailable() }.getOrNull(),
        "structuredOutputAvailable" to runCatching { c.isStructuredOutputFeatureAvailable() }.getOrNull(),
        "cachingAvailable" to runCatching { c.isCachingFeatureAvailable() }.getOrNull(),
        "aicoreVersion" to runCatching { context.packageManager.getPackageInfo("com.google.android.aicore", 0).versionName }.getOrNull(),
        "releaseStage" to (if (releaseStage == ModelReleaseStage.PREVIEW) "preview" else "stable"),
        "preference" to (if (preference == ModelPreference.FAST) "fast" else "full"),
      )
    }

    /** Selects the AICore model track. Recreates the client; takes effect on the next call. */
    Function("setModelConfig") { stage: String, pref: String ->
      releaseStage = if (stage == "preview") ModelReleaseStage.PREVIEW else ModelReleaseStage.STABLE
      preference = if (pref == "fast") ModelPreference.FAST else ModelPreference.FULL
      model?.close()
      model = null
    }

    /** Streams AICore's download progress as events and resolves with the final status. */
    AsyncFunction("download") Coroutine { ->
      guarded {
        client().download().collect { s ->
          when (s) {
            is DownloadStatus.DownloadStarted ->
              sendEvent("onDownloadProgress", mapOf("phase" to "started", "bytes" to 0L))
            is DownloadStatus.DownloadProgress ->
              sendEvent("onDownloadProgress", mapOf("phase" to "progress", "bytes" to s.totalBytesDownloaded))
            is DownloadStatus.DownloadCompleted ->
              sendEvent("onDownloadProgress", mapOf("phase" to "completed"))
            is DownloadStatus.DownloadFailed ->
              throw NanoException(codeName(s.e), s.e.message ?: "download failed", s.e)
          }
        }
        statusName(client().checkStatus())
      }
    }

    /** Loads the model into AICore ahead of the first prompt. Returns the wall time it took. */
    AsyncFunction("warmup") Coroutine { ->
      val t0 = SystemClock.elapsedRealtime()
      guarded { client().warmup() }
      SystemClock.elapsedRealtime() - t0
    }

    /** Token count from the on-device tokenizer for the exact request that would be sent. */
    AsyncFunction("countTokens") Coroutine { prompt: String, options: Map<String, Any?>? ->
      guarded { client().countTokens(buildRequest(prompt, options)).totalTokens }
    }

    // ───────────────────────── Generation ─────────────────────────
    AsyncFunction("generate") Coroutine { prompt: String, options: Map<String, Any?>? ->
      gate.withLock {
        ensureAvailable()
        val req = buildRequest(prompt, options)
        val t0 = SystemClock.elapsedRealtime()
        val res = guarded { client().generateContent(req) }
        resultMap(res, SystemClock.elapsedRealtime() - t0, null)
      }
    }

    /** Streams tokens as `onToken` / `onThought` events tagged with requestId; resolves with the full result. */
    AsyncFunction("stream") Coroutine { requestId: String, prompt: String, options: Map<String, Any?>? ->
      gate.withLock {
        ensureAvailable()
        val req = buildRequest(prompt, options)
        val t0 = SystemClock.elapsedRealtime()
        var firstTokenMs: Long? = null
        val res = guarded {
          client().generateContent(req, object : StreamingCallback {
            override fun onNewText(additionalText: String) {
              if (firstTokenMs == null) firstTokenMs = SystemClock.elapsedRealtime() - t0
              sendEvent("onToken", mapOf("requestId" to requestId, "text" to additionalText))
            }
            override fun onNewThought(additionalThought: String) {
              sendEvent("onThought", mapOf("requestId" to requestId, "text" to additionalThought))
            }
          })
        }
        resultMap(res, SystemClock.elapsedRealtime() - t0, firstTokenMs)
      }
    }

    Function("close") {
      model?.close()
      model = null
    }

    OnDestroy {
      model?.close()
      model = null
    }
  }
}
