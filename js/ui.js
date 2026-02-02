/**
 * Knitting Pattern Converter - UI Controller
 * Handles all user interface interactions, accessibility, and DOM updates
 */

class UIController {
    constructor(converter, storage) {
        this.converter = converter;
        this.storage = storage;
        this.currentPattern = null;
        this.currentMode = 'abbreviate';
        this.elements = {};
        this.ollama = null;

        this.initializeElements();
        this.createToastContainer();
        this.createAnnouncer();
        this.attachEventListeners();
        this.loadCustomAbbreviations();
        this.renderHistory();
        this.renderCustomAbbreviations();
        this.initializeOllama();
    }

    /**
     * Cache DOM element references
     */
    initializeElements() {
        this.elements = {
            // File input
            fileInput: document.getElementById('fileInput'),
            uploadSection: document.getElementById('uploadSection'),
            fileInfo: document.getElementById('fileInfo'),

            // Text input/output
            patternInput: document.getElementById('patternInput'),
            preview: document.getElementById('preview'),
            outputSection: document.getElementById('outputSection'),

            // Buttons
            convertBtn: document.getElementById('convertBtn'),
            expandBtn: document.getElementById('expandBtn'),
            downloadBtn: document.getElementById('downloadBtn'),
            copyBtn: document.getElementById('copyBtn'),
            printBtn: document.getElementById('printBtn'),

            // Loading
            loading: document.getElementById('loading'),
            loadingText: document.getElementById('loadingText'),

            // Panels
            historyPanel: document.getElementById('historyPanel'),
            historyList: document.getElementById('historyList'),
            clearHistoryBtn: document.getElementById('clearHistoryBtn'),

            customAbbrevPanel: document.getElementById('customAbbrevPanel'),
            customAbbrevForm: document.getElementById('customAbbrevForm'),
            customFullInput: document.getElementById('customFull'),
            customAbbrevInput: document.getElementById('customAbbrev'),
            customAbbrevList: document.getElementById('customAbbrevList'),
            clearCustomBtn: document.getElementById('clearCustomBtn'),

            // Ollama
            ollamaStatus: document.getElementById('ollamaStatus'),
            ollamaStatusIcon: document.getElementById('ollamaStatusIcon'),
            ollamaStatusText: document.getElementById('ollamaStatusText'),
            ollamaSettingsToggle: document.getElementById('ollamaSettingsToggle'),
            ollamaPanel: document.getElementById('ollamaPanel'),
            ollamaUrl: document.getElementById('ollamaUrl'),
            ollamaModel: document.getElementById('ollamaModel'),
            testOllamaBtn: document.getElementById('testOllamaBtn'),
            ollamaTestResult: document.getElementById('ollamaTestResult')
        };
    }

    /**
     * Initialize Ollama integration
     */
    async initializeOllama() {
        if (typeof OllamaPatternExtractor === 'undefined') {
            console.log('Ollama module not loaded');
            return;
        }

        // Load saved settings
        const savedUrl = localStorage.getItem('ollamaUrl') || 'http://localhost:11434';
        const savedModel = localStorage.getItem('ollamaModel') || 'llama3.2-vision';

        if (this.elements.ollamaUrl) {
            this.elements.ollamaUrl.value = savedUrl;
        }
        if (this.elements.ollamaModel) {
            this.elements.ollamaModel.value = savedModel;
        }

        this.ollama = new OllamaPatternExtractor({
            baseUrl: savedUrl,
            model: savedModel
        });

        // Check availability
        await this.checkOllamaStatus();
    }

    /**
     * Check and display Ollama status
     */
    async checkOllamaStatus() {
        if (!this.ollama || !this.elements.ollamaStatus) return;

        const status = await this.ollama.checkAvailability();

        this.elements.ollamaStatus.style.display = 'flex';

        if (status.available) {
            if (status.hasVisionModel) {
                this.elements.ollamaStatusIcon.textContent = '✓';
                this.elements.ollamaStatusIcon.style.color = '#28a745';
                this.elements.ollamaStatusText.textContent = `Ollama ready (${status.visionModels.length} vision model${status.visionModels.length > 1 ? 's' : ''})`;
            } else {
                this.elements.ollamaStatusIcon.textContent = '⚠';
                this.elements.ollamaStatusIcon.style.color = '#ffc107';
                this.elements.ollamaStatusText.textContent = 'Ollama connected - no vision model found';
            }

            // Update model dropdown with available models
            if (status.visionModels.length > 0 && this.elements.ollamaModel) {
                const currentValue = this.elements.ollamaModel.value;
                this.elements.ollamaModel.innerHTML = status.visionModels.map(m =>
                    `<option value="${m}" ${m === currentValue ? 'selected' : ''}>${m}</option>`
                ).join('');
            }
        } else {
            this.elements.ollamaStatusIcon.textContent = '✗';
            this.elements.ollamaStatusIcon.style.color = '#dc3545';
            this.elements.ollamaStatusText.textContent = `Ollama not available: ${status.error}`;
        }
    }

