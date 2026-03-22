# 3D Print Price Calculator (Next.js)

A client-side calculator for estimating the cost of 3D-printed keychains and small parts. Built with Next.js App Router — all logic runs in the browser, no backend required.

## Features

- **STL file upload** — automatically parses volume from binary and ASCII STL files
- **Image/logo support** — PNG, JPG, SVG with manual keychain dimensions
- **Material selection** — PLA, PLA+, PETG, ABS, ASA, TPU, Nylon, CF blends, PC, PA-CF/PA-GF
- **Print parameters** — infill presets and wall thickness
- **Add-ons** — NFC tag embedding, resin coating, keychain ring
- **Quantity pricing** — bulk discounts (5% >= 30 pcs, 7% >= 50, 10% >= 100, 20% >= 200, 28% >= 400, 32% >= 600, 40% >= 1000; min. 4 PLN/pc)
- **Cost breakdown** — material, machine time, setup fee, and add-ons

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## Assumptions & Simplifications

- STL units are treated as millimetres.
- 35% of volume is allocated to perimeters; the rest is scaled by the infill factor.
- Print speed: 12 000 mm³/h. Machine rate: 12 PLN/h. One-time setup fee (file prep & review): 20 PLN per order.
- Bulk discounts apply to the per-unit cost (material + time + add-ons); the setup fee is always fixed.
- Unit price is floored at 4 PLN to preserve a minimum margin at high volumes.
- The algorithm is an approximation and should be calibrated to actual costs for a specific print shop.

## Roadmap

- STL mesh validation (e.g. non-manifold detection).
- STL preview renderer (e.g. Three.js).
- PDF export or email summary.

## Contact

[apps@karpas.pl](mailto:apps@karpas.pl)
