document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('cardForm');
    const preview = document.getElementById('preview');
    const cardCanvas = document.getElementById('cardCanvas');
    const downloadBtn = document.getElementById('downloadBtn');
    const generateBtn = document.getElementById('generateBtn');

    let qrCode = null;
    let logoData = null;

    // Handle logo upload
    document.getElementById('logo').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.size > 1024 * 1024) { // 1MB limit
            alert('El logo debe ser menor a 1MB.');
            e.target.value = '';
            return;
        }
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                logoData = reader.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Generate card on form submit
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value.trim();
        const phone = document.getElementById('phone').value.trim().replace(/\s+/g, '').replace(/^\+?/, '+');
        const company = document.getElementById('company').value.trim();
        const position = document.getElementById('position').value.trim();
        const style = document.getElementById('style').value;

        if (!name || !phone) {
            alert('Nombre y teléfono son obligatorios.');
            return;
        }

        // Validate phone (basic: digits with optional +, length 9-15)
        if (!/^\+\d{9,15}$/.test(phone)) {
            alert('Teléfono inválido. Usa formato internacional con + al inicio.');
            return;
        }

        const whatsappLink = `https://wa.me/${phone.replace(/^\+/, '')}`;

        // Clear previous QR
        if (qrCode) qrCode.clear();

        // Generate QR
        QRCode.toCanvas(whatsappLink, { width: 100, height: 100 }, (error, canvas) => {
            if (error) {
                console.error(error);
                alert('Error generando QR.');
                return;
            }
            canvas.setAttribute('alt', 'Código QR para abrir WhatsApp');
            qrCode = canvas;

            // Update preview
            updatePreview(name, company, position, phone, canvas, logoData, style);
            preview.classList.remove('hidden');
            generateBtn.textContent = 'Actualizar tarjeta';
        });
    });

    // Update preview div
    function updatePreview(name, company, position, phone, qrCanvas, logo, style) {
        // Sanitize inputs to prevent XSS
        const safeName = document.createElement('div').textContent = name;
        const safeCompany = document.createElement('div').textContent = company;
        const safePosition = document.createElement('div').textContent = position;
        const safePhone = document.createElement('div').textContent = phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');

        // Apply style based on selection
        let backgroundColor = 'white';
        let textColor = '#333';
        let fontFamily = 'Arial, sans-serif';

        switch (style) {
            case 'minimalista':
                backgroundColor = 'white';
                textColor = '#333';
                fontFamily = 'Arial, sans-serif';
                break;
            case 'moderno':
                backgroundColor = '#007BFF';
                textColor = 'white';
                fontFamily = 'Roboto, sans-serif';
                break;
            case 'elegante':
                backgroundColor = '#F5F5DC';
                textColor = '#333';
                fontFamily = 'Times New Roman, serif';
                break;
            case 'creativo':
                backgroundColor = '#28A745';
                textColor = '#FFD700';
                fontFamily = 'Comic Sans MS, cursive';
                break;
            case 'profesional':
                backgroundColor = '#D3D3D3';
                textColor = '#007BFF';
                fontFamily = 'Helvetica, sans-serif';
                break;
        }

        // Apply styles to cardCanvas
        cardCanvas.style.backgroundColor = backgroundColor;
        cardCanvas.style.color = textColor;
        cardCanvas.style.fontFamily = fontFamily;
        cardCanvas.style.textAlign = 'center';
        cardCanvas.style.borderRadius = '5px';

        cardCanvas.innerHTML = `
            ${logo ? `<img src="${logo}" alt="Logo" style="max-width: 50px; max-height: 50px; margin-bottom: 10px;">` : ''}
            <h3 style="margin: 5px 0;">${safeName}</h3>
            ${safePosition ? `<p style="margin: 5px 0;">${safePosition}</p>` : ''}
            ${safeCompany ? `<p style="margin: 5px 0;">${safeCompany}</p>` : ''}
            <p style="margin: 5px 0;">${safePhone}</p>
            <div style="margin-top: 10px;">${qrCanvas.outerHTML}</div>
        `;
    }

    // Download PNG
    downloadBtn.addEventListener('click', () => {
        html2canvas(cardCanvas, { scale: 2 }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'tarjeta-qr.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        }).catch(err => {
            console.error(err);
            alert('Error descargando la imagen.');
        });
    });
});
