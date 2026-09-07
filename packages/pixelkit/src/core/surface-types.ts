/**
 * @file surface-types.ts
 * @description The shape of a navigation section, used by `ScreenScaffold`.
 *
 * PixelKit's own map of tabs, sections and hook homes lives with the demo app in
 * `src/core/surface.ts`, because "one home per hook" is a discipline about screens and a
 * consuming app has its own tabs. This is the one type that discipline is expressed in.
 */

/** Section within a tab. Each is a sub-tab in the tab's own navigation. */
export interface SurfaceSection {
  id: string;
  /** Sub-tab label, uppercased by the control. */
  title: string;
  /** One line under the header saying what this section is for. */
  blurb: string;
}
