(function () {
    let outlets = [];

    const dom = {
        selector: document.getElementById('outletSelector'),
        address: document.getElementById('outletAddress'),
        phone: document.getElementById('outletPhone'),
        hours: document.getElementById('outletHours'),
        map: document.getElementById('outletMap'),
        whatsapp: document.getElementById('outletWhatsapp')
    };

    function buildWhatsappLink(phoneRaw) {
        return `https://wa.me/${phoneRaw.replace(/\D/g, '')}?text=Hi%20there%2C%20I%20visited%20your%20website%20and%20have%20a%20question`;
    }

    function renderAddress(lines) {
        dom.address.innerHTML = '';
        lines.forEach((line, index) => {
            dom.address.append(document.createTextNode(line));
            if (index < lines.length - 1) {
                dom.address.append(document.createElement('br'));
            }
        });
    }

    function updateOutlet(outletId) {
        const outlet = outlets.find(item => item.id === outletId) || outlets[0];
        if (!outlet) return;

        renderAddress(outlet.addressLines);
        dom.phone.textContent = outlet.phoneDisplay;
        dom.phone.href = `tel:${outlet.phoneRaw}`;
        dom.hours.textContent = outlet.hours;
        dom.map.src = outlet.mapEmbedUrl;
        dom.whatsapp.href = buildWhatsappLink(outlet.whatsappNumber || outlet.phoneRaw);
    }

    function initOutletSelector() {
        if (!dom.selector || !dom.address || !dom.phone || !dom.hours || !dom.map || !dom.whatsapp) {
            return;
        }

        fetch('assets/data/outlets.json')
            .then(res => res.json())
            .then(data => {
                outlets = data;

                dom.selector.innerHTML = '';
                outlets.forEach(outlet => {
                    const option = document.createElement('option');
                    option.value = outlet.id;
                    option.textContent = outlet.name;
                    dom.selector.appendChild(option);
                });

                dom.selector.addEventListener('change', event => {
                    updateOutlet(event.target.value);
                });

                dom.selector.value = outlets[0].id;
                updateOutlet(outlets[0].id);
            })
            .catch(err => {
                console.error('Failed to load outlets:', err);
            });
    }

    document.addEventListener('DOMContentLoaded', initOutletSelector);
})();
