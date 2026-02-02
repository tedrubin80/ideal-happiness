/**
 * Ollama Vision Integration for PDF Pattern Extraction
 * Uses local Ollama with vision models to extract pattern data from images/PDFs
 */

class OllamaPatternExtractor {
    constructor(options = {}) {
        this.baseUrl = options.baseUrl || 'http://localhost:11434';
        this.model = options.model || 'llava:7b';
        this.timeout = options.timeout || 120000; // 2 minutes for large patterns
    }

    /**
     * The master prompt for extracting knitting/crochet patterns from images
     * Designed to handle designer PDFs, scanned patterns, and image-based instructions
     */
    getExtractionPrompt() {
        return `You are a knitting and crochet pattern extraction specialist. Analyze this pattern image and extract ALL information in a structured, machine-readable format.

EXTRACT THE FOLLOWING SECTIONS (use exact headers):

=== PATTERN INFO ===
Title: [pattern name]
Designer: [designer/company name if visible]
Type: [knit/crochet/other]
Category: [garment type: sweater, hat, scarf, blanket, etc.]
Skill Level: [beginner/easy/intermediate/advanced]
Sizes: [list all sizes available]

=== MATERIALS ===
Yarn:
- Weight: [lace/fingering/sport/DK/worsted/aran/bulky/super bulky]
- Fiber: [wool, cotton, acrylic, blend, etc.]
- Brand/Name: [if specified]
- Yardage: [yards/meters needed per size]
- Color(s): [color names or codes]

Needles/Hooks:
- Size: [US/metric sizes]
- Type: [straight, circular, DPN, crochet hook]
- Length: [if specified for circulars]

Notions: [stitch markers, cable needle, tapestry needle, buttons, etc.]

=== GAUGE ===
Stitch Gauge: [X stitches = 4 inches/10cm]
Row Gauge: [X rows = 4 inches/10cm]
Pattern: [stockinette, garter, pattern stitch name]
Blocked: [yes/no if specified]
Note: [any gauge notes]

=== MEASUREMENTS ===
[List finished measurements for each size in a table format]
Size | Chest | Length | Sleeve | etc.

=== ABBREVIATIONS ===
[List ALL abbreviations used with their meanings, one per line]
k = knit
p = purl
k2tog = knit 2 together
ssk = slip slip knit
yo = yarn over
[continue for all abbreviations in the pattern]

=== SPECIAL TECHNIQUES ===
[List any special stitches, techniques, or stitch patterns with full instructions]
Example:
Seed Stitch (over odd number of sts):
Row 1: *K1, p1; rep from * to last st, k1.
Row 2: Rep Row 1.

=== PATTERN INSTRUCTIONS ===
[Extract the COMPLETE pattern instructions, preserving:]
- Row/Round numbers exactly as written
- Stitch counts in parentheses at end of rows
- Repeat instructions using asterisks: *k2, p2; rep from *
- Size variations in parentheses: k10 (12, 14, 16) sts
- Section headers (Back, Front, Left Sleeve, Right Sleeve, Finishing, etc.)

Example format:
BACK
Cast on 80 (88, 96, 104) sts.
Row 1 (RS): K2, *p2, k2; rep from * to end.
Row 2 (WS): P2, *k2, p2; rep from * to end.
Rows 3-10: Rep Rows 1-2 four more times.
Continue in stockinette st until piece measures 15 (15.5, 16, 16.5)" from cast on.

=== CHARTS ===
[If there are any knitting/crochet charts, describe them:]
Chart A: [X stitches wide x Y rows tall]
- Describe the pattern repeat
- List any special symbols and their meanings
- Note: [CHART IMAGE - see original pattern for visual]

=== SCHEMATIC ===
[If there's a schematic/diagram, extract all measurements:]
- Width at hem: X (X, X, X)"
- Width at bust: X (X, X, X)"
- Length to underarm: X (X, X, X)"
[etc.]

=== FINISHING INSTRUCTIONS ===
[Seaming, blocking, button placement, etc.]

=== NOTES ===
[Any additional pattern notes, tips, designer notes, or warnings]

=== EXTRACTION CONFIDENCE ===
Overall: [high/medium/low]
Unclear sections: [list any areas that were hard to read]
Missing content: [note if pages appear to be cut off or missing]

CRITICAL RULES:
1. PRESERVE EXACT STITCH COUNTS - these are essential for the pattern to work
2. Keep all repeat notation intact: *k2, p2; rep from * to end
3. Maintain size progressions exactly: k10 (12, 14, 16) sts
4. Do NOT summarize or paraphrase - extract verbatim where possible
5. If text is unclear, mark as: [UNCLEAR: your best interpretation]
6. Include EVERY row/round instruction - do not skip or abbreviate
7. Separate sections with blank lines for readability
8. Use standard abbreviation format: lowercase for stitches (k, p, yo)`;
    }

