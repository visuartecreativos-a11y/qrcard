// ============================================
// QRCard Dashboard - Interactive Application
// ============================================

// ============================================
// State Management
// ============================================
const AppState = {
    currentSection: 'home',
    theme: localStorage.getItem('theme') || 'light',
    cards: JSON.parse(localStorage.getItem('qrcard_history') || '[]'),
    currentCard: null,
    settings: {
        quality: localStorage.getItem('qrcard_quality') || 'high',
        language: localStorage.getItem('qrcard_language') || 'es'
    }
};

// ============================================
// Premium Configuration
// ============================================
const isPremiumUnlocked = false; // Cambia a true para probar todas las plantillas
const premiumStyles = ['luxe', 'eco', 'tech', 'vintage', 'bold'];

// ============================================
// DOM Elements
// ============================================
const elements = {
    // Loading
    loadingScreen: document.getElementById('loading-screen'),

    // Sidebar
    sidebar: document.getElementById('sidebar'),
    sidebarToggle: document.getElementById('sidebarToggle'),
    themeToggle: document.getElementById('themeToggle'),
    navItems: document.querySelectorAll('.nav-item'),

    // Sections
    sections: document.querySelectorAll('.section'),
    pageTitle: document.querySelector('.page-title'),

    // Form
    cardForm: document.getElementById('cardForm'),
    styleSelector: document.getElementById('styleSelector'),
    dropZone: document.getElementById('dropZone'),
    logoInput: document.getElementById('logo'),
    logoPreview: document.getElementById('logoPreview'),
    removeLogo: document.getElementById('removeLogo'),
    generateBtn: document.getElementById('generateBtn'),

    // Preview
    cardCanvas: document.getElementById('cardCanvas'),
    downloadBtn: document.getElementById('downloadBtn'),
    shareBtn: document.getElementById('shareBtn'),

    // NFC
    nfcUrlDisplay: document.getElementById('nfcUrlDisplay'),
    copyNfcBtn: document.getElementById('copyNfcBtn'),
    downloadVcfBtn: document.getElementById('downloadVcfBtn'),

    // Video
    tutorialVideo: document.getElementById('tutorialVideo'),
    videoOverlay: document.getElementById('videoOverlay'),
    playBtn: document.getElementById('playBtn'),

    // Stats
    statCards: document.getElementById('statCards'),
    statDownloads: document.getElementById('statDownloads'),

    // Templates
    templatesGrid: document.getElementById('templatesGrid'),

    // History
    historyList: document.getElementById('historyList'),

    // Settings
    darkModeToggle: document.getElementById('darkModeToggle'),
    languageSelect: document.getElementById('languageSelect'),
    qualitySelect: document.getElementById('qualitySelect'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),

    // Modal
    successModal: document.getElementById('successModal'),
    modalDownloadBtn: document.getElementById('modalDownloadBtn'),
    modalCloseBtn: document.getElementById('modalCloseBtn'),

    // Toast
    toastContainer: document.getElementById('toastContainer')
};

// ============================================
// Initialization
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    init();
});

function init() {
    // Hide loading screen
    setTimeout(() => {
        elements.loadingScreen.classList.add('hidden');
    }, 1500);

    // Initialize theme
    applyTheme(AppState.theme);

    // Initialize event listeners
    initEventListeners();

    // Initialize stats
    updateStats();

    // Load templates
    loadTemplates();

    // Load history
    loadHistory();

    // Initialize settings
    initSettings();

    // Animate floating cards
    animateFloatingCards();
}

