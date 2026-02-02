/**
 * Knitting Pattern Converter - Abbreviations Module
 * Comprehensive list of knitting abbreviations with multi-word terms
 */

const BUILTIN_ABBREVIATIONS = {
    // Multi-word terms (MUST be processed first - longer phrases before shorter)
    'slip slip knit': 'ssk',
    'slip slip purl': 'ssp',
    'slip slip slip knit': 'sssk',
    'yarn over': 'yo',
    'yarn forward': 'yf',
    'yarn round needle': 'yrn',
    'yarn over needle': 'yon',
    'cast on': 'CO',
    'cast off': 'BO',
    'bind off': 'BO',
    'through back loop': 'tbl',
    'through the back loop': 'tbl',
    'right side': 'RS',
    'wrong side': 'WS',
    'make one left': 'M1L',
    'make one right': 'M1R',
    'make one purlwise': 'M1P',
    'make one': 'M1',
    'knit front and back': 'kfb',
    'purl front and back': 'pfb',
    'knit into front and back': 'kfb',
    'purl into front and back': 'pfb',
    'pass slipped stitch over': 'psso',
    'pass slip stitch over': 'psso',
    'slip knit pass': 'skp',
    'slip 1 knit 2 together pass slipped stitch over': 'sk2p',
    'slip knit 2 together pass': 'sk2p',
    'with yarn in front': 'wyif',
    'with yarn in back': 'wyib',
    'place marker': 'pm',
    'slip marker': 'sm',
    'double pointed needle': 'dpn',
    'double pointed needles': 'dpns',
    'double-pointed needle': 'dpn',
    'double-pointed needles': 'dpns',
    'circular needle': 'circ',
    'circular needles': 'circs',
    'cable needle': 'cn',
    'main color': 'MC',
    'main colour': 'MC',
    'contrast color': 'CC',
    'contrast colour': 'CC',
    'stockinette stitch': 'St st',
    'stocking stitch': 'St st',
    'garter stitch': 'g st',
    'seed stitch': 'seed st',
    'moss stitch': 'moss st',
    'reverse stockinette': 'rev St st',
    'reverse stocking stitch': 'rev St st',
    'knit 2 together': 'k2tog',
    'knit two together': 'k2tog',
    'purl 2 together': 'p2tog',
    'purl two together': 'p2tog',
    'knit 3 together': 'k3tog',
    'knit three together': 'k3tog',
    'purl 3 together': 'p3tog',
    'purl three together': 'p3tog',
    'slip 1 knitwise': 'sl1k',
    'slip 1 purlwise': 'sl1p',
    'slip one knitwise': 'sl1k',
    'slip one purlwise': 'sl1p',
    'left needle': 'LN',
    'right needle': 'RN',
    'right hand': 'RH',
    'left hand': 'LH',
    'as established': 'as est',
    'as if to knit': 'kwise',
    'as if to purl': 'pwise',
    'work even': 'work even',
    'end of row': 'EOR',
    'at the same time': 'AT',
    'repeat from': 'rep from',

    // Single-word terms (processed after multi-word)
    'knit': 'k',
    'purl': 'p',
    'slip': 'sl',
    'stitch': 'st',
    'stitches': 'sts',
    'together': 'tog',
    'repeat': 'rep',
    'beginning': 'beg',
    'decrease': 'dec',
    'decreasing': 'dec',
    'increase': 'inc',
    'increasing': 'inc',
    'cable': 'C',
    'approximately': 'approx',
    'alternate': 'alt',
    'alternating': 'alt',
    'continue': 'cont',
    'continuing': 'cont',
    'following': 'foll',
    'follows': 'foll',
    'pattern': 'patt',
    'remaining': 'rem',
    'remain': 'rem',
    'previous': 'prev',
    'round': 'rnd',
    'rounds': 'rnds',
    'centimeter': 'cm',
    'centimeters': 'cm',
    'centimetre': 'cm',
    'centimetres': 'cm',
    'inch': 'in',
    'inches': 'in',
    'millimeter': 'mm',
    'millimeters': 'mm',
    'millimetre': 'mm',
    'millimetres': 'mm',
    'gauge': 'gauge',
    'tension': 'tension',
    'knitwise': 'kwise',
    'purlwise': 'pwise',
    'selvage': 'selv',
    'selvedge': 'selv'
};

/**
 * Get abbreviations sorted by key length (longest first)
 * This ensures multi-word phrases are matched before their component words
 * @param {Object} customAbbrevs - User-defined custom abbreviations
 * @returns {Array} Array of [fullWord, abbreviation] pairs sorted by length
 */
function getSortedAbbreviations(customAbbrevs = {}) {
    // Merge built-in with custom (custom overrides built-in)
    const merged = { ...BUILTIN_ABBREVIATIONS, ...customAbbrevs };

    // Sort by key length descending to match longer phrases first
    return Object.entries(merged).sort((a, b) => b[0].length - a[0].length);
}

/**
 * Get reverse mapping (abbreviation -> full word) sorted by abbreviation length
 * @param {Object} customAbbrevs - User-defined custom abbreviations
 * @returns {Array} Array of [abbreviation, fullWord] pairs sorted by length
 */
function getReversedAbbreviations(customAbbrevs = {}) {
    const merged = { ...BUILTIN_ABBREVIATIONS, ...customAbbrevs };

    // Create reverse mapping and sort by abbreviation length descending
    return Object.entries(merged)
        .map(([full, abbrev]) => [abbrev, full])
        .sort((a, b) => b[0].length - a[0].length);
}

/**
 * Get all abbreviations as a simple object (for display purposes)
 * @param {Object} customAbbrevs - User-defined custom abbreviations
 * @returns {Object} Merged abbreviations object
 */
function getAllAbbreviations(customAbbrevs = {}) {
    return { ...BUILTIN_ABBREVIATIONS, ...customAbbrevs };
}
