/**
 * Knitting Pattern Converter - Local Storage Manager
 * Handles persistence of conversion history and custom abbreviations
 */

class StorageManager {
    constructor() {
        this.HISTORY_KEY = 'knitting_pattern_history';
        this.CUSTOM_ABBREV_KEY = 'knitting_custom_abbreviations';
        this.MAX_HISTORY = 10;
        this.storageAvailable = this.checkStorageAvailable();
    }

    /**
     * Check if localStorage is available
     * @returns {boolean} True if localStorage works
     */
    checkStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    // ==================== Conversion History ====================

    /**
     * Save a conversion to history
     * @param {string} original - Original pattern text
     * @param {string} converted - Converted pattern text
     * @param {string} mode - 'abbreviate' or 'expand'
     * @returns {Object|null} The saved entry or null if storage unavailable
     */
    saveConversion(original, converted, mode = 'abbreviate') {
        if (!this.storageAvailable) return null;

        const history = this.getHistory();
        const entry = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            mode: mode,
            originalPreview: original.substring(0, 100) + (original.length > 100 ? '...' : ''),
            originalFull: original,
            converted: converted,
            convertedPreview: converted.substring(0, 150) + '...'
        };

        history.unshift(entry);

        // Keep only last MAX_HISTORY entries
        while (history.length > this.MAX_HISTORY) {
            history.pop();
        }

        try {
            localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
            return entry;
        } catch (e) {
            // Storage quota exceeded - remove oldest entries and retry
            console.warn('Storage quota exceeded, removing old entries');
            while (history.length > 1) {
                history.pop();
                try {
                    localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
                    return entry;
                } catch (e2) {
                    continue;
                }
            }
            return null;
        }
    }

    /**
     * Get all conversion history
     * @returns {Array} Array of history entries
     */
    getHistory() {
        if (!this.storageAvailable) return [];

        try {
            const data = localStorage.getItem(this.HISTORY_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.warn('Failed to parse history:', e);
            return [];
        }
    }

    /**
     * Get a specific history entry by ID
     * @param {number} id - The entry ID
     * @returns {Object|null} The history entry or null
     */
    getHistoryEntry(id) {
        const history = this.getHistory();
        return history.find(entry => entry.id === id) || null;
    }

    /**
     * Delete a specific history entry
     * @param {number} id - The entry ID to delete
     */
    deleteHistoryEntry(id) {
        if (!this.storageAvailable) return;

        const history = this.getHistory().filter(entry => entry.id !== id);
        localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
    }

    /**
     * Clear all conversion history
     */
    clearHistory() {
        if (!this.storageAvailable) return;
        localStorage.removeItem(this.HISTORY_KEY);
    }

    // ==================== Custom Abbreviations ====================

    /**
     * Get all custom abbreviations
     * @returns {Object} Object mapping full words to abbreviations
     */
    getCustomAbbreviations() {
        if (!this.storageAvailable) return {};

        try {
            const data = localStorage.getItem(this.CUSTOM_ABBREV_KEY);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.warn('Failed to parse custom abbreviations:', e);
            return {};
        }
    }

    /**
     * Save a custom abbreviation
     * @param {string} fullWord - The full word/phrase
     * @param {string} abbreviation - The abbreviation
     * @returns {boolean} True if saved successfully
     */
    saveCustomAbbreviation(fullWord, abbreviation) {
        if (!this.storageAvailable) return false;

        const customs = this.getCustomAbbreviations();
        customs[fullWord.toLowerCase().trim()] = abbreviation.trim();

        try {
            localStorage.setItem(this.CUSTOM_ABBREV_KEY, JSON.stringify(customs));
            return true;
        } catch (e) {
            console.warn('Failed to save custom abbreviation:', e);
            return false;
        }
    }

    /**
     * Delete a custom abbreviation
     * @param {string} fullWord - The full word to delete
     * @returns {boolean} True if deleted successfully
     */
    deleteCustomAbbreviation(fullWord) {
        if (!this.storageAvailable) return false;

        const customs = this.getCustomAbbreviations();
        delete customs[fullWord.toLowerCase().trim()];

        try {
            localStorage.setItem(this.CUSTOM_ABBREV_KEY, JSON.stringify(customs));
            return true;
        } catch (e) {
            console.warn('Failed to delete custom abbreviation:', e);
            return false;
        }
    }

    /**
     * Clear all custom abbreviations
     */
    clearCustomAbbreviations() {
        if (!this.storageAvailable) return;
        localStorage.removeItem(this.CUSTOM_ABBREV_KEY);
    }

    /**
     * Import custom abbreviations from JSON
     * @param {string} jsonString - JSON string of abbreviations
     * @returns {boolean} True if imported successfully
     */
    importCustomAbbreviations(jsonString) {
        if (!this.storageAvailable) return false;

        try {
            const imported = JSON.parse(jsonString);
            if (typeof imported !== 'object' || Array.isArray(imported)) {
                throw new Error('Invalid format');
            }

            const customs = this.getCustomAbbreviations();
            // Merge imported with existing (imported wins)
            const merged = { ...customs, ...imported };

            localStorage.setItem(this.CUSTOM_ABBREV_KEY, JSON.stringify(merged));
            return true;
        } catch (e) {
            console.warn('Failed to import custom abbreviations:', e);
            return false;
        }
    }

    /**
     * Export custom abbreviations as JSON string
     * @returns {string} JSON string of custom abbreviations
     */
    exportCustomAbbreviations() {
        return JSON.stringify(this.getCustomAbbreviations(), null, 2);
    }
}
