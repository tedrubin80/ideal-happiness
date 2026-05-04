# Woolery — Knitting Pattern Converter

A web tool that shortens or spells out knitting patterns. Paste a pattern (or upload a `.txt` or `.pdf`) and toggle between full-word and abbreviated form.

## Features

- **Paste, type, or upload** a pattern (`.txt` up to 1 MB, `.pdf` up to 10 MB / 4 pages)
- **Two-way conversion**: shorten full words to standard abbreviations (`knit` → `k`), or spell abbreviations back out
- **Custom abbreviations**: define your own mappings, stored in your browser
- **History**: last 10 conversions are kept locally
- **Save / copy / print** the result

## How to Use

1. **Open the Application**: Simply open `index.html` in any modern web browser
2. **Load Your Pattern**: 
   - Drag and drop a `.txt` file onto the upload area, OR
   - Click "Choose File" to browse for a file, OR
   - Paste your pattern text directly into the text area
3. **Convert**: Click the "Convert Pattern" button
4. **Download**: Once converted, click "Download Pattern" to save the standardized version

## Pattern Format

The converter recognizes and standardizes:

- Row instructions (e.g., "Row 1:", "R1:", "1.")
- Common knitting terms (knit, purl, yarn over, etc.)
- Standard abbreviations (k, p, yo, st, sts, etc.)
- Pattern structure and formatting

### Example Input:
```
Row 1: Knit 2, purl 2, repeat to end
Row 2: Purl 2, knit 2, repeat to end
```

### Example Output:
```
Row 1: k 2, p 2, rep to end
Row 2: p 2, k 2, rep to end
```

## Supported Abbreviations

The converter automatically applies standard knitting abbreviations:

- knit → k
- purl → p
- stitch/stitches → st/sts
- yarn over → yo
- together → tog
- repeat → rep
- cast on → CO
- bind off → BO
- right side → RS
- wrong side → WS
- slip slip knit → ssk
- make one → m1
- And many more!

## Testing

A sample pattern file (`sample_pattern.txt`) is included for testing the converter.

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

## Privacy

- **Text-only conversions stay in your browser.** When you paste or type a pattern and use Shorten / Spell it out, no data leaves your device.
- **PDF reading uses our server.** When you upload a PDF, the file is sent to our backend, which uses an AI model (via OpenRouter) to read the pattern. We do not store the file or the extracted text after the response is returned.
- **History and custom abbreviations are stored in your browser only** (localStorage), never on our server.

## Architecture

- **Frontend**: static HTML/CSS/JS served by nginx. No build step.
- **Backend** (PDF reading only): small Node service at `/api/extract-pdf` that renders PDF pages and forwards them to OpenRouter (default model `google/gemma-3-4b-it`). Source lives outside this repo (`/opt/woolery-api`).
- **Secrets**: API keys live in `/etc/woolery/woolery.env` and are never committed.

## License

This project is open source and available for personal and commercial use.

## Contributing

Feel free to submit issues and enhancement requests! 
