document.addEventListener('DOMContentLoaded', () => {
  const badge = document.getElementById('badge');
  const pageTypeBadge = document.getElementById('page-type-badge');
  const singleView = document.getElementById('single-listing-view');
  const competitorView = document.getElementById('competitor-search-view');
  const notOnEtsy = document.getElementById('not-on-etsy');

  // Single listing elements
  const prevTitle = document.getElementById('prev-title');
  const prevPrice = document.getElementById('prev-price');
  const prevShop = document.getElementById('prev-shop');
  const prevTags = document.getElementById('prev-tags');
  const btnOpenSingle = document.getElementById('btn-open-single');
  const btnAddCompetitor = document.getElementById('btn-add-competitor');
  const btnCopyAll = document.getElementById('btn-copy-all');
  const btnCopyTags = document.getElementById('btn-copy-tags');
  const btnCopyDesc = document.getElementById('btn-copy-desc');
  const btnCopyImages = document.getElementById('btn-copy-images');

  // Competitor batch elements
  const searchQueryTitle = document.getElementById('search-query-title');
  const searchMetaCount = document.getElementById('search-meta-count');
  const btnOpenCompetitors = document.getElementById('btn-open-competitors');
  const btnCopyCompetitors = document.getElementById('btn-copy-competitors');

  // Competitor Queue elements
  const queueBadgeCount = document.getElementById('queue-badge-count');
  const queueSlotsList = document.getElementById('queue-slots-list');
  const btnClearQueue = document.getElementById('btn-clear-queue');
  const btnAnalyzeSavedQueue = document.getElementById('btn-analyze-saved-queue');

  const studioUrlInput = document.getElementById('studio-url');
  const btnSaveUrl = document.getElementById('btn-save-url');

  let activeData = null;

  const DEFAULT_STUDIO_URL = 'https://etsy-seo-intelligence.vercel.app';

  chrome.storage.local.get(['studioUrl'], (res) => {
    if (res.studioUrl && !res.studioUrl.includes('localhost') && !res.studioUrl.includes('127.0.0.1')) {
      studioUrlInput.value = res.studioUrl;
    } else {
      studioUrlInput.value = DEFAULT_STUDIO_URL;
      chrome.storage.local.set({ studioUrl: DEFAULT_STUDIO_URL });
    }
  });

  btnSaveUrl.onclick = () => {
    let val = studioUrlInput.value.trim() || DEFAULT_STUDIO_URL;
    if (val.includes('localhost') || val.includes('127.0.0.1')) {
      val = DEFAULT_STUDIO_URL;
      studioUrlInput.value = DEFAULT_STUDIO_URL;
    }
    chrome.storage.local.set({ studioUrl: val }, () => {
      btnSaveUrl.innerText = 'Saved!';
      setTimeout(() => { btnSaveUrl.innerText = 'Save'; }, 1500);
    });
  };

  function flashBtn(btn, text) {
    const orig = btn.innerHTML;
    btn.innerText = text;
    setTimeout(() => { btn.innerHTML = orig; }, 1800);
  }

  // Render Competitor Queue Slots (1, 2, 3)
  function renderQueue() {
    chrome.runtime.sendMessage({ action: 'get_competitor_queue' }, (res) => {
      const queue = (res && Array.isArray(res.queue)) ? res.queue : [];
      const count = queue.length;

      if (queueBadgeCount) {
        queueBadgeCount.innerText = `(${count}/3)`;
      }

      if (queueSlotsList) {
        queueSlotsList.innerHTML = '';
        for (let i = 0; i < 3; i++) {
          const item = queue[i];
          if (item) {
            const slotEl = document.createElement('div');
            slotEl.className = 'queue-slot';

            const thumb = document.createElement('img');
            thumb.className = 'slot-thumb';
            thumb.src = item.imageUrl || (item.images && item.images[0]) || 'icons/icon48.png';
            thumb.alt = 'Listing';
            thumb.onerror = () => { thumb.src = 'icons/icon48.png'; };

            const info = document.createElement('div');
            info.className = 'slot-info';

            const title = document.createElement('div');
            title.className = 'slot-title';
            title.innerText = `#${i + 1}: ${item.title || 'Etsy Competitor'}`;
            title.title = item.title || '';

            const meta = document.createElement('div');
            meta.className = 'slot-meta';
            const p = item.price ? ('$' + item.price) : 'Price noted';
            const s = item.shopName || 'Artisan';
            meta.innerText = `${p} · ${s} · ${(item.tags || []).length} tags`;

            info.appendChild(title);
            info.appendChild(meta);

            const removeBtn = document.createElement('button');
            removeBtn.className = 'slot-remove';
            removeBtn.innerHTML = '✕';
            removeBtn.title = 'Remove this competitor';
            removeBtn.onclick = () => {
              chrome.runtime.sendMessage({ action: 'remove_from_competitor_queue', index: i }, () => {
                renderQueue();
              });
            };

            slotEl.appendChild(thumb);
            slotEl.appendChild(info);
            slotEl.appendChild(removeBtn);
            queueSlotsList.appendChild(slotEl);
          } else {
            const emptyEl = document.createElement('div');
            emptyEl.className = 'queue-slot-empty';
            emptyEl.innerText = `Slot #${i + 1}: Empty (Click "Add as Competitor" on Etsy)`;
            queueSlotsList.appendChild(emptyEl);
          }
        }
      }

      // Update Analyze CTA
      if (btnAnalyzeSavedQueue) {
        if (count > 0) {
          btnAnalyzeSavedQueue.disabled = false;
          btnAnalyzeSavedQueue.style.opacity = '1';
          btnAnalyzeSavedQueue.style.cursor = 'pointer';
          btnAnalyzeSavedQueue.innerText = `🚀 Analyze ${count} Competitor${count > 1 ? 's' : ''} in Studio ↗`;
        } else {
          btnAnalyzeSavedQueue.disabled = true;
          btnAnalyzeSavedQueue.style.opacity = '0.5';
          btnAnalyzeSavedQueue.style.cursor = 'not-allowed';
          btnAnalyzeSavedQueue.innerText = '🚀 Analyze in Studio ↗';
        }
      }

      // Update Add as Competitor button state if on single listing
      if (btnAddCompetitor && activeData) {
        const isSaved = queue.some((c) =>
          (c.listingId && activeData.listingId && String(c.listingId) === String(activeData.listingId)) ||
          (c.url && activeData.url && (c.url === activeData.url || c.url.split('?')[0] === activeData.url.split('?')[0]))
        );
        if (isSaved) {
          btnAddCompetitor.innerText = `✓ Saved in Queue (${count}/3) · Click to Remove`;
          btnAddCompetitor.style.color = '#34d399';
          btnAddCompetitor.style.borderColor = 'rgba(52, 211, 153, 0.4)';
        } else if (count >= 3) {
          btnAddCompetitor.innerText = 'Queue Full (3/3) - Analyze ↗';
          btnAddCompetitor.style.color = '#fbbf24';
          btnAddCompetitor.style.borderColor = 'rgba(251, 191, 36, 0.4)';
        } else {
          btnAddCompetitor.innerText = `🎯 Add as Competitor (${count}/3)`;
          btnAddCompetitor.style.color = '';
          btnAddCompetitor.style.borderColor = '';
        }
      }
    });
  }

  // Clear all competitors in queue
  if (btnClearQueue) {
    btnClearQueue.onclick = () => {
      btnClearQueue.innerText = 'Clearing...';
      chrome.runtime.sendMessage({ action: 'clear_competitor_queue' }, () => {
        btnClearQueue.innerText = '✓ Cleared!';
        renderQueue();
        setTimeout(() => { btnClearQueue.innerText = 'Clear all'; }, 1500);
      });
    };
  }

  // Analyze in Studio
  if (btnAnalyzeSavedQueue) {
    btnAnalyzeSavedQueue.onclick = () => {
      btnAnalyzeSavedQueue.innerText = 'Opening Studio...';
      chrome.runtime.sendMessage({ action: 'analyze_competitor_queue' }, () => {
        setTimeout(renderQueue, 1500);
      });
    };
  }

  // Tab Inspection
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    if (!currentTab || !currentTab.url) {
      renderQueue();
      return;
    }

    if (currentTab.url.includes('etsy.com/listing/')) {
      // Single listing mode
      pageTypeBadge.innerText = 'Listing Inspector';
      chrome.tabs.sendMessage(currentTab.id, { action: 'get_data' }, (data) => {
        if (!data) {
          renderQueue();
          return;
        }
        activeData = data;
        badge.className = 'status-badge status-active';
        const vidCount = (data.videos ? data.videos.length : (data.videoUrl ? 1 : 0));
        badge.innerText = '✓ ' + (data.tags ? data.tags.length : 0) + ' Tags · ' + (data.images ? data.images.length : 0) + ' HD Photos' + (vidCount > 0 ? (' · ' + vidCount + ' Video') : '');

        prevTitle.innerText = data.title || 'Etsy Listing';
        prevPrice.innerText = (data.price ? ('$' + data.price + ' ' + (data.currency || 'USD')) : 'Price detected');
        prevShop.innerText = data.shopName || 'Etsy Artisan';

        prevTags.innerHTML = '';
        (data.tags || []).forEach(t => {
          const span = document.createElement('span');
          span.className = 'tag-pill';
          span.innerText = t;
          prevTags.appendChild(span);
        });

        singleView.style.display = 'block';

        if (btnCopyTags) btnCopyTags.innerText = '🏷️ Copy Tags (' + (data.tags ? data.tags.length : 0) + ')';
        if (btnCopyImages) btnCopyImages.innerText = '🖼️ HD Photos (' + (data.images ? data.images.length : 0) + ')';

        renderQueue();
      });

      btnOpenSingle.onclick = () => {
        if (activeData) chrome.runtime.sendMessage({ action: 'open_in_studio', data: activeData });
      };

      if (btnAddCompetitor) {
        btnAddCompetitor.onclick = () => {
          if (!activeData) return;
          chrome.runtime.sendMessage({ action: 'get_competitor_queue' }, (qRes) => {
            const queue = (qRes && Array.isArray(qRes.queue)) ? qRes.queue : [];
            const isSaved = queue.some((c) =>
              (c.listingId && activeData.listingId && String(c.listingId) === String(activeData.listingId)) ||
              (c.url && activeData.url && (c.url === activeData.url || c.url.split('?')[0] === activeData.url.split('?')[0]))
            );

            if (isSaved) {
              btnAddCompetitor.innerText = 'Removing...';
              chrome.runtime.sendMessage({
                action: 'remove_from_competitor_queue',
                listingId: activeData.listingId,
                url: activeData.url
              }, () => {
                flashBtn(btnAddCompetitor, '✕ Removed from Queue');
                renderQueue();
              });
              return;
            }

            btnAddCompetitor.innerText = 'Saving...';
            chrome.runtime.sendMessage({ action: 'add_to_competitor_queue', data: activeData }, (resp) => {
              if (resp && resp.added) {
                flashBtn(btnAddCompetitor, `✓ Saved Competitor #${resp.count}!`);
              } else if (resp && resp.alreadyExists) {
                flashBtn(btnAddCompetitor, '✓ Already in Queue!');
              } else if (resp && resp.limitReached) {
                flashBtn(btnAddCompetitor, '⚠️ Max 3 Saved! Click Analyze');
              }
              renderQueue();
            });
          });
        };
      }

      btnCopyAll.onclick = () => {
        if (activeData && activeData.formattedText) {
          navigator.clipboard.writeText(activeData.formattedText).then(() => flashBtn(btnCopyAll, '✓ All Copied!'));
        }
      };
      btnCopyTags.onclick = () => {
        if (activeData && activeData.tagsString) {
          navigator.clipboard.writeText(activeData.tagsString).then(() => flashBtn(btnCopyTags, '✓ Tags Copied!'));
        }
      };
      btnCopyDesc.onclick = () => {
        if (activeData && activeData.description) {
          navigator.clipboard.writeText(activeData.description).then(() => flashBtn(btnCopyDesc, '✓ Desc Copied!'));
        }
      };
      btnCopyImages.onclick = () => {
        if (activeData && activeData.images) {
          navigator.clipboard.writeText(activeData.images.join('\n')).then(() => flashBtn(btnCopyImages, '✓ URLs Copied!'));
        }
      };
    } else if (currentTab.url.includes('etsy.com/search') || currentTab.url.includes('etsy.com/shop') || currentTab.url.includes('etsy.com/market')) {
      // Competitors bulk search mode
      pageTypeBadge.innerText = 'Competitors Search';
      chrome.tabs.sendMessage(currentTab.id, { action: 'get_data' }, (data) => {
        if (!data) {
          renderQueue();
          return;
        }
        activeData = data;
        badge.className = 'status-badge status-active';
        badge.innerText = '✓ ' + (data.totalCount || 0) + ' Competitor Listings on Page';

        searchQueryTitle.innerText = data.keyword ? ('Search: "' + data.keyword + '"') : 'Etsy Competitor Listings';
        searchMetaCount.innerText = (data.totalCount || 0) + ' competitor listings ready for analysis';

        competitorView.style.display = 'block';
        renderQueue();
      });

      btnOpenCompetitors.onclick = () => {
        if (activeData) {
          chrome.runtime.sendMessage({
            action: 'open_competitors_in_studio',
            keyword: activeData.keyword,
            competitors: activeData.competitors
          });
        }
      };

      btnCopyCompetitors.onclick = () => {
        if (activeData) {
          navigator.clipboard.writeText(JSON.stringify(activeData)).then(() => flashBtn(btnCopyCompetitors, '✓ Competitors Copied!'));
        }
      };
    } else {
      badge.className = 'status-badge status-inactive';
      badge.innerText = 'Not on Etsy';
      notOnEtsy.style.display = 'block';
      renderQueue();
    }
  });

  // Live storage sync in popup if changed in any other tab
  try {
    if (chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes.competitorQueue) {
          renderQueue();
        }
      });
    }
  } catch (e) {}
  window.addEventListener('focus', renderQueue);
});
