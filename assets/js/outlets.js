(function () {
    let outlets = [];

    const dom = {
        selector: document.getElementById('outletSelector'),
        address: document.getElementById('outletAddress'),
        phone: document.getElementById('outletPhone'),
        hours: document.getElementById('outletHours'),
        map: document.getElementById('outletMap'),
        whatsapp: document.getElementById('outletWhatsapp'),
        zomatoReservation: document.getElementById('outletZomatoReservation'),
        swiggyReservation: document.getElementById('outletSwiggyReservation'),
        eazyReservation: document.getElementById('outletEazyReservation'),
        headerMenu: document.getElementById('headerOutletMenu'),
        headerSelector: document.getElementById('headerOutletSelector'),
        headerName: document.getElementById('headerOutletName'),
        headerCall: document.getElementById('headerCall'),
        headerMap: document.getElementById('headerMap')
    };

    const locationToOutletId = {
        indiqube: 'mg-road',
        bagmane: 'bagmane-solarium-city'
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
        dom.zomatoReservation.href = outlet.zomatoReservationUrl;
        dom.swiggyReservation.href = outlet.swiggyReservationUrl;
        dom.eazyReservation.href = outlet.eazyReservationUrl;
        dom.selector.value = outlet.id;
        dom.headerSelector.value = outlet.id;
        dom.headerName.textContent = outlet.id === 'mg-road' ? 'IndiQube' : 'Bagmane';
        dom.headerMenu.querySelector('summary').setAttribute('aria-label', `Outlet: ${dom.headerName.textContent}. Choose outlet and quick actions`);
        dom.headerCall.href = `tel:${outlet.phoneRaw}`;
        dom.headerMap.href = outlet.mapDirectionsUrl;

        return outlet;
    }

    function selectOutlet(outletId) {
        const outlet = updateOutlet(outletId);
        if (!outlet) return;

        const location = Object.keys(locationToOutletId).find(key => locationToOutletId[key] === outlet.id);
        if (location) {
            const url = new URL(window.location.href);
            url.searchParams.set('location', location);
            window.history.replaceState(null, '', url);
        }
    }

    function initOutletSelector() {
        if (!dom.selector || !dom.address || !dom.phone || !dom.hours || !dom.map || !dom.whatsapp || !dom.zomatoReservation || !dom.swiggyReservation || !dom.eazyReservation || !dom.headerMenu || !dom.headerSelector || !dom.headerName || !dom.headerCall || !dom.headerMap) {
            return;
        }

        fetch('assets/data/outlets.json')
            .then(res => res.json())
            .then(data => {
                outlets = data;

                dom.selector.innerHTML = '';
                dom.headerSelector.innerHTML = '';
                outlets.forEach(outlet => {
                    const option = document.createElement('option');
                    option.value = outlet.id;
                    option.textContent = outlet.name;
                    dom.selector.appendChild(option);

                    const headerOption = document.createElement('option');
                    headerOption.value = outlet.id;
                    headerOption.textContent = outlet.id === 'mg-road' ? 'IndiQube / MG Road' : 'Bagmane / Brookefield';
                    dom.headerSelector.appendChild(headerOption);
                });

                dom.selector.addEventListener('change', event => selectOutlet(event.target.value));
                dom.headerSelector.addEventListener('change', event => selectOutlet(event.target.value));

                const requestedLocation = new URL(window.location.href).searchParams.get('location');
                const requestedOutletId = locationToOutletId[requestedLocation];
                const selectedOutlet = outlets.find(outlet => outlet.id === requestedOutletId) || outlets[0];
                if (selectedOutlet) {
                    dom.selector.value = selectedOutlet.id;
                    updateOutlet(selectedOutlet.id);
                }

                document.addEventListener('click', event => {
                    if (!dom.headerMenu.contains(event.target)) dom.headerMenu.open = false;
                });
                dom.headerMenu.addEventListener('keydown', event => {
                    if (event.key === 'Escape') {
                        dom.headerMenu.open = false;
                        dom.headerMenu.querySelector('summary').focus();
                    }
                });
                dom.headerMenu.querySelectorAll('.header-quick-action').forEach(action => {
                    action.addEventListener('click', () => { dom.headerMenu.open = false; });
                });
            })
            .catch(err => {
                console.error('Failed to load outlets:', err);
            });
    }

    document.addEventListener('DOMContentLoaded', initOutletSelector);
})();
