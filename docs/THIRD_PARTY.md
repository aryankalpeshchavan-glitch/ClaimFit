# Third-Party Notices and Licences

This project incorporates architectural patterns, visual components, and motion utilities from the following open-source and team reference sources under the MIT Licence:

---

## 1. Custodia Reference Architecture

- **Project**: Custodia
- **Author**: Anjishnu Ghosh
- **Repository**: https://github.com/anjishnughosh72501/Custodia
- **Licence**: MIT Licence
- **Copyright**: Copyright (c) 2026 Anjishnu Ghosh

```
MIT License

Copyright (c) 2026 Anjishnu Ghosh

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- **Reused Components & Patterns**:
  - Modular product landing page architecture (`Landing.tsx`, `Hero.tsx`, `HeroDemo.tsx`, `TickerRow.tsx`, `TrustRow.tsx`, `HowItWorks.tsx`, `Catches.tsx`, `Dimensions.tsx`, `Scenarios.tsx`, `BenchmarkBand.tsx`, `Limits.tsx`, `Faq.tsx`, `CtaBand.tsx`).
  - Native client router (`router.ts`) supporting `/`, `/check`, `/r/:id`, prefetching, and view transitions.
  - Responsive app shell navigation and footer with server status pill (`Shell.tsx`).
  - Motion utilities (`useInView.ts`, `useReducedMotion.ts`, `Reveal.tsx`, `viewTransition.ts`).

---

## 2. React Bits Components

Adapted from React Bits (https://reactbits.dev) and integrated under the MIT Licence:

- **Source**: https://reactbits.dev
- **Repository**: https://github.com/DavidHDev/react-bits
- **Licence**: MIT Licence
- **Author**: David Haz (DavidHDev)

### Adapted Components:

1. **Shiny Text**
   - **Source**: https://reactbits.dev/text-animations/shiny-text
   - **Modifications**: Re-styled to use ClaimFit palette tokens (`--ink`, `--ok`, `--paper`), fully accessible with DOM text selectable and visible on first paint.

2. **Magnet**
   - **Source**: https://reactbits.dev/animations/magnet
   - **Modifications**: Implemented in TypeScript and CSS without external animation dependencies. Bound to desktop pointer only, automatically disabled under `prefers-reduced-motion`.

3. **Glare Hover**
   - **Source**: https://reactbits.dev/components/glare-hover
   - **Modifications**: Styled using ClaimFit tokens (`--rule`, `--paper`, `--shadow-1`, `--shadow-2`). Radial glare overlay tracks pointer coordinates and cleanly fades on exit. Respects reduced motion.

4. **Count Up**
   - **Source**: https://reactbits.dev/text-animations/count-up
   - **Modifications**: Implemented with native `requestAnimationFrame` and `useInView`. Renders immediate final target value when `prefers-reduced-motion` is active.

5. **Logo Loop / Ticker**
   - **Source**: https://reactbits.dev/components/logo-loop
   - **Modifications**: Displays verified claim dimensions (`±N%`, `N-day test`, `N users`, `using Tier`, `median ≠ avg`, `pts ≠ %`). Pauses on hover, focus, and document `visibilitychange`. Displays as static wrapped flex layout when `prefers-reduced-motion` is active.

---

## 3. Typography

- **Fraunces Variable**: SIL Open Font License (OFL-1.1), by Undercase Type.
- **Hanken Grotesk Variable**: SIL Open Font License (OFL-1.1), by Alfredo Marco Pradil.
