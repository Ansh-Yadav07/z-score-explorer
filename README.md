# Z-Score Explorer

An interactive standard normal distribution calculator built with vanilla HTML, CSS, and JavaScript. All computations run entirely in your browser — no server, no dependencies.

![Z-Score Explorer](https://img.shields.io/badge/Status-Live-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue)

## Features

- **Z-Score Calculator** — Compute probabilities for four modes:
  - Area from 0 → Z
  - Left tail P(Z ≤ z)
  - Right tail P(Z ≥ z)
  - Between two Z-scores P(z₁ ≤ Z ≤ z₂)
- **Interactive Bell Curve** — Responsive, animated SVG chart; drag on it (or use the slider) to move Z
- **Probability → Z** — Inverse lookup for left-tail, right-tail, or central probabilities
- **Probability Breakdown Bar** — Visual split of left tail, center area, and right tail
- **Z-Table Lookup** — Shows the traditional row/column/value decomposition
- **Raw Score ↔ Z-Score Converter** — Convert between raw scores and Z-scores using custom μ and σ
- **Confidence Interval Cards** — Load the central ±Z area for 90%, 95%, 99%
- **Reference Table** — Common Z-scores with CDF, percentile, and tail probabilities
- **Dark / Light Theme** — Toggle with automatic OS preference detection
- **Fully Responsive** — Mobile-first layout, touch-friendly controls, readable chart at any width
- **Animations** — Scroll reveals, animated chart transitions, count-up results (respects reduced-motion)

## Project Structure

```
NormalDistribution_calculator/
├── index.html          # HTML markup and page structure
├── css/
│   └── styles.css      # All styles — variables, theming, layout, responsive
├── js/
│   └── app.js          # All JavaScript — math, UI logic, SVG rendering, events
└── README.md
```

## Getting Started

No build tools or dependencies required. Just open the file in a browser:

```bash
# Clone the repository
git clone https://github.com/<your-username>/NormalDistribution_calculator.git

# Open in browser
open index.html
```

Or use a local server for development:

```bash
# Python
python3 -m http.server 8000

# Node.js (npx)
npx serve .
```

Then visit `http://localhost:8000`.

## How It Works

### Math Engine

The CDF is computed with the **Hart (1968) / West (2005) double-precision algorithm**, which keeps a relative error below 10⁻⁸ even far into the tails. Right-tail and between-area probabilities are computed from whichever tail avoids floating-point cancellation, so tiny probabilities (e.g. P(Z ≥ 5) ≈ 2.867 × 10⁻⁷) are reported correctly.

The inverse CDF uses **Acklam's rational approximation** refined with one Halley step.

The PDF uses the standard formula:

```
f(x) = (1/√2π) · e^(−x²/2)
```

### Visualization

The bell curve is rendered as an SVG with:
- Redrawn at the container's real pixel width so labels stay readable on phones
- Gradient-filled shaded regions for selected probability areas
- Dashed marker lines with labeled dots at Z-positions
- Dynamic σ and axis labels

## Tech Stack

| Layer   | Technology          |
|---------|---------------------|
| Markup  | HTML5               |
| Styling | CSS3 (custom properties, grid, clamp) |
| Logic   | Vanilla JavaScript (ES6+) |
| Fonts   | [DM Sans](https://fonts.google.com/specimen/DM+Sans) + [DM Mono](https://fonts.google.com/specimen/DM+Mono) via Google Fonts |

## Browser Support

Works in all modern browsers:
- Chrome / Edge 80+
- Firefox 75+
- Safari 13+

## License

This project is open source under the [MIT License](LICENSE).
