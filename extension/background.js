// Etsy SEO Intelligence Background Service Worker
function updateBadge(count) {
  try {
    if (count > 0) {
      chrome.action.setBadgeText({ text: String(count) });
      chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  } catch (e) {
    console.warn('Could not set badge:', e);
  }
}

// Broadcast queue changes to all active tabs in real-time
function broadcastQueueChange(queue) {
  try {
    chrome.tabs.query({}, (tabs) => {
      if (tabs && tabs.length) {
        tabs.forEach((t) => {
          if (t.id) {
            chrome.tabs.sendMessage(t.id, { action: 'queue_updated', queue: queue }).catch(() => {});
          }
        });
      }
    });
  } catch (e) {
    console.warn('Could not broadcast queue change:', e);
  }
}

// Listen to any local storage changes and broadcast immediately across all tabs
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.competitorQueue) {
    const newQueue = changes.competitorQueue.newValue || [];
    updateBadge(newQueue.length);
    broadcastQueueChange(newQueue);
  }
});

const PRODUCTION_STUDIO_URL = 'https://etsy-seo-intelligence.vercel.app';

function getSanitizedStudioUrl(storedUrl) {
  if (!storedUrl || typeof storedUrl !== 'string' || storedUrl.includes('localhost') || storedUrl.includes('127.0.0.1')) {
    return PRODUCTION_STUDIO_URL;
  }
  return storedUrl.replace(/\/+$/, '');
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['studioUrl', 'competitorQueue'], (res) => {
    if (!res.studioUrl || res.studioUrl.includes('localhost') || res.studioUrl.includes('127.0.0.1')) {
      chrome.storage.local.set({ studioUrl: PRODUCTION_STUDIO_URL });
    }
    if (!res.competitorQueue) {
      chrome.storage.local.set({ competitorQueue: [] });
      updateBadge(0);
    } else {
      updateBadge(res.competitorQueue.length);
    }
  });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(['studioUrl', 'competitorQueue'], (res) => {
    if (!res.studioUrl || res.studioUrl.includes('localhost') || res.studioUrl.includes('127.0.0.1')) {
      chrome.storage.local.set({ studioUrl: PRODUCTION_STUDIO_URL });
    }
    updateBadge((res.competitorQueue || []).length);
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // 1. Direct 1-listing Studio Open
  if (msg.action === 'open_in_studio') {
    chrome.storage.local.get(['studioUrl'], (res) => {
      const baseUrl = getSanitizedStudioUrl(res.studioUrl);
      const fullUrl = baseUrl + '/#import=' + encodeURIComponent(JSON.stringify(msg.data));
      chrome.tabs.create({ url: fullUrl });
      sendResponse({ success: true, url: fullUrl });
    });
    return true;
  }

  // 2. Direct Competitor Search Page Open
  if (msg.action === 'open_competitors_in_studio') {
    chrome.storage.local.get(['studioUrl'], (res) => {
      const baseUrl = getSanitizedStudioUrl(res.studioUrl);
      const payload = {
        type: 'competitors',
        keyword: msg.keyword || '',
        competitors: msg.competitors || []
      };
      const fullUrl = baseUrl + '/#import=' + encodeURIComponent(JSON.stringify(payload));
      chrome.tabs.create({ url: fullUrl });
      sendResponse({ success: true, url: fullUrl });
    });
    return true;
  }

  // 3. Get Competitor Queue
  if (msg.action === 'get_competitor_queue') {
    chrome.storage.local.get(['competitorQueue'], (res) => {
      const queue = res.competitorQueue || [];
      updateBadge(queue.length);
      sendResponse({ success: true, queue, count: queue.length });
    });
    return true;
  }

  // 4. Add Listing to Competitor Queue (Silently, max 3, NO tab redirect!)
  if (msg.action === 'add_to_competitor_queue' || msg.action === 'add_as_competitor') {
    chrome.storage.local.get(['competitorQueue'], (res) => {
      const queue = Array.isArray(res.competitorQueue) ? [...res.competitorQueue] : [];
      const item = msg.data;
      if (!item) {
        sendResponse({ success: false, error: 'No listing data provided' });
        return;
      }

      // Check if already in queue
      const existingIdx = queue.findIndex(
        (c) => (c.listingId && item.listingId && String(c.listingId) === String(item.listingId)) ||
               (c.url && item.url && c.url === item.url)
      );

      if (existingIdx !== -1) {
        updateBadge(queue.length);
        sendResponse({ success: true, alreadyExists: true, slot: existingIdx + 1, count: queue.length, queue });
        return;
      }

      // Check max limit 3
      if (queue.length >= 3) {
        updateBadge(3);
        sendResponse({
          success: false,
          limitReached: true,
          count: 3,
          queue,
          message: 'Maximum of 3 competitor listings reached. Click "Analyze in Studio" to analyze.'
        });
        return;
      }

      // Add to queue
      queue.push(item);
      chrome.storage.local.set({ competitorQueue: queue }, () => {
        updateBadge(queue.length);
        sendResponse({
          success: true,
          added: true,
          slot: queue.length,
          count: queue.length,
          queue
        });
      });
    });
    return true;
  }

  // 5. Remove Item from Competitor Queue
  if (msg.action === 'remove_from_competitor_queue') {
    chrome.storage.local.get(['competitorQueue'], (res) => {
      let queue = Array.isArray(res.competitorQueue) ? [...res.competitorQueue] : [];
      if (typeof msg.index === 'number' && msg.index >= 0 && msg.index < queue.length) {
        queue.splice(msg.index, 1);
      } else if (msg.listingId || msg.url) {
        queue = queue.filter((c) => {
          if (msg.listingId && c.listingId && String(c.listingId) === String(msg.listingId)) return false;
          if (msg.url && c.url) {
            const clean1 = c.url.split('?')[0].replace(/\/+$/, '');
            const clean2 = msg.url.split('?')[0].replace(/\/+$/, '');
            if (clean1 === clean2) return false;
          }
          return true;
        });
      }
      chrome.storage.local.set({ competitorQueue: queue }, () => {
        updateBadge(queue.length);
        sendResponse({ success: true, count: queue.length, queue });
      });
    });
    return true;
  }

  // 6. Clear Competitor Queue
  if (msg.action === 'clear_competitor_queue') {
    chrome.storage.local.set({ competitorQueue: [] }, () => {
      updateBadge(0);
      sendResponse({ success: true, count: 0, queue: [] });
    });
    return true;
  }

  // 7. Analyze Saved Competitors in Studio
  if (msg.action === 'analyze_competitor_queue') {
    chrome.storage.local.get(['studioUrl', 'competitorQueue'], (res) => {
      const baseUrl = getSanitizedStudioUrl(res.studioUrl);
      const queue = (msg.competitors && msg.competitors.length > 0)
        ? msg.competitors
        : (res.competitorQueue || []);

      if (queue.length === 0) {
        sendResponse({ success: false, error: 'No competitors saved yet' });
        return;
      }

      // Extract a smart lead keyword
      let keyword = msg.keyword || '';
      if (!keyword && queue[0]) {
        if (queue[0].tags && queue[0].tags.length > 0) {
          keyword = queue[0].tags[0];
        } else if (queue[0].title) {
          keyword = queue[0].title.split(/[,|\-]/)[0].trim();
        }
      }

      const payload = {
        action: 'analyze_competitors',
        keyword: keyword,
        competitors: queue.slice(0, 3)
      };

      const fullUrl = baseUrl + '/#import=' + encodeURIComponent(JSON.stringify(payload));
      chrome.tabs.create({ url: fullUrl });
      sendResponse({ success: true, url: fullUrl, count: queue.length });
    });
    return true;
  }
});
