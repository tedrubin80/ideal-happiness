# 🧶 Legendary Broccoli - Knitting Pattern Converter

A web-based application that converts text-based knitting patterns (such as those sold on Etsy) into standardized, professional knitting patterns with proper abbreviations and formatting.

## Features

- **File Upload**: Drag and drop or browse to upload text-based pattern files
- **Text Input**: Paste patterns directly into the text area
- **Smart Conversion**: Automatically standardizes common knitting terms and abbreviations
- **Download**: Save converted patterns as formatted text files
- **Beautiful UI**: Modern, responsive design with an intuitive interface

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

## Technical Details

- Pure HTML/CSS/JavaScript - no dependencies required
- Client-side processing - all conversions happen in your browser
- No data is sent to any server
- Lightweight and fast

## License

This project is open source and available for personal and commercial use.

## Contributing

Feel free to submit issues and enhancement requests! 
