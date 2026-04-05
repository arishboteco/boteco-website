(function () {
    'use strict';

    const sections = {
        'about': { title: 'About', init: null },
        'food-menu': { title: 'Food Menu', init: null },
        'bar-menu': { title: 'Bar Menu', init: null },
        'specials-menu': { title: 'Specials Menu', init: null },
        'events': { title: 'Events', init: null },
        'images': { title: 'Images', init: null },
        'outlets': { title: 'Outlets', init: null },
        'hero': { title: 'Hero', init: null }
    };

    let currentSection = 'about';

    function init() {
        const sidebarItems = document.querySelectorAll('.sidebar-item');
        sidebarItems.forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.section;
                switchSection(section);
            });
        });

        const sidebarToggle = document.getElementById('btn-sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', toggleSidebar);
        }

        switchSection('about');
    }

    function switchSection(sectionName) {
        if (!sections[sectionName]) return;
        currentSection = sectionName;

        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === sectionName);
        });

        const contentArea = document.getElementById('content-area');
        if (!contentArea) return;

        contentArea.innerHTML = '';
        const h2 = document.createElement('h2');
        h2.className = 'section-title';
        h2.textContent = sections[sectionName].title;
        contentArea.appendChild(h2);

        const container = document.createElement('div');
        container.id = `section-${sectionName}`;
        container.className = 'section-content';
        contentArea.appendChild(container);

        if (sections[sectionName].init) {
            sections[sectionName].init(container);
        }
    }

    function toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.toggle('sidebar-collapsed');
        }
    }

    function registerSection(name, initFn) {
        if (sections[name]) {
            sections[name].init = initFn;
            if (currentSection === name) {
                switchSection(name);
            }
        }
    }

    window.AdminDashboard = {
        init,
        registerSection,
        switchSection,
        sections
    };
})();