// ============================================
// Event Listeners
// ============================================
function initEventListeners() {
    // Sidebar toggle
    elements.sidebarToggle.addEventListener('click', toggleSidebar);

    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);

    // Navigation
    elements.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            navigateTo(section);
        });
    });

    // Form submission
    elements.cardForm.addEventListener('submit', handleFormSubmit);

    // Style selector with premium logic
    elements.styleSelector.querySelectorAll('.style-option').forEach(option => {
        option.addEventListener('click', () => selectStyle(option));
    });

    // Drag and drop
    initDragAndDrop();

    // Logo input
    elements.logoInput.addEventListener('change', handleLogoSelect);
    elements.removeLogo.addEventListener('click', removeLogo);

    // Video
    elements.playBtn.addEventListener('click', playVideo);
    elements.tutorialVideo.addEventListener('play', () => {
        elements.videoOverlay.classList.add('hidden');
    });

    // Download and share
    elements.downloadBtn.addEventListener('click', downloadCard);
    elements.shareBtn.addEventListener('click', shareCard);

    // NFC
    elements.copyNfcBtn.addEventListener('click', copyNfcUrl);
    elements.downloadVcfBtn.addEventListener('click', downloadVCard);

    // Modal
    elements.modalDownloadBtn.addEventListener('click', () => {
        downloadCard();
        closeModal();
    });
    elements.modalCloseBtn.addEventListener('click', closeModal);

    // Settings
    elements.darkModeToggle.addEventListener('change', toggleDarkMode);
    elements.languageSelect.addEventListener('change', changeLanguage);
    elements.qualitySelect.addEventListener('change', changeQuality);
    elements.clearHistoryBtn.addEventListener('click', clearHistory);

    // Real-time preview
    const formInputs = elements.cardForm.querySelectorAll('input:not([type="file"])');
    formInputs.forEach(input => {
        input.addEventListener('input', debounce(updatePreview, 300));
    });
}

// ============================================
// Navigation
// ============================================
function navigateTo(section) {
    // Update active nav item
    elements.navItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === section) {
            item.classList.add('active');
        }
    });

    // Update sections
    elements.sections.forEach(sec => {
        sec.classList.remove('active');
    });
    document.getElementById(section).classList.add('active');

    // Update page title
    const titles = {
        home: 'Dashboard',
        create: 'Crear Tarjeta',
        templates: 'Plantillas',
        history: 'Historial',
        settings: 'Configuración'
    };
    elements.pageTitle.textContent = titles[section] || 'Dashboard';

    AppState.currentSection = section;

    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        elements.sidebar.classList.remove('open');
    }
}

// ============================================
// Sidebar & Theme
// ============================================
function toggleSidebar() {
    elements.sidebar.classList.toggle('collapsed');
}

function toggleTheme() {
    const newTheme = AppState.theme === 'light' ? 'dark' : 'light';
    AppState.theme = newTheme;
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    elements.darkModeToggle.checked = theme === 'dark';
}

function toggleDarkMode(e) {
    const theme = e.target.checked ? 'dark' : 'light';
    AppState.theme = theme;
    localStorage.setItem('theme', theme);
    applyTheme(theme);
}

// ============================================
// Form Handling
// ============================================
function selectStyle(option) {
    const style = option.dataset.style;

    // Check if premium style and not unlocked
    if (premiumStyles.includes(style) && !isPremiumUnlocked) {
        showToast('🔒 Desbloquea Premium para usar esta plantilla', 'error');
        return;
    }

    elements.styleSelector.querySelectorAll('.style-option').forEach(opt => {
        opt.classList.remove('active');
    });
    option.classList.add('active');
    updatePreview();
}

function initDragAndDrop() {
    const dropZone = elements.dropZone;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('dragover');
        }, false);
    });

    dropZone.addEventListener('drop', handleDrop, false);
    dropZone.addEventListener('click', () => {
        elements.logoInput.click();
    });
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

function handleLogoSelect(e) {
    handleFiles(e.target.files);
}

