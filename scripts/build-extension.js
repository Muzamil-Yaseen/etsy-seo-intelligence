const fs = require('fs');
const path = require('path');

const extDir = path.join(__dirname, '..', 'extension');
if (!fs.existsSync(extDir)) fs.mkdirSync(extDir, { recursive: true });

// 1. manifest.json
const manifest = {
  manifest_version: 3,
  name: Etsy SEO Intelligence & Downloader,
  version: 1.0.0,
  description: 1-Click HD Photo Downloader, 13 Tag Extractor, and SEO Inspector for Etsy listings.,
  icons: {
    16: icons/icon16.png,
    48: icons/icon48.png,
    128: icons/icon128.png
  },
  action: {
    default_popup: popup.html,
    default_icon: {
      16: icons/icon16.png,
      48: icons/icon48.png,
      128: icons/icon128.png
    }
  },
  background: {
    service_worker: background.js
  },
  content_scripts: [
    {
      matches: [
        *://*.etsy.com/listing/*,
        *://*.etsy.com/*/listing/*
      ],
      js: [content.js],
      css: [content.css],
      run_at: document_idle
    }
  ],
  permissions: [
    storage,
    activeTab,
    clipboardWrite
  ],
  host_permissions: [
    *://*.etsy.com/*,
    http://localhost:*/*,
    https://*/*
  ]
};
fs.writeFileSync(path.join(extDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

// 2. background.js
const bgCode = // Etsy Intelligence Background Service Worker
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['studioUrl'], (res) => {
    if (!res.studioUrl) {
      chrome.storage.local.set({ studioUrl: 'http://localhost:3001' });
    }
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'open_in_studio') {
    chrome.storage.local.get(['studioUrl'], (res) => {
      const baseUrl = (res.studioUrl || 'http://localhost:3001').replace(/\\/+$/, '');
      const fullUrl = baseUrl + '/#import=' + encodeURIComponent(JSON.stringify(msg.data));
      chrome.tabs.create({ url: fullUrl });
      sendResponse({ success: true, url: fullUrl });
    });
    return true;
  }
});
;
fs.writeFileSync(path.join(extDir, 'background.js'), bgCode);

// 3. content.css
const cssCode = #etsy-intel-dock {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 2147483647;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #ffffff;
  background: #09090b;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 12px 16px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s ease;
  user-select: none;
}
#etsy-intel-dock:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 44px rgba(0, 0, 0, 0.65);
  border-color: rgba(255, 255, 255, 0.35);
}
.ei-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
}
.ei-dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 8px #10b981;
}
.ei-count {
  font-size: 11px;
  color: #a1a1aa;
  font-weight: 500;
}
.ei-btn-primary {
  background: #ffffff;
  color: #000000;
  border: none;
  border-radius: 10px;
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: background 0.15s ease;
}
.ei-btn-primary:hover {
  background: #e4e4e7;
}
.ei-btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: background 0.15s ease;
}
.ei-btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
}
.ei-btn-close {
  background: transparent;
  border: none;
  color: #71717a;
  font-size: 14px;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
}
.ei-btn-close:hover {
  color: #ffffff;
}
;
fs.writeFileSync(path.join(extDir, 'content.css'), cssCode);

