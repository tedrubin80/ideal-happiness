/**
 * Knitting Pattern Converter - Application Entry Point
 * Initializes all modules and exposes global references
 */

// Global references for UI callbacks (onclick handlers in HTML)
let storage, converter, ui;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize modules
    storage = new StorageManager();
    converter = new KnittingPatternConverter(storage.getCustomAbbreviations());
    ui = new UIController(converter, storage);

    // Log initialization (development only)
    console.log('Knitting Pattern Converter initialized');
    console.log(`Loaded ${Object.keys(BUILTIN_ABBREVIATIONS).length} built-in abbreviations`);
    console.log(`Loaded ${Object.keys(storage.getCustomAbbreviations()).length} custom abbreviations`);
});
