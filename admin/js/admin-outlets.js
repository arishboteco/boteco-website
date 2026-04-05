(function () {
    'use strict';

    async function fetchOutlets() {
        try {
            const data = await AdminAuth.githubApi('/contents/assets/data/outlets.json');
            return JSON.parse(decodeURIComponent(escape(atob(data.content))));
        } catch (err) {
            AdminUtils.showToast(`Failed to load outlets: ${err.message}`, 'error');
            return [];
        }
    }

    function render(container) {
        const addBtn = document.createElement('button');
        addBtn.className = 'btn-add-outlet';
        addBtn.textContent = '+ Add Outlet';
        addBtn.addEventListener('click', () => addOutletForm(container));
        container.appendChild(addBtn);

        const listContainer = document.createElement('div');
        listContainer.id = 'outlets-list';
        listContainer.className = 'outlets-list';
        container.appendChild(listContainer);

        loadOutlets(listContainer);
    }

    async function loadOutlets(listContainer) {
        const outlets = await fetchOutlets();
        listContainer.innerHTML = '';

        outlets.forEach((outlet, index) => {
            const card = document.createElement('div');
            card.className = 'outlet-card';
            card.innerHTML = `
                <div class="outlet-header">
                    <h4>${outlet.name}</h4>
                    <button class="btn-delete-outlet" data-index="${index}" aria-label="Delete outlet">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                    </button>
                </div>
                <div class="outlet-fields">
                    <div class="form-field">
                        <label>Name</label>
                        <input type="text" class="form-input outlet-name" value="${outlet.name}" data-field="name" data-index="${index}">
                    </div>
                    <div class="form-field">
                        <label>Phone (raw)</label>
                        <input type="text" class="form-input outlet-phone-raw" value="${outlet.phoneRaw}" data-field="phoneRaw" data-index="${index}">
                    </div>
                    <div class="form-field">
                        <label>Phone (display)</label>
                        <input type="text" class="form-input outlet-phone-display" value="${outlet.phoneDisplay}" data-field="phoneDisplay" data-index="${index}">
                    </div>
                    <div class="form-field">
                        <label>Hours</label>
                        <input type="text" class="form-input outlet-hours" value="${outlet.hours}" data-field="hours" data-index="${index}">
                    </div>
                    <div class="form-field">
                        <label>Address (one line per row)</label>
                        <textarea class="form-textarea outlet-address" data-field="addressLines" data-index="${index}" rows="4">${outlet.addressLines.join('\n')}</textarea>
                    </div>
                    <div class="form-field">
                        <label>Map Embed URL</label>
                        <input type="text" class="form-input outlet-map" value="${outlet.mapEmbedUrl}" data-field="mapEmbedUrl" data-index="${index}">
                    </div>
                    <div class="form-field">
                        <label>WhatsApp Number</label>
                        <input type="text" class="form-input outlet-whatsapp" value="${outlet.whatsappNumber || outlet.phoneRaw}" data-field="whatsappNumber" data-index="${index}">
                    </div>
                </div>
            `;
            listContainer.appendChild(card);
        });

        listContainer.querySelectorAll('.form-input, .form-textarea').forEach(input => {
            input.addEventListener('change', () => {
                handleOutletChange(listContainer);
            });
        });

        listContainer.querySelectorAll('.btn-delete-outlet').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.index, 10);
                deleteOutlet(idx, listContainer);
            });
        });
    }

    async function handleOutletChange(listContainer) {
        const outlets = await fetchOutlets();

        listContainer.querySelectorAll('.outlet-card').forEach((card, index) => {
            if (!outlets[index]) return;

            const nameInput = card.querySelector('.outlet-name');
            const phoneRawInput = card.querySelector('.outlet-phone-raw');
            const phoneDisplayInput = card.querySelector('.outlet-phone-display');
            const hoursInput = card.querySelector('.outlet-hours');
            const addressInput = card.querySelector('.outlet-address');
            const mapInput = card.querySelector('.outlet-map');
            const whatsappInput = card.querySelector('.outlet-whatsapp');

            if (nameInput) outlets[index].name = nameInput.value;
            if (phoneRawInput) outlets[index].phoneRaw = phoneRawInput.value;
            if (phoneDisplayInput) outlets[index].phoneDisplay = phoneDisplayInput.value;
            if (hoursInput) outlets[index].hours = hoursInput.value;
            if (addressInput) outlets[index].addressLines = addressInput.value.split('\n').filter(l => l.trim());
            if (mapInput) outlets[index].mapEmbedUrl = mapInput.value;
            if (whatsappInput) outlets[index].whatsappNumber = whatsappInput.value;
        });

        const content = JSON.stringify(outlets, null, 4);
        AdminCommit.addChange(
            'assets/data/outlets.json',
            'Update outlet data',
            async () => content
        );
    }

    async function deleteOutlet(index, listContainer) {
        const outlets = await fetchOutlets();
        outlets.splice(index, 1);

        const content = JSON.stringify(outlets, null, 4);
        AdminCommit.addChange(
            'assets/data/outlets.json',
            'Delete outlet',
            async () => content
        );

        loadOutlets(listContainer);
    }

    async function addOutletForm(container) {
        const outlets = await fetchOutlets();
        const newOutlet = {
            id: `outlet-${Date.now()}`,
            name: 'New Outlet',
            phoneRaw: '+918792045444',
            phoneDisplay: '+91 87920 45444',
            hours: 'Mon-Sun, 12:00 PM - 1:00 AM',
            addressLines: ['Address line 1', 'City, State'],
            mapEmbedUrl: '',
            whatsappNumber: '+918792045444'
        };
        outlets.push(newOutlet);

        const content = JSON.stringify(outlets, null, 4);
        AdminCommit.addChange(
            'assets/data/outlets.json',
            'Add new outlet',
            async () => content
        );

        const listContainer = document.getElementById('outlets-list');
        if (listContainer) loadOutlets(listContainer);
    }

    if (window.AdminDashboard) {
        window.AdminDashboard.registerSection('outlets', render);
    }

    window.AdminOutlets = { render, fetchOutlets };
})();
