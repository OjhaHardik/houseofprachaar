;(function () {
  var AUTH_KEY = 'hop_admin_auth'

  var ORIENTATION_LABELS = {
    vertical: 'Vertical (9:16)',
    horizontal: 'Horizontal (16:9)',
    square: 'Square (1:1)',
    portrait: 'Portrait (4:5)',
  }

  // Reels and Posts are edited through the same form, but with a different
  // field set: Reels need a real Instagram link (the whole point is linking
  // out to the video); Posts are upload-first showcase images and don't
  // require one. Which orientations are offered is scoped per section too.
  var SECTION_CONFIG = {
    reel: {
      orientations: ['vertical', 'horizontal'],
      urlLabel: 'Instagram reel URL',
      urlPlaceholder: 'https://www.instagram.com/reel/...',
      urlRequired: true,
      thumbLabel: 'Thumbnail image (optional — leave blank for a generated placeholder)',
      thumbRequired: false,
      hint: 'Reels link out to a real Instagram reel when clicked.',
      addLabel: 'Add reel',
    },
    post: {
      orientations: ['square', 'portrait'],
      urlLabel: 'Instagram post URL (optional)',
      urlPlaceholder: 'https://www.instagram.com/p/... (optional)',
      urlRequired: false,
      thumbLabel: 'Image (required)',
      thumbRequired: true,
      hint: 'Posts are upload-first — the image is what shows in the grid. Linking to Instagram is optional.',
      addLabel: 'Add post',
    },
  }

  var gateEl = document.getElementById('gate')
  var gateForm = document.getElementById('gateForm')
  var gateInput = document.getElementById('gateInput')
  var gateError = document.getElementById('gateError')
  var passcodeHint = document.getElementById('passcodeHint')

  var adminEl = document.getElementById('admin')
  var lockBtn = document.getElementById('lockBtn')

  var categoryList = document.getElementById('categoryList')
  var categoryForm = document.getElementById('categoryForm')
  var categoryNameInput = document.getElementById('categoryNameInput')

  var reelFilter = document.getElementById('reelFilter')
  var newReelBtn = document.getElementById('newReelBtn')
  var newPostBtn = document.getElementById('newPostBtn')
  var reelForm = document.getElementById('reelForm')
  var reelEditingId = document.getElementById('reelEditingId')
  var reelFormSection = document.getElementById('reelFormSection')
  var reelFormHint = document.getElementById('reelFormHint')
  var reelTitleInput = document.getElementById('reelTitleInput')
  var reelCategoryInput = document.getElementById('reelCategoryInput')
  var reelUrlLabel = document.getElementById('reelUrlLabel')
  var reelUrlInput = document.getElementById('reelUrlInput')
  var reelThumbLabel = document.getElementById('reelThumbLabel')
  var reelThumbInput = document.getElementById('reelThumbInput')
  var reelThumbFileInput = document.getElementById('reelThumbFileInput')
  var reelThumbPreview = document.getElementById('reelThumbPreview')
  var reelThumbClearBtn = document.getElementById('reelThumbClearBtn')
  var reelThumbStatus = document.getElementById('reelThumbStatus')
  var reelOrientationInput = document.getElementById('reelOrientationInput')
  var reelSubmitBtn = document.getElementById('reelSubmitBtn')
  var reelCancelBtn = document.getElementById('reelCancelBtn')
  var reelSearchInput = document.getElementById('reelSearchInput')
  var reelListWrap = document.getElementById('reelListWrap')

  var pullBtn = document.getElementById('pullBtn')
  var exportBtn = document.getElementById('exportBtn')
  var importBtn = document.getElementById('importBtn')
  var importFile = document.getElementById('importFile')
  var resetBtn = document.getElementById('resetBtn')
  var dataMessage = document.getElementById('dataMessage')

  var githubTokenInput = document.getElementById('githubTokenInput')
  var saveTokenBtn = document.getElementById('saveTokenBtn')
  var forgetTokenBtn = document.getElementById('forgetTokenBtn')
  var tokenStatus = document.getElementById('tokenStatus')
  var publishBtn = document.getElementById('publishBtn')
  var publishMessage = document.getElementById('publishMessage')

  var newPasscodeInput = document.getElementById('newPasscodeInput')
  var savePasscodeBtn = document.getElementById('savePasscodeBtn')
  var passcodeMessage = document.getElementById('passcodeMessage')

  // ---------- Gate ----------

  function showAdmin() {
    gateEl.hidden = true
    adminEl.hidden = false
    // First-ever visit to this browser's dashboard: start the draft from
    // what's actually live instead of the code's bundled placeholder seed.
    if (!HopStore.hasLocalData()) {
      HopStore.loadFromPublished()
        .catch(function () {})
        .then(renderAll)
    } else {
      renderAll()
    }
  }

  function showGate() {
    adminEl.hidden = true
    gateEl.hidden = false
    gateInput.value = ''
    gateError.hidden = true
    gateInput.focus()
  }

  passcodeHint.textContent = HopStore.getPasscodeHint()

  if (sessionStorage.getItem(AUTH_KEY) === '1') {
    showAdmin()
  } else {
    showGate()
  }

  gateForm.addEventListener('submit', function (e) {
    e.preventDefault()
    if (HopStore.checkPasscode(gateInput.value)) {
      sessionStorage.setItem(AUTH_KEY, '1')
      showAdmin()
    } else {
      gateError.hidden = false
    }
  })

  gateInput.addEventListener('input', function () {
    gateError.hidden = true
  })

  lockBtn.addEventListener('click', function () {
    sessionStorage.removeItem(AUTH_KEY)
    showGate()
  })

  // ---------- Categories ----------

  function startRenameCategory(cat, label) {
    var input = document.createElement('input')
    input.className = 'admin-input'
    input.value = cat.name
    label.parentNode.replaceChild(input, label)
    input.focus()
    input.select()
    var save = function () {
      if (input.value.trim()) HopStore.renameCategory(cat.id, input.value)
      else renderCategories()
    }
    input.addEventListener('blur', save)
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') input.blur()
    })
  }

  function renderCategories() {
    var categories = HopStore.getCategories()
    var allReels = HopStore.getReels()
    categoryList.innerHTML = ''

    categories.forEach(function (cat, i) {
      var li = document.createElement('li')
      li.className = 'admin-list__row'

      var count = allReels.filter(function (r) {
        return r.categoryId === cat.id
      }).length

      var label = document.createElement('button')
      label.type = 'button'
      label.className = 'admin-list__label'
      label.textContent = cat.name
      label.addEventListener('click', function () {
        startRenameCategory(cat, label)
      })

      var badge = document.createElement('span')
      badge.className = 'admin-count-badge'
      badge.textContent = String(count)

      var nameWrap = document.createElement('div')
      nameWrap.className = 'admin-list__name-wrap'
      nameWrap.appendChild(label)
      nameWrap.appendChild(badge)

      var actions = document.createElement('div')
      actions.className = 'admin-list__actions'

      var editBtn = document.createElement('button')
      editBtn.type = 'button'
      editBtn.className = 'admin-icon-btn'
      editBtn.textContent = '✎'
      editBtn.setAttribute('aria-label', 'Edit name')
      editBtn.addEventListener('click', function () {
        startRenameCategory(cat, label)
      })

      var upBtn = document.createElement('button')
      upBtn.type = 'button'
      upBtn.className = 'admin-icon-btn'
      upBtn.textContent = '↑'
      upBtn.disabled = i === 0
      upBtn.setAttribute('aria-label', 'Move up')
      upBtn.addEventListener('click', function () {
        HopStore.reorderCategory(cat.id, -1)
      })

      var downBtn = document.createElement('button')
      downBtn.type = 'button'
      downBtn.className = 'admin-icon-btn'
      downBtn.textContent = '↓'
      downBtn.disabled = i === categories.length - 1
      downBtn.setAttribute('aria-label', 'Move down')
      downBtn.addEventListener('click', function () {
        HopStore.reorderCategory(cat.id, 1)
      })

      var delBtn = document.createElement('button')
      delBtn.type = 'button'
      delBtn.className = 'admin-icon-btn admin-icon-btn--danger'
      delBtn.textContent = '✕'
      delBtn.setAttribute('aria-label', 'Delete')
      delBtn.addEventListener('click', function () {
        if (confirm('Delete "' + cat.name + '" and all its reels?')) HopStore.deleteCategory(cat.id)
      })

      actions.appendChild(editBtn)
      actions.appendChild(upBtn)
      actions.appendChild(downBtn)
      actions.appendChild(delBtn)

      li.appendChild(nameWrap)
      li.appendChild(actions)
      categoryList.appendChild(li)
    })
  }

  categoryForm.addEventListener('submit', function (e) {
    e.preventDefault()
    if (!categoryNameInput.value.trim()) return
    HopStore.addCategory(categoryNameInput.value)
    categoryNameInput.value = ''
  })

  // ---------- Reels ----------

  function populateCategorySelects() {
    var categories = HopStore.getCategories()
    var currentFilter = reelFilter.value || 'all'
    var currentReelCat = reelCategoryInput.value

    reelFilter.innerHTML = '<option value="all">All categories</option>'
    reelCategoryInput.innerHTML = ''
    categories.forEach(function (c) {
      var opt1 = document.createElement('option')
      opt1.value = c.id
      opt1.textContent = c.name
      reelFilter.appendChild(opt1)

      var opt2 = document.createElement('option')
      opt2.value = c.id
      opt2.textContent = c.name
      reelCategoryInput.appendChild(opt2)
    })

    if (categories.some(function (c) { return c.id === currentFilter })) reelFilter.value = currentFilter
    if (categories.some(function (c) { return c.id === currentReelCat })) reelCategoryInput.value = currentReelCat
  }

  // ---------- Thumbnail upload ----------

  function setThumbStatus(text) {
    reelThumbStatus.textContent = text
    reelThumbStatus.hidden = !text
  }

  function updateThumbPreview(url) {
    if (url) {
      reelThumbPreview.src = url
      reelThumbPreview.hidden = false
      reelThumbClearBtn.hidden = false
    } else {
      reelThumbPreview.hidden = true
      reelThumbPreview.src = ''
      reelThumbClearBtn.hidden = true
    }
  }

  reelThumbFileInput.addEventListener('change', function () {
    var file = reelThumbFileInput.files && reelThumbFileInput.files[0]
    if (!file) return
    setThumbStatus('Processing image…')
    HopUtils.fileToCompressedDataUrl(file)
      .then(function (dataUrl) {
        reelThumbInput.value = dataUrl
        updateThumbPreview(dataUrl)
        var approxKb = Math.round((dataUrl.length * 0.75) / 1024)
        setThumbStatus('Image ready (~' + approxKb + ' KB).')
      })
      .catch(function (err) {
        setThumbStatus(err.message)
      })
  })

  reelThumbInput.addEventListener('input', function () {
    updateThumbPreview(reelThumbInput.value.trim())
    setThumbStatus('')
  })

  reelThumbClearBtn.addEventListener('click', function () {
    reelThumbInput.value = ''
    reelThumbFileInput.value = ''
    updateThumbPreview('')
    setThumbStatus('')
  })

  // Rebuilds the orientation dropdown and field labels/requiredness for
  // whichever section (reel/post) the form is currently open for.
  function applyFormSection(section) {
    var config = SECTION_CONFIG[section]
    reelFormSection.value = section

    reelOrientationInput.innerHTML = ''
    config.orientations.forEach(function (o) {
      var opt = document.createElement('option')
      opt.value = o
      opt.textContent = ORIENTATION_LABELS[o]
      reelOrientationInput.appendChild(opt)
    })

    reelUrlLabel.textContent = config.urlLabel
    reelUrlInput.placeholder = config.urlPlaceholder
    reelUrlInput.required = config.urlRequired

    reelThumbLabel.textContent = config.thumbLabel

    reelFormHint.textContent = config.hint
    reelSubmitBtn.textContent = config.addLabel
  }

  function resetReelForm(section) {
    reelEditingId.value = ''
    reelTitleInput.value = ''
    reelUrlInput.value = ''
    reelThumbInput.value = ''
    reelThumbFileInput.value = ''
    updateThumbPreview('')
    setThumbStatus('')
    applyFormSection(section)
    if (reelFilter.value !== 'all') reelCategoryInput.value = reelFilter.value
  }

  function openNewItemForm(section) {
    if (HopStore.getCategories().length === 0) {
      alert('Add a category first before adding reels or posts.')
      return
    }
    resetReelForm(section)
    reelForm.hidden = false
  }

  newReelBtn.addEventListener('click', function () {
    openNewItemForm('reel')
  })

  newPostBtn.addEventListener('click', function () {
    openNewItemForm('post')
  })

  reelCancelBtn.addEventListener('click', function () {
    reelForm.hidden = true
  })

  reelFilter.addEventListener('change', renderReelList)

  reelForm.addEventListener('submit', function (e) {
    e.preventDefault()
    var config = SECTION_CONFIG[reelFormSection.value] || SECTION_CONFIG.reel
    var payload = {
      title: reelTitleInput.value.trim(),
      categoryId: reelCategoryInput.value,
      instagramUrl: reelUrlInput.value.trim(),
      thumbnailUrl: reelThumbInput.value.trim(),
      orientation: reelOrientationInput.value,
    }
    if (!payload.title || !payload.categoryId) return
    if (config.urlRequired && !payload.instagramUrl) return
    if (config.thumbRequired && !payload.thumbnailUrl) {
      setThumbStatus('An image is required for posts.')
      return
    }

    if (reelEditingId.value) {
      HopStore.updateReel(reelEditingId.value, payload)
    } else {
      HopStore.addReel(payload)
    }
    reelForm.hidden = true
  })

  function openReelEditForm(reel) {
    var section = HopUtils.sectionOf(reel.orientation)
    applyFormSection(section)
    reelEditingId.value = reel.id
    reelTitleInput.value = reel.title
    reelCategoryInput.value = reel.categoryId
    reelUrlInput.value = reel.instagramUrl
    reelThumbInput.value = reel.thumbnailUrl
    reelThumbFileInput.value = ''
    updateThumbPreview(reel.thumbnailUrl)
    setThumbStatus('')
    reelOrientationInput.value = ORIENTATION_LABELS[reel.orientation] ? reel.orientation : section === 'post' ? 'square' : 'vertical'
    reelSubmitBtn.textContent = 'Save changes'
    reelForm.hidden = false
  }

  function buildReelRow(reel, categoryById, siblingCount, indexInGroup) {
    var li = document.createElement('li')
    li.className = 'admin-reel-row'

    var swatch = document.createElement('span')
    swatch.className = 'admin-reel-row__swatch'
    if (reel.thumbnailUrl) {
      swatch.style.backgroundImage = 'url(' + JSON.stringify(reel.thumbnailUrl).slice(1, -1) + ')'
    } else {
      swatch.style.background = HopUtils.placeholderGradient(reel.id)
    }

    var info = document.createElement('div')
    info.className = 'admin-reel-row__info'
    var title = document.createElement('span')
    title.className = 'admin-reel-row__title'
    title.textContent = reel.title
    var meta = document.createElement('span')
    meta.className = 'admin-reel-row__meta'
    var categoryName = categoryById[reel.categoryId] ? categoryById[reel.categoryId].name : 'Uncategorized'
    var orientationLabel = ORIENTATION_LABELS[reel.orientation] || ORIENTATION_LABELS.vertical
    meta.textContent = categoryName + ' · ' + orientationLabel
    info.appendChild(title)
    info.appendChild(meta)

    var actions = document.createElement('div')
    actions.className = 'admin-list__actions'

    var upBtn = document.createElement('button')
    upBtn.type = 'button'
    upBtn.className = 'admin-icon-btn'
    upBtn.textContent = '↑'
    upBtn.disabled = indexInGroup === 0
    upBtn.setAttribute('aria-label', 'Move up')
    upBtn.addEventListener('click', function () {
      HopStore.reorderReel(reel.id, -1)
    })

    var downBtn = document.createElement('button')
    downBtn.type = 'button'
    downBtn.className = 'admin-icon-btn'
    downBtn.textContent = '↓'
    downBtn.disabled = indexInGroup === siblingCount - 1
    downBtn.setAttribute('aria-label', 'Move down')
    downBtn.addEventListener('click', function () {
      HopStore.reorderReel(reel.id, 1)
    })

    var editBtn = document.createElement('button')
    editBtn.type = 'button'
    editBtn.className = 'admin-icon-btn'
    editBtn.textContent = '✎'
    editBtn.setAttribute('aria-label', 'Edit')
    editBtn.addEventListener('click', function () {
      openReelEditForm(reel)
    })

    var delBtn = document.createElement('button')
    delBtn.type = 'button'
    delBtn.className = 'admin-icon-btn admin-icon-btn--danger'
    delBtn.textContent = '✕'
    delBtn.setAttribute('aria-label', 'Delete')
    delBtn.addEventListener('click', function () {
      if (confirm('Delete "' + reel.title + '"?')) HopStore.deleteReel(reel.id)
    })

    actions.appendChild(upBtn)
    actions.appendChild(downBtn)
    actions.appendChild(editBtn)
    actions.appendChild(delBtn)

    li.appendChild(swatch)
    li.appendChild(info)
    li.appendChild(actions)
    return li
  }

  function buildReelGroup(title, items, categoryById, emptyText) {
    var group = document.createElement('div')
    group.className = 'admin-reel-group'

    var heading = document.createElement('h3')
    heading.className = 'admin-reel-group__title'
    heading.textContent = title + ' (' + items.length + ')'
    group.appendChild(heading)

    if (items.length === 0) {
      var hint = document.createElement('p')
      hint.className = 'admin-panel__hint'
      hint.textContent = emptyText
      group.appendChild(hint)
      return group
    }

    var ul = document.createElement('ul')
    ul.className = 'admin-reel-list'
    items.forEach(function (reel, i) {
      ul.appendChild(buildReelRow(reel, categoryById, items.length, i))
    })
    group.appendChild(ul)
    return group
  }

  function renderReelList() {
    var categories = HopStore.getCategories()
    var categoryById = {}
    categories.forEach(function (c) {
      categoryById[c.id] = c
    })

    var filterId = reelFilter.value
    var query = reelSearchInput.value.trim().toLowerCase()
    var items = HopStore.getReels(filterId === 'all' ? undefined : filterId)
    if (query) {
      items = items.filter(function (r) {
        return r.title.toLowerCase().indexOf(query) !== -1
      })
    }

    // Reorder buttons only make sense among siblings sharing a category —
    // when "All categories" is selected, split further so up/down never
    // jumps a reel/post between two different categories' running order.
    var groupKey = filterId === 'all' ? function (r) { return r.categoryId } : function () { return 'all' }
    var reelsByGroup = {}
    var postsByGroup = {}
    items.forEach(function (r) {
      var key = groupKey(r)
      var bucket = HopUtils.sectionOf(r.orientation) === 'post' ? postsByGroup : reelsByGroup
      ;(bucket[key] = bucket[key] || []).push(r)
    })

    reelListWrap.innerHTML = ''

    if (items.length === 0) {
      var hint = document.createElement('p')
      hint.className = 'admin-panel__hint'
      hint.textContent = query ? 'No matches for "' + reelSearchInput.value.trim() + '".' : 'No reels or posts here yet.'
      reelListWrap.appendChild(hint)
      return
    }

    var reelsFlat = items.filter(function (r) { return HopUtils.sectionOf(r.orientation) === 'reel' })
    var postsFlat = items.filter(function (r) { return HopUtils.sectionOf(r.orientation) === 'post' })

    if (filterId === 'all') {
      // Group by category for readability when browsing everything at once.
      categories.forEach(function (cat) {
        var catReels = reelsByGroup[cat.id] || []
        var catPosts = postsByGroup[cat.id] || []
        if (catReels.length === 0 && catPosts.length === 0) return

        var catHeading = document.createElement('h3')
        catHeading.className = 'admin-reel-group__title'
        catHeading.textContent = cat.name
        catHeading.style.marginTop = '18px'
        reelListWrap.appendChild(catHeading)

        reelListWrap.appendChild(buildReelGroup('Reels', catReels, categoryById, 'No reels yet.'))
        reelListWrap.appendChild(buildReelGroup('Posts', catPosts, categoryById, 'No posts yet.'))
      })
    } else {
      reelListWrap.appendChild(buildReelGroup('Reels', reelsFlat, categoryById, 'No reels yet.'))
      reelListWrap.appendChild(buildReelGroup('Posts', postsFlat, categoryById, 'No posts yet.'))
    }
  }

  reelSearchInput.addEventListener('input', renderReelList)

  // ---------- Data tools ----------

  exportBtn.addEventListener('click', function () {
    HopStore.downloadJson()
  })

  importBtn.addEventListener('click', function () {
    importFile.click()
  })

  importFile.addEventListener('change', function () {
    var file = importFile.files && importFile.files[0]
    if (!file) return
    var reader = new FileReader()
    reader.onload = function () {
      var result = HopStore.importJson(String(reader.result))
      showDataMessage(result.ok ? 'Imported successfully.' : 'Import failed: ' + result.error)
    }
    reader.readAsText(file)
    importFile.value = ''
  })

  resetBtn.addEventListener('click', function () {
    if (confirm('Reset all data back to the seed file? This discards local changes.')) {
      HopStore.resetToSeed()
      showDataMessage('Reset to seed data.')
    }
  })

  pullBtn.addEventListener('click', function () {
    if (!confirm('Load the currently live data? This overwrites your local draft with what\'s published.')) return
    HopStore.loadFromPublished()
      .then(function () {
        showDataMessage('Loaded the current live data into your draft.')
      })
      .catch(function (err) {
        showDataMessage('Couldn\'t load live data: ' + err.message)
      })
  })

  function showDataMessage(text) {
    dataMessage.textContent = text
    dataMessage.hidden = false
  }

  // ---------- Publish to GitHub ----------

  function renderTokenStatus() {
    if (HopPublish.hasToken()) {
      tokenStatus.textContent = 'A token is saved in this browser.'
      forgetTokenBtn.hidden = false
    } else {
      tokenStatus.textContent = 'No token saved yet — publishing is disabled until you add one.'
      forgetTokenBtn.hidden = true
    }
  }

  renderTokenStatus()

  saveTokenBtn.addEventListener('click', function () {
    var value = githubTokenInput.value.trim()
    if (!value) return
    HopPublish.setToken(value)
    githubTokenInput.value = ''
    renderTokenStatus()
  })

  forgetTokenBtn.addEventListener('click', function () {
    HopPublish.setToken('')
    renderTokenStatus()
  })

  function showPublishMessage(text) {
    publishMessage.textContent = text
    publishMessage.hidden = false
  }

  publishBtn.addEventListener('click', function () {
    if (!HopPublish.hasToken()) {
      showPublishMessage('Add a GitHub token above first.')
      return
    }
    publishBtn.disabled = true
    publishBtn.textContent = 'Publishing…'
    showPublishMessage('')
    publishMessage.hidden = true

    HopPublish.publish(HopStore.exportJson(), 'Publish content update from dashboard')
      .then(function () {
        showPublishMessage('Published! Live on houseofprachar.com within about a minute.')
      })
      .catch(function (err) {
        showPublishMessage('Publish failed: ' + err.message)
      })
      .then(function () {
        publishBtn.disabled = false
        publishBtn.textContent = 'Publish to GitHub'
      })
  })

  // ---------- Passcode settings ----------

  savePasscodeBtn.addEventListener('click', function () {
    var value = newPasscodeInput.value.trim()
    if (!value) return
    HopStore.setPasscode(value)
    newPasscodeInput.value = ''
    passcodeHint.textContent = HopStore.getPasscodeHint()
    passcodeMessage.hidden = false
  })

  // ---------- Render orchestration ----------

  function renderAll() {
    renderCategories()
    populateCategorySelects()
    renderReelList()
  }

  HopStore.subscribe(function () {
    if (!adminEl.hidden) renderAll()
  })
})()
