# Design System Specification: Editorial Student Living

## 1. Overview & Creative North Star
### Creative North Star: "The Academic Curator"
Traditional student housing apps often feel like cluttered spreadsheets or sterile marketplaces. This design system rejects the "template" aesthetic in favor of a high-end, editorial experience. We treat university housing as a lifestyle choice, not just a transaction. 

By leveraging the "Academic Curator" mindset, we combine the bold, geometric rigor of **Space Grotesk** with a sophisticated, layered UI. The experience is defined by **Organic Asymmetry**: large-scale 3D imagery (as seen in our inspiration) paired with generous white space and off-grid typography. We prioritize "breathing room" over information density, ensuring every interaction feels intentional, premium, and trustworthy.

---

## 2. Colors
Our palette is anchored in a deep, authoritative **Primary Violet (#4400b6)**, softened by an expansive range of architectural greys and high-chroma **Pink (#7d0036)** accents for micro-moments of delight.

### The Rules of Engagement
*   **The "No-Line" Rule:** 1px solid borders are strictly prohibited for sectioning. Structural boundaries must be created through background shifts. For example, a card using `surface-container-lowest` (#ffffff) should sit on a `surface-container-low` (#f3f3f5) background to define its shape.
*   **Surface Hierarchy:** Use the `surface-container` tiers to create "nested" depth. Higher-priority information should move toward the user visually by utilizing "brighter" surface tokens like `surface-bright`.
*   **Glass & Gradient Rule:** For elements that float over imagery (like price tags on a bedroom photo), use Glassmorphism. Apply `surface` colors at 60% opacity with a `24px` backdrop-blur. 
*   **Signature Textures:** Main CTAs should not be flat. Apply a subtle linear gradient from `primary` (#4400b6) to `primary-container` (#5d21df) at a 135° angle to add "soul" and dimension.

---

## 3. Typography
We utilize a dual-font strategy to balance character with readability.

*   **Display & Headlines (Space Grotesk):** Our voice. Space Grotesk's idiosyncratic terminals provide a "modern-brutalist" edge. Use `display-lg` for welcome screens and `headline-md` for property titles. 
*   **Body & Titles (Manrope):** Our workhorse. Manrope provides a neutral, highly legible contrast to the headlines. Use `body-lg` for property descriptions and `title-sm` for UI labels.

**Editorial Scale:** To achieve an editorial look, use extreme contrast. Pair a `display-lg` headline with a `label-md` caption immediately below it, skipping the middle-tier sizes to create a dynamic visual hierarchy.

---

## 4. Elevation & Depth
In this design system, depth is a feeling, not a shadow effect.

*   **Tonal Layering:** Avoid shadows for static cards. Instead, stack `surface-container-lowest` on `surface-container-high`.
*   **Ambient Shadows:** When an element must "float" (e.g., a bottom navigation bar or a modal), use a diffused ambient shadow. 
    *   *Values:* `Y: 20px`, `Blur: 40px`, `Color: on-surface (8% opacity)`. 
*   **The Ghost Border:** If a boundary is required for accessibility on high-key images, use the `outline-variant` token at **15% opacity**. Never use 100% opaque outlines.
*   **Curvature:** Use the `xl` (1.5rem) roundedness for large containers and imagery to maintain a "student-friendly" softness, while using `sm` (0.25rem) for interactive inputs to retain a sense of precision.

---

## 5. Components

### Buttons
*   **Primary:** Gradient (`primary` to `primary-container`), white text, `full` rounding. High-impact.
*   **Secondary:** `surface-container-highest` background with `primary` text. No border.
*   **Tertiary:** `on-surface` text with no background. Use for "Cancel" or "Skip" actions.

### Cards & Lists
*   **The "No Divider" Rule:** Forbid the use of 1px lines between list items. Use `spacing-8` (2rem) of vertical white space to separate content, or alternating `surface-container` subtle shifts.
*   **Property Cards:** Feature a large `xl` corner radius. The price should be a "Floating Glass" chip in the top-right corner using `surface-bright` at 70% opacity.

### Input Fields
*   **States:** Default state uses `surface-container-low`. Focus state uses a `ghost-border` of `primary` at 40% and a subtle `surface-tint` glow.
*   **Labels:** Use `label-md` in `on-surface-variant`. Labels should always sit outside the input box to maximize internal breathing room.

### Interactive "Pink" Accents
*   Use the `tertiary` (#7d0036) and `tertiary-fixed-dim` (#ffb1c1) exclusively for "Success" states, "Heart" favorites, or "New Property" badges to provide a warm, student-friendly counterpoint to the professional Violet.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical margins. If the left margin is `spacing-6`, try a right margin of `spacing-10` for headline elements to mimic magazine layouts.
*   **Do** lean into 3D iconography and character illustrations (referencing {{DATA:IMAGE:IMAGE_1}}).
*   **Do** use `spacing-20` (5rem) for section breaks to ensure the UI feels premium and unhurried.

### Don't
*   **Don't** use pure black (#000000). Always use `on-surface` (#1a1c1d) for text to maintain a soft, modern feel.
*   **Don't** use standard Material Design drop shadows. They look "cheap" in an editorial context.
*   **Don't** cram more than three primary property features (e.g., Wifi, Gym, Laundry) into a single card preview. Move the rest to the details page to preserve white space.