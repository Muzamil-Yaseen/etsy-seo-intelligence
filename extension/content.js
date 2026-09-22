// Etsy SEO Intelligence Content Script - Robust Tag & Competitor Extractor
(function() {
  // ==========================================
  // 1. ROCK-SOLID TAG EXTRACTION
  // ==========================================
  // Function to verify element is NOT inside recommended / other shops / cards / reviews
  function isUnrelatedElement(el) {
    if (!el || !el.closest) return false;
    return !!el.closest([
      '[data-appears-component-name*="other_listings"]',
      '[data-appears-component-name*="you_may_also_like"]',
      '[data-appears-component-name*="similar"]',
      '[data-appears-component-name*="recommended"]',
      '[data-appears-component-name*="reviews"]',
      '[data-appears-component-name*="bought_together"]',
      '[data-component*="other-listings"]',
      '[data-component*="you-may-also-like"]',
      '[data-component*="similar"]',
      '[data-component*="reviews"]',
      '[data-component*="recommendations"]',
      '.v2-listing-card',
      '[data-listing-card]',
      '.listing-card',
      '#reviews',
      'footer',
      'header',
      'nav',
      '#gnav',
      'aside',
      '.shop-home-wide',
      '.shop-home'
    ].join(', '));
  }

  // ==========================================
  // 1. ROCK-SOLID LISTING TAG EXTRACTION
  // ==========================================
  function extractListingTags(title, description) {
    var tags = new Set();

    function addCleanTag(raw) {
      if (!raw || typeof raw !== 'string') return;
      var clean = raw.trim().replace(/\s+/g, ' ');
      // Handle URL encoded tags
      try { clean = decodeURIComponent(clean.replace(/\+/g, ' ')); } catch(e) {}
      clean = clean.toLowerCase();

      if (
        clean.length >= 2 &&
        clean.length <= 32 &&
        clean.indexOf('\n') === -1 &&
        clean.indexOf('http') === -1 &&
        !/^(all|shop|search|home|cart|help|reviews|star|seller|policy|sign in|register|favorites|shipping|gift|listing|page|explore|more|read more|less|show more)$/i.test(clean)
      ) {
        tags.add(clean);
      }
    }

    // Step A: Trigger lazy-load container if needed
    var tagContainer = document.querySelector('[data-appears-component-name="listing_page_tags"], #tags-section-container, [data-component="listing-page-tags"]');
    if (tagContainer) {
      try {
        tagContainer.dispatchEvent(new CustomEvent('appear', { bubbles: true }));
      } catch(e) {}
    }

    // Step B: Extract strictly from links with ref=listing_tag or ref=lp_tag (Etsy's official listing tags)
    document.querySelectorAll('a[href*="ref=listing_tag"], a[href*="ref=lp_tag"]').forEach(function(a) {
      if (!isUnrelatedElement(a)) {
        if (a.innerText) addCleanTag(a.innerText);
        try {
          var u = new URL(a.href, location.origin);
          var q = u.searchParams.get('q');
          if (q) addCleanTag(q);
        } catch(e) {}
      }
    });

    // Step C: Look for all links in specific tag containers
    var tagContainers = [
      '#tags-section-container a',
      '[data-appears-component-name="listing_page_tags"] a',
      '[data-component="listing-page-tags"] a',
      '#wt-content-toggle-tags-read-more a',
      'ul.tag-cards a',
      'div.tags-section a',
      'div[data-component="tags"] a',
      '[data-appears-component-name="listing_page_tags"] [data-appears-event-data*="tag"]'
    ];
    tagContainers.forEach(function(sel) {
      document.querySelectorAll(sel).forEach(function(el) {
        if (isUnrelatedElement(el)) return;
        if (el.tagName === 'A') {
          addCleanTag(el.innerText);
          try {
            var u = new URL(el.href, location.origin);
            var q = u.searchParams.get('q');
            if (q) addCleanTag(q);
          } catch(e) {}
        } else {
          var evtData = el.getAttribute('data-appears-event-data');
          if (evtData) {
            try {
              var parsed = JSON.parse(evtData);
              if (parsed.tag_name) addCleanTag(parsed.tag_name);
              if (parsed.query) addCleanTag(parsed.query);
            } catch(e) {}
          }
        }
      });
    });

    // Step D: Scan Schema.org JSON-LD (keywords for Product)
    document.querySelectorAll('script[type="application/ld+json"]').forEach(function(s) {
      try {
        var data = JSON.parse(s.innerText);
        var items = Array.isArray(data) ? data : (data['@graph'] || [data]);
        items.forEach(function(item) {
          if (item && (item['@type'] === 'Product' || item['@type'] === 'IndividualProduct') && item.keywords) {
            var list = Array.isArray(item.keywords) ? item.keywords : item.keywords.split(',');
            list.forEach(addCleanTag);
          }
        });
      } catch(e) {}
    });

    // Step E: Scan raw HTML source for "keywords": "..." or "tags": [...]
    try {
      var html = document.documentElement.innerHTML;
      var kwMatch = html.match(/"keywords"\s*:\s*"([^"]{5,400})"/);
      if (kwMatch && kwMatch[1]) {
        kwMatch[1].split(',').forEach(addCleanTag);
      }
      var tagsMatch = html.match(/"tags"\s*:\s*(\[[^\]]{5,1500}\])/);
      if (tagsMatch && tagsMatch[1]) {
        try {
          var parsedTags = JSON.parse(tagsMatch[1]);
          if (Array.isArray(parsedTags)) parsedTags.forEach(addCleanTag);
        } catch(e) {}
      }
    } catch(e) {}

    // Step F: Meta keywords tag
    var metaKw = document.querySelector('meta[name="keywords"]')?.content;
    if (metaKw) {
      metaKw.split(',').forEach(addCleanTag);
    }

    // Step G: Smart Fallback ONLY if 0 tags were found
    if (tags.size === 0 && title) {
      var stopWords = new Set(['and','or','the','in','on','with','for','of','at','by','from','a','an','is','it','to','this','that','style']);
      title.split(/[,|\-–—]/).forEach(function(part) {
        var clean = part.trim().toLowerCase();
        if (clean.length >= 3 && clean.length <= 25) addCleanTag(clean);
      });
      var words = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(function(w) {
        return w.length > 2 && !stopWords.has(w);
      });
      for (var i = 0; i < words.length - 1 && tags.size < 13; i++) {
        var bigram = words[i] + ' ' + words[i + 1];
        addCleanTag(bigram);
        if (i < words.length - 2 && tags.size < 13) {
          var trigram = words[i] + ' ' + words[i + 1] + ' ' + words[i + 2];
          addCleanTag(trigram);
        }
      }
    }

    return Array.from(tags).slice(0, 13);
  }

  // ==========================================
  // 2. STRICT LISTING IMAGE EXTRACTION (ONLY LISTING PHOTOS)
  // ==========================================
  function normalizeEtsyImageUrl(url) {
    if (!url || typeof url !== 'string') return null;
    var clean = url.trim();
    if (clean.indexOf('i.etsystatic.com') === -1) return null;
    // Exclude avatars, badges, shop icons, review reviewer photos
    if (
      clean.indexOf('/iusa_') !== -1 ||
      clean.indexOf('/isbl_') !== -1 ||
      clean.indexOf('/isla_') !== -1 ||
      clean.indexOf('/shopavatar') !== -1 ||
      clean.indexOf('/avatar') !== -1 ||
      clean.indexOf('etsystatic.com/site-assets') !== -1
    ) {
      return null;
    }
    // Upgrade any thumbnail / medium size to full resolution
    return clean
      .replace(/\/il_\d+x\w+\./, '/il_fullxfull.')
      .replace(/\/il_\d+x\d+\./, '/il_fullxfull.');
  }

  function extractListingImages() {
    var imgs = new Set();

    function addImg(raw) {
      var normalized = normalizeEtsyImageUrl(raw);
      if (normalized) {
        imgs.add(normalized);
      }
    }

    // Step A: Search designated listing gallery and carousel containers
    var galleryEl = document.querySelector(
      '[data-component="listing-page-image-carousel"], [data-appears-component-name="listing_page_image_carousel"], [data-component="listing-page-photos"], .image-carousel-container, [data-image-carousel-container], [data-palette-listing-image-container], .listing-page-image-carousel-component, #image-card-container, #listing-photos, div.photos-carousel'
    );

    if (galleryEl) {
      galleryEl.querySelectorAll('img').forEach(function(i) {
        if (!isUnrelatedElement(i)) {
          addImg(i.getAttribute('data-full-image-href') || i.getAttribute('data-src-zoom-image') || i.getAttribute('data-src') || i.src);
        }
      });
      galleryEl.querySelectorAll('[data-full-image-href], [data-src-zoom-image], [data-large-image-href]').forEach(function(el) {
        if (!isUnrelatedElement(el)) {
          addImg(el.getAttribute('data-full-image-href') || el.getAttribute('data-src-zoom-image') || el.getAttribute('data-large-image-href'));
        }
      });
    }

    // Step B: Thumbnail pagination (buttons/thumbnails for the active listing carousel)
    document.querySelectorAll('ul[data-carousel-pagination-list] img, ul.carousel-pagination-list img, li[data-carousel-pagination-item] img, button[data-carousel-pagination-item] img').forEach(function(i) {
      if (!isUnrelatedElement(i)) {
        addImg(i.getAttribute('data-full-image-href') || i.getAttribute('data-src-zoom-image') || i.getAttribute('data-src') || i.src);
      }
    });

    // Step C: Schema.org JSON-LD Product.image (exact images for this listing)
    document.querySelectorAll('script[type="application/ld+json"]').forEach(function(s) {
      try {
        var data = JSON.parse(s.innerText);
        var items = Array.isArray(data) ? data : (data['@graph'] || [data]);
        items.forEach(function(item) {
          if (item && (item['@type'] === 'Product' || item['@type'] === 'IndividualProduct')) {
            if (item.image) {
              var imgList = Array.isArray(item.image) ? item.image : [item.image];
              imgList.forEach(function(imgItem) {
                if (typeof imgItem === 'string') addImg(imgItem);
                else if (imgItem && imgItem.contentUrl) addImg(imgItem.contentUrl);
                else if (imgItem && imgItem.url) addImg(imgItem.url);
              });
            }
          }
        });
      } catch(e) {}
    });

    // Step D: OpenGraph primary image if empty
    if (imgs.size === 0) {
      var ogImg = document.querySelector('meta[property="og:image"]')?.content;
      if (ogImg) addImg(ogImg);
    }

    // Step E: Fallback: only if still 0 images, scan page with strict exclusion
    if (imgs.size === 0) {
      document.querySelectorAll('img').forEach(function(i) {
        if (!isUnrelatedElement(i)) {
          var s = i.src || i.getAttribute('data-src') || '';
          addImg(s);
        }
      });
    }

    return Array.from(imgs).slice(0, 10);
  }

  // ==========================================
  // 2B. LISTING VIDEO EXTRACTION
  // ==========================================
  function extractListingVideos() {
    var vids = [];
    var seenUrls = new Set();

    function addVid(url, poster) {
      if (!url || typeof url !== 'string') return;
      url = url.trim();
      if (!url.startsWith('http')) return;
      if (seenUrls.has(url)) return;
      seenUrls.add(url);
      vids.push({
        url: url,
        posterUrl: poster || '',
        format: url.includes('.m3u8') ? 'hls' : 'mp4'
      });
    }

    // Step A: Search for <video> elements on page
    document.querySelectorAll('video').forEach(function(v) {
      if (isUnrelatedElement(v)) return;
      var poster = v.poster || v.getAttribute('poster') || '';
      var src = v.currentSrc || v.src || v.getAttribute('src') || v.getAttribute('data-src');
      if (src) addVid(src, poster);

      v.querySelectorAll('source').forEach(function(srcEl) {
        var s = srcEl.src || srcEl.getAttribute('src') || srcEl.getAttribute('data-src');
        if (s) addVid(s, poster);
      });
    });

    // Step B: Video containers with data attributes
    document.querySelectorAll('[data-video-url], [data-mp4-url], [data-video-src]').forEach(function(el) {
      if (isUnrelatedElement(el)) return;
      var vUrl = el.getAttribute('data-video-url') || el.getAttribute('data-mp4-url') || el.getAttribute('data-video-src');
      var poster = el.getAttribute('data-poster-image') || el.getAttribute('poster') || '';
      if (vUrl) addVid(vUrl, poster);
    });

    // Step C: Look in JSON-LD schema
    document.querySelectorAll('script[type="application/ld+json"]').forEach(function(s) {
      try {
        var data = JSON.parse(s.innerText);
        var items = Array.isArray(data) ? data : (data['@graph'] || [data]);
        items.forEach(function(item) {
          if (item && item.video) {
            var v = item.video;
            if (typeof v === 'string') addVid(v);
            else if (v.contentUrl) addVid(v.contentUrl, v.thumbnailUrl);
            else if (v.url) addVid(v.url, v.thumbnailUrl);
          }
        });
      } catch(e) {}
    });

    // Step D: Search HTML for etsystatic video URLs (v.etsystatic.com or .mp4)
    try {
      var html = document.documentElement.innerHTML;
      var videoMatches = html.match(/https:\/\/[^"'\s]+\.etsystatic\.com\/[^"'\s]+\.mp4[^"'\s]*/gi);
      if (videoMatches) {
        videoMatches.forEach(function(m) {
          var cleanUrl = m.replace(/\\/g, '').split('"')[0].split("'")[0];
          addVid(cleanUrl);
        });
      }
    } catch(e) {}

    return vids;
  }

  // ==========================================
  // 3. SINGLE LISTING DATA EXTRACTION
  // ==========================================
  function extractListingData() {
    var match = location.pathname.match(/\/listing\/(\d+)/);
    var id = match ? match[1] : null;
    var title = (document.querySelector('h1[data-buy-box-listing-title], h1')?.innerText || document.querySelector('meta[property="og:title"]')?.content || document.title.split('|')[0] || '').replace(/\s+/g, ' ').trim();
    var priceMeta = document.querySelector('meta[property="product:price:amount"]')?.content;
    var priceText = document.querySelector('[data-buy-box] .wt-text-title-larger, .wt-text-title-larger')?.innerText || '';
    var price = (priceMeta || priceText).replace(/[^0-9.]/g, '');
    var curr = document.querySelector('meta[property="product:price:currency"]')?.content || 'USD';
    var shopEl = document.querySelector('a[href*="/shop/"]') || document.querySelector('[data-shop-name]');
    var shopName = (shopEl ? shopEl.innerText.trim().split('\n')[0] : '') || 'Etsy Artisan';
    var shopUrl = (shopEl && shopEl.href) ? shopEl.href.split('?')[0] : '';

    // Expand description
    var readMoreBtn = document.querySelector('button[aria-controls="wt-content-toggle-tags-read-more"], [data-id="description-text"] + button');
    if (readMoreBtn && !readMoreBtn.classList.contains('wt-is-hidden')) {
      try { readMoreBtn.click(); } catch(e) {}
    }
    var descEl = document.querySelector('[data-id="description-text"]') || document.querySelector('#wt-content-toggle-tags-read-more') || document.querySelector('meta[property="og:description"]');
    var desc = (descEl && (descEl.innerText || descEl.content)) || '';

    var tagsArray = extractListingTags(title, desc);
    var imageArray = extractListingImages();
    var videoArray = extractListingVideos();
    var tagsString = tagsArray.join(', ');

    var formattedText = [
      '=========================================',
      'ETSY LISTING DETAILS',
      '=========================================',
      '',
      'TITLE:',
      title,
      '',
      'PRICE:',
      (price ? ('$' + price + ' ' + curr) : 'N/A'),
      '',
      'SHOP:',
      shopName + (shopUrl ? (' (' + shopUrl + ')') : ''),
      '',
      'LISTING ID: ' + (id || 'N/A'),
      'URL: ' + window.location.href.split('?')[0],
      '',
      'KEYWORDS / TAGS (' + tagsArray.length + '):',
      tagsString,
      '',
      'DESCRIPTION:',
      desc.trim(),
      '',
      'HD GALLERY PHOTOS (' + imageArray.length + '):',
      imageArray.map(function(u, idx) { return (idx + 1) + '. ' + u; }).join('\n'),
      (videoArray.length > 0 ? (
        '\n\nHD LISTING VIDEOS (' + videoArray.length + '):\n' +
        videoArray.map(function(v, idx) { return (idx + 1) + '. ' + v.url; }).join('\n')
      ) : ''),
      '========================================='
    ].join('\n');

    return {
      type: 'single_listing',
      listingId: id,
      title: title,
      price: price,
      currency: curr,
      shopName: shopName,
      shopUrl: shopUrl,
      url: window.location.href.split('?')[0],
      imageUrl: imageArray[0] || '',
      images: imageArray,
      videos: videoArray,
      videoUrl: videoArray[0] ? videoArray[0].url : '',
      tags: tagsArray,
      tagsString: tagsString,
      description: desc.trim(),
      formattedText: formattedText,
      source: 'chrome_extension',
      fetchedAt: new Date().toISOString()
    };
  }

  // ==========================================
  // 3. MULTI-LISTING SEARCH / SHOP EXTRACTOR
  // ==========================================
  function extractMultipleCompetitorsOnPage() {
    var competitors = [];
    var seenIds = new Set();

    // Query for listing cards on search, shop, or category pages
    var cards = document.querySelectorAll('div[data-listing-id], .v2-listing-card, .listing-link, [data-palette-listing-id]');
    cards.forEach(function(card) {
      var id = card.getAttribute('data-listing-id') || card.getAttribute('data-palette-listing-id');
      var link = card.querySelector('a.listing-link') || (card.tagName === 'A' ? card : card.querySelector('a[href*="/listing/"]'));
      var href = link ? link.href.split('?')[0] : '';
      if (!id && href) {
        var m = href.match(/\/listing\/(\d+)/);
        if (m) id = m[1];
      }

      if (!id || seenIds.has(id)) return;
      seenIds.add(id);

      var titleEl = card.querySelector('.v2-listing-card__title, h3, [data-listing-card-title], .wt-text-caption') || link;
      var title = (titleEl ? (titleEl.getAttribute('title') || titleEl.innerText) : '').replace(/\s+/g, ' ').trim();

      var priceEl = card.querySelector('.currency-value, .wt-text-title-01, .n-e5__text--bold, [data-buy-box] .wt-text-title-larger');
      var price = (priceEl ? priceEl.innerText : '').replace(/[^0-9.]/g, '');

      var shopEl = card.querySelector('.v2-listing-card__shop, .wt-text-caption--subtle, [data-shop-name]');
      var shop = (shopEl ? shopEl.innerText.trim() : 'Etsy Competitor');

      var imgEl = card.querySelector('img');
      var imgSrc = imgEl ? (imgEl.src || imgEl.getAttribute('data-src') || '') : '';
      if (imgSrc.indexOf('i.etsystatic.com') !== -1) {
        imgSrc = imgSrc.replace(/\/il_\d+x\w+\./, '/il_fullxfull.').replace(/\/il_\d+x\d+\./, '/il_fullxfull.');
      }

      competitors.push({
        listingId: id,
        title: title || ('Etsy Listing #' + id),
        price: price || '0.00',
        currency: 'USD',
        shopName: shop,
        url: href || ('https://www.etsy.com/listing/' + id),
        imageUrl: imgSrc,
        images: imgSrc ? [imgSrc] : [],
        tags: extractListingTags(title, ''),
        source: 'etsy_search_bulk'
      });
    });

    // Detect search query if on search page
    var keyword = '';
    try {
      var u = new URL(location.href);
      keyword = u.searchParams.get('q') || '';
    } catch(e) {}
    if (!keyword) {
      var searchInput = document.querySelector('input[name="q"], input#global-enhancements-search-query');
      if (searchInput) keyword = searchInput.value;
    }

    return {
      type: 'competitors',
      keyword: keyword,
      pageUrl: location.href,
      totalCount: competitors.length,
      competitors: competitors.slice(0, 48)
    };
  }

  // ==========================================
  // 4. REAL-TIME CROSS-TAB QUEUE SYNCHRONIZATION & MANAGEMENT
  // ==========================================
  var currentQueue = [];
  var isPopoverOpen = false;

  function ensureQueuePopover(dock) {
    var pop = document.getElementById('ei-queue-popover');
    if (!pop && dock) {
      pop = document.createElement('div');
      pop.id = 'ei-queue-popover';
      pop.style.display = 'none';
      dock.appendChild(pop);
    }
    return pop;
  }

  function renderQueuePopover(queue) {
    var dock = document.getElementById('etsy-intel-dock');
    if (!dock) return;
    var pop = ensureQueuePopover(dock);
    if (!pop) return;

    var q = Array.isArray(queue) ? queue : currentQueue;
    var count = q.length;

    var html = '<div class="ei-popover-header">'
      + '<span>🎯 Competitor Queue (' + count + '/3)</span>'
      + '<button class="ei-btn-close" id="ei-popover-close" style="padding:0 4px;font-size:12px;">✕</button>'
      + '</div>';

    html += '<div class="ei-popover-items">';
    if (count === 0) {
      html += '<div class="ei-popover-empty">No competitors saved yet.<br/>Click "🎯 Add as Competitor" on any Etsy listing.</div>';
    } else {
      q.forEach(function(item, idx) {
        var thumb = item.imageUrl || (item.images && item.images[0]) || '';
        var title = item.title || 'Competitor #' + (idx + 1);
        var price = item.price ? ('$' + item.price + ' ' + (item.currency || 'USD')) : '';
        var shop = item.shopName || 'Etsy Shop';
        var tagsCount = (item.tags || []).length;

        html += '<div class="ei-popover-item">'
          + (thumb ? '<img class="ei-popover-thumb" src="' + thumb + '" alt="Thumbnail" />' : '<div class="ei-popover-thumb" style="display:flex;align-items:center;justify-content:center;font-size:10px;color:#71717a;">#' + (idx + 1) + '</div>')
          + '<div class="ei-popover-info">'
          + '<div class="ei-popover-title" title="' + title.replace(/"/g, '&quot;') + '">#' + (idx + 1) + ': ' + title + '</div>'
          + '<div class="ei-popover-sub">' + (price ? (price + ' · ') : '') + shop + ' · ' + tagsCount + ' tags</div>'
          + '</div>'
          + '<button class="ei-popover-remove" data-remove-index="' + idx + '" title="Remove #' + (idx + 1) + ' from queue">✕</button>'
          + '</div>';
      });
    }
    html += '</div>';

    if (count > 0) {
      html += '<div class="ei-popover-footer">'
        + '<button class="ei-btn-danger" id="ei-popover-clear" style="padding:5px 10px;font-size:11px;"><span>🗑️ Clear All</span></button>'
        + '<button class="ei-btn-primary" id="ei-popover-analyze" style="background:#10b981;color:#000000;padding:5px 11px;font-size:11px;font-weight:700;"><span>🚀 Analyze in Studio ↗</span></button>'
        + '</div>';
    }

    pop.innerHTML = html;

    // Attach popover events
    var closeBtn = document.getElementById('ei-popover-close');
    if (closeBtn) {
      closeBtn.onclick = function(e) {
        e.stopPropagation();
        pop.style.display = 'none';
        isPopoverOpen = false;
      };
    }

    pop.querySelectorAll('.ei-popover-remove').forEach(function(rBtn) {
      rBtn.onclick = function(e) {
        e.stopPropagation();
        var index = parseInt(this.getAttribute('data-remove-index'), 10);
        this.innerText = '...';
        chrome.runtime.sendMessage({ action: 'remove_from_competitor_queue', index: index }, function() {
          syncQueueState();
        });
      };
    });

    var popClear = document.getElementById('ei-popover-clear');
    if (popClear) {
      popClear.onclick = function(e) {
        e.stopPropagation();
        popClear.innerText = 'Clearing...';
        chrome.runtime.sendMessage({ action: 'clear_competitor_queue' }, function() {
          pop.style.display = 'none';
          isPopoverOpen = false;
          syncQueueState();
        });
      };
    }

    var popAnalyze = document.getElementById('ei-popover-analyze');
    if (popAnalyze) {
      popAnalyze.onclick = function(e) {
        e.stopPropagation();
        popAnalyze.innerText = 'Opening...';
        chrome.runtime.sendMessage({ action: 'analyze_competitor_queue' }, function() {
          setTimeout(function() {
            pop.style.display = 'none';
            isPopoverOpen = false;
            syncQueueState();
          }, 1500);
        });
      };
    }
  }

  function toggleQueuePopover() {
    var dock = document.getElementById('etsy-intel-dock');
    if (!dock) return;
    var pop = ensureQueuePopover(dock);
    if (!pop) return;

    if (pop.style.display === 'none' || !pop.style.display) {
      renderQueuePopover(currentQueue);
      pop.style.display = 'flex';
      isPopoverOpen = true;
    } else {
      pop.style.display = 'none';
      isPopoverOpen = false;
    }
  }

  function hideQueuePopover() {
    var pop = document.getElementById('ei-queue-popover');
    if (pop) {
      pop.style.display = 'none';
      isPopoverOpen = false;
    }
  }

  function syncQueueState(givenQueue) {
    var btn = document.getElementById('ei-btn-add-comp');
    var analyzeBtn = document.getElementById('ei-btn-analyze-comp');
    var clearBtn = document.getElementById('ei-btn-clear-queue');
    if (!btn && !analyzeBtn) return;

    function applyState(q) {
      var queue = Array.isArray(q) ? q : [];
      currentQueue = queue;
      var count = queue.length;
      var curData = extractListingData();
      var isSaved = queue.some(function(c) {
        return (c.listingId && curData.listingId && String(c.listingId) === String(curData.listingId)) ||
               (c.url && curData.url && (c.url === curData.url || c.url.split('?')[0] === curData.url.split('?')[0]));
      });

      if (btn) {
        if (isSaved) {
          btn.innerHTML = '<span>✓ Saved (' + count + '/3) · ✕ Remove</span>';
          btn.style.background = 'rgba(16, 185, 129, 0.2)';
          btn.style.borderColor = 'rgba(16, 185, 129, 0.45)';
          btn.style.color = '#34d399';
          btn.title = 'Listing is saved in competitor queue. Click to remove it!';
        } else if (count >= 3) {
          btn.innerHTML = '<span>Queue Full (3/3) ▾</span>';
          btn.style.background = 'rgba(245, 158, 11, 0.15)';
          btn.style.borderColor = 'rgba(245, 158, 11, 0.35)';
          btn.style.color = '#fbbf24';
          btn.title = 'Queue is full (3/3). Click to view competitors, remove listings, or clear queue.';
        } else {
          btn.innerHTML = '<span>🎯 Add as Competitor (' + count + '/3)</span>';
          btn.style.background = 'rgba(255, 255, 255, 0.1)';
          btn.style.borderColor = 'rgba(255, 255, 255, 0.15)';
          btn.style.color = '#ffffff';
          btn.title = 'Add this listing to your competitor queue';
        }
      }

      if (analyzeBtn) {
        if (count > 0) {
          analyzeBtn.style.display = 'inline-flex';
          analyzeBtn.innerHTML = '<span>🚀 Analyze (' + count + '/3) in Studio ↗</span>';
        } else {
          analyzeBtn.style.display = 'none';
        }
      }

      if (clearBtn) {
        if (count > 0) {
          clearBtn.style.display = 'inline-flex';
          clearBtn.innerHTML = '<span>🗑️ Clear (' + count + ')</span>';
        } else {
          clearBtn.style.display = 'none';
        }
      }

      if (isPopoverOpen) {
        renderQueuePopover(queue);
      }
    }

    if (Array.isArray(givenQueue)) {
      applyState(givenQueue);
      return;
    }

    try {
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['competitorQueue'], function(res) {
          if (res && Array.isArray(res.competitorQueue)) {
            applyState(res.competitorQueue);
          } else {
            chrome.runtime.sendMessage({ action: 'get_competitor_queue' }, function(resp) {
              if (resp && Array.isArray(resp.queue)) {
                applyState(resp.queue);
              }
            });
          }
        });
      } else {
        chrome.runtime.sendMessage({ action: 'get_competitor_queue' }, function(resp) {
          if (resp && Array.isArray(resp.queue)) {
            applyState(resp.queue);
          }
        });
      }
    } catch(e) {}
  }

  // A. Listen to Chrome storage changes across tabs in real-time
  try {
    if (chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(function(changes, areaName) {
        if (areaName === 'local' && changes.competitorQueue) {
          syncQueueState(changes.competitorQueue.newValue);
        }
      });
    }
  } catch(e) {}

  // B. Listen to direct broadcast messages from background worker
  chrome.runtime.onMessage.addListener(function(req, sender, sendResponse) {
    if (req.action === 'queue_updated') {
      syncQueueState(req.queue);
    }
    if (req.action === 'get_data') {
      if (location.pathname.includes('/listing/')) {
        sendResponse(extractListingData());
      } else {
        sendResponse(extractMultipleCompetitorsOnPage());
      }
    }
  });

  // C. Sync immediately whenever user focuses or switches back to this tab
  window.addEventListener('focus', function() { syncQueueState(); });
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      syncQueueState();
    }
  });

  // ==========================================
  // 5. IN-PAGE FLOATING UI WIDGET
  // ==========================================
  function injectWidget() {
    if (document.getElementById('etsy-intel-dock')) return;

    var isSingleListing = location.pathname.includes('/listing/');
    var isSearchOrShop = location.pathname.includes('/search') || location.pathname.includes('/shop') || location.pathname.includes('/market');

    if (!isSingleListing && !isSearchOrShop) return;

    var dock = document.createElement('div');
    dock.id = 'etsy-intel-dock';

    if (isSingleListing) {
      // 1-Listing Dock
      var data = extractListingData();
      dock.innerHTML = '<div class="ei-badge"><span class="ei-dot"></span><span>Etsy Intelligence</span></div>'
        + '<div class="ei-count"><span id="dock-photo-count">' + data.images.length + '</span> HD Photos · <span id="dock-tag-count">' + data.tags.length + '</span> Tags</div>'
        + '<button class="ei-btn-primary" id="ei-btn-open"><span>⚡ Open in Studio ↗</span></button>'
        + '<button class="ei-btn-secondary" id="ei-btn-add-comp"><span>🎯 Add as Competitor (0/3)</span></button>'
        + '<button class="ei-btn-primary" id="ei-btn-analyze-comp" style="display:none;background:#10b981;color:#000000;font-weight:700;"><span>🚀 Analyze Competitors ↗</span></button>'
        + '<button class="ei-btn-danger" id="ei-btn-clear-queue" style="display:none;" title="Clear all competitor listings from queue"><span>🗑️ Clear</span></button>'
        + '<button class="ei-btn-secondary" id="ei-btn-copy-all"><span>📋 Copy All</span></button>'
        + '<button class="ei-btn-secondary" id="ei-btn-copy-tags"><span>🏷️ Tags (' + data.tags.length + ')</span></button>'
        + '<button class="ei-btn-secondary" id="ei-btn-copy-images"><span>🖼️ Photos (' + data.images.length + ')</span></button>'
        + '<button class="ei-btn-close" id="ei-btn-hide">✕</button>';

      document.body.appendChild(dock);

      // Initial queue check
      syncQueueState();

      // Re-check photos and tags after 1.5 seconds in case lazy-loader or dynamic gallery finished
      setTimeout(function() {
        var refreshed = extractListingData();
        var cntEl = document.getElementById('dock-tag-count');
        if (cntEl) cntEl.innerText = refreshed.tags.length;
        var pEl = document.getElementById('dock-photo-count');
        if (pEl) pEl.innerText = refreshed.images.length;
        var tagBtn = document.getElementById('ei-btn-copy-tags');
        if (tagBtn) tagBtn.innerHTML = '<span>🏷️ Tags (' + refreshed.tags.length + ')</span>';
        var imgBtn = document.getElementById('ei-btn-copy-images');
        if (imgBtn) imgBtn.innerHTML = '<span>🖼️ Photos (' + refreshed.images.length + ')</span>';
        syncQueueState();
      }, 1500);

      document.getElementById('ei-btn-open').onclick = function() {
        var latest = extractListingData();
        var btn = this;
        btn.innerText = 'Opening...';
        chrome.runtime.sendMessage({ action: 'open_in_studio', data: latest }, function() {
          setTimeout(function() { btn.innerText = '⚡ Open in Studio ↗'; }, 2000);
        });
      };

      var addCompBtn = document.getElementById('ei-btn-add-comp');
      if (addCompBtn) {
        addCompBtn.onclick = function() {
          var latest = extractListingData();
          var curQueue = currentQueue || [];
          var isSaved = curQueue.some(function(c) {
            return (c.listingId && latest.listingId && String(c.listingId) === String(latest.listingId)) ||
                   (c.url && latest.url && (c.url === latest.url || c.url.split('?')[0] === latest.url.split('?')[0]));
          });

          if (isSaved) {
            // Remove current listing from queue
            addCompBtn.innerHTML = '<span>Removing...</span>';
            chrome.runtime.sendMessage({
              action: 'remove_from_competitor_queue',
              listingId: latest.listingId,
              url: latest.url
            }, function() {
              addCompBtn.innerHTML = '<span>✕ Removed</span>';
              setTimeout(syncQueueState, 400);
            });
            return;
          }

          if (curQueue.length >= 3) {
            // Queue full: toggle popover so user can remove an item or clear!
            toggleQueuePopover();
            return;
          }

          // Add to queue
          addCompBtn.innerHTML = '<span>Saving...</span>';
          chrome.runtime.sendMessage({ action: 'add_to_competitor_queue', data: latest }, function(resp) {
            if (resp && resp.added) {
              addCompBtn.innerHTML = '<span>✓ Saved Competitor #' + resp.count + ' (' + resp.count + '/3)</span>';
            } else if (resp && resp.alreadyExists) {
              addCompBtn.innerHTML = '<span>✓ Already in Queue</span>';
            } else if (resp && resp.limitReached) {
              addCompBtn.innerHTML = '<span>Queue Full (3/3) ▾</span>';
              toggleQueuePopover();
            } else {
              addCompBtn.innerHTML = '<span>🎯 Add as Competitor</span>';
            }
            setTimeout(syncQueueState, 1000);
          });
        };
      }

      var clearQueueBtn = document.getElementById('ei-btn-clear-queue');
      if (clearQueueBtn) {
        clearQueueBtn.onclick = function() {
          var btn = this;
          btn.innerHTML = '<span>Clearing...</span>';
          chrome.runtime.sendMessage({ action: 'clear_competitor_queue' }, function() {
            btn.innerHTML = '<span>✓ Cleared!</span>';
            hideQueuePopover();
            setTimeout(syncQueueState, 400);
          });
        };
      }

      var analyzeQueueBtn = document.getElementById('ei-btn-analyze-comp');
      if (analyzeQueueBtn) {
        analyzeQueueBtn.onclick = function() {
          var btn = this;
          btn.innerHTML = '<span>Opening Studio...</span>';
          chrome.runtime.sendMessage({ action: 'analyze_competitor_queue' }, function() {
            setTimeout(function() {
              syncQueueState();
            }, 1500);
          });
        };
      }

      // Close popover when clicking outside the dock
      document.addEventListener('click', function(e) {
        var pop = document.getElementById('ei-queue-popover');
        var d = document.getElementById('etsy-intel-dock');
        if (pop && pop.style.display !== 'none' && d && !d.contains(e.target)) {
          hideQueuePopover();
        }
      });

      document.getElementById('ei-btn-copy-all').onclick = function() {
        var latest = extractListingData();
        var btn = this;
        navigator.clipboard.writeText(latest.formattedText).then(function() {
          btn.innerText = '✓ All Copied!';
          setTimeout(function() { btn.innerText = '📋 Copy All'; }, 2000);
        });
      };

      document.getElementById('ei-btn-copy-tags').onclick = function() {
        var latest = extractListingData();
        var btn = this;
        navigator.clipboard.writeText(latest.tagsString).then(function() {
          btn.innerText = '✓ ' + latest.tags.length + ' Tags Copied!';
          setTimeout(function() { btn.innerText = '🏷️ Tags (' + latest.tags.length + ')'; }, 2000);
        });
      };

      var copyImgsBtn = document.getElementById('ei-btn-copy-images');
      if (copyImgsBtn) {
        copyImgsBtn.onclick = function() {
          var latest = extractListingData();
          var btn = this;
          navigator.clipboard.writeText(latest.images.join('\n')).then(function() {
            btn.innerText = '✓ ' + latest.images.length + ' URLs Copied!';
            setTimeout(function() { btn.innerText = '🖼️ Photos (' + latest.images.length + ')'; }, 2000);
          });
        };
      }

      document.getElementById('ei-btn-hide').onclick = function() {
        dock.remove();
      };
    } else {
      // Multi-Listing Competitor Search Dock
      var batch = extractMultipleCompetitorsOnPage();
      if (batch.totalCount === 0) return;

      dock.innerHTML = '<div class="ei-badge"><span class="ei-dot"></span><span>Competitor Intelligence</span></div>'
        + '<div class="ei-count">' + batch.totalCount + ' Listings on Page</div>'
        + '<button class="ei-btn-primary" id="ei-btn-open-competitors"><span>🚀 Add to Studio for Analysis ↗</span></button>'
        + '<button class="ei-btn-secondary" id="ei-btn-copy-competitors"><span>📋 Copy JSON</span></button>'
        + '<button class="ei-btn-close" id="ei-btn-hide">✕</button>';

      document.body.appendChild(dock);

      document.getElementById('ei-btn-open-competitors').onclick = function() {
        var latestBatch = extractMultipleCompetitorsOnPage();
        var btn = this;
        btn.innerText = 'Opening Studio...';
        chrome.runtime.sendMessage({
          action: 'open_competitors_in_studio',
          keyword: latestBatch.keyword,
          competitors: latestBatch.competitors
        }, function() {
          setTimeout(function() { btn.innerText = '🚀 Add to Studio for Analysis ↗'; }, 2000);
        });
      };

      document.getElementById('ei-btn-copy-competitors').onclick = function() {
        var latestBatch = extractMultipleCompetitorsOnPage();
        var btn = this;
        navigator.clipboard.writeText(JSON.stringify(latestBatch)).then(function() {
          btn.innerText = '✓ ' + latestBatch.totalCount + ' Copied!';
          setTimeout(function() { btn.innerText = '📋 Copy JSON'; }, 2000);
        });
      };

      document.getElementById('ei-btn-hide').onclick = function() {
        dock.remove();
      };
    }
  }

  // Pre-trigger lazy loader softly on listing page
  if (location.pathname.includes('/listing/')) {
    setTimeout(function() {
      var tagEl = document.querySelector('[data-appears-component-name="listing_page_tags"], #tags-section-container, footer');
      if (tagEl) {
        var curY = window.scrollY;
        tagEl.scrollIntoView({ behavior: 'instant', block: 'end' });
        window.scrollTo({ top: curY, behavior: 'instant' });
      }
    }, 400);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectWidget);
  } else {
    injectWidget();
  }
})();