    /**
     * Check if Ollama is available and running
     * @returns {Promise<{available: boolean, models: string[], visionModels: string[], error: string|null}>}
     */
    async checkAvailability() {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });

            if (!response.ok) {
                return { available: false, models: [], visionModels: [], error: 'Ollama not responding' };
            }

            const data = await response.json();
            const models = data.models?.map(m => m.name) || [];
            const visionModels = models.filter(m =>
                m.includes('vision') ||
                m.includes('llava') ||
                m.includes('bakllava') ||
                m.includes('moondream')
            );

            return {
                available: true,
                models: models,
                visionModels: visionModels,
                hasVisionModel: visionModels.length > 0,
                error: null
            };
        } catch (err) {
            return {
                available: false,
                models: [],
                visionModels: [],
                hasVisionModel: false,
                error: err.message || 'Cannot connect to Ollama'
            };
        }
    }

    /**
     * Convert a File/Blob to base64
     * @param {File|Blob} file - The file to convert
     * @returns {Promise<string>} Base64 encoded string (without data URL prefix)
     */
    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Convert PDF pages to images using PDF.js
     * @param {File} pdfFile - The PDF file
     * @returns {Promise<string[]>} Array of base64 encoded PNG images
     */
    async pdfToImages(pdfFile) {
        if (typeof pdfjsLib === 'undefined') {
            throw new Error('PDF.js library not loaded. Include pdf.js to enable PDF extraction.');
        }

        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const images = [];

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const scale = 2.0; // Higher resolution for better OCR accuracy
            const viewport = page.getViewport({ scale });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            const base64 = canvas.toDataURL('image/png').split(',')[1];
            images.push(base64);
        }

        return images;
    }

    /**
     * Extract pattern from an image using Ollama vision model
     * @param {string} base64Image - Base64 encoded image
     * @param {string} customPrompt - Optional custom prompt override
     * @returns {Promise<string>} Extracted pattern text
     */
    async extractFromImage(base64Image, customPrompt = null) {
        const prompt = customPrompt || this.getExtractionPrompt();

        const response = await fetch(`${this.baseUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.model,
                prompt: prompt,
                images: [base64Image],
                stream: false,
                options: {
                    temperature: 0.1,
                    num_predict: 8192
                }
            }),
            signal: AbortSignal.timeout(this.timeout)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Ollama error: ${error}`);
        }

        const data = await response.json();
        return data.response;
    }

    /**
     * Extract pattern from a PDF file with progress reporting
     * @param {File} pdfFile - The PDF file to process
     * @param {Function} onProgress - Progress callback: (pageNum, totalPages, status)
     * @returns {Promise<string>} Combined extracted pattern text
     */
    async extractFromPDF(pdfFile, onProgress = null) {
        if (onProgress) onProgress(0, 0, 'Converting PDF to images...');

        const images = await this.pdfToImages(pdfFile);
        const results = [];

        for (let i = 0; i < images.length; i++) {
            if (onProgress) {
                onProgress(i + 1, images.length, `Extracting page ${i + 1} of ${images.length}...`);
            }

            let pagePrompt = this.getExtractionPrompt();
            if (images.length > 1) {
                pagePrompt = `This is page ${i + 1} of ${images.length} of a knitting/crochet pattern.\n\n${pagePrompt}`;
            }

            const pageText = await this.extractFromImage(images[i], pagePrompt);
            results.push(`\n${'='.repeat(60)}\nPAGE ${i + 1}\n${'='.repeat(60)}\n${pageText}`);
        }

        if (onProgress) onProgress(images.length, images.length, 'Processing complete!');

        return this.combinePageResults(results);
    }

    /**
     * Combine multi-page extraction results
     * @param {string[]} pageResults - Array of extracted text from each page
     * @returns {string} Combined pattern text
     */
    combinePageResults(pageResults) {
        if (pageResults.length === 1) {
            return pageResults[0].replace(/^[\n=\s]*PAGE 1[\n=\s]*/, '');
        }
        return pageResults.join('\n\n');
    }

    /**
     * Quick extraction with simpler prompt for faster results
     * @param {string} base64Image - Base64 encoded image
     * @returns {Promise<string>} Extracted pattern text
     */
    async quickExtract(base64Image) {
        const quickPrompt = `Extract all text from this knitting/crochet pattern image.
Include:
- Pattern title and designer
- Materials (yarn, needles/hooks, notions)
- Gauge information
- All abbreviations with definitions
- Complete row-by-row instructions with stitch counts
- Any notes or finishing instructions

Preserve exact stitch counts and formatting. Do not summarize.`;

        return this.extractFromImage(base64Image, quickPrompt);
    }

    /**
     * Extract just the abbreviations from a pattern image
     * @param {string} base64Image - Base64 encoded image
     * @returns {Promise<Object>} Object mapping abbreviations to definitions
     */
    async extractAbbreviations(base64Image) {
        const abbrevPrompt = `Extract ONLY the abbreviations from this knitting/crochet pattern.

Return as a simple list, one per line:
abbreviation = definition

Example:
k = knit
p = purl
k2tog = knit 2 together
ssk = slip, slip, knit
yo = yarn over
RS = right side
WS = wrong side

Extract ALL abbreviations visible in the pattern, including standard and pattern-specific ones.`;

        const result = await this.extractFromImage(base64Image, abbrevPrompt);

        // Parse the result into an object
        const abbreviations = {};
        const lines = result.split('\n');
        for (const line of lines) {
            const match = line.match(/^\s*([a-zA-Z0-9]+)\s*=\s*(.+?)\s*$/);
            if (match) {
                abbreviations[match[1].toLowerCase()] = match[2];
            }
        }
        return abbreviations;
    }

    /**
     * Set the vision model to use
     * @param {string} model - Model name (e.g., 'llava', 'llava:7b')
     */
    setModel(model) {
        this.model = model;
    }

    /**
     * Set the Ollama base URL
     * @param {string} url - Base URL (e.g., 'http://localhost:11434')
     */
    setBaseUrl(url) {
        this.baseUrl = url.replace(/\/$/, '');
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OllamaPatternExtractor;
}
