# Knitting Pattern Converter - Enhancement Plan

## Overview
Comprehensive enhancement of the knitting pattern converter with improved architecture, expanded functionality, and better parsing logic.

## Current State
- Single `index.html` file with embedded CSS (~230 lines) and JS (~270 lines)
- Basic abbreviation list (18 terms)
- Only converts row instruction lines, other lines pass through unchanged
- No persistence, no clipboard, no accessibility features

## New File Structure
```
/var/www/patternrec/
├── index.html              # Markup only
├── css/
│   ├── styles.css          # Main styles
│   └── print.css           # Print-specific styles
├── js/
│   ├── abbreviations.js    # Abbreviation data (~50+ terms)
│   ├── converter.js        # KnittingPatternConverter class
│   ├── storage.js          # LocalStorage manager
│   ├── ui.js               # UIController class
│   └── app.js              # Entry point
├── README.md
└── sample_pattern.txt
```

## Implementation Phases

### Phase 1: Foundation
1. **File Structure Split** - Extract CSS to `css/styles.css`, JS to separate modules
2. **Expanded Abbreviations** - Create comprehensive list (50+ terms) with multi-word terms:
   - slip slip knit, yarn over, cast on, bind off, through back loop
   - knit front and back, purl front and back, pass slipped stitch over
   - make one left/right, with yarn in front/back, place/slip marker
   - double pointed needles, cable needle, main/contrast color
   - knit 2/3 together, purl 2/3 together, stockinette stitch, etc.
3. **Fix Parsing Logic** - Apply abbreviations to ALL lines, not just row instructions
   - Current bug: "Cast on 30 stitches" and "Bind off all stitches" in sample_pattern.txt are NOT converted
   - Solution: Process every line except structural markers (headers, separators, bullet points)

### Phase 2: Core Features
4. **Copy to Clipboard** - Button with navigator.clipboard API + fallback for older browsers
5. **Local Storage** - StorageManager class for:
   - Conversion history (last 10 with timestamps)
   - Custom abbreviations (user-defined mappings)
6. **Reverse Conversion** - Expand abbreviated patterns back to full words (beginner-friendly)

### Phase 3: Enhanced UX
7. **Custom Abbreviations UI** - Panel to add/edit/delete custom mappings
8. **History UI** - Panel to view and reload past conversions
9. **Print-Friendly View** - `print.css` hiding UI chrome, clean layout

### Phase 4: Accessibility
10. **ARIA Labels** - All interactive elements properly labeled
11. **Keyboard Navigation** - Ctrl+Enter to convert, Ctrl+S to download
12. **Screen Reader Announcements** - Live regions for status updates
13. **Skip Link** - Jump to main content

## Key Technical Decisions

### Abbreviation Processing Order
Multi-word phrases must be processed BEFORE single words:
```javascript
// Sort by length descending: "yarn over" before "yarn"
const sorted = Object.entries(abbreviations)
    .sort((a, b) => b[0].length - a[0].length);
```

### Structural Line Detection
Preserve headers/structure, convert everything else:
```javascript
isStructuralLine(line) {
    const patterns = [
        /^={3,}$/, /^-{3,}$/,     // Separators
        /^Materials:/i,           // Section headers
        /^Supplies:/i, /^Notes:/i,
        /^-\s/,                   // Bullet points
    ];
    return patterns.some(p => p.test(line));
}
```

### Clipboard Fallback
```javascript
if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
} else {
    // execCommand fallback for older browsers
}
```

## Edge Cases to Handle
- Multi-word phrase overlap ("yarn over" vs "yarn")
- Numbers in abbreviations (k2tog should not expand "2" to "together")
- Parenthetical instructions: "(knit 2, purl 2) 3 times"
- Asterisk repeat markers: "*k2, p2; rep from * to end"
- Storage quota exceeded / private browsing mode
- Clipboard permissions denied

## Files to Modify/Create
- `/var/www/patternrec/index.html` - Strip CSS/JS, add new HTML structure
- `/var/www/patternrec/css/styles.css` - New file
- `/var/www/patternrec/css/print.css` - New file
- `/var/www/patternrec/js/abbreviations.js` - New file
- `/var/www/patternrec/js/converter.js` - New file
- `/var/www/patternrec/js/storage.js` - New file
- `/var/www/patternrec/js/ui.js` - New file
- `/var/www/patternrec/js/app.js` - New file

## Verification
1. Load `index.html` in browser
2. Upload `sample_pattern.txt`
3. Verify "Cast on 30 stitches" converts to "CO 30 sts" (currently broken)
4. Verify "Bind off all stitches" converts to "BO all sts" (currently broken)
5. Test copy to clipboard
6. Test reverse conversion (abbreviated -> full words)
7. Test history persistence across page reload
8. Test custom abbreviation add/delete
9. Test print view (Ctrl+P)
10. Test keyboard navigation (Ctrl+Enter, Tab through buttons)
11. Test with screen reader (VoiceOver/NVDA)
