/**
 * Knitting Pattern Converter - Core Conversion Logic
 * Converts between full words and abbreviations
 */

class KnittingPatternConverter {
    constructor(customAbbreviations = {}) {
        this.customAbbreviations = customAbbreviations;
        this.mode = 'abbreviate'; // 'abbreviate' or 'expand'
        this.usedAbbreviations = new Map();
    }

    /**
     * Set conversion mode
     * @param {string} mode - 'abbreviate' or 'expand'
     */
    setMode(mode) {
        if (mode === 'abbreviate' || mode === 'expand') {
            this.mode = mode;
        }
    }

    /**
     * Update custom abbreviations
     * @param {Object} customs - Custom abbreviation mappings
     */
    setCustomAbbreviations(customs) {
        this.customAbbreviations = customs || {};
    }

    /**
     * Main conversion method - converts entire pattern text
     * @param {string} patternText - The pattern text to convert
     * @returns {string} Converted pattern text
     */
    convert(patternText) {
        if (!patternText?.trim()) {
            throw new Error('Pattern text is empty');
        }

        this.usedAbbreviations.clear();
        const lines = patternText.split('\n');
        const convertedLines = [];

        // Add header
        convertedLines.push('='.repeat(60));
        const headerText = this.mode === 'abbreviate'
            ? 'STANDARDIZED KNITTING PATTERN (Abbreviated)'
            : 'EXPANDED KNITTING PATTERN (Full Words)';
        convertedLines.push(headerText);
        convertedLines.push('='.repeat(60));
        convertedLines.push('');

        for (const line of lines) {
            const trimmed = line.trim();

            if (trimmed.length === 0) {
                convertedLines.push('');
                continue;
            }

            // Check if this is a structural line that shouldn't be converted
            if (this.isStructuralLine(trimmed)) {
                convertedLines.push(trimmed);
            } else {
                // Apply conversion to ALL content lines (fixed from original)
                convertedLines.push(this.convertLine(trimmed));
            }
        }

        // Add abbreviation legend (only for abbreviate mode)
        if (this.mode === 'abbreviate' && this.usedAbbreviations.size > 0) {
            convertedLines.push('');
            convertedLines.push('='.repeat(60));
            convertedLines.push('ABBREVIATIONS USED:');
            convertedLines.push('-'.repeat(60));

            // Sort alphabetically by abbreviation for readability
            const sortedAbbrevs = Array.from(this.usedAbbreviations.entries())
                .sort((a, b) => a[1].localeCompare(b[1]));

            for (const [full, abbrev] of sortedAbbrevs) {
                convertedLines.push(`${abbrev} = ${full}`);
            }
        }

        convertedLines.push('='.repeat(60));
        convertedLines.push(`Converted on: ${new Date().toLocaleDateString()}`);
        convertedLines.push('='.repeat(60));

        return convertedLines.join('\n');
    }

    /**
     * Check if a line is structural (headers, separators, etc.)
     * These lines should NOT be converted
     * @param {string} line - The line to check
     * @returns {boolean} True if structural
     */
    isStructuralLine(line) {
        const structuralPatterns = [
            /^={3,}$/,              // Equals separator lines
            /^-{3,}$/,              // Dashed separator lines
            /^\*{3,}$/,             // Asterisk separator lines
            /^#{1,6}\s/,            // Markdown headers
            /^Materials?:/i,        // Section headers
            /^Supplies?:/i,
            /^Notes?:/i,
            /^Gauge:/i,
            /^Tension:/i,
            /^Sizes?:/i,
            /^Finished/i,
            /^Measurements?:/i,
            /^Needles?:/i,
            /^Yarn:/i,
            /^Notions?:/i,
            /^Abbreviations?:/i,
            /^Instructions?:/i,
            /^Directions?:/i,
        ];

        return structuralPatterns.some(p => p.test(line));
    }

    /**
     * Convert a single line based on current mode
     * @param {string} line - The line to convert
     * @returns {string} Converted line
     */
    convertLine(line) {
        if (this.mode === 'abbreviate') {
            return this.abbreviateLine(line);
        } else {
            return this.expandLine(line);
        }
    }

    /**
     * Convert full words to abbreviations
     * @param {string} line - The line to abbreviate
     * @returns {string} Abbreviated line
     */
    abbreviateLine(line) {
        let converted = line;
        const sorted = getSortedAbbreviations(this.customAbbreviations);

        for (const [full, abbrev] of sorted) {
            const regex = new RegExp('\\b' + this.escapeRegex(full) + '\\b', 'gi');
            const matches = converted.match(regex);

            if (matches) {
                this.usedAbbreviations.set(full, abbrev);
                converted = converted.replace(regex, abbrev);
            }
        }

        return converted;
    }

    /**
     * Expand abbreviations to full words
     * @param {string} line - The line to expand
     * @returns {string} Expanded line
     */
    expandLine(line) {
        let converted = line;
        const reversed = getReversedAbbreviations(this.customAbbreviations);

        for (const [abbrev, full] of reversed) {
            // For abbreviations, we need to be careful with case
            // k2tog should expand but not K2TOG differently
            const regex = new RegExp('\\b' + this.escapeRegex(abbrev) + '\\b', 'gi');
            converted = converted.replace(regex, full);
        }

        return converted;
    }

    /**
     * Escape special regex characters in a string
     * @param {string} str - The string to escape
     * @returns {string} Escaped string
     */
    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Get abbreviations that were used in the last conversion
     * @returns {Map} Map of full word -> abbreviation
     */
    getUsedAbbreviations() {
        return this.usedAbbreviations;
    }

    /**
     * Generate a filename for the converted pattern
     * @returns {string} Suggested filename
     */
    generateFileName() {
        const timestamp = new Date().toISOString().split('T')[0];
        const modeText = this.mode === 'abbreviate' ? 'abbreviated' : 'expanded';
        return `knitting_pattern_${modeText}_${timestamp}.txt`;
    }
}
