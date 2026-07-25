;(function () {
  var ENTERED_KEY = 'hop_entered'

  var heroEl = document.getElementById('hero')
  var portfolioEl = document.getElementById('portfolio')
  var enterBtn = document.getElementById('enterBtn')
  var logoHome = document.getElementById('logoHome')
  var tabsEl = document.getElementById('tabs')
  var mobileNavToggle = document.getElementById('mobileNavToggle')
  var mobileNavLabel = document.getElementById('mobileNavLabel')
  var mobileNavPanel = document.getElementById('mobileNavPanel')
  var gridEl = document.getElementById('grid')
  var yearLabel = document.getElementById('yearLabel')

  var activeCategoryId = null

  yearLabel.textContent = '© ' + new Date().getFullYear() + ' House of Prachar'

  // ---------- Hero ----------

  function enterPortfolio(skipAnimation) {
    sessionStorage.setItem(ENTERED_KEY, '1')
    heroEl.classList.remove('hero--leaving')
    if (skipAnimation) {
      heroEl.hidden = true
      portfolioEl.hidden = false
      renderAll()
      return
    }
    heroEl.classList.add('hero--leaving')
    window.setTimeout(function () {
      heroEl.hidden = true
      portfolioEl.hidden = false
      renderAll()
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
        closeMobileNav()
        renderAll()
      })
      mobileNavPanel.appendChild(item)
    })
  }

  function reelCardMarkup(reel) {
    var hasImage = Boolean(reel.thumbnailUrl)
    var bg = hasImage
      ? 'background-image:url(' + JSON.stringify(reel.thumbnailUrl).slice(1, -1) + ')'
      : 'background:' + HopUtils.placeholderGradient(reel.id)
    return (
      '<div class="reel-card__thumb" style="' + bg + '">' +
      '<div class="reel-card__scrim"></div>' +
      '<span class="reel-card__title">' + HopUtils.escapeHtml(reel.title) + '</span>' +
      '<span class="reel-card__play" aria-hidden="true">' +
      '<svg width="20" height="22" viewBox="0 0 20 22" fill="none"><path d="M1 1.5L18.5 11L1 20.5V1.5Z" fill="currentColor"/></svg>' +
      '</span>' +
      '</div>'
    )
  }

  function renderGrid(reels) {
    gridEl.innerHTML = ''
    if (reels.length === 0) {
      var empty = document.createElement('div')
      empty.className = 'reel-grid__empty'
      empty.textContent = 'No reels in this category yet.'
      gridEl.appendChild(empty)
      return
    }
    var ORIENTATION_CLASSES = { square: 1, portrait: 1, horizontal: 1, landscape: 1 }
    reels.forEach(function (reel) {
      var card = document.createElement('button')
      card.type = 'button'
      card.className = 'reel-card' + (ORIENTATION_CLASSES[reel.orientation] ? ' reel-card--' + reel.orientation : '')
      card.setAttribute('aria-label', 'Watch reel: ' + reel.title + ' on Instagram')
      card.innerHTML = reelCardMarkup(reel)
      card.addEventListener('click', function () {
        window.open(reel.instagramUrl, '_blank', 'noopener,noreferrer')
      })
      gridEl.appendChild(card)
    })
  }

  function renderAll() {
    var categories = HopStore.getCategories()
    renderTabs(categories)
    if (categories.length === 0) {
      gridEl.innerHTML = ''
      var msg = document.createElement('p')
      msg.className = 'portfolio__empty'
      msg.textContent = 'No categories yet — add one from the dashboard.'
      gridEl.appendChild(msg)
      return
    }
    renderGrid(HopStore.getReels(activeCategoryId))
  }

  HopStore.subscribe(function () {
    if (!portfolioEl.hidden) renderAll()
  })

  window.addEventListener('resize', function () {
    if (!portfolioEl.hidden) renderTabs(HopStore.getCategories())
  })

  if (!portfolioEl.hidden) renderAll()
})()