function handleFiles(files) {
    if (files.length > 0) {
        const file = files[0];
        if (file.size > 2 * 1024 * 1024) {
            showToast('El logo no debe superar 2MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = elements.logoPreview.querySelector('img');
            img.src = e.target.result;
            elements.logoPreview.classList.remove('hidden');
            updatePreview();
        };
        reader.readAsDataURL(file);
    }
}

function removeLogo() {
    elements.logoInput.value = '';
    elements.logoPreview.classList.add('hidden');
    updatePreview();
}

// ============================================
// Card Generation
// ============================================
async function handleFormSubmit(e) {
    e.preventDefault();

    const data = {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        company: document.getElementById('company').value,
        position: document.getElementById('position').value,
        email: document.getElementById('email').value,
        website: document.getElementById('website').value,
        message: document.getElementById('message').value,
        style: document.querySelector('.style-option.active')?.dataset.style || 'minimalista'
    };

    // Validate required fields
    if (!data.name || !data.phone) {
        showToast('Por favor completa los campos obligatorios', 'error');
        return;
    }

    // Show loading
    elements.generateBtn.disabled = true;
    elements.generateBtn.querySelector('.btn-text').textContent = 'Generando...';
    elements.generateBtn.querySelector('.btn-loader').classList.remove('hidden');

    try {
        await generateCard(data);

        // Save to history
        saveToHistory(data);

        // Update stats
        updateStats();

        // Show success modal
        showModal();

        showToast('¡Tarjeta generada con éxito!', 'success');
    } catch (error) {
        showToast('Error al generar la tarjeta', 'error');
        console.error(error);
    } finally {
        elements.generateBtn.disabled = false;
        elements.generateBtn.querySelector('.btn-text').textContent = 'Generar tarjeta';
        elements.generateBtn.querySelector('.btn-loader').classList.add('hidden');
    }
}

async function generateCard(data) {
    const style = data.style || 'minimalista';
    const cardDiv = document.createElement('div');
    cardDiv.className = `card ${style}`;

    // Generate QR code with WhatsApp URL
    const qrCanvas = document.createElement('canvas');
    const phoneClean = data.phone ? data.phone.replace(/\D/g, '') : '';

    // Build WhatsApp URL with optional message
    let whatsappUrl = `https://wa.me/${phoneClean}`;
    if (data.message && data.message.trim()) {
        whatsappUrl += `?text=${encodeURIComponent(data.message.trim())}`;
    }

    try {
        await QRCode.toCanvas(qrCanvas, whatsappUrl, {
            width: 200,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            },
            errorCorrectionLevel: 'H'
        });
    } catch (err) {
        console.error('QR generation error:', err);
        showToast('Error al generar el código QR', 'error');
        return;
    }

    // Get logo if exists
    const logoImg = elements.logoPreview.querySelector('img');
    const logoSrc = logoImg?.src || '';

    // Generate card HTML based on style (including premium styles)
    const qrDataUrl = qrCanvas.toDataURL('image/png');
    const html = generateCardHTML(data, qrDataUrl, logoSrc);

    cardDiv.innerHTML = html;

    elements.cardCanvas.innerHTML = '';
    elements.cardCanvas.appendChild(cardDiv);

    // Update NFC elements
    updateNfcElements(whatsappUrl, data);

    elements.downloadBtn.disabled = false;
    elements.shareBtn.disabled = false;

    AppState.currentCard = cardDiv;

    // Animate card appearance
    cardDiv.style.opacity = '0';
    cardDiv.style.transform = 'scale(0.9)';
    setTimeout(() => {
        cardDiv.style.transition = 'all 0.5s ease';
        cardDiv.style.opacity = '1';
        cardDiv.style.transform = 'scale(1)';
    }, 50);
}