// 4. content.js
const contentCode = // Etsy Intelligence Content Script
(function() {
  function extractListingData() {
    var match = location.pathname.match(/\\/listing\\/(\\d+)/);
    var id = match ? match[1] : null;
    var title = (document.querySelector('h1')?.innerText || document.querySelector('meta[property=og:title]')?.content || document.title.split('|')[0] || '').trim();
    var priceMeta = document.querySelector('meta[property=product:price:amount]')?.content;
    var priceText = document.querySelector('[data-buy-box] .wt-text-title-larger, .wt-text-title-larger')?.innerText || '';
    var price = (priceMeta || priceText).replace(/[^0-9.]/g, '');
    var curr = document.querySelector('meta[property=product:price:currency]')?.content || 'USD';
    var shop = (document.querySelector('a[href*=/shop/]') || document.querySelector('[data-shop-name]'))?.innerText?.trim().split('\\n')[0] || 'Etsy Artisan';

    // Upgrade all images to raw full resolution (il_fullxfull)
    var imgs = new Set();
    document.querySelectorAll('img').forEach(function(i) {
      var s = i.src || i.getAttribute('data-src') || '';
      if (s.indexOf('i.etsystatic.com') !== -1 && s.indexOf('/iusa_') === -1 && s.indexOf('/isbl_') === -1 && s.indexOf('/isla_') === -1) {
        imgs.add(s.replace(/\\/il_\\d+x\\w+\\./, '/il_fullxfull.').replace(/\\/il_\\d+x\\d+\\./, '/il_fullxfull.'));
      }
    });
    document.querySelectorAll('[data-full-image-href],[data-src]').forEach(function(el) {
      var h = el.getAttribute('data-full-image-href') || el.getAttribute('data-src') || '';
      if (h.indexOf('i.etsystatic.com') !== -1) {
        imgs.add(h.replace(/\\/il_\\d+x\\w+\\./, '/il_fullxfull.'));
      }
    });

    // Extract all tags
    var tags = new Set();
    document.querySelectorAll('a[href*=/search?q=],[data-appears-component-name=listing_page_tags] a,ul.wt-action-group a').forEach(function(a) {
      var t = a.innerText && a.innerText.trim();
      if (t && t.length > 1 && t.length <= 25 && t.indexOf('\\n') === -1 && t.indexOf('http') === -1) {
        tags.add(t);
      }
    });

    var descEl = document.querySelector('[data-id=description-text]') || document.querySelector('meta[property=og:description]');
    var desc = (descEl && (descEl.innerText || descEl.content)) || '';

    return {
      listingId: id,
      title: title,
      price: price,
      currency: curr,
      shopName: shop,
      url: window.location.href.split('?')[0],
      imageUrl: Array.from(imgs)[0] || '',
      images: Array.from(imgs).slice(0, 10),
      tags: Array.from(tags).slice(0, 13),
      description: desc.trim(),
      source: 'chrome_extension',
      fetchedAt: new Date().toISOString()
    };
  }

  // Listen to messages from popup
  chrome.runtime.onMessage.addListener(function(req, sender, sendResponse) {
    if (req.action === 'get_data') {
      sendResponse(extractListingData());
    }
  });

  // Inject floating UI widget if on listing page
  function injectWidget() {
    if (!location.pathname.includes('/listing/')) return;
    if (document.getElementById('etsy-intel-dock')) return;

    var data = extractListingData();
    var dock = document.createElement('div');
    dock.id = 'etsy-intel-dock';

    dock.innerHTML = '<div class=ei-badge><span class=ei-dot></span><span>Etsy Intelligence</span></div>'
      + '<div class=ei-count>' + data.images.length + ' HD Photos · ' + data.tags.length + ' Tags</div>'
      + '<button class=ei-btn-primary id=ei-btn-open><span>? Open in Studio ?</span></button>'
      + '<button class=ei-btn-secondary id=ei-btn-copy title=Copy JSON><span>?? Copy</span></button>'
      + '<button class=ei-btn-close id=ei-btn-hide title=Hide>?</button>';

    document.body.appendChild(dock);

    document.getElementById('ei-btn-open').onclick = function() {
      var latest = extractListingData();
      var btn = this;
      btn.innerText = 'Opening...';
      chrome.runtime.sendMessage({ action: 'open_in_studio', data: latest }, function(resp) {
        setTimeout(function() { btn.innerText = '? Open in Studio ?'; }, 2000);
      });
    };

    document.getElementById('ei-btn-copy').onclick = function() {
      var latest = extractListingData();
      var btn = this;
      navigator.clipboard.writeText(JSON.stringify(latest)).then(function() {
        btn.innerText = '? Copied!';
        setTimeout(function() { btn.innerText = '?? Copy'; }, 2000);
      });
    };

    document.getElementById('ei-btn-hide').onclick = function() {
      dock.remove();
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectWidget);
  } else {
    injectWidget();
  }
})();
;
fs.writeFileSync(path.join(extDir, 'content.js'), contentCode);

