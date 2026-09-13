# Z-Score Explorer

An interactive standard normal distribution calculator built with vanilla HTML, CSS, and JavaScript. All computations run entirely in your browser — no server, no dependencies.

![Z-Score Explorer](https://img.shields.io/badge/Status-Live-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue)

## Features

- **Z-Score Calculator** — Compute probabilities for four modes:
  - Area from 0 → Z
  - Left tail P(Z ≤ z)
  - Right tail P(Z ≥ z)
  - Between two Z-scores P(z₁ ≤ Z ≤ z₂)
- **Interactive Bell Curve** — Real-time SVG visualization with shaded areas, Z-markers, and σ labels
- **Probability Breakdown Bar** — Visual split of left tail, center area, and right tail
- **Z-Table Lookup** — Shows the traditional row/column/value decomposition
- **Raw Score ↔ Z-Score Converter** — Convert between raw scores and Z-scores using custom μ and σ
- **Confidence Interval Cards** — Quick-load common critical values (90%, 95%, 99%)
- **Reference Table** — Common Z-scores with CDF, percentile, and tail probabilities
- **Dark / Light Theme** — Toggle with automatic OS preference detection
- **Fully Responsive** — Works on desktop, tablet, and mobile

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

The CDF is computed using the **Abramowitz & Stegun rational approximation** (formula 7.1.26), which provides accuracy to ~1.5 × 10⁻⁷:

```
Φ(z) = 1 - φ(z)(a₁t + a₂t² + a₃t³ + a₄t⁴ + a₅t⁵)
where t = 1 / (1 + 0.2316419·|z|)
```

The PDF uses the standard formula:

```
f(x) = (1/√2π) · e^(−x²/2)
```

### Visualization

The bell curve is rendered as an SVG with:
- 400-step polyline for smooth curve rendering
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