// Generate card HTML based on style (including premium styles)
function generateCardHTML(data, qrDataUrl, logoSrc) {
    const logoHTML = logoSrc ? `<img src="${logoSrc}" class="card-logo" style="max-height:80px;margin-bottom:15px;">` : '';
    let html = `<div class="card-inner" style="height:100%;padding:30px;display:flex;flex-direction:column;justify-content:space-between;box-sizing:border-box;">`;

    // Free styles
    if (data.style === 'minimalista') {
        html += `
            ${logoHTML}
            <div style="text-align:center;">
                <h2 style="margin:0;font-size:28px;">${escapeHtml(data.name)}</h2>
                <p style="margin:5px 0;color:#555;">${escapeHtml(data.position || '')}</p>
                <p style="margin:5px 0;color:#777;">${escapeHtml(data.company || '')}</p>
                ${data.email ? `<p style="margin:5px 0;">${escapeHtml(data.email)}</p>` : ''}
                ${data.website ? `<p style="margin:5px 0;"><a href="${data.website}">${data.website}</a></p>` : ''}
            </div>
            <div style="text-align:center;" id="qrContainer">
                <img src="${qrDataUrl}" alt="QR WhatsApp" style="width:140px;height:140px;">
            </div>
        `;
    } else if (data.style === 'moderno') {
        html += `
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    ${logoHTML}
                    <h2 style="margin:0;font-size:26px;color:#007bff;">${escapeHtml(data.name)}</h2>
                    <p style="margin:5px 0;">${escapeHtml(data.position || '')} • ${escapeHtml(data.company || '')}</p>
                </div>
                <div id="qrContainer">
                    <img src="${qrDataUrl}" alt="QR WhatsApp" style="width:120px;height:120px;">
                </div>
            </div>
        `;
    } else if (data.style === 'elegante') {
        html += `
            <div style="background:linear-gradient(135deg,#f5f7fa,#c3cfe2);border-radius:15px;padding:20px;text-align:center;">
                ${logoHTML}
                <h2 style="margin:10px 0;font-size:30px;color:#2c3e50;">${escapeHtml(data.name)}</h2>
                <p style="margin:5px 0;font-style:italic;">${escapeHtml(data.position || '')}</p>
                <p style="margin:5px 0;">${escapeHtml(data.company || '')}</p>
                <div id="qrContainer" style="margin-top:20px;">
                    <img src="${qrDataUrl}" alt="QR WhatsApp" style="width:120px;height:120px;">
                </div>
            </div>
        `;
    } else if (data.style === 'creativo') {
        html += `
            <div style="text-align:center;background:#fff8e1;border-radius:20px;padding:20px;">
                ${logoHTML}
                <h2 style="margin:10px 0;font-size:32px;color:#ff6b6b;">${escapeHtml(data.name)}</h2>
                <p style="margin:5px 0;font-weight:bold;">${escapeHtml(data.position || '')}</p>
                <div id="qrContainer">
                    <img src="${qrDataUrl}" alt="QR WhatsApp" style="width:120px;height:120px;">
                </div>
            </div>
        `;
    } else if (data.style === 'profesional') {
        html += `
            <div style="border-left:8px solid #007bff;padding-left:20px;">
                ${logoHTML}
                <h2 style="margin:5px 0;font-size:28px;">${escapeHtml(data.name)}</h2>
                <p style="margin:5px 0;color:#007bff;font-weight:bold;">${escapeHtml(data.position || '')}</p>
                <p style="margin:5px 0;">${escapeHtml(data.company || '')}</p>
                <div id="qrContainer" style="position:absolute;bottom:20px;right:20px;">
                    <img src="${qrDataUrl}" alt="QR WhatsApp" style="width:100px;height:100px;">
                </div>
            </div>
        `;
    }

    // Premium styles
    else if (data.style === 'luxe') {
        html += `
            <div style="background:linear-gradient(135deg,#000000,#434343);color:#ffd700;padding:40px;text-align:center;">
                ${logoHTML}
                <h2 style="margin:20px 0;font-size:36px;font-weight:900;letter-spacing:3px;">${escapeHtml(data.name)}</h2>
                <p style="margin:10px 0;font-size:22px;">${escapeHtml(data.position || '')}</p>
                <p style="margin:10px 0;font-style:italic;">${escapeHtml(data.company || '')}</p>
                <div id="qrContainer" style="margin-top:40px;">
                    <img src="${qrDataUrl}" alt="QR WhatsApp" style="width:140px;height:140px;">
                </div>
            </div>
        `;
    } else if (data.style === 'eco') {
        html += `
            <div style="background:#f8fff8;padding:30px;text-align:center;border:2px dashed #4caf50;">
                ${logoHTML}
                <h2 style="margin:15px 0;font-size:32px;color:#2e7d32;">${escapeHtml(data.name)}</h2>
                <p style="margin:10px 0;font-size:20px;color:#4caf50;">${escapeHtml(data.position || '')}</p>
                <p style="margin:10px 0;color:#666;">${escapeHtml(data.company || '')} ♻️</p>
                <div id="qrContainer">
                    <img src="${qrDataUrl}" alt="QR WhatsApp" style="width:120px;height:120px;">
                </div>
            </div>
        `;
    } else if (data.style === 'tech') {
        html += `
            <div style="background:linear-gradient(135deg,#0f2027,#203a43,#2c5364);color:#00ffea;padding:40px;position:relative;">
                <div style="position:absolute;top:0;left:0;width:100%;height:100%;background:radial-gradient(circle at 30% 70%,rgba(0,255,234,0.1),transparent);"></div>
                ${logoHTML}
                <h2 style="margin:20px 0;font-size:34px;font-weight:bold;text-shadow:0 0 10px #00ffea;">${escapeHtml(data.name)}</h2>
                <p style="margin:10px 0;color:#00ffea;">${escapeHtml(data.position || '')}</p>
                <div id="qrContainer" style="margin-top:30px;">
                    <img src="${qrDataUrl}" alt="QR WhatsApp" style="width:140px;height:140px;">
                </div>
            </div>
        `;
    } else if (data.style === 'vintage') {
        html += `
            <div style="background:#fef9e7;padding:40px;text-align:center;font-family:'Georgia',serif;color:#5d4037;position:relative;">
                <div style="position:absolute;top:0;left:0;width:100%;height:100%;background:url('data:image/svg+xml;base64,...') opacity:0.1;"></div>
                ${logoHTML}
                <h2 style="margin:20px 0;font-size:36px;font-style:italic;border-bottom:3px double #8d6e63;padding-bottom:10px;">${escapeHtml(data.name)}</h2>
                <p style="margin:15px 0;font-size:22px;">${escapeHtml(data.position || '')}</p>
                <p style="margin:10px 0;">${escapeHtml(data.company || '')}</p>
                <div id="qrContainer">
                    <img src="${qrDataUrl}" alt="QR WhatsApp" style="width:120px;height:120px;">
                </div>
            </div>
        `;
    } else if (data.style === 'bold') {
        html += `
            <div style="background:#ff3b30;color:white;padding:40px;text-align:center;font-weight:900;">
                ${logoHTML}
                <h2 style="margin:20px 0;font-size:48px;text-transform:uppercase;letter-spacing:4px;">${escapeHtml(data.name)}</h2>
                <p style="margin:15px 0;font-size:28px;">${escapeHtml(data.position || '')}</p>
                <p style="margin:10px 0;font-size:24px;">${escapeHtml(data.company || '')}</p>
                <div id="qrContainer" style="margin-top:30px;">
                    <img src="${qrDataUrl}" alt="QR WhatsApp" style="width:140px;height:140px;">
                </div>
            </div>
        `;
    }

    html += `</div>`;
    return html;
}

