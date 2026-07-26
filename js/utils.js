var HopUtils = (function () {
  function hashString(input) {
    var hash = 0
    for (var i = 0; i < input.length; i++) {
      hash = (hash << 5) - hash + input.charCodeAt(i)
      hash |= 0
    }
    return Math.abs(hash)
  }

  var GRADIENTS = [
    'linear-gradient(135deg, #292929 0%, #1e1e1e 55%, #d42c3d 140%)',
    'linear-gradient(160deg, #1e1e1e 0%, #333333 60%, #d42c3d 150%)',
    'linear-gradient(200deg, #292929 10%, #141414 55%, #d42c3d 130%)',
    'linear-gradient(120deg, #333333 0%, #1e1e1e 50%, #d42c3d 160%)',
    'linear-gradient(170deg, #1e1e1e 0%, #292929 65%, #d42c3d 145%)',
  ]

  function placeholderGradient(seed) {
    return GRADIENTS[hashString(seed) % GRADIENTS.length]
  }

  function escapeHtml(str) {
    var div = document.createElement('div')
    div.textContent = str == null ? '' : String(str)
    return div.innerHTML
  }

  // Reads an uploaded image file, downscales it (long edge capped at
  // maxDimension) and re-encodes as JPEG, so thumbnails stay small enough to
  // comfortably live in localStorage instead of storing multi-MB originals.
  function fileToCompressedDataUrl(file, maxDimension, quality) {
    maxDimension = maxDimension || 720
    quality = quality || 0.82
    return new Promise(function (resolve, reject) {
      var reader = new FileReader()
      reader.onerror = function () {
        reject(new Error('Could not read that file.'))
      }
      reader.onload = function () {
        var img = new Image()
        img.onerror = function () {
          reject(new Error('That file doesn\'t look like a valid image.'))
        }
        img.onload = function () {
          var scale = Math.min(1, maxDimension / Math.max(img.width, img.height))
          var w = Math.max(1, Math.round(img.width * scale))
          var h = Math.max(1, Math.round(img.height * scale))
          var canvas = document.createElement('canvas')
          canvas.width = w
          canvas.height = h
          canvas.getContext('2d').drawImage(img, 0, 0, w, h)
          resolve(canvas.toDataURL('image/jpeg', quality))
        }
        img.src = reader.result
      }
      reader.readAsDataURL(file)
    })
  }

  // ---------- Ratios ----------
  // A subcategory's type (video/photo) gates which ratios its items may use.
  // Existing card modifier classes (square/portrait/horizontal) are reused
  // where the ratio matches one that already existed pre-subcategories;
  // cardClass: null means the unmodified base .reel-card__thumb rule (9:16)
  // already gives the right ratio.

  var RATIOS_BY_TYPE = {
    video: ['horizontal', 'vertical'],
    photo: ['3:4', '4:5', 'square', '5:4', '4:3'],
  }

  var RATIO_LABELS = {
    vertical: 'Vertical (9:16)',
    horizontal: 'Horizontal (16:9)',
    square: 'Square (1:1)',
    '4:5': 'Portrait (4:5)',
    '3:4': 'Portrait (3:4)',
    '5:4': 'Landscape (5:4)',
    '4:3': 'Landscape (4:3)',
  }

  var RATIO_META = {
    vertical: { aspect: '9 / 16', cardClass: null },
    horizontal: { aspect: '16 / 9', cardClass: 'reel-card--horizontal' },
    square: { aspect: '1 / 1', cardClass: 'reel-card--square' },
    '4:5': { aspect: '4 / 5', cardClass: 'reel-card--portrait' },
    '3:4': { aspect: '3 / 4', cardClass: 'reel-card--ratio-3-4' },
    '5:4': { aspect: '5 / 4', cardClass: 'reel-card--ratio-5-4' },
    '4:3': { aspect: '4 / 3', cardClass: 'reel-card--ratio-4-3' },
  }

  function normalizeRatio(ratio, type) {
    var valid = RATIOS_BY_TYPE[type] || RATIOS_BY_TYPE.video
    return valid.indexOf(ratio) !== -1 ? ratio : valid[0]
  }

  // ---------- Legacy data migration ----------
  // Pre-subcategories, every item stored a fixed `orientation` and its
  // Reels/Posts membership was derived from that (square/portrait -> post,
  // everything else -> reel). Migrating means turning that derived split
  // into a real subcategory per category, one for each bucket that actually
  // has items — so today's real data (all "horizontal") produces exactly
  // one "Reels" subcategory per category and nothing else changes.
  var LEGACY_VIDEO_RATIO = { horizontal: 'horizontal', vertical: 'vertical' }
  var LEGACY_PHOTO_RATIO = { square: 'square', portrait: '4:5' }

  function normalizeLegacyOrientation(value) {
    if (value === 'landscape') value = 'horizontal' // retired option; nearest remaining equivalent
    return LEGACY_VIDEO_RATIO[value] || LEGACY_PHOTO_RATIO[value] ? value : 'vertical'
  }

  // Deterministic (not uid()-random) ids: read() may re-run this against the
  // same localStorage draft more than once before the migrated result gets
  // written back, and two runs must agree on which subcategory a reel maps
  // to, or the subcategoryId cross-references would drift apart.
  function migrateLegacyData(raw) {
    var subcategories = []
    var items = []
    var bucketsByCategory = {}

    raw.reels.forEach(function (reel, idx) {
      var orientation = normalizeLegacyOrientation(reel.orientation)
      var isPhoto = Boolean(LEGACY_PHOTO_RATIO[orientation])
      var type = isPhoto ? 'photo' : 'video'
      var ratio = isPhoto ? LEGACY_PHOTO_RATIO[orientation] : LEGACY_VIDEO_RATIO[orientation]

      var buckets = bucketsByCategory[reel.categoryId] || (bucketsByCategory[reel.categoryId] = {})
      if (!buckets[type]) {
        var sub = {
          id: 'sub-' + reel.categoryId + '-' + (type === 'video' ? 'reels' : 'posts'),
          categoryId: reel.categoryId,
          name: type === 'video' ? 'Reels' : 'Posts',
          slug: type === 'video' ? 'reels' : 'posts',
          type: type,
          order: type === 'video' ? 0 : 1,
        }
        buckets[type] = sub
        subcategories.push(sub)
      }

      items.push({
        id: reel.id,
        subcategoryId: buckets[type].id,
        title: reel.title,
        linkUrl: reel.instagramUrl || '',
        thumbnailUrl: reel.thumbnailUrl || '',
        ratio: ratio,
        order: typeof reel.order === 'number' ? reel.order : idx,
      })
    })

    return { categories: raw.categories, subcategories: subcategories, items: items }
  }

  // Single entry point for turning "whatever shape this JSON is in" into the
  // current { categories, subcategories, items } shape — used by both
  // js/storage.js (admin drafts) and js/main.js (public site), since only
  // js/storage.js loads on the admin page.
  function normalizeSiteData(raw) {
    if (!raw || typeof raw !== 'object') return null
    if (Array.isArray(raw.subcategories) && Array.isArray(raw.items)) {
      raw.items.forEach(function (item) {
        var subcat = raw.subcategories.filter(function (s) { return s.id === item.subcategoryId })[0]
        item.ratio = normalizeRatio(item.ratio, subcat ? subcat.type : 'video')
      })
      return raw
    }
    if (Array.isArray(raw.categories) && Array.isArray(raw.reels)) {
      return migrateLegacyData(raw)
    }
    return null
  }

  return {
    hashString: hashString,
    placeholderGradient: placeholderGradient,
    escapeHtml: escapeHtml,
    fileToCompressedDataUrl: fileToCompressedDataUrl,
    RATIOS_BY_TYPE: RATIOS_BY_TYPE,
    RATIO_LABELS: RATIO_LABELS,
    RATIO_META: RATIO_META,
    normalizeRatio: normalizeRatio,
    normalizeSiteData: normalizeSiteData,
    migrateLegacyData: migrateLegacyData,
  }
})()
