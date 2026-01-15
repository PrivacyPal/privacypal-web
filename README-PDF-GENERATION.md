# PDF Generation for Pitch Deck

This directory contains scripts to generate PDF versions of the pitch deck presentation.

## Requirements

- Node.js (v14 or higher)
- npm

## Installation

Install dependencies:

```bash
npm install
```

## Usage

Generate both color and grayscale PDFs:

```bash
npm run generate-pdf
```

Or directly:

```bash
node generate-pdf.js
```

## Output

The script generates two PDF files in the `presentations/` directory:

1. **pitch-deck-color.pdf** - Full-color version of the pitch deck
2. **pitch-deck-grayscale.pdf** - Black & white/grayscale version for printing

## PDF Specifications

- **Orientation**: Landscape
- **Page Size**: A4 (11.69in × 8.27in)
- **Margins**: None (full-page)
- **Format**: Each slide occupies exactly one page
- **Background**: Included (printBackground: true)

## Notes

- The script automatically hides navigation elements and animations
- All 12 slides are included in the PDF
- The grayscale version uses CSS filters to convert colors to grayscale