// 5. popup.html
const popupHtml = <!DOCTYPE html>
<html>
<head>
  <meta charset=utf-8>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 320px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #09090b;
      color: #ffffff;
      padding: 16px;
      font-size: 12px;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      margin-bottom: 14px;
    }
    .logo-img { width: 22px; height: 22px; object-fit: contain; }
    .title { font-size: 13px; font-weight: 700; color: #fff; }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 10px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 12px;
      width: 100%;
    }
    .status-active { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .status-inactive { background: rgba(255, 255, 255, 0.08); color: #a1a1aa; border: 1px solid rgba(255, 255, 255, 0.15); }
    .btn {
      width: 100%;
      padding: 9px 12px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: background 0.15s ease;
      margin-bottom: 8px;
    }
    .btn-primary { background: #ffffff; color: #000000; }
    .btn-primary:hover { background: #e4e4e7; }
    .btn-secondary { background: rgba(255, 255, 255, 0.1); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.15); }
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.18); }
    .config-box {
      margin-top: 14px;
      padding-top: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    .config-label { font-size: 10px; text-transform: uppercase; color: #71717a; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 6px; }
    .input-row { display: flex; gap: 6px; }
    .input-text {
      flex: 1;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      padding: 6px 8px;
      font-size: 11px;
      color: #fff;
      outline: none;
    }
    .input-text:focus { border-color: #fff; }
    .btn-save {
      background: rgba(255, 255, 255, 0.15);
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-save:hover { background: rgba(255, 255, 255, 0.25); }
  </style>
</head>
<body>
  <div class=header>
    <img src=icons/icon48.png class=logo-img alt=Logo>
    <div class=title>Etsy Intelligence Studio</div>
  </div>

  <div id=status-area>
    <div class=status-badge status-inactive id=badge>Detecting Etsy Listing...</div>
    <div id=action-buttons style=display: none;>
      <button class=btn btn-primary id=btn-open>? Open in Studio ?</button>
      <button class=btn btn-secondary id=btn-copy>?? Copy JSON to Clipboard</button>
    </div>
    <div id=not-on-etsy style=display: none; color: #a1a1aa; font-size: 11px; line-height: 1.4; margin-bottom: 8px;>
      Open any Etsy listing page (e.g. <code>etsy.com/listing/...</code>) to instantly download HD images & extract all 13 tags.
    </div>
  </div>

  <div class=config-box>
    <div class=config-label>Studio URL Target</div>
    <div class=input-row>
      <input type=text id=studio-url class=input-text value=http://localhost:3001>
      <button class=btn-save id=btn-save-url>Save</button>
    </div>
  </div>

  <script src=popup.js></script>
</body>
</html>
;
fs.writeFileSync(path.join(extDir, 'popup.html'), popupHtml);

// 6. popup.js
const popupJs = document.addEventListener('DOMContentLoaded', () => {
  const badge = document.getElementById('badge');
  const actionBtns = document.getElementById('action-buttons');
  const notOnEtsy = document.getElementById('not-on-etsy');
  const btnOpen = document.getElementById('btn-open');
  const btnCopy = document.getElementById('btn-copy');
  const studioUrlInput = document.getElementById('studio-url');
  const btnSaveUrl = document.getElementById('btn-save-url');

  chrome.storage.local.get(['studioUrl'], (res) => {
    if (res.studioUrl) {
      studioUrlInput.value = res.studioUrl;
    }
  });

  btnSaveUrl.onclick = () => {
    const val = studioUrlInput.value.trim() || 'http://localhost:3001';
    chrome.storage.local.set({ studioUrl: val }, () => {
      btnSaveUrl.innerText = 'Saved!';
      setTimeout(() => { btnSaveUrl.innerText = 'Save'; }, 1500);
    });
  };

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    if (!currentTab || !currentTab.url) return;

    if (currentTab.url.includes('etsy.com/listing/')) {
      chrome.tabs.sendMessage(currentTab.id, { action: 'get_data' }, (data) => {
        if (chrome.runtime.lastError || !data) {
          badge.className = 'status-badge status-active';
          badge.innerText = '? Etsy Listing Page (Ready)';
          actionBtns.style.display = 'block';
        } else {
          badge.className = 'status-badge status-active';
          badge.innerText = '? ' + data.images.length + ' HD Photos · ' + data.tags.length + ' Tags';
          actionBtns.style.display = 'block';
        }
      });

      btnOpen.onclick = () => {
        chrome.tabs.sendMessage(currentTab.id, { action: 'get_data' }, (data) => {
          if (data) {
            chrome.runtime.sendMessage({ action: 'open_in_studio', data });
          }
        });
      };

      btnCopy.onclick = () => {
        chrome.tabs.sendMessage(currentTab.id, { action: 'get_data' }, (data) => {
          if (data) {
            navigator.clipboard.writeText(JSON.stringify(data)).then(() => {
              btnCopy.innerText = '? Copied!';
              setTimeout(() => { btnCopy.innerText = '?? Copy JSON to Clipboard'; }, 1500);
            });
          }
        });
      };
    } else {
      badge.className = 'status-badge status-inactive';
      badge.innerText = 'Not on Etsy Listing';
      notOnEtsy.style.display = 'block';
    }
  });
});
;
fs.writeFileSync(path.join(extDir, 'popup.js'), popupJs);

console.log('SUCCESS: All Chrome Extension files created successfully in extension/!');
