const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('assets/js/intent-tracking.js', 'utf8');

function setup(location = 'indiqube', selected = '', analytics = true) {
    const calls = [];
    const handlers = {};
    const modalHandlers = {};
    const selector = { value: selected };
    const hint = { textContent: '' };
    const modal = { addEventListener: (name, fn) => { modalHandlers[name] = fn; } };
    const window = { location: { href: `https://boteco.co.in/?location=${location}` } };
    if (analytics) window.gtag = (...args) => calls.push(args);
    const document = {
        getElementById: id => ({ outletSelector: selector, reservationsModal: modal, reservationOutletHint: hint }[id]),
        addEventListener: (name, fn) => { handlers[name] = fn; }
    };
    const context = vm.createContext({ window, document, URL });
    vm.runInContext(source, context);
    return {
        calls, selector, hint, modalHandlers,
        click: id => handlers.click({ target: { closest: () => ({ id }) } }),
        reload: () => vm.runInContext(source, context)
    };
}

test('opening the direct form records intent only, with the correct outlet hint', () => {
    const s = setup();
    s.modalHandlers['show.bs.modal']();
    assert.equal(s.calls.length, 0);
    assert.match(s.hint.textContent, /IndiQube Symphony.*“Boteco”/);
    s.modalHandlers['shown.bs.modal']();
    assert.equal(s.calls.length, 1);
    assert.equal(s.calls[0][1], 'reservation_start');
    assert.equal(s.calls[0][2].outlet_location, 'indiqube');
    assert.equal(s.calls[0][2].send_to, 'G-RPDE0S6068');
    assert.equal(s.calls[0][2].booking_provider, 'petpooja');
});

test('the current outlet wins over the original landing URL', () => {
    const s = setup('indiqube', 'bagmane-solarium-city');
    s.modalHandlers['show.bs.modal']();
    assert.match(s.hint.textContent, /Boteco - Bagmane/);
    s.click('outletZomatoReservation');
    assert.equal(s.calls[0][2].outlet_location, 'bagmane');
    s.selector.value = 'mg-road';
    s.click('headerCall');
    assert.equal(s.calls[1][1], 'phone_click');
    assert.equal(s.calls[1][2].outlet_location, 'indiqube');
});

test('nested link clicks distinguish providers and ignore unrelated links', () => {
    const s = setup('bagmane');
    for (const id of ['outletSwiggyReservation', 'outletEazyReservation', 'outletWhatsapp', 'headerMap']) s.click(id);
    s.click('unrelated');
    assert.deepEqual(s.calls.map(call => call[1]), ['reservation_start', 'reservation_start', 'whatsapp_click', 'directions_click']);
    assert.deepEqual(s.calls.map(call => call[2].booking_provider), ['swiggy_dineout', 'eazydiner', 'whatsapp', 'google_maps']);
    assert.ok(s.calls.every(call => call[2].outlet_location === 'bagmane'));
    assert.ok(s.calls.every(call => !['conversion', 'reservation', 'purchase', 'book_appointment'].includes(call[1])));
});

test('analytics absence and duplicate script inclusion do not break booking', () => {
    const s = setup('indiqube', '', false);
    s.reload();
    assert.doesNotThrow(() => s.click('outletWhatsapp'));
    assert.doesNotThrow(() => s.modalHandlers['shown.bs.modal']());
    assert.equal(s.calls.length, 0);
});
