import android.hardware.lights.Light;
import android.hardware.lights.LightState;
import android.os.Binder;
import android.os.IBinder;
import java.lang.reflect.Array;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;

/**
 * HiLightProbe: shell-level proof that the Pixel 11 Pro HiLight LED array answers through the
 * Android lights service. Runs as uid 2000 (shell) via app_process, which holds
 * android.permission.CONTROL_DEVICE_LIGHTS. Uses the hidden ILightsManager binder by reflection
 * (the same interface the public LightsManager wraps) and public Light / LightState classes.
 *
 * usage (on device):
 *   CLASSPATH=/data/local/tmp/hilight.jar app_process /data/local/tmp HiLightProbe list
 *   CLASSPATH=/data/local/tmp/hilight.jar app_process /data/local/tmp HiLightProbe all  <AARRGGBB> <ms>
 *   CLASSPATH=/data/local/tmp/hilight.jar app_process /data/local/tmp HiLightProbe one  <AARRGGBB> <ms> <id>
 *
 * Every run ends with black writes, session close and three priority -1000 cleanup passes
 * (the sequence HiLight Studio 1.0.9 uses against the stuck-LED latch).
 */
public class HiLightProbe {
  static Class<?> iface;
  static Object svc;
  static Class<?> stateArrayClass;

  public static void main(String[] a) throws Exception {
    IBinder b = (IBinder) Class.forName("android.os.ServiceManager").getMethod("getService", String.class).invoke(null, "lights");
    if (b == null) { System.out.println("lights service not found"); return; }
    iface = Class.forName("android.hardware.lights.ILightsManager");
    svc = Class.forName("android.hardware.lights.ILightsManager$Stub").getMethod("asInterface", IBinder.class).invoke(null, b);
    stateArrayClass = Class.forName("[Landroid.hardware.lights.LightState;");

    List<?> lights = (List<?>) iface.getMethod("getLights").invoke(svc);
    ArrayList<Integer> appIds = new ArrayList<>();
    for (Object o : lights) {
      Light l = (Light) o;
      System.out.println("light id=" + l.getId() + " name=" + l.getName() + " ordinal=" + l.getOrdinal()
        + " type=" + l.getType() + " rgb=" + l.hasRgbControl() + " brightness=" + l.hasBrightnessControl() + extra(l));
      if (l.getType() == 10) appIds.add(l.getId());
    }
    System.out.println("application-type lights: " + appIds);
    String cmd = a.length > 0 ? a[0] : "list";
    if (cmd.equals("list")) { readback(appIds); return; }

    int color = (int) Long.parseLong(a[1], 16);
    long ms = Long.parseLong(a[2]);
    ArrayList<Integer> target = new ArrayList<>();
    if (cmd.equals("one")) target.add(Integer.parseInt(a[3])); else target.addAll(appIds);
    int[] ids = new int[target.size()];
    for (int i = 0; i < ids.length; i++) ids[i] = target.get(i);

    Method open = iface.getMethod("openSession", IBinder.class, int.class);
    Method set = iface.getMethod("setLightStates", IBinder.class, int[].class, stateArrayClass);
    Method close = iface.getMethod("closeSession", IBinder.class);

    IBinder token = new Binder();
    open.invoke(svc, token, 0);
    long t0 = System.nanoTime();
    set.invoke(svc, token, ids, states(ids.length, color));
    System.out.println("setLightStates(" + Integer.toHexString(color) + ") took " + (System.nanoTime() - t0) / 1000 + " us");
    readback(target);
    Thread.sleep(ms);
    set.invoke(svc, token, ids, states(ids.length, 0x01000000));
    Thread.sleep(40);
    set.invoke(svc, token, ids, states(ids.length, 0x00000000));
    close.invoke(svc, token);
    System.out.println("session closed");

    for (int pass = 0; pass < 3; pass++) {
      IBinder t = new Binder();
      open.invoke(svc, t, -1000);
      set.invoke(svc, t, ids, states(ids.length, 0x01000000));
      Thread.sleep(40);
      set.invoke(svc, t, ids, states(ids.length, 0x00000000));
      close.invoke(svc, t);
      Thread.sleep(300);
    }
    System.out.println("cleanup passes done");
    readback(target);
  }

  static Object states(int n, int color) {
    Object arr = Array.newInstance(LightState.class, n);
    for (int i = 0; i < n; i++) Array.set(arr, i, new LightState.Builder().setColor(color).build());
    return arr;
  }

  static void readback(List<Integer> ids) throws Exception {
    Method get = iface.getMethod("getLightState", int.class);
    StringBuilder sb = new StringBuilder("readback:");
    for (int id : ids) {
      LightState s = (LightState) get.invoke(svc, id);
      sb.append(" ").append(id).append("=").append(s == null ? "null" : Integer.toHexString(s.getColor()));
    }
    System.out.println(sb);
  }

  static String extra(Light l) {
    try {
      Method m = Light.class.getMethod("hasAnimationControl");
      Method p = Light.class.getMethod("getMinUpdatePeriodMillis");
      return " anim=" + m.invoke(l) + " minUpdateMs=" + p.invoke(l);
    } catch (Throwable t) { return ""; }
  }
}
