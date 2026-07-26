;(function () {
  var ENTERED_KEY = 'hop_entered'
  var DATA_URL = 'data.json'

  var heroEl = document.getElementById('hero')
  var portfolioEl = document.getElementById('portfolio')
  var enterBtn = document.getElementById('enterBtn')
  var logoHome = document.getElementById('logoHome')
  var tabsEl = document.getElementById('tabs')
  var mobileNavToggle = document.getElementById('mobileNavToggle')
  var mobileNavLabel = document.getElementById('mobileNavLabel')
  var mobileNavPanel = document.getElementById('mobileNavPanel')
  var subnav = document.getElementById('subnav')
  var categoryEmpty = document.getElementById('categoryEmpty')
  var gridEl = document.getElementById('grid')
  var yearLabel = document.getElementById('yearLabel')

  var activeCategoryId = null
  var activeSubcategoryId = null

  yearLabel.textContent = '© ' + new Date().getFullYear() + ' House of Prachar'

  // ---------- Published data ----------
  // Every visitor fetches the same data.json — the file the dashboard's
  // "Publish" button writes to the repo — instead of reading localStorage,
  // so everyone always sees the same content (no per-browser drift).

  var siteData = { categories: [], subcategories: [], items: [] }

  var dataReady = fetch(DATA_URL + '?_=' + Date.now(), { cache: 'no-store' })
    .then(function (res) {
      if (!res.ok) throw new Error('data.json request failed: ' + res.status)
      return res.json()
    })
    .catch(function () {
      return HOP_SEED // offline, file://, or data.json missing — fall back to the bundled default
    })
    .then(function (data) {
      var normalized = HopUtils.normalizeSiteData(data) || { categories: [], subcategories: [], items: [] }
      siteData.categories = normalized.categories
      siteData.subcategories = normalized.subcategories
      siteData.items = normalized.items
      return siteData
    })

  function getCategories() {
    return siteData.categories.slice().sort(function (a, b) {
      return a.order - b.order
    })
  }

  function getSubcategories(categoryId) {
    return siteData.subcategories
      .filter(function (s) {
        return s.categoryId === categoryId
      })
      .sort(function (a, b) {
        return a.order - b.order
      })
  }

  function getItems(subcategoryId) {
    return siteData.items
      .filter(function (it) {
        return it.subcategoryId === subcategoryId
      })
      .sort(function (a, b) {
        return a.order - b.order
      })
  }

  // ---------- Hero ----------

  function enterPortfolio(skipAnimation) {
    sessionStorage.setItem(ENTERED_KEY, '1')
    heroEl.classList.remove('hero--leaving')
    if (skipAnimation) {
      heroEl.hidden = true
      portfolioEl.hidden = false
      dataReady.then(renderAll)
      return
    }
    heroEl.classList.add('hero--leaving')
    window.setTimeout(function () {
      heroEl.hidden = true
      portfolioEl.hidden = false
      dataReady.then(renderAll)
    }, 700)
  }

  // The title in the portfolio header doubles as a "home" link back to the
  // full-screen hero — re-entering plays the same enter transition next time.
  function goToHero() {
    sessionStorage.removeItem(ENTERED_KEY)
    closeMobileNav()
    portfolioEl.hidden = true
    heroEl.hidden = false
    heroEl.classList.remove('hero--leaving')
  }

  logoHome.addEventListener('click', goToHero)

  heroEl.addEventListener('pointermove', function (e) {
    var rect = heroEl.getBoundingClientRect()
    heroEl.style.setProperty('--x', ((e.clientX - rect.left) / rect.width) * 100 + '%')
    heroEl.style.setProperty('--y', ((e.clientY - rect.top) / rect.height) * 100 + '%')
  })

  if (sessionStorage.getItem(ENTERED_KEY) === '1') {
    enterPortfolio(true)
  }

  enterBtn.addEventListener('click', function () {
    enterPortfolio(false)
  })

  window.addEventListener('keydown', function (e) {
    if (heroEl.hidden) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      enterPortfolio(false)
    }
  })

  // ---------- Mobile category menu ----------

  function openMobileNav() {
    mobileNavPanel.hidden = false
    mobileNavToggle.setAttribute('aria-expanded', 'true')
    mobileNavToggle.classList.add('mobile-nav__toggle--open')
  }

  function closeMobileNav() {
    mobileNavPanel.hidden = true
    mobileNavToggle.setAttribute('aria-expanded', 'false')
    mobileNavToggle.classList.remove('mobile-nav__toggle--open')
  }

  mobileNavToggle.addEventListener('click', function () {
    if (mobileNavPanel.hidden) openMobileNav()
    else closeMobileNav()
  })

  document.addEventListener('click', function (e) {
    if (mobileNavPanel.hidden) return
    if (e.target === mobileNavToggle || mobileNavToggle.contains(e.target)) return
    if (mobileNavPanel.contains(e.target)) return
    closeMobileNav()
  })

  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !mobileNavPanel.hidden) closeMobileNav()
  })

  // ---------- Portfolio ----------

  function renderTabs(categories) {
    if (!activeCategoryId || !categories.some(function (c) { return c.id === activeCategoryId })) {
      activeCategoryId = categories.length ? categories[0].id : null
    }

    // Desktop/tablet horizontal tabs
    tabsEl.innerHTML = ''
    categories.forEach(function (cat) {
      var btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'tabs__item' + (cat.id === activeCategoryId ? ' tabs__item--active' : '')
      btn.textContent = cat.name
      btn.addEventListener('click', function () {
        activeCategoryId = cat.id
        activeSubcategoryId = null
        renderAll()
      })
      tabsEl.appendChild(btn)
    })

    var underline = document.createElement('span')
    underline.className = 'tabs__underline'
    tabsEl.appendChild(underline)

    var activeBtn = tabsEl.querySelector('.tabs__item--active')
    if (activeBtn) {
      underline.style.left = activeBtn.offsetLeft + 'px'
      underline.style.width = activeBtn.offsetWidth + 'px'
    } else {
      underline.style.width = '0'
    }

    // Phone hamburger menu — same category set, collapsed behind a toggle
    var activeCat = categories.filter(function (c) { return c.id === activeCategoryId })[0]
    mobileNavLabel.textContent = activeCat ? activeCat.name : 'Categories'

    mobileNavPanel.innerHTML = ''
    categories.forEach(function (cat) {
      var item = document.createElement('button')
      item.type = 'button'
      item.className = 'mobile-nav__item' + (cat.id === activeCategoryId ? ' mobile-nav__item--active' : '')
      item.textContent = cat.name
      item.addEventListener('click', function () {
        activeCategoryId = cat.id
        activeSubcategoryId = null
        closeMobileNav()
        renderAll()
      })
      mobileNavPanel.appendChild(item)
    })
  }

  // Photo items are static showcase images, not playable clips, so they skip
  // the play-icon affordance video items get.
  function itemCardMarkup(item, isVideo) {
    var hasImage = Boolean(item.thumbnailUrl)
    var bg = hasImage
      ? 'background-image:url(' + JSON.stringify(item.thumbnailUrl).slice(1, -1) + ')'
      : 'background:' + HopUtils.placeholderGradient(item.id)
    return (
      '<div class="reel-card__thumb" style="' + bg + '">' +
      '<div class="reel-card__scrim"></div>' +
      '<span class="reel-card__title">' + HopUtils.escapeHtml(item.title) + '</span>' +
      (isVideo
        ? '<span class="reel-card__play" aria-hidden="true">' +
          '<svg width="20" height="22" viewBox="0 0 20 22" fill="none"><path d="M1 1.5L18.5 11L1 20.5V1.5Z" fill="currentColor"/></svg>' +
          '</span>'
        : '') +
      '</div>'
    )
  }

  function renderGrid(gridEl, items, subcategoryType) {
    gridEl.innerHTML = ''
    var isVideo = subcategoryType === 'video'
    items.forEach(function (item) {
      var meta = HopUtils.RATIO_META[item.ratio] || HopUtils.RATIO_META.vertical
      var card = document.createElement('button')
      card.type = 'button'
      card.className = 'reel-card' + (meta.cardClass ? ' ' + meta.cardClass : '')
      card.setAttribute('aria-label', (isVideo ? 'Watch: ' : 'View: ') + item.title)
      card.innerHTML = itemCardMarkup(item, isVideo)
      if (item.linkUrl) {
        card.addEventListener('click', function () {
          window.open(item.linkUrl, '_blank', 'noopener,noreferrer')
        })
      } else {
        card.classList.add('reel-card--static')
      }
      gridEl.appendChild(card)
    })
  }

  // Left sidebar at every width (categories collapse into the hamburger
  // instead), listing the active category's actual subcategories — 0, 1, or
  // many, not a fixed pair. A subcategory stays clickable even at zero
  // items — an empty one shows an honest "nothing here yet" message instead
  // of being disabled, which read as broken rather than just empty.
  function renderSubnav(subcats) {
    function buildItem(subcat) {
      var item = document.createElement('button')
      item.type = 'button'
      item.setAttribute('role', 'tab')
      item.className = 'subnav__item' + (subcat.id === activeSubcategoryId ? ' subnav__item--active' : '')
      item.textContent = subcat.name
      item.setAttribute('aria-selected', subcat.id === activeSubcategoryId ? 'true' : 'false')
      item.addEventListener('click', function () {
        activeSubcategoryId = subcat.id
        renderContent(false)
      })
      return item
    }

    subnav.innerHTML = ''
    subcats.forEach(function (subcat) {
      subnav.appendChild(buildItem(subcat))
    })
  }

  // allowAutoSwitch is true only when arriving at a category fresh (initial
  // load, or switching top-level category) — it steers you to a subcategory
  // that has content instead of landing on an empty one. A deliberate click
  // on another subcategory (allowAutoSwitch = false) always honors that
  // choice, even if it's empty.
  function renderContent(allowAutoSwitch) {
    var subcats = getSubcategories(activeCategoryId)

    if (subcats.length === 0) {
      subnav.innerHTML = ''
      gridEl.hidden = true
      categoryEmpty.hidden = false
      categoryEmpty.textContent = 'No subcategories yet in this category.'
      return
    }

    if (allowAutoSwitch || !activeSubcategoryId || !subcats.some(function (s) { return s.id === activeSubcategoryId })) {
      var withItems = subcats.filter(function (s) { return getItems(s.id).length > 0 })
      activeSubcategoryId = (withItems[0] || subcats[0]).id
    }

    renderSubnav(subcats)

    var activeSubcat = subcats.filter(function (s) { return s.id === activeSubcategoryId })[0]
    var visible = getItems(activeSubcategoryId)
    categoryEmpty.hidden = visible.length !== 0
    categoryEmpty.textContent = 'No items in "' + activeSubcat.name + '" yet.'
    gridEl.hidden = visible.length === 0
    renderGrid(gridEl, visible, activeSubcat.type)
  }

  function renderAll() {
    var categories = getCategories()
    renderTabs(categories)
    if (categories.length === 0) {
      subnav.innerHTML = ''
      gridEl.hidden = true
      categoryEmpty.hidden = false
      categoryEmpty.textContent = 'No categories yet — add one from the dashboard.'
      return
    }
    renderContent(true)
  }

  window.addEventListener('resize', function () {
    if (!portfolioEl.hidden) renderTabs(getCategories())
  })

  if (!portfolioEl.hidden) dataReady.then(renderAll)
})()