function updatePreview() {
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;

    if (!name && !phone) {
        // Show placeholder if no data
        elements.cardCanvas.innerHTML = `
            <div class="card-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M8 12h8M12 8v8"/>
                </svg>
                <p>Completa los datos para ver la preview</p>
            </div>
        `;
        elements.downloadBtn.disabled = true;
        elements.shareBtn.disabled = true;
        elements.copyNfcBtn.disabled = true;
        elements.downloadVcfBtn.disabled = true;
        elements.nfcUrlDisplay.textContent = 'Rellena el teléfono para generar el enlace';
        return;
    }

    const data = {
        name: name || 'Tu Nombre',
        phone: phone || '+34 600 000 000',
        company: document.getElementById('company').value,
        position: document.getElementById('position').value,
        message: document.getElementById('message').value,
        style: document.querySelector('.style-option.active')?.dataset.style || 'minimalista'
    };

    generateCard(data);
}

function updateNfcElements(whatsappUrl, data) {
    elements.nfcUrlDisplay.textContent = whatsappUrl;
    elements.copyNfcBtn.disabled = false;
    elements.downloadVcfBtn.disabled = false;
}

// ============================================
// NFC Functions
// ============================================
function copyNfcUrl() {
    const url = elements.nfcUrlDisplay.textContent;
    if (url && url !== 'Rellena el teléfono para generar el enlace') {
        navigator.clipboard.writeText(url).then(() => {
            showToast('Enlace NFC copiado al portapapeles', 'success');
        }).catch(() => {
            showToast('Error al copiar enlace', 'error');
        });
    }
}

