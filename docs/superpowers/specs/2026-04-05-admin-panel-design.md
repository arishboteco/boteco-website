# Admin Panel Design Spec

## Overview

A hidden admin panel hosted at `admin.boteco.co.in` that allows the site owner to manage all website content (menus, events, about text, images, outlets, hero media) through a browser-based dashboard. Authentication is via GitHub OAuth, with a GitHub Action serving as the secure token exchange proxy. All content changes are committed directly to the GitHub repository.

## Architecture

```
admin.boteco.co.in (GitHub Pages subdomain)
├── index.html          ← Admin SPA entry point
├── admin.js            ← Auth flow + GitHub API client + UI logic
└── admin.css           ← Admin panel styles (dark mode, two-column layout)

.github/workflows/
└── oauth-proxy.yml     ← GitHub Action: receives OAuth callback,
                          exchanges code for token, verifies user identity,
                          returns short-lived session token to SPA

Repository (boteco-website)
└── All content files   ← Admin reads/writes via GitHub Contents API
```

## Authentication Flow

1. User visits `admin.boteco.co.in`
2. If no valid session token exists, show "Login with GitHub" button
3. User clicks → redirected to GitHub OAuth authorize URL
4. After authorization, GitHub redirects to the OAuth proxy workflow (via `workflow_dispatch` or a dedicated endpoint)
5. The GitHub Action:
   - Exchanges the OAuth code for an access token (using stored client secret as a repository secret)
   - Fetches the authenticated user's GitHub username
   - Verifies it matches the allowed admin username
   - Generates a short-lived session token (JWT or random string, valid 24h)
   - Returns the session token to the SPA via a redirect to the admin page with the token in the URL fragment
6. SPA stores the token in `sessionStorage` (cleared on tab close)
7. All subsequent GitHub API calls use this token in the `Authorization` header

**Security:**
- GitHub OAuth client secret stored as a repository secret, never exposed to the client
- Only the designated admin GitHub username is allowed access
- Session tokens expire after 24 hours
- `sessionStorage` used instead of `localStorage` so tokens don't persist across tabs/sessions
- CSP headers on the admin page restrict script sources

## Admin Dashboard Layout

**Two-column layout:**
- **Left sidebar**: Navigation between content sections, collapsible on mobile
- **Right content area**: Active section's editing interface

**Header bar:**
- Boteco admin branding
- GitHub avatar + username of logged-in user
- Session expiry countdown
- Logout button (clears session storage)

## Content Sections

### 1. About
- Edit four text blocks: "Our Story", "The Boteco Experience", "Meet the Chef", "Our Menu"
- Each block has a rich text area (up to 10,000 chars)
- Upload/replace the 6 about images + the GIF/MP4 tile
- Drag-and-drop image upload with live preview
- Auto-convert uploaded images to WebP + generate optimized `.jpg` fallbacks

### 2. Food Menu
- Upload PDF → triggers the existing `update_menu_from_pdf.py` pipeline via a GitHub Action
- Action converts PDF to page images, updates `food-menu.json` manifest
- Show current menu pages with ability to reorder or delete individual pages
- Preview modal matching the live site's food menu modal

### 3. Bar Menu
- Same flow as Food Menu
- Targets `bar-menu.pdf` → `assets/menus/bar-menu-pg#.jpg` + `bar-menu.json`

### 4. Specials Menu
- Same flow as Food Menu
- Targets `specials-menu.pdf` → `assets/menus/specials-menu-pg#.jpg` + `specials-menu.json`

### 5. Events
- Upload event images (any format)
- Set event date and title via form fields
- Auto-generates `assets/events/events.json` on commit
- One-click "Archive" button moves past events to the archive section
- Drag-and-drop upload with thumbnail preview grid
- Auto-convert to WebP

### 6. Images
- File browser for all `assets/images/` subdirectories
- Upload replacement images for any existing file
- Auto-convert to WebP + generate optimized JPEG/PNG fallbacks
- Automatic compression: oversized images are resized and quality-optimized client-side before commit
- No file size limits — compression handles large files transparently

### 7. Outlets
- Edit outlet data stored in `assets/data/outlets.json` (or current data source)
- Fields per outlet: name, address, phone, hours, map coordinates, WhatsApp number, Google Maps embed URL
- Add/remove outlets
- Live preview of how outlet info appears on the main site

