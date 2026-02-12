(function () {
    const outlets = [
        {
            id: 'mg-road',
            name: 'Boteco MG Road (Current)',
            phoneRaw: '+918792045444',
            phoneDisplay: '+91 87920 45444',
            hours: 'Mon-Sun, 12:00 PM - 1:00 AM',
            addressLines: [
                'Unit 6, IndiQube Symphony, 25,',
                'Mahatma Gandhi Rd, Craig Park Layout,',
                'Ashok Nagar, Bengaluru,',
                'Karnataka 560001, India'
            ],
            mapEmbedUrl: 'https://www.google.com/maps?q=Unit%206%2C%20IndiQube%20Symphony%2C%2025%2C%20Mahatma%20Gandhi%20Rd%2C%20Craig%20Park%20Layout%2C%20Ashok%20Nagar%2C%20Bengaluru%2C%20Karnataka%20560001%2C%20India&output=embed'
        },
        {
            id: 'new-outlet-placeholder',
            name: 'Boteco New Outlet (Coming Soon)',
            phoneRaw: '+919999999999',
            phoneDisplay: '+91 99999 99999',
            hours: 'Mon-Sun, 12:00 PM - 12:00 AM',
            addressLines: [
                'New Boteco outlet opening soon,',
                'Bengaluru, Karnataka, India'
            ],
            mapEmbedUrl: 'https://www.google.com/maps?q=Bengaluru%2C%20Karnataka%2C%20India&output=embed'
        }
    ];

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

        renderAddress(outlet.addressLines);
        dom.phone.textContent = outlet.phoneDisplay;
        dom.phone.href = `tel:${outlet.phoneRaw}`;
        dom.hours.textContent = outlet.hours;
        dom.map.src = outlet.mapEmbedUrl;
        dom.whatsapp.href = buildWhatsappLink(outlet.phoneRaw);
    }

    function initOutletSelector() {
        if (!dom.selector || !dom.address || !dom.phone || !dom.hours || !dom.map || !dom.whatsapp) {
            return;
        }

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
    }

    document.addEventListener('DOMContentLoaded', initOutletSelector);
})();