function downloadVCard() {
    const data = {
        name: document.getElementById('name').value || 'Contacto',
        position: document.getElementById('position').value,
        company: document.getElementById('company').value,
        phone: document.getElementById('phone').value.trim(),
        email: document.getElementById('email').value,
        website: document.getElementById('website').value
    };

    let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
    vcard += `FN:${data.name}\n`;
    vcard += `TITLE:${data.position}\n`;
    vcard += `ORG:${data.company}\n`;
    vcard += `TEL;TYPE=CELL:${data.phone}\n`;
    if (data.email) vcard += `EMAIL:${data.email}\n`;
    if (data.website) vcard += `URL:${data.website}\n`;
    vcard += `NOTE:Escanea o toca para WhatsApp\n`;
    vcard += 'END:VCARD';

    const blob = new Blob([vcard], { type: 'text/vcard' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'contacto-whatsapp.vcf';
    link.click();
    showToast('vCard descargada', 'success');
}

// ============================================
// Download & Share
// ============================================
async function downloadCard() {
    if (!AppState.currentCard) return;

    const card = AppState.currentCard;

    try {
        const canvas = await html2canvas(card, {
            scale: AppState.settings.quality === 'ultra' ? 4 : AppState.settings.quality === 'high' ? 2 : 1,
            backgroundColor: null,
            logging: false
        });

        const link = document.createElement('a');
        link.download = `tarjeta-qrcard-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        // Update download count
        const downloads = parseInt(localStorage.getItem('qrcard_downloads') || '0') + 1;
        localStorage.setItem('qrcard_downloads', downloads);
        updateStats();

        showToast('Tarjeta descargada', 'success');
    } catch (error) {
        showToast('Error al descargar', 'error');
        console.error(error);
    }
}

async function shareCard() {
    if (!AppState.currentCard) return;

    try {
        const canvas = await html2canvas(AppState.currentCard, {
            scale: 2,
            backgroundColor: null
        });

        canvas.toBlob(async (blob) => {
            const file = new File([blob], 'tarjeta.png', { type: 'image/png' });

            if (navigator.share) {
                await navigator.share({
                    title: 'Mi tarjeta de visita',
                    text: 'Generada con QRCard',
                    files: [file]
                });
            } else {
                showToast('Compartir no disponible en este navegador', 'error');
            }
        });
    } catch (error) {
        showToast('Error al compartir', 'error');
    }
}

// ============================================
// Video
// ============================================
function playVideo() {
    elements.tutorialVideo.play();
    elements.videoOverlay.classList.add('hidden');
}

// ============================================
// Templates
// ============================================
function loadTemplates() {
    const templates = [
        { id: 'minimalista', name: 'Minimalista', desc: 'Diseño limpio y elegante', color: 'linear-gradient(135deg, #ffffff, #f8fafc)' },
        { id: 'moderno', name: 'Moderno', desc: 'Estilo contemporáneo con gradientes', color: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' },
        { id: 'elegante', name: 'Elegante', desc: 'Toque clásico y sofisticado', color: 'linear-gradient(135deg, #f5f5dc, #e8e4c9)' },
        { id: 'creativo', name: 'Creativo', desc: 'Colores vibrantes y atrevidos', color: 'linear-gradient(135deg, #10b981, #f59e0b)' },
        { id: 'profesional', name: 'Profesional', desc: 'Ideal para empresas', color: 'linear-gradient(135deg, #64748b, #334155)' },
        { id: 'luxe', name: 'Luxe', desc: 'Diseño premium exclusivo', color: 'linear-gradient(135deg, #000000, #434343)', premium: true },
        { id: 'eco', name: 'Eco', desc: 'Estilo sostenible y natural', color: 'linear-gradient(135deg, #f8fff8, #e8f5e9)', premium: true },
        { id: 'tech', name: 'Tech', desc: 'Futurista y tecnológico', color: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)', premium: true },
        { id: 'vintage', name: 'Vintage', desc: 'Clásico y retro', color: 'linear-gradient(135deg, #fef9e7, #f5e6c8)', premium: true },
        { id: 'bold', name: 'Bold', desc: 'Impactante y audaz', color: '#ff3b30', premium: true }
    ];

    elements.templatesGrid.innerHTML = templates.map(t => `
        <div class="template-card ${t.premium ? 'premium' : ''}" onclick="selectTemplate('${t.id}')">
            <div class="template-preview" style="background: ${t.color}"></div>
            <div class="template-info">
                <div class="template-name">${t.name} ${t.premium ? '<span class="premium-badge">Premium</span>' : ''}</div>
                <div class="template-desc">${t.desc}</div>
            </div>
        </div>
    `).join('');
}

function selectTemplate(templateId) {
    // Check if premium template and not unlocked
    if (premiumStyles.includes(templateId) && !isPremiumUnlocked) {
        showToast('🔒 Desbloquea Premium para usar esta plantilla', 'error');
        return;
    }

    // Update style selector
    elements.styleSelector.querySelectorAll('.style-option').forEach(opt => {
        opt.classList.remove('active');
        if (opt.dataset.style === templateId) {
            opt.classList.add('active');
        }
    });

    navigateTo('create');
    showToast(`Plantilla ${templateId} seleccionada`, 'success');
}

// ============================================
// History
// ============================================
function saveToHistory(data) {
    const historyItem = {
        ...data,
        id: Date.now(),
        createdAt: new Date().toISOString()
    };

    AppState.cards.unshift(historyItem);
    if (AppState.cards.length > 50) {
        AppState.cards = AppState.cards.slice(0, 50);
    }

    localStorage.setItem('qrcard_history', JSON.stringify(AppState.cards));
    loadHistory();
}

function loadHistory() {
    if (AppState.cards.length === 0) {
        elements.historyList.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p>No hay tarjetas creadas aún</p>
                <button class="btn btn-primary" onclick="navigateTo('create')">Crear primera tarjeta</button>
            </div>
        `;
        return;
    }

    elements.historyList.innerHTML = `
        <div class="history-grid" style="display: grid; gap: 1rem;">
            ${AppState.cards.map(card => `
                <div class="history-item" style="
                    background: var(--bg-secondary);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-lg);
                    padding: var(--space-4);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <div>
                        <div style="font-weight: 600; color: var(--text-primary);">${escapeHtml(card.name)}</div>
                        <div style="font-size: 0.875rem; color: var(--text-tertiary);">
                            ${escapeHtml(card.company || 'Sin empresa')} • ${new Date(card.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                    <div style="display: flex; gap: var(--space-2);">
                        <button class="btn btn-secondary" onclick="loadCard(${card.id})" style="padding: var(--space-2);">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button class="btn btn-danger" onclick="deleteCard(${card.id})" style="padding: var(--space-2);">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function loadCard(id) {
    const card = AppState.cards.find(c => c.id === id);
    if (!card) return;

    document.getElementById('name').value = card.name;
    document.getElementById('phone').value = card.phone;
    document.getElementById('company').value = card.company || '';
    document.getElementById('position').value = card.position || '';

    // Select style
    elements.styleSelector.querySelectorAll('.style-option').forEach(opt => {
        opt.classList.remove('active');
        if (opt.dataset.style === card.style) {
            opt.classList.add('active');
        }
    });

    navigateTo('create');
    updatePreview();
    showToast('Tarjeta cargada', 'success');
}

function deleteCard(id) {
    AppState.cards = AppState.cards.filter(c => c.id !== id);
    localStorage.setItem('qrcard_history', JSON.stringify(AppState.cards));
    loadHistory();
    updateStats();
    showToast('Tarjeta eliminada', 'success');
}

function clearHistory() {
    if (confirm('¿Estás seguro de que quieres borrar todo el historial?')) {
        AppState.cards = [];
        localStorage.removeItem('qrcard_history');
        loadHistory();
        updateStats();
        showToast('Historial borrado', 'success');
    }
}

// ============================================
// Stats
// ============================================
function updateStats() {
    const cards = AppState.cards.length;
    const downloads = parseInt(localStorage.getItem('qrcard_downloads') || '0');

    animateValue(elements.statCards, 0, cards, 1000);
    animateValue(elements.statDownloads, 0