    /**
     * Create toast notification container
     */
    createToastContainer() {
        if (!document.getElementById('toastContainer')) {
            const container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            container.setAttribute('aria-live', 'polite');
            document.body.appendChild(container);
        }
        this.toastContainer = document.getElementById('toastContainer');
    }

    /**
     * Create screen reader announcer element
     */
    createAnnouncer() {
        if (!document.getElementById('srAnnouncer')) {
            const announcer = document.createElement('div');
            announcer.id = 'srAnnouncer';
            announcer.setAttribute('role', 'status');
            announcer.setAttribute('aria-live', 'polite');
            announcer.setAttribute('aria-atomic', 'true');
            announcer.className = 'sr-only';
            document.body.appendChild(announcer);
        }
        this.announcer = document.getElementById('srAnnouncer');
    }

    /**
     * Announce message to screen readers
     * @param {string} message - Message to announce
     */
    announce(message) {
        this.announcer.textContent = '';
        setTimeout(() => {
            this.announcer.textContent = message;
        }, 100);
    }

    /**
     * Attach all event listeners
     */
    attachEventListeners() {
        // File input
        this.elements.fileInput?.addEventListener('change', (e) => this.handleFileSelect(e));

        // Drag and drop
        this.setupDragDrop();

        // Convert buttons
        this.elements.convertBtn?.addEventListener('click', () => this.convertPattern('abbreviate'));
        this.elements.expandBtn?.addEventListener('click', () => this.convertPattern('expand'));

        // Output buttons
        this.elements.downloadBtn?.addEventListener('click', () => this.downloadPattern());
        this.elements.copyBtn?.addEventListener('click', () => this.copyToClipboard());
        this.elements.printBtn?.addEventListener('click', () => this.printPattern());

        // History panel
        this.elements.clearHistoryBtn?.addEventListener('click', () => this.clearHistory());

        // Custom abbreviations
        this.elements.customAbbrevForm?.addEventListener('submit', (e) => this.handleAddCustomAbbrev(e));
        this.elements.clearCustomBtn?.addEventListener('click', () => this.clearCustomAbbreviations());

        // Ollama settings
        this.elements.ollamaSettingsToggle?.addEventListener('click', () => {
            this.togglePanel(this.elements.ollamaPanel);
        });
        this.elements.testOllamaBtn?.addEventListener('click', () => this.testOllamaConnection());
        this.elements.ollamaUrl?.addEventListener('change', () => this.saveOllamaSettings());
        this.elements.ollamaModel?.addEventListener('change', () => this.saveOllamaSettings());

        // Panel toggles
        document.querySelectorAll('.panel-header').forEach(header => {
            header.addEventListener('click', () => this.togglePanel(header.closest('.panel')));
            header.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.togglePanel(header.closest('.panel'));
                }
            });
        });

        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
    }

    /**
     * Save Ollama settings
     */
    saveOllamaSettings() {
        const url = this.elements.ollamaUrl?.value || 'http://localhost:11434';
        const model = this.elements.ollamaModel?.value || 'llama3.2-vision';

        localStorage.setItem('ollamaUrl', url);
        localStorage.setItem('ollamaModel', model);

        if (this.ollama) {
            this.ollama.setBaseUrl(url);
            this.ollama.setModel(model);
        }
    }

    /**
     * Test Ollama connection
     */
    async testOllamaConnection() {
        if (!this.ollama) return;

        this.saveOllamaSettings();

        const resultEl = this.elements.ollamaTestResult;
        if (resultEl) {
            resultEl.textContent = 'Testing...';
            resultEl.style.color = '#666';
        }

        const status = await this.ollama.checkAvailability();

        if (status.available) {
            if (resultEl) {
                resultEl.textContent = status.hasVisionModel
                    ? `Connected! Found: ${status.visionModels.join(', ')}`
                    : 'Connected but no vision models found. Run: ollama pull llama3.2-vision';
                resultEl.style.color = status.hasVisionModel ? '#28a745' : '#ffc107';
            }
        } else {
            if (resultEl) {
                resultEl.textContent = `Failed: ${status.error}`;
                resultEl.style.color = '#dc3545';
            }
        }

        await this.checkOllamaStatus();
    }

    /**
     * Setup drag and drop for file upload
     */
    setupDragDrop() {
        const section = this.elements.uploadSection;
        if (!section) return;

        section.addEventListener('dragover', (e) => {
            e.preventDefault();
            section.classList.add('dragover');
        });

        section.addEventListener('dragleave', () => {
            section.classList.remove('dragover');
        });

        section.addEventListener('drop', (e) => {
            e.preventDefault();
            section.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.readFile(files[0]);
            }
        });
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.convertPattern('abbreviate');
            }

            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Enter') {
                e.preventDefault();
                this.convertPattern('expand');
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 's' && this.currentPattern) {
                e.preventDefault();
                this.downloadPattern();
            }
        });
    }

    /**
     * Handle file selection
     * @param {Event} e - Change event
     */
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.readFile(file);
        }
    }

    /**
     * Read and display file contents
     * @param {File} file - File to read
     */
    async readFile(file) {
        // Check if it's a PDF
        if (file.name.match(/\.pdf$/i)) {
            await this.handlePDFFile(file);
            return;
        }

        // Validate file size (max 1MB)
        if (file.size > 1024 * 1024) {
            this.showToast('File too large. Maximum size is 1MB.', 'error');
            return;
        }

        // Validate file type
        if (!file.name.match(/\.(txt|text)$/i)) {
            this.showToast('Please select a text file (.txt) or PDF', 'error');
            return;
        }

        const reader = new FileReader();

        reader.onload = (e) => {
            const content = e.target.result;
            this.elements.patternInput.value = content;

            if (this.elements.fileInfo) {
                this.elements.fileInfo.innerHTML = `<strong>File:</strong> ${this.escapeHtml(file.name)} (${this.formatFileSize(file.size)})`;
                this.elements.fileInfo.classList.add('active');
            }

            this.announce(`File ${file.name} loaded successfully`);
            this.showToast('File loaded successfully!', 'success');
        };

        reader.onerror = () => {
            this.showToast('Error reading file', 'error');
        };

        reader.readAsText(file);
    }

    /**
     * Handle PDF file using Ollama vision
     * @param {File} file - PDF file
     */
    async handlePDFFile(file) {
        if (!this.ollama) {
            this.showToast('Ollama not initialized. Cannot process PDF.', 'error');
            return;
        }

        // Check Ollama availability
        const status = await this.ollama.checkAvailability();
        if (!status.available) {
            this.showToast(`Ollama not available: ${status.error}`, 'error');
            this.togglePanel(this.elements.ollamaPanel);
            return;
        }

        if (!status.hasVisionModel) {
            this.showToast('No vision model found. Run: ollama pull llama3.2-vision', 'error');
            this.togglePanel(this.elements.ollamaPanel);
            return;
        }

        // Validate file size (max 10MB for PDFs)
        if (file.size > 10 * 1024 * 1024) {
            this.showToast('PDF too large. Maximum size is 10MB.', 'error');
            return;
        }

        // Show file info
        if (this.elements.fileInfo) {
            this.elements.fileInfo.innerHTML = `<strong>File:</strong> ${this.escapeHtml(file.name)} (${this.formatFileSize(file.size)}) - Processing with AI...`;
            this.elements.fileInfo.classList.add('active');
        }

        this.showLoading(true, 'Extracting pattern from PDF...');

        try {
            const extractedText = await this.ollama.extractFromPDF(file, (page, total, status) => {
                this.updateLoadingText(status);
            });

            this.elements.patternInput.value = extractedText;

            if (this.elements.fileInfo) {
                this.elements.fileInfo.innerHTML = `<strong>File:</strong> ${this.escapeHtml(file.name)} (${this.formatFileSize(file.size)}) - Extracted with AI`;
            }

            this.announce(`PDF ${file.name} extracted successfully`);
            this.showToast('PDF pattern extracted successfully!', 'success');

        } catch (error) {
            console.error('PDF extraction error:', error);
            this.showToast(`PDF extraction failed: ${error.message}`, 'error');

            if (this.elements.fileInfo) {
                this.elements.fileInfo.innerHTML = `<strong>Error:</strong> Could not extract PDF`;
            }
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Update loading text
     * @param {string} text - Loading text to display
     */
    updateLoadingText(text) {
        if (this.elements.loadingText) {
            this.elements.loadingText.textContent = text;
        }
    }

    /**
     * Convert the pattern
     * @param {string} mode - 'abbreviate' or 'expand'
     */
    async convertPattern(mode) {
        const patternText = this.elements.patternInput?.value;

        if (!patternText?.trim()) {
            this.showToast('Please enter or upload a pattern first', 'error');
            this.elements.patternInput?.focus();
            return;
        }

        this.showLoading(true, 'Converting pattern...');
        this.currentMode = mode;
        this.converter.setMode(mode);

        await new Promise(resolve => setTimeout(resolve, 300));

        try {
            this.currentPattern = this.converter.convert(patternText);
            this.elements.preview.textContent = this.currentPattern;
            this.elements.outputSection.classList.add('active');

            this.storage.saveConversion(patternText, this.currentPattern, mode);
            this.renderHistory();

            const modeText = mode === 'abbreviate' ? 'abbreviated' : 'expanded';
            this.announce(`Pattern ${modeText} successfully. Output is ready for download or copy.`);
            this.showToast(`Pattern ${modeText} successfully!`, 'success');

            this.elements.outputSection.scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => this.elements.downloadBtn?.focus(), 500);

        } catch (error) {
            this.showToast('Error: ' + error.message, 'error');
            this.announce('Conversion failed: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Download the converted pattern
     */
    downloadPattern() {
        if (!this.currentPattern) {
            this.showToast('No pattern to download', 'error');
            return;
        }

        const filename = this.converter.generateFileName();
        const blob = new Blob([this.currentPattern], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('Pattern downloaded!', 'success');
        this.announce('Pattern downloaded as ' + filename);
    }

    /**
     * Copy pattern to clipboard
     */
    async copyToClipboard() {
        if (!this.currentPattern) {
            this.showToast('No pattern to copy', 'error');
            return;
        }

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(this.currentPattern);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = this.currentPattern;
                textarea.style.cssText = 'position:fixed;opacity:0;';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }

            this.showToast('Pattern copied to clipboard!', 'success');
            this.announce('Pattern copied to clipboard');
        } catch (err) {
            this.showToast('Failed to copy pattern', 'error');
            console.error('Copy failed:', err);
        }
    }

    /**
     * Print the pattern
     */
    printPattern() {
        if (!this.currentPattern) {
            this.showToast('No pattern to print', 'error');
            return;
        }
        window.print();
    }

    /**
     * Toggle panel collapsed state
     * @param {HTMLElement} panel - Panel element
     */
    togglePanel(panel) {
        if (!panel) return;
        panel.classList.toggle('collapsed');

        const isCollapsed = panel.classList.contains('collapsed');
        const header = panel.querySelector('.panel-header');
        header?.setAttribute('aria-expanded', !isCollapsed);
    }

    /**
     * Show/hide loading indicator
     * @param {boolean} show - Whether to show loading
     * @param {string} text - Optional loading text
     */
    showLoading(show, text = 'Converting pattern...') {
        if (show) {
            this.updateLoadingText(text);
            this.elements.loading?.classList.add('active');
            this.elements.convertBtn.disabled = true;
            this.elements.expandBtn.disabled = true;
            this.elements.outputSection?.classList.remove('active');
        } else {
            this.elements.loading?.classList.remove('active');
            this.elements.convertBtn.disabled = false;
            this.elements.expandBtn.disabled = false;
        }
    }

    /**
     * Show toast notification
     * @param {string} message - Message to show
     * @param {string} type - 'success', 'error', or 'info'
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toast.setAttribute('role', 'alert');

        this.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ==================== History ====================

    renderHistory() {
        const list = this.elements.historyList;
        if (!list) return;

        const history = this.storage.getHistory();

        if (history.length === 0) {
            list.innerHTML = '<div class="empty-state">No conversion history yet</div>';
            return;
        }

        list.innerHTML = history.map(entry => `
            <div class="history-item" data-id="${entry.id}">
                <div class="history-item-content">
                    <div class="history-item-date">
                        ${new Date(entry.timestamp).toLocaleString()}
                        (${entry.mode === 'abbreviate' ? 'Abbreviated' : 'Expanded'})
                    </div>
                    <div class="history-item-preview">${this.escapeHtml(entry.originalPreview)}</div>
                </div>
                <div class="history-item-actions">
                    <button class="btn btn-small btn-outline" onclick="ui.loadHistoryEntry(${entry.id})"
                            aria-label="Load this conversion">
                        Load
                    </button>
                    <button class="btn btn-small btn-danger" onclick="ui.deleteHistoryEntry(${entry.id})"
                            aria-label="Delete this entry">
                        ×
                    </button>
                </div>
            </div>
        `).join('');
    }

    loadHistoryEntry(id) {
        const entry = this.storage.getHistoryEntry(id);
        if (entry) {
            this.elements.patternInput.value = entry.originalFull;
            this.showToast('Pattern loaded from history', 'success');
            this.announce('Pattern loaded from history');
            this.elements.patternInput.focus();
        }
    }

    deleteHistoryEntry(id) {
        this.storage.deleteHistoryEntry(id);
        this.renderHistory();
        this.showToast('Entry deleted', 'info');
    }

    clearHistory() {
        if (confirm('Are you sure you want to clear all conversion history?')) {
            this.storage.clearHistory();
            this.renderHistory();
            this.showToast('History cleared', 'info');
            this.announce('Conversion history cleared');
        }
    }

    // ==================== Custom Abbreviations ====================

    loadCustomAbbreviations() {
        const customs = this.storage.getCustomAbbreviations();
        this.converter.setCustomAbbreviations(customs);
    }

    handleAddCustomAbbrev(e) {
        e.preventDefault();

        const fullWord = this.elements.customFullInput?.value?.trim();
        const abbrev = this.elements.customAbbrevInput?.value?.trim();

        if (!fullWord || !abbrev) {
            this.showToast('Please enter both the full word and abbreviation', 'error');
            return;
        }

        if (this.storage.saveCustomAbbreviation(fullWord, abbrev)) {
            this.loadCustomAbbreviations();
            this.renderCustomAbbreviations();
            this.elements.customFullInput.value = '';
            this.elements.customAbbrevInput.value = '';
            this.showToast('Custom abbreviation added', 'success');
            this.announce(`Added custom abbreviation: ${fullWord} equals ${abbrev}`);
        } else {
            this.showToast('Failed to save abbreviation', 'error');
        }
    }

    renderCustomAbbreviations() {
        const list = this.elements.customAbbrevList;
        if (!list) return;

        const customs = this.storage.getCustomAbbreviations();
        const entries = Object.entries(customs);

        if (entries.length === 0) {
            list.innerHTML = '<div class="empty-state">No custom abbreviations</div>';
            return;
        }

        list.innerHTML = '<div class="abbrev-list">' + entries.map(([full, abbrev]) => `
            <span class="abbrev-tag">
                <span class="abbrev-tag-text">${this.escapeHtml(full)} → ${this.escapeHtml(abbrev)}</span>
                <button class="abbrev-tag-delete" onclick="ui.deleteCustomAbbrev('${this.escapeHtml(full)}')"
                        aria-label="Delete ${this.escapeHtml(full)} abbreviation">
                    ×
                </button>
            </span>
        `).join('') + '</div>';
    }

    deleteCustomAbbrev(fullWord) {
        this.storage.deleteCustomAbbreviation(fullWord);
        this.loadCustomAbbreviations();
        this.renderCustomAbbreviations();
        this.showToast('Abbreviation deleted', 'info');
    }

    clearCustomAbbreviations() {
        if (confirm('Are you sure you want to clear all custom abbreviations?')) {
            this.storage.clearCustomAbbreviations();
            this.loadCustomAbbreviations();
            this.renderCustomAbbreviations();
            this.showToast('Custom abbreviations cleared', 'info');
        }
    }

    // ==================== Utilities ====================

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' bytes';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
}