### 8. Hero
- Upload replacement hero video (MP4/WebM) or poster image
- Auto-compress video client-side if possible (or warn if too large for GitHub API)
- Preview the hero section with the new media

## Commit Flow

1. Each edit creates a pending change in the commit panel (bottom of the dashboard)
2. Panel shows a list of all files that will be modified
3. User writes a commit message (default auto-generated from action type)
4. Two commit modes:
   - **Commit directly to main** — immediate push (for quick single-file changes)
   - **Create PR** — commits to a new branch, creates a pull request for review (for multi-file or risky changes)
5. On success: toast notification + option to view the commit/PR on GitHub
6. On failure: clear error message with retry option

## Data Flow

```
User action in admin UI
  ↓
Client-side validation (file type, required fields)
  ↓
Auto-compression/conversion (images → WebP, resize if needed)
  ↓
GitHub API: GET file metadata (to retrieve current SHA)
  ↓
GitHub API: PUT file with new content + SHA
  ↓
For multi-file operations (PDF conversion, event batch):
  - Create new branch
  - Commit each file sequentially
  - Create PR
  ↓
Success: toast + updated preview
Failure: error message + retry
```

## Error Handling

| Error | Behavior |
|-------|----------|
| Auth token expired | Attempt silent refresh → if fails, show "Session expired" banner with one-click re-auth |
| GitHub API rate limit | Show countdown timer, queue changes in memory, replay when limit resets |
| File conflict (SHA mismatch) | Show diff view, offer: overwrite, re-fetch and merge, or discard |
| Network failure during upload | Retry with exponential backoff (3 attempts), then show manual retry button |
| PDF conversion fails | Report which pages failed, keep successful pages, allow retry |
| File exceeds GitHub API 100MB limit after compression | Show warning, suggest further compression or splitting |

## File Compression Strategy

**Client-side processing before commit:**

- **JPEG/PNG images**: Use Canvas API to resize if dimensions exceed 4096px on longest edge, compress to quality 85, then generate WebP via `canvas.toBlob('image/webp')`
- **GIFs**: Pass through without conversion (preserve animation)
- **Videos**: Pass through — client-side video compression is unreliable; if file exceeds 100MB, warn user
- **PDFs**: Compressed via a lightweight client-side PDF optimizer if available, otherwise sent as-is to the GitHub Action for server-side conversion
- **All uploads**: No artificial size limits — compression runs transparently before the GitHub API call

## Technology Choices

- **No framework** — vanilla JavaScript, HTML, CSS to match the existing site's approach
- **GitHub OAuth App** — for authentication (separate from the repo, registered under the owner's GitHub account)
- **GitHub Contents API** — for reading and writing files (`PUT /repos/{owner}/{repo}/contents/{path}`)
- **GitHub Actions** — for OAuth token exchange proxy and PDF-to-image conversion pipeline
- **GitHub Pages** — hosting for the admin SPA (same as the main site)

## Subdomain Setup

- Create `admin/CNAME` file containing `admin.boteco.co.in`
- Configure DNS: add a CNAME record for `admin` pointing to the GitHub Pages domain
- The admin page is served from the `admin/` directory of the repo, separate from the main site

## Files to Create

```
admin/
├── index.html            ← Admin SPA shell
├── css/
│   └── admin.css         ← Dark mode admin styles
├── js/
│   └── admin.js          ← Auth, GitHub API client, UI logic
└── CNAME                 ← admin.boteco.co.in

.github/workflows/
├── oauth-proxy.yml       ← OAuth token exchange + user verification
└── pdf-menu-converter.yml ← Converts uploaded PDFs to menu images
```

## Files to Modify

```
index.html              ← No changes (admin is completely separate)
assets/data/            ← May need to create outlets.json if it doesn't exist
```

## Security Considerations

1. **OAuth client secret** stored as `GH_OAUTH_CLIENT_SECRET` repository secret
2. **Allowed admin username** stored as `ADMIN_GITHUB_USERNAME` repository secret
3. **Session tokens** are short-lived (24h), stored in `sessionStorage`
4. **CSP** on admin page restricts script sources to `self` and `api.github.com`
5. **No write access from unauthenticated users** — all API calls require a valid session token
6. **Audit trail** — every change is a git commit with author info and timestamp
