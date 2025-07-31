const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

const distPath = path.join(__dirname, 'dist');
const includesPath = path.join(__dirname, '_includes');
const dataPath = path.join(__dirname, '_data');
const assetsPath = path.join(__dirname, 'assets');

// Clean the dist directory
if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true, force: true });
}
fs.mkdirSync(distPath, { recursive: true });


// Copy assets
fs.copySync(assetsPath, path.join(distPath, 'assets'));

// Read data files
const data = {};
const dataFiles = fs.readdirSync(dataPath);
for (const file of dataFiles) {
    if (file.endsWith('.json')) {
        const name = path.basename(file, '.json');
        data[name] = JSON.parse(fs.readFileSync(path.join(dataPath, file), 'utf8'));
    }
}

// Read includes
const includes = {};
const includeFiles = fs.readdirSync(includesPath);
for (const file of includeFiles) {
    if (file.endsWith('.html')) {
        const name = path.basename(file, '.html');
        includes[name] = fs.readFileSync(path.join(includesPath, file), 'utf8');
    }
}

// Process HTML files
const htmlFiles = glob.sync('*.html');
for (const file of htmlFiles) {
    let content = fs.readFileSync(file, 'utf8');

    // Replace include placeholders
    content = content.replace(/<!-- include (\w+) -->/g, (match, p1) => {
        return includes[p1] || '';
    });

    // Special handling for index.html to render events
    if (file === 'index.html') {
        let eventsHtml = '';
        if (data.events && data.events.length > 0) {
            for (const event of data.events) {
                const dateObj = new Date(event.date);
                const dateString = isNaN(dateObj)
                    ? event.date
                    : dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

                eventsHtml += `
                    <div class="col-md-4">
                        <div class="card event-card h-100">
                            <img loading="lazy" src="assets/events/${event.image}" class="card-img-top" alt="${event.title}">
                            <div class="card-body">
                                <h5 class="card-title">${event.title}</h5>
                                <p class="card-text">${dateString}</p>
                            </div>
                        </div>
                    </div>
                `;
            }
        } else {
            eventsHtml = '<p class="text-center w-100">No upcoming events</p>';
        }
        content = content.replace('<!-- events -->', eventsHtml);
    }

    // Special handling for menu pages
    if (file === 'food-menu.html' || file === 'bar-menu.html') {
        const menuName = file.split('-')[0]; // food or bar
        const menuData = data[`${menuName}-menu`];
        let menuHtml = '';

        if (menuData && menuData.categories) {
            for (const category of menuData.categories) {
                menuHtml += `<h2 class="menu-category">${category.name}</h2>`;
                if (category.items) {
                    menuHtml += '<div class="row">';
                    for (const item of category.items) {
                        menuHtml += `
                            <div class="col-md-6">
                                <div class="menu-item">
                                    <div class="menu-item-header">
                                        <h5 class="menu-item-name">${item.name}</h5>
                                        <div class="menu-item-price">${item.price}</div>
                                    </div>
                                    <p class="menu-item-description">${item.description}</p>
                                </div>
                            </div>
                        `;
                    }
                    menuHtml += '</div>';
                }
            }
        } else {
            menuHtml = '<p>Menu coming soon.</p>';
        }

        content = content.replace(`<!-- menu-${menuName} -->`, menuHtml);
    }

    const outputPath = path.join(distPath, file);
    fs.writeFileSync(outputPath, content);
}

console.log('Build complete. Files are in the dist/ directory.');
