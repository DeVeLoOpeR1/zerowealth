# Zero Wealth browser test report

## Scope and environment

- Browser engine: Chromium (headless browser automation).
- Responsive viewport checks: 320×740, 390×844, 768×1024, 1366×768 and 1920×1080.
- Additional touch/mobile emulation: 375×812 and 390×844.
- Additional layout checks: 320×740, 768×1024 and 1440×900.
- Both `index.html` and `calculators.html` were loaded and exercised.
- This is Chromium responsive/touch emulation; it is not a native Safari-on-iOS or Firefox test.

## Results

- **10/10 responsive smoke checks passed** across the two main pages and five viewport profiles in the primary matrix.
- **50/50 calculator-tab checks passed**: all 10 calculator tools were opened at each of five responsive profiles.
- Theme: one site-wide setting (theme.js). Default is light; the theme button choice is saved and applied on every page and open tab. (The earlier time-of-day auto theme was removed.)
- Manual theme switching passed in each theme-boundary case and each responsive calculator test.
- No horizontal document overflow in the final viewport matrix.
- No browser JavaScript errors in the final responsive smoke checks.
- SIP chart rendered non-empty canvas pixels; 15 year rows were generated.
- Generic projection chart rendered non-empty canvas pixels.
- Switching to Real mode updated the explanatory note.
- Editing the SIP amount recalculated results.
- CSV export completed with filename `sip-breakdown-real.csv`.

## Fix made during testing

The first 320px landing-page test found a 13px horizontal overflow caused by the navigation CTA. A small-screen CSS rule now hides that navigation CTA at widths up to 360px; the hero CTA remains available. The retest showed no horizontal page overflow.

## Notes

These are automated browser checks of layout and core interactions, not a formal financial-model audit or a guarantee of identical behavior in every browser/operating system. Please run native Safari and Firefox acceptance tests before a public production release.
