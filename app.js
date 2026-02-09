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
        const phone = document.getElementById('phone').value.trim().replace(/\s+/g, '').replace(/^\+/, '');
        const company = document.getElementById('company').value.trim();

        if (!name || !phone) {
            alert('Nombre y teléfono son obligatorios.');
            return;
        }

        // Validate phone (basic: digits only, length 9-15)
        if (!/^\d{9,15}$/.test(phone)) {
            alert('Teléfono inválido. Usa formato internacional sin + ni espacios.');
            return;
        }

        const whatsappLink = `https://wa.me/${phone}`;

        // Clear previous QR
        if (qrCode) qrCode.clear();

        // Generate QR
        QRCode.toCanvas(whatsappLink, { width: 100, height: 100 }, (error, canvas) => {
            if (error) {
                console.error(error);
                alert('Error generando QR.');
                return;
            }
            qrCode = canvas;

            // Update preview
            updatePreview(name, company, phone, canvas, logoData);
            preview.classList.remove('hidden');
            generateBtn.textContent = 'Actualizar tarjeta';
        });
    });

    // Update preview div
    function updatePreview(name, company, phone, qrCanvas, logo) {
        cardCanvas.innerHTML = `
            <div style="text-align: center; font-family: Arial, sans-serif;">
                ${logo ? `<img src="${logo}" alt="Logo" style="max-width: 50px; max-height: 50px; margin-bottom: 10px;">` : ''}
                <h3 style="margin: 5px 0;">${name}</h3>
                ${company ? `<p style="margin: 5px 0;">${company}</p>` : ''}
                <p style="margin: 5px 0;">${phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')}</p>
                <div style="margin-top: 10px;">${qrCanvas.outerHTML}</div>
            </div>
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
