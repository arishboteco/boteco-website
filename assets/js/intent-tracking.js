/* Measure contact and reservation intent; never claim a completed booking. */
(function () {
    'use strict';
    if (window.botecoIntentTracking) return;
    window.botecoIntentTracking = true;

    function outletContext() {
        const selector = document.getElementById('outletSelector');
        const requested = new URL(window.location.href).searchParams.get('location');
        const selected = selector && selector.value;
        const outletId = selected === 'mg-road' || selected === 'bagmane-solarium-city'
            ? selected : requested === 'bagmane' ? 'bagmane-solarium-city' : 'mg-road';
        return {
            outlet_id: outletId,
            outlet_location: outletId === 'mg-road' ? 'indiqube' : 'bagmane'
        };
    }

    function track(name, provider) {
        if (typeof window.gtag !== 'function') return;
        window.gtag('event', name, {
            send_to: 'G-RPDE0S6068',
            ...outletContext(),
            booking_provider: provider,
            transport_type: 'beacon'
        });
    }

    const modal = document.getElementById('reservationsModal');
    const hint = document.getElementById('reservationOutletHint');
    if (modal) {
        modal.addEventListener('show.bs.modal', function () {
            if (!hint) return;
            hint.textContent = outletContext().outlet_id === 'mg-road'
                ? 'For IndiQube Symphony, select “Boteco” in the booking form below.'
                : 'For Bagmane Solarium City, select “Boteco - Bagmane” in the booking form below.';
        });
        modal.addEventListener('shown.bs.modal', function () {
            track('reservation_start', 'petpooja');
        });
    }

    const actions = {
        outletZomatoReservation: ['reservation_start', 'zomato'],
        outletSwiggyReservation: ['reservation_start', 'swiggy_dineout'],
        outletEazyReservation: ['reservation_start', 'eazydiner'],
        outletPhone: ['phone_click', 'phone'],
        headerCall: ['phone_click', 'phone'],
        outletWhatsapp: ['whatsapp_click', 'whatsapp'],
        headerMap: ['directions_click', 'google_maps'],
        outletMapFallback: ['directions_click', 'google_maps']
    };
    document.addEventListener('click', function (event) {
        const link = event.target.closest && event.target.closest('a[id]');
        const action = link && actions[link.id];
        if (action) track(action[0], action[1]);
    });
})();
