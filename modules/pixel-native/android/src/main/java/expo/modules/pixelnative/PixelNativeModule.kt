package expo.modules.pixelnative

import android.app.ActivityManager
import android.content.Context
import android.content.pm.PackageManager
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.opengl.EGL14
import android.opengl.EGLConfig
import android.opengl.GLES20
import android.os.Build
import android.os.Debug
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.os.Process
import android.os.SystemClock
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.view.Choreographer
import android.view.Display
import android.view.WindowManager
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

class NativeUnavailableException(what: String, why: String) :
  CodedException("E_PIXEL_NATIVE_UNAVAILABLE", "$what unavailable: $why", null)

/**
 * PixelNative: real Android platform telemetry and actuators for PixelKit.
 * Everything here reads or drives actual hardware/OS state. Nothing is fabricated;
 * when an API is missing on the device the function reports null or throws.
 */
class PixelNativeModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw NativeUnavailableException("React context", "lost")

  private val mainHandler = Handler(Looper.getMainLooper())
  private var thermalListener: PowerManager.OnThermalStatusChangedListener? = null
  private var frameCallback: Choreographer.FrameCallback? = null
  private var torchCallback: CameraManager.TorchCallback? = null

  // App-process CPU sampling state
  private var lastCpuMs = 0L
  private var lastWallMs = 0L

  override fun definition() = ModuleDefinition {
    Name("PixelNative")

    Events("onThermalStatus", "onFrameStats", "onTorchState")

    // ───────────────────────── SoC / build identity ─────────────────────────
    Function("getSocInfo") {
      mapOf(
        "socModel" to (if (Build.VERSION.SDK_INT >= 31) Build.SOC_MODEL else null),
        "socManufacturer" to (if (Build.VERSION.SDK_INT >= 31) Build.SOC_MANUFACTURER else null),
        "hardware" to Build.HARDWARE,
        "device" to Build.DEVICE,
        "model" to Build.MODEL,
        "buildId" to Build.ID,
        "release" to Build.VERSION.RELEASE,
        "sdkInt" to Build.VERSION.SDK_INT,
        "sdkIntFull" to (if (Build.VERSION.SDK_INT >= 36) Build.VERSION.SDK_INT_FULL else null),
        "securityPatch" to Build.VERSION.SECURITY_PATCH,
        "supportedAbis" to Build.SUPPORTED_ABIS.toList(),
      )
    }

    Function("hasSystemFeature") { name: String -> context.packageManager.hasSystemFeature(name) }

    Function("getPackageVersion") { pkg: String ->
      try {
        val info = context.packageManager.getPackageInfo(pkg, 0)
        mapOf("installed" to true, "versionName" to info.versionName, "versionCode" to info.longVersionCode)
      } catch (e: PackageManager.NameNotFoundException) {
        mapOf("installed" to false, "versionName" to null, "versionCode" to null)
      }
    }

    // ───────────────────────── CPU ─────────────────────────
    Function("getCpuInfo") { cpuInfo() }

    Function("getCpuLoad") {
      val nowWall = SystemClock.elapsedRealtime()
      val nowCpu = Process.getElapsedCpuTime()
      val cores = Runtime.getRuntime().availableProcessors().coerceAtLeast(1)
      val appPercent = if (lastWallMs == 0L) null else {
        val wallDelta = (nowWall - lastWallMs).coerceAtLeast(1)
        ((nowCpu - lastCpuMs).toDouble() / wallDelta / cores * 100.0).coerceIn(0.0, 100.0)
      }
      lastWallMs = nowWall
      lastCpuMs = nowCpu
      val freqs = coreFrequencies()
      val util = freqs.mapNotNull { c ->
        val cur = c["curMHz"] as? Int
        val max = c["maxMHz"] as? Int
        if (cur != null && max != null && max > 0) cur.toDouble() / max else null
      }
      mapOf(
        "appCpuPercent" to appPercent,
        "frequencyUtilizationPercent" to (if (util.isEmpty()) null else util.average() * 100.0),
        "cores" to freqs,
      )
    }

    // ───────────────────────── Memory ─────────────────────────
    Function("getMemoryInfo") { memoryInfo() }

    Function("requestGc") {
      Runtime.getRuntime().gc()
      System.runFinalization()
      memoryInfo()
    }

    // ───────────────────────── Thermal / ADPF ─────────────────────────
    Function("getThermal") {
      val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
      val headroom = try { pm.getThermalHeadroom(0) } catch (e: Throwable) { Float.NaN }
      val thresholds: Map<String, Float>? = if (Build.VERSION.SDK_INT >= 35) {
        try { pm.thermalHeadroomThresholds.entries.associate { it.key.toString() to it.value } } catch (e: Throwable) { null }
      } else null
      mapOf(
        "thermalHeadroom" to (if (headroom.isNaN()) null else headroom.toDouble()),
        "thermalStatus" to pm.currentThermalStatus,
        "thresholds" to thresholds,
        "cpuHeadroom" to healthHeadroom("Cpu"),
        "gpuHeadroom" to healthHeadroom("Gpu"),
      )
    }

    OnStartObserving("onThermalStatus") {
      val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
      val listener = PowerManager.OnThermalStatusChangedListener { status ->
        sendEvent("onThermalStatus", mapOf("status" to status))
      }
      thermalListener = listener
      pm.addThermalStatusListener(listener)
    }

    OnStopObserving("onThermalStatus") {
      val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
      thermalListener?.let { pm.removeThermalStatusListener(it) }
      thermalListener = null
    }

    // ───────────────────────── Display ─────────────────────────
    Function("getDisplayInfo") { displayInfo() }

    AsyncFunction("setPreferredRefreshRate") { rate: Double ->
      val activity = appContext.currentActivity ?: throw NativeUnavailableException("Activity", "not resumed")
      val attrs = activity.window.attributes
      attrs.preferredRefreshRate = rate.toFloat()
      activity.window.attributes = attrs
      true
    }.runOnQueue(Queues.MAIN)

    // ───────────────────────── GPU ─────────────────────────
    Function("getGpuInfo") { gpuInfo() }

    OnStartObserving("onFrameStats") { startFrameStats() }
    OnStopObserving("onFrameStats") { frameCallback = null }

    // ───────────────────────── Torch ─────────────────────────
    Function("getTorchInfo") {
      val id = torchCameraId()
      if (id == null) mapOf("available" to false) else {
        val ch = cameraManager.getCameraCharacteristics(id)
        val max = if (Build.VERSION.SDK_INT >= 33) ch.get(CameraCharacteristics.FLASH_INFO_STRENGTH_MAXIMUM_LEVEL) else null
        val def = if (Build.VERSION.SDK_INT >= 33) ch.get(CameraCharacteristics.FLASH_INFO_STRENGTH_DEFAULT_LEVEL) else null
        val level = if (Build.VERSION.SDK_INT >= 33) try { cameraManager.getTorchStrengthLevel(id) } catch (e: Throwable) { null } else null
        mapOf("available" to true, "cameraId" to id, "maxStrengthLevel" to max, "defaultStrengthLevel" to def, "currentStrengthLevel" to level)
      }
    }

    AsyncFunction("setTorch") { on: Boolean, strengthLevel: Int? ->
      val id = torchCameraId() ?: throw NativeUnavailableException("Torch", "no rear camera with flash")
      try {
        if (on && strengthLevel != null && Build.VERSION.SDK_INT >= 33) {
          cameraManager.turnOnTorchWithStrengthLevel(id, strengthLevel.coerceAtLeast(1))
        } else {
          cameraManager.setTorchMode(id, on)
        }
        true
      } catch (e: Throwable) {
        throw CodedException("E_TORCH", e.message ?: "torch failed (camera in use?)", e)
      }
    }

    OnStartObserving("onTorchState") {
      val cb = object : CameraManager.TorchCallback() {
        override fun onTorchModeChanged(cameraId: String, enabled: Boolean) {
          sendEvent("onTorchState", mapOf("cameraId" to cameraId, "enabled" to enabled))
        }
        override fun onTorchModeUnavailable(cameraId: String) {
          sendEvent("onTorchState", mapOf("cameraId" to cameraId, "enabled" to false, "unavailable" to true))
        }
      }
      torchCallback = cb
      cameraManager.registerTorchCallback(cb, mainHandler)
    }

    OnStopObserving("onTorchState") {
      torchCallback?.let { cameraManager.unregisterTorchCallback(it) }
      torchCallback = null
    }

    // ───────────────────────── Haptics ─────────────────────────
    Function("getHapticsInfo") {
      val v = vibrator()
      val resonant = if (Build.VERSION.SDK_INT >= 30) v.resonantFrequency else Float.NaN
      val q = if (Build.VERSION.SDK_INT >= 30) v.qFactor else Float.NaN
      val envelope = if (Build.VERSION.SDK_INT >= 36) try { v.areEnvelopeEffectsSupported() } catch (e: Throwable) { false } else false
      val primitives = if (Build.VERSION.SDK_INT >= 30) PRIMITIVES.filter { (_, id) -> try { v.areAllPrimitivesSupported(id) } catch (e: Throwable) { false } }.keys.toList() else emptyList()
      mapOf(
        "hasVibrator" to v.hasVibrator(),
        "hasAmplitudeControl" to v.hasAmplitudeControl(),
        "envelopeEffectsSupported" to envelope,
        "resonantFrequencyHz" to (if (resonant.isNaN()) null else resonant.toDouble()),
        "qFactor" to (if (q.isNaN()) null else q.toDouble()),
        "supportedPrimitives" to primitives,
      )
    }

    Function("playEnvelope") { points: List<Map<String, Any?>>, initialSharpness: Double? ->
      if (Build.VERSION.SDK_INT < 36) throw NativeUnavailableException("Envelope haptics", "requires Android 16")
      val v = vibrator()
      if (!v.areEnvelopeEffectsSupported()) throw NativeUnavailableException("Envelope haptics", "not supported by this vibrator")
      val b = VibrationEffect.BasicEnvelopeBuilder()
      initialSharpness?.let { b.setInitialSharpness(it.toFloat().coerceIn(0f, 1f)) }
      var lastIntensity = 1f
      for (p in points) {
        val i = ((p["intensity"] as? Number)?.toFloat() ?: 0f).coerceIn(0f, 1f)
        val s = ((p["sharpness"] as? Number)?.toFloat() ?: 0.5f).coerceIn(0f, 1f)
        val d = ((p["durationMs"] as? Number)?.toLong() ?: 50L).coerceAtLeast(1L)
        b.addControlPoint(i, s, d)
        lastIntensity = i
      }
      if (lastIntensity != 0f) b.addControlPoint(0f, 0.5f, 20L) // envelopes must end at zero
      v.vibrate(b.build())
      true
    }

    Function("playPrimitives") { steps: List<Map<String, Any?>> ->
      if (Build.VERSION.SDK_INT < 30) throw NativeUnavailableException("Primitive haptics", "requires Android 11")
      val v = vibrator()
      val comp = VibrationEffect.startComposition()
      for (s in steps) {
        val name = (s["primitive"] as? String)?.uppercase() ?: "CLICK"
        val id = PRIMITIVES[name] ?: throw CodedException("E_HAPTIC_PRIMITIVE", "Unknown primitive $name", null)
        val scale = ((s["scale"] as? Number)?.toFloat() ?: 1f).coerceIn(0f, 1f)
        val delay = ((s["delayMs"] as? Number)?.toInt() ?: 0).coerceAtLeast(0)
        comp.addPrimitive(id, scale, delay)
      }
      v.vibrate(comp.compose())
      true
    }

    Function("cancelVibration") { vibrator().cancel(); true }

    OnDestroy {
      frameCallback = null
      thermalListener?.let { (context.getSystemService(Context.POWER_SERVICE) as PowerManager).removeThermalStatusListener(it) }
      torchCallback?.let { cameraManager.unregisterTorchCallback(it) }
    }
  }

  // ───────────────────────── helpers ─────────────────────────

  private val cameraManager: CameraManager
    get() = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager

  private fun torchCameraId(): String? = try {
    cameraManager.cameraIdList.firstOrNull { id ->
      val c = cameraManager.getCameraCharacteristics(id)
      c.get(CameraCharacteristics.FLASH_INFO_AVAILABLE) == true &&
        c.get(CameraCharacteristics.LENS_FACING) == CameraCharacteristics.LENS_FACING_BACK
    }
  } catch (e: Throwable) { null }

  private fun vibrator(): Vibrator =
    if (Build.VERSION.SDK_INT >= 31) (context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator
    else @Suppress("DEPRECATION") (context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator)

  @Suppress("DEPRECATION")
  private fun defaultDisplay(): Display =
    (context.getSystemService(Context.WINDOW_SERVICE) as WindowManager).defaultDisplay

  private fun readSys(path: String): String? = try { File(path).readText().trim() } catch (e: Throwable) { null }

  /** Per-core "CPU part" ids parsed from /proc/cpuinfo (index → part hex string). */
  private fun corePartIds(): Map<Int, String> {
    val result = mutableMapOf<Int, String>()
    var current = -1
    readSys("/proc/cpuinfo")?.lines()?.forEach { line ->
      val kv = line.split(":", limit = 2)
      if (kv.size == 2) {
        val k = kv[0].trim(); val v = kv[1].trim()
        if (k == "processor") current = v.toIntOrNull() ?: current
        if (k == "CPU part" && current >= 0) result[current] = v.lowercase()
      }
    }
    return result
  }

  private fun coreFrequencies(): List<Map<String, Any?>> {
    val n = Runtime.getRuntime().availableProcessors()
    val parts = corePartIds()
    return (0 until n).map { i ->
      val base = "/sys/devices/system/cpu/cpu$i/cpufreq"
      val part = parts[i]
      mapOf(
        "index" to i,
        "part" to part,
        "name" to (part?.let { PART_NAMES[it] ?: "Arm $it" }),
        "curMHz" to readSys("$base/scaling_cur_freq")?.toLongOrNull()?.div(1000)?.toInt(),
        "maxMHz" to readSys("$base/cpuinfo_max_freq")?.toLongOrNull()?.div(1000)?.toInt(),
        "minMHz" to readSys("$base/cpuinfo_min_freq")?.toLongOrNull()?.div(1000)?.toInt(),
      )
    }
  }

  private fun cpuInfo(): Map<String, Any?> {
    var implementer: String? = null
    readSys("/proc/cpuinfo")?.lines()?.forEach { line ->
      val kv = line.split(":", limit = 2)
      if (kv.size == 2 && kv[0].trim() == "CPU implementer") implementer = kv[1].trim()
    }
    val cores = coreFrequencies()
    // Cluster = same part + same max frequency, in ascending frequency order
    val clusters = cores.groupBy { Pair(it["part"] as? String, it["maxMHz"] as? Int) }
      .map { (key, list) -> mapOf("part" to key.first, "name" to (list.first()["name"]), "maxMHz" to key.second, "count" to list.size) }
      .sortedBy { (it["maxMHz"] as? Int) ?: 0 }
    return mapOf(
      "coreCount" to Runtime.getRuntime().availableProcessors(),
      "implementer" to implementer,
      "clusters" to clusters,
      "governor" to readSys("/sys/devices/system/cpu/cpu0/cpufreq/scaling_governor"),
      "cores" to cores,
    )
  }

  private fun memoryInfo(): Map<String, Any?> {
    val am = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
    val mi = ActivityManager.MemoryInfo().also { am.getMemoryInfo(it) }
    val rt = Runtime.getRuntime()
    return mapOf(
      "totalBytes" to mi.totalMem,
      "availableBytes" to mi.availMem,
      "lowMemoryThresholdBytes" to mi.threshold,
      "isLowMemory" to mi.lowMemory,
      "appJavaHeapUsedBytes" to (rt.totalMemory() - rt.freeMemory()),
      "appJavaHeapMaxBytes" to rt.maxMemory(),
      "appNativeHeapBytes" to Debug.getNativeHeapAllocatedSize(),
      "memoryClassMB" to am.memoryClass,
      "largeMemoryClassMB" to am.largeMemoryClass,
    )
  }

  /** SystemHealthManager.get{Cpu,Gpu}Headroom (Android 16+) via reflection so a naming drift degrades to null, not a build break. */
  private fun healthHeadroom(kind: String): Double? = try {
    if (Build.VERSION.SDK_INT < 36) null else {
      val shm = context.getSystemService("systemhealth") ?: return null
      val m = shm.javaClass.methods.firstOrNull { it.name == "get${kind}Headroom" } ?: return null
      val res = m.invoke(shm, *arrayOfNulls<Any>(m.parameterCount)) ?: return null
      val g = res.javaClass.methods.firstOrNull { it.name == "getHeadroom" } ?: return null
      (g.invoke(res) as? Float)?.toDouble()?.takeIf { !it.isNaN() }
    }
  } catch (e: Throwable) { null }

  private fun displayInfo(): Map<String, Any?> {
    val d = defaultDisplay()
    val mode = d.mode
    val hdr = d.hdrCapabilities
    val metrics = context.resources.displayMetrics
    val arr = if (Build.VERSION.SDK_INT >= 36) try { d.hasArrSupport() } catch (e: Throwable) { null } else null
    val rates = if (Build.VERSION.SDK_INT >= 36) try { d.supportedRefreshRates.toList() } catch (e: Throwable) { null } else null
    val suggestedHigh = if (Build.VERSION.SDK_INT >= 36) try { d.getSuggestedFrameRate(Display.FRAME_RATE_CATEGORY_HIGH) } catch (e: Throwable) { null } else null
    val suggestedNormal = if (Build.VERSION.SDK_INT >= 36) try { d.getSuggestedFrameRate(Display.FRAME_RATE_CATEGORY_NORMAL) } catch (e: Throwable) { null } else null
    return mapOf(
      "refreshRate" to mode.refreshRate,
      "modeId" to mode.modeId,
      "physicalWidth" to mode.physicalWidth,
      "physicalHeight" to mode.physicalHeight,
      "densityDpi" to metrics.densityDpi,
      "modes" to d.supportedModes.map { mapOf("id" to it.modeId, "width" to it.physicalWidth, "height" to it.physicalHeight, "refreshRate" to it.refreshRate) },
      "hdrTypes" to hdr?.supportedHdrTypes?.toList(),
      "maxLuminance" to hdr?.desiredMaxLuminance,
      "maxAverageLuminance" to hdr?.desiredMaxAverageLuminance,
      "isHdr" to d.isHdr,
      "isWideColorGamut" to d.isWideColorGamut,
      "hasArrSupport" to arr,
      "supportedRefreshRates" to rates,
      "suggestedFrameRateHigh" to suggestedHigh,
      "suggestedFrameRateNormal" to suggestedNormal,
    )
  }

  private fun gpuInfo(): Map<String, Any?> {
    var vulkan: String? = null
    try {
      val f = context.packageManager.systemAvailableFeatures.firstOrNull { it.name == "android.hardware.vulkan.version" }
      f?.let { vulkan = "${it.version shr 22}.${(it.version shr 12) and 0x3ff}" }
    } catch (e: Throwable) { /* ignore */ }
    return try {
      val display = EGL14.eglGetDisplay(EGL14.EGL_DEFAULT_DISPLAY)
      val ver = IntArray(2)
      EGL14.eglInitialize(display, ver, 0, ver, 1)
      val attribs = intArrayOf(EGL14.EGL_RENDERABLE_TYPE, EGL14.EGL_OPENGL_ES2_BIT, EGL14.EGL_SURFACE_TYPE, EGL14.EGL_PBUFFER_BIT, EGL14.EGL_NONE)
      val configs = arrayOfNulls<EGLConfig>(1)
      val num = IntArray(1)
      EGL14.eglChooseConfig(display, attribs, 0, configs, 0, 1, num, 0)
      val ctx = EGL14.eglCreateContext(display, configs[0], EGL14.EGL_NO_CONTEXT, intArrayOf(EGL14.EGL_CONTEXT_CLIENT_VERSION, 2, EGL14.EGL_NONE), 0)
      val surf = EGL14.eglCreatePbufferSurface(display, configs[0], intArrayOf(EGL14.EGL_WIDTH, 1, EGL14.EGL_HEIGHT, 1, EGL14.EGL_NONE), 0)
      EGL14.eglMakeCurrent(display, surf, surf, ctx)
      val renderer = GLES20.glGetString(GLES20.GL_RENDERER)
      val vendor = GLES20.glGetString(GLES20.GL_VENDOR)
      val version = GLES20.glGetString(GLES20.GL_VERSION)
      EGL14.eglMakeCurrent(display, EGL14.EGL_NO_SURFACE, EGL14.EGL_NO_SURFACE, EGL14.EGL_NO_CONTEXT)
      EGL14.eglDestroySurface(display, surf)
      EGL14.eglDestroyContext(display, ctx)
      EGL14.eglTerminate(display)
      mapOf("renderer" to renderer, "vendor" to vendor, "glVersion" to version, "vulkanVersion" to vulkan)
    } catch (e: Throwable) {
      mapOf("renderer" to null, "vendor" to null, "glVersion" to null, "vulkanVersion" to vulkan, "error" to e.message)
    }
  }

  private fun startFrameStats() {
    val expectedNs = try { (1_000_000_000.0 / defaultDisplay().mode.refreshRate).toLong() } catch (e: Throwable) { 8_333_333L }
    val cb = object : Choreographer.FrameCallback {
      var lastNs = 0L; var windowStart = 0L
      var frames = 0; var sumNs = 0L; var maxNs = 0L; var jank = 0
      override fun doFrame(frameTimeNanos: Long) {
        if (lastNs != 0L) {
          val d = frameTimeNanos - lastNs
          frames++; sumNs += d; if (d > maxNs) maxNs = d
          if (d > expectedNs * 3 / 2) jank++
        } else windowStart = frameTimeNanos
        lastNs = frameTimeNanos
        if (frameTimeNanos - windowStart >= 1_000_000_000L && frames > 0) {
          sendEvent("onFrameStats", mapOf(
            "fps" to frames * 1e9 / (frameTimeNanos - windowStart),
            "avgFrameMs" to sumNs.toDouble() / frames / 1e6,
            "maxFrameMs" to maxNs / 1e6,
            "jankFrames" to jank,
            "frames" to frames,
            "expectedFrameMs" to expectedNs / 1e6,
          ))
          frames = 0; sumNs = 0; maxNs = 0; jank = 0; windowStart = frameTimeNanos
        }
        if (frameCallback === this) Choreographer.getInstance().postFrameCallback(this)
      }
    }
    frameCallback = cb
    mainHandler.post { Choreographer.getInstance().postFrameCallback(cb) }
  }

  companion object {
    private val PART_NAMES = mapOf(
      "0xd8c" to "Arm C1-Ultra", "0xd8b" to "Arm C1-Pro", "0xd8a" to "Arm C1-Premium", "0xd89" to "Arm C1-Nano",
      "0xd85" to "Cortex-X925", "0xd87" to "Cortex-A725", "0xd81" to "Cortex-A720", "0xd80" to "Cortex-A520",
      "0xd82" to "Cortex-X4", "0xd4e" to "Cortex-X3", "0xd4d" to "Cortex-A715", "0xd48" to "Cortex-X2",
      "0xd47" to "Cortex-A710", "0xd46" to "Cortex-A510", "0xd44" to "Cortex-X1", "0xd41" to "Cortex-A78",
      "0xd05" to "Cortex-A55",
    )
    private val PRIMITIVES: Map<String, Int> = buildMap {
      if (Build.VERSION.SDK_INT >= 30) {
        put("CLICK", VibrationEffect.Composition.PRIMITIVE_CLICK)
        put("TICK", VibrationEffect.Composition.PRIMITIVE_TICK)
        put("QUICK_RISE", VibrationEffect.Composition.PRIMITIVE_QUICK_RISE)
        put("SLOW_RISE", VibrationEffect.Composition.PRIMITIVE_SLOW_RISE)
        put("QUICK_FALL", VibrationEffect.Composition.PRIMITIVE_QUICK_FALL)
      }
      if (Build.VERSION.SDK_INT >= 31) {
        put("THUD", VibrationEffect.Composition.PRIMITIVE_THUD)
        put("SPIN", VibrationEffect.Composition.PRIMITIVE_SPIN)
        put("LOW_TICK", VibrationEffect.Composition.PRIMITIVE_LOW_TICK)
      }
    }
  }
}
