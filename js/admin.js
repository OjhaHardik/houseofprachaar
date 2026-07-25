;(function () {
  var AUTH_KEY = 'hop_admin_auth'

  var ORIENTATION_LABELS = {
    vertical: 'Vertical (9:16)',
    square: 'Square (1:1)',
    portrait: 'Portrait (3:4)',
    horizontal: 'Horizontal (16:9)',
    landscape: 'Landscape (4:3)',
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
  var reelForm = document.getElementById('reelForm')
  var reelEditingId = document.getElementById('reelEditingId')
  var reelTitleInput = document.getElementById('reelTitleInput')
  var reelCategoryInput = document.getElementById('reelCategoryInput')
  var reelUrlInput = document.getElementById('reelUrlInput')
  var reelThumbInput = document.getElementById('reelThumbInput')
  var reelThumbFileInput = document.getElementById('reelThumbFileInput')
  var reelThumbPreview = document.getElementById('reelThumbPreview')
  var reelThumbClearBtn = document.getElementById('reelThumbClearBtn')
  var reelThumbStatus = document.getElementById('reelThumbStatus')
  var reelOrientationInput = document.getElementById('reelOrientationInput')
  var reelSubmitBtn = document.getElementById('reelSubmitBtn')
  var reelCancelBtn = document.getElementById('reelCancelBtn')
  var reelList = document.getElementById('reelList')

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

  function renderCategories() {
    var categories = HopStore.getCategories()
    categoryList.innerHTML = ''

    categories.forEach(function (cat, i) {
      var li = document.createElement('li')
      li.className = 'admin-list__row'

      var label = document.createElement('button')
      label.type = 'button'
      label.className = 'admin-list__label'
      label.textContent = cat.name
      label.addEventListener('click', function () {
        var input = document.createElement('input')
        input.className = 'admin-input'
        input.value = cat.name
        li.replaceChild(input, label)
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
      })

      var actions = document.createElement('div')
      actions.className = 'admin-list__actions'

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

      actions.appendChild(upBtn)
      actions.appendChild(downBtn)
      actions.appendChild(delBtn)

      li.appendChild(label)
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

  function resetReelForm() {
    reelEditingId.value = ''
    reelTitleInput.value = ''
    reelUrlInput.value = ''
    reelThumbInput.value = ''
    reelThumbFileInput.value = ''
    updateThumbPreview('')
    setThumbStatus('')
    reelOrientationInput.value = 'vertical'
    if (reelFilter.value !== 'all') reelCategoryInput.value = reelFilter.value
    reelSubmitBtn.textContent = 'Add reel'
  }

  newReelBtn.addEventListener('click', function () {
    if (HopStore.getCategories().length === 0) {
      alert('Add a category first before adding reels.')
      return
    }
    resetReelForm()
    reelForm.hidden = false
  })

  reelCancelBtn.addEventListener('click', function () {
    reelForm.hidden = true
  })

  reelFilter.addEventListener('change', renderReelList)

  reelForm.addEventListener('submit', function (e) {
    e.preventDefault()
    var payload = {
      title: reelTitleInput.value.trim(),
      categoryId: reelCategoryInput.value,
      instagramUrl: reelUrlInput.value.trim(),
      thumbnailUrl: reelThumbInput.value.trim(),
      orientation: reelOrientationInput.value,
    }
    if (!payload.title || !payload.categoryId || !payload.instagramUrl) return

    if (reelEditingId.value) {
      HopStore.updateReel(reelEditingId.value, payload)
    } else {
      HopStore.addReel(payload)
    }
    reelForm.hidden = true
  })

  function renderReelList() {
    var categories = HopStore.getCategories()
    var categoryById = {}
    categories.forEach(function (c) {
      categoryById[c.id] = c
    })

    var filterId = reelFilter.value
    var reels = HopStore.getReels(filterId === 'all' ? undefined : filterId)

    reelList.innerHTML = ''

    if (reels.length === 0) {
      var hint = document.createElement('p')
      hint.className = 'admin-panel__hint'
      hint.textContent = 'No reels here yet.'
      reelList.appendChild(hint)
      return
    }

    reels.forEach(function (reel) {
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

      var editBtn = document.createElement('button')
      editBtn.type = 'button'
      editBtn.className = 'admin-icon-btn'
      editBtn.textContent = '✎'
      editBtn.setAttribute('aria-label', 'Edit')
      editBtn.addEventListener('click', function () {
        reelEditingId.value = reel.id
        reelTitleInput.value = reel.title
        reelCategoryInput.value = reel.categoryId
        reelUrlInput.value = reel.instagramUrl
        reelThumbInput.value = reel.thumbnailUrl
        reelThumbFileInput.value = ''
        updateThumbPreview(reel.thumbnailUrl)
        setThumbStatus('')
        reelOrientationInput.value = ORIENTATION_LABELS[reel.orientation] ? reel.orientation : 'vertical'
        reelSubmitBtn.textContent = 'Save changes'
        reelForm.hidden = false
      })

      var delBtn = document.createElement('button')
      delBtn.type = 'button'
      delBtn.className = 'admin-icon-btn admin-icon-btn--danger'
      delBtn.textContent = '✕'
      delBtn.setAttribute('aria-label', 'Delete')
      delBtn.addEventListener('click', function () {
        if (confirm('Delete "' + reel.title + '"?')) HopStore.deleteReel(reel.id)
      })

      actions.appendChild(editBtn)
      actions.appendChild(delBtn)

      li.appendChild(swatch)
      li.appendChild(info)
      li.appendChild(actions)
      reelList.appendChild(li)
    })
  }

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
