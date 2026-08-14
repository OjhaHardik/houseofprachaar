;(function () {
  var AUTH_KEY = 'hop_admin_auth'

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
  var newItemBtn = document.getElementById('newItemBtn')
  var reelForm = document.getElementById('reelForm')
  var reelEditingId = document.getElementById('reelEditingId')
  var reelFormHint = document.getElementById('reelFormHint')
  var reelTitleInput = document.getElementById('reelTitleInput')
  var reelCategoryInput = document.getElementById('reelCategoryInput')
  var reelSubcategoryInput = document.getElementById('reelSubcategoryInput')
  var reelUrlInput = document.getElementById('reelUrlInput')
  var reelThumbLabel = document.getElementById('reelThumbLabel')
  var reelThumbInput = document.getElementById('reelThumbInput')
  var reelThumbFileInput = document.getElementById('reelThumbFileInput')
  var reelThumbPreview = document.getElementById('reelThumbPreview')
  var reelThumbClearBtn = document.getElementById('reelThumbClearBtn')
  var reelThumbStatus = document.getElementById('reelThumbStatus')
  var reelRatioInput = document.getElementById('reelRatioInput')
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

  var localSaveSection = document.getElementById('localSaveSection')
  var localSaveBtn = document.getElementById('localSaveBtn')
  var localSaveMessage = document.getElementById('localSaveMessage')

  var githubTokenInput = document.getElementById('githubTokenInput')
  var saveTokenBtn = document.getElementById('saveTokenBtn')
  var forgetTokenBtn = document.getElementById('forgetTokenBtn')
  var tokenStatus = document.getElementById('tokenStatus')
  var publishBtn = document.getElementById('publishBtn')
  var publishMessage = document.getElementById('publishMessage')

  var newPasscodeInput = document.getElementById('newPasscodeInput')
  var savePasscodeBtn = document.getElementById('savePasscodeBtn')
  var passcodeMessage = document.getElementById('passcodeMessage')

  // Which categories' subcategory panels are open — persists across
  // renderCategories() re-renders (every store mutation triggers one).
  // Declared up here (not next to the functions that use it further down)
  // because an already-authenticated session renders the dashboard
  // immediately at the bottom of this file, and that must never run before
  // every `var` this script depends on has actually been assigned.
  var expandedCategoryIds = {}

  // ---------- Gate ----------

  function showAdmin() {
    gateEl.hidden = true
    adminEl.hidden = false
    // First-ever visit to this browser's dashboard: start the draft from
    // what's actually live instead of the code's bundled placeholder seed.
    if (!HopStore.hasLocalData()) {
      HopStore.loadFromPublished()
        .catch(function (err) {
          // Storage-full already got its own clear alert from the onError
          // subscription below — don't stack a second one on top of it.
          if (err.isStorageFull) return
          alert(
            'Could not load the published content into this browser (' + err.message + ').\n\n' +
            'You\'re seeing placeholder demo content below, not your real site — do not edit or publish from here ' +
            'until this is fixed, or you risk overwriting real content with demo content. Try reloading the page, ' +
            'or check your connection.'
          )
        })
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

  // ---------- Categories & Subcategories ----------

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

  function startRenameSubcategory(sub, label) {
    var input = document.createElement('input')
    input.className = 'admin-input'
    input.value = sub.name
    label.parentNode.replaceChild(input, label)
    input.focus()
    input.select()
    var save = function () {
      if (input.value.trim()) HopStore.renameSubcategory(sub.id, input.value)
      else renderCategories()
    }
    input.addEventListener('blur', save)
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') input.blur()
    })
  }

  function buildSubcategoryRow(sub, siblingCount, indexInGroup) {
    var li = document.createElement('li')
    li.className = 'admin-list__row'

    var label = document.createElement('button')
    label.type = 'button'
    label.className = 'admin-list__label'
    label.textContent = sub.name
    label.addEventListener('click', function () {
      startRenameSubcategory(sub, label)
    })

    var typeBadge = document.createElement('span')
    typeBadge.className = 'admin-count-badge'
    typeBadge.textContent = sub.type === 'photo' ? 'Photo' : 'Video'

    var countBadge = document.createElement('span')
    countBadge.className = 'admin-count-badge'
    countBadge.textContent = String(HopStore.getItems(sub.id).length)

    var nameWrap = document.createElement('div')
    nameWrap.className = 'admin-list__name-wrap'
    nameWrap.appendChild(label)
    nameWrap.appendChild(typeBadge)
    nameWrap.appendChild(countBadge)

    var actions = document.createElement('div')
    actions.className = 'admin-list__actions'

    var editBtn = document.createElement('button')
    editBtn.type = 'button'
    editBtn.className = 'admin-icon-btn'
    editBtn.textContent = '✎'
    editBtn.setAttribute('aria-label', 'Rename')
    editBtn.addEventListener('click', function () {
      startRenameSubcategory(sub, label)
    })

    var upBtn = document.createElement('button')
    upBtn.type = 'button'
    upBtn.className = 'admin-icon-btn'
    upBtn.textContent = '↑'
    upBtn.disabled = indexInGroup === 0
    upBtn.setAttribute('aria-label', 'Move up')
    upBtn.addEventListener('click', function () {
      HopStore.reorderSubcategory(sub.id, -1)
    })

    var downBtn = document.createElement('button')
    downBtn.type = 'button'
    downBtn.className = 'admin-icon-btn'
    downBtn.textContent = '↓'
    downBtn.disabled = indexInGroup === siblingCount - 1
    downBtn.setAttribute('aria-label', 'Move down')
    downBtn.addEventListener('click', function () {
      HopStore.reorderSubcategory(sub.id, 1)
    })

    var delBtn = document.createElement('button')
    delBtn.type = 'button'
    delBtn.className = 'admin-icon-btn admin-icon-btn--danger'
    delBtn.textContent = '✕'
    delBtn.setAttribute('aria-label', 'Delete')
    delBtn.addEventListener('click', function () {
      if (confirm('Delete "' + sub.name + '" and all its items?')) HopStore.deleteSubcategory(sub.id)
    })

    actions.appendChild(editBtn)
    actions.appendChild(upBtn)
    actions.appendChild(downBtn)
    actions.appendChild(delBtn)

    li.appendChild(nameWrap)
    li.appendChild(actions)
    return li
  }

  function buildSubcategoryPanel(cat) {
    var panel = document.createElement('div')
    panel.className = 'admin-subcat-panel'
    panel.hidden = !expandedCategoryIds[cat.id]
    if (!expandedCategoryIds[cat.id]) return panel

    var subs = HopStore.getSubcategories(cat.id)
    if (subs.length === 0) {
      var hint = document.createElement('p')
      hint.className = 'admin-panel__hint'
      hint.style.margin = '0'
      hint.textContent = 'No subcategories yet — add one below.'
      panel.appendChild(hint)
    } else {
      var ul = document.createElement('ul')
      ul.className = 'admin-list'
      ul.style.margin = '0'
      subs.forEach(function (sub, i) {
        ul.appendChild(buildSubcategoryRow(sub, subs.length, i))
      })
      panel.appendChild(ul)
    }

    var form = document.createElement('form')
    form.className = 'admin-panel__row'
    var nameInput = document.createElement('input')
    nameInput.className = 'admin-input'
    nameInput.placeholder = 'New subcategory name'
    var typeSelect = document.createElement('select')
    typeSelect.className = 'admin-input'
    ;[
      ['video', 'Video'],
      ['photo', 'Photo'],
    ].forEach(function (pair) {
      var opt = document.createElement('option')
      opt.value = pair[0]
      opt.textContent = pair[1]
      typeSelect.appendChild(opt)
    })
    var addBtn = document.createElement('button')
    addBtn.type = 'submit'
    addBtn.className = 'admin-btn'
    addBtn.textContent = 'Add subcategory'
    form.appendChild(nameInput)
    form.appendChild(typeSelect)
    form.appendChild(addBtn)
    form.addEventListener('submit', function (e) {
      e.preventDefault()
      if (!nameInput.value.trim()) return
      HopStore.addSubcategory(cat.id, nameInput.value, typeSelect.value)
    })
    panel.appendChild(form)

    return panel
  }

  function renderCategories() {
    var categories = HopStore.getCategories()
    categoryList.innerHTML = ''

    categories.forEach(function (cat, i) {
      var li = document.createElement('li')
      li.className = 'admin-list__row'
      li.setAttribute('data-category-id', cat.id)

      var count = HopStore.getItemsByCategory(cat.id).length

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

      var toggleBtn = document.createElement('button')
      toggleBtn.type = 'button'
      toggleBtn.className = 'admin-icon-btn'
      toggleBtn.textContent = expandedCategoryIds[cat.id] ? '▾' : '▸'
      toggleBtn.setAttribute('aria-label', expandedCategoryIds[cat.id] ? 'Collapse subcategories' : 'Expand subcategories')
      toggleBtn.addEventListener('click', function () {
        expandedCategoryIds[cat.id] = !expandedCategoryIds[cat.id]
        renderCategories()
      })

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
        if (confirm('Delete "' + cat.name + '" and all its subcategories and items?')) HopStore.deleteCategory(cat.id)
      })

      actions.appendChild(toggleBtn)
      actions.appendChild(editBtn)
      actions.appendChild(upBtn)
      actions.appendChild(downBtn)
      actions.appendChild(delBtn)

      li.appendChild(nameWrap)
      li.appendChild(actions)
      categoryList.appendChild(li)

      var panelLi = document.createElement('li')
      panelLi.appendChild(buildSubcategoryPanel(cat))
      categoryList.appendChild(panelLi)
    })
  }

  categoryForm.addEventListener('submit', function (e) {
    e.preventDefault()
    if (!categoryNameInput.value.trim()) return
    var cat = HopStore.addCategory(categoryNameInput.value)
    categoryNameInput.value = ''
    // Auto-expand the new category so its subcategory controls are right
    // there — creating a category and adding subcategories to it is one
    // continuous action, not two separate UI areas.
    expandedCategoryIds[cat.id] = true
    renderCategories()
    var row = categoryList.querySelector('[data-category-id="' + cat.id + '"]')
    if (row) row.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  })

  // ---------- Items ----------

  function populateSubcategorySelect(categoryId) {
    var subs = HopStore.getSubcategories(categoryId)
    var currentSub = reelSubcategoryInput.value
    reelSubcategoryInput.innerHTML = ''

    if (subs.length === 0) {
      var opt = document.createElement('option')
      opt.value = ''
      opt.textContent = 'No subcategories — add one above'
      opt.disabled = true
      opt.selected = true
      reelSubcategoryInput.appendChild(opt)
      setItemFieldsDisabled(true)
      return
    }

    subs.forEach(function (s) {
      var opt = document.createElement('option')
      opt.value = s.id
      opt.textContent = s.name + ' (' + (s.type === 'photo' ? 'Photo' : 'Video') + ')'
      reelSubcategoryInput.appendChild(opt)
    })
    if (subs.some(function (s) { return s.id === currentSub })) reelSubcategoryInput.value = currentSub

    setItemFieldsDisabled(false)
    var selected = subs.filter(function (s) { return s.id === reelSubcategoryInput.value })[0] || subs[0]
    reelSubcategoryInput.value = selected.id
    applyFormForSubcategory(selected)
  }

  function setItemFieldsDisabled(disabled) {
    reelUrlInput.disabled = disabled
    reelThumbFileInput.disabled = disabled
    reelThumbInput.disabled = disabled
    reelRatioInput.disabled = disabled
    reelSubmitBtn.disabled = disabled
  }

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

    populateSubcategorySelect(reelCategoryInput.value)
  }

  reelCategoryInput.addEventListener('change', function () {
    populateSubcategorySelect(this.value)
  })

  reelSubcategoryInput.addEventListener('change', function () {
    var subcat = HopStore.getSubcategories(reelCategoryInput.value).filter(function (s) {
      return s.id === reelSubcategoryInput.value
    })[0]
    applyFormForSubcategory(subcat)
  })

  // Rebuilds the ratio dropdown and field labels/hint for whichever
  // subcategory is currently selected — its type gates which ratios are valid.
  function applyFormForSubcategory(subcat) {
    if (!subcat) return
    var type = subcat.type

    reelRatioInput.innerHTML = ''
    HopUtils.RATIOS_BY_TYPE[type].forEach(function (r) {
      var opt = document.createElement('option')
      opt.value = r
      opt.textContent = HopUtils.RATIO_LABELS[r]
      reelRatioInput.appendChild(opt)
    })

    reelThumbLabel.textContent =
      type === 'photo' ? 'Thumbnail image (required)' : 'Thumbnail image (optional — leave blank for a generated placeholder)'

    reelFormHint.textContent =
      type === 'photo'
        ? 'Photo items are upload-first — the image is what shows in the grid. The link is optional.'
        : 'Video items open the Link URL when clicked.'
  }

  // ---------- Thumbnail upload ----------
  // Uploaded images are stored as real files, not embedded as base64 text —
  // that's what blew past the browser's storage quota before (see
  // js/storage.js's onError handling). Where the file actually lands
  // depends on what's available, tried in this order: the local dev server
  // (tools/dev-server.js), a saved GitHub token (commits straight to the
  // repo), or — only if neither exists — the old embed-as-data-URL
  // behavior, with a clear warning instead of it happening invisibly.

  function isLocalDevServer() {
    return location.hostname === 'localhost' || location.hostname === '127.0.0.1'
  }

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

  function storeEmbedded(dataUrl) {
    reelThumbInput.value = dataUrl
    var approxKb = Math.round((dataUrl.length * 0.75) / 1024)
    setThumbStatus(
      'Warning: no local dev server or GitHub token available, so this image (~' + approxKb + ' KB) is being ' +
      'embedded directly instead of saved as a file. This uses up storage faster — run the local dev server ' +
      '("node tools/dev-server.js") or add a GitHub token to avoid this.'
    )
  }

  function storeUploadedThumbnail(dataUrl) {
    if (isLocalDevServer()) {
      setThumbStatus('Saving to local assets/uploads…')
      return fetch('/__upload-asset__', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl: dataUrl }),
      })
        .then(function (res) {
          if (!res.ok) return res.text().then(function (text) { throw new Error(text || 'HTTP ' + res.status) })
          return res.json()
        })
        .then(function (result) {
          reelThumbInput.value = result.path
          setThumbStatus('Saved as ' + result.path + '.')
        })
        .catch(function (err) {
          setThumbStatus(
            'Local upload failed (' + err.message + ') — make sure the site is running via ' +
            '"node tools/dev-server.js", not Live Server. Falling back to an embedded image.'
          )
          storeEmbedded(dataUrl)
        })
    }

    if (HopPublish.hasToken()) {
      setThumbStatus('Committing image to GitHub…')
      return HopPublish.uploadAsset(dataUrl, 'Upload thumbnail image')
        .then(function (result) {
          reelThumbInput.value = result.path
          setThumbStatus('Committed as ' + result.path + '. Remember to Publish to make it live.')
        })
        .catch(function (err) {
          setThumbStatus('GitHub upload failed (' + err.message + '). Falling back to an embedded image.')
          storeEmbedded(dataUrl)
        })
    }

    storeEmbedded(dataUrl)
    return Promise.resolve()
  }

  reelThumbFileInput.addEventListener('change', function () {
    var file = reelThumbFileInput.files && reelThumbFileInput.files[0]
    if (!file) return
    setThumbStatus('Processing image…')
    HopUtils.fileToCompressedDataUrl(file)
      .then(function (dataUrl) {
        updateThumbPreview(dataUrl) // instant, doesn't wait on upload
        return storeUploadedThumbnail(dataUrl)
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

  function resetItemForm() {
    reelEditingId.value = ''
    reelTitleInput.value = ''
    reelUrlInput.value = ''
    reelThumbInput.value = ''
    reelThumbFileInput.value = ''
    updateThumbPreview('')
    setThumbStatus('')
    reelSubmitBtn.textContent = 'Add item'
    if (reelFilter.value !== 'all') reelCategoryInput.value = reelFilter.value
    populateSubcategorySelect(reelCategoryInput.value)
  }

  function openNewItemForm() {
    var categories = HopStore.getCategories()
    if (categories.length === 0) {
      alert('Add a category first before adding items.')
      return
    }
    if (HopStore.getSubcategories().length === 0) {
      alert('Add a subcategory first — expand a category above and add one.')
      return
    }

    var defaultCatId =
      reelFilter.value !== 'all' && HopStore.getSubcategories(reelFilter.value).length > 0
        ? reelFilter.value
        : categories.filter(function (c) {
            return HopStore.getSubcategories(c.id).length > 0
          })[0].id

    reelCategoryInput.value = defaultCatId
    resetItemForm()
    reelForm.hidden = false
  }

  newItemBtn.addEventListener('click', openNewItemForm)

  reelCancelBtn.addEventListener('click', function () {
    reelForm.hidden = true
  })

  reelFilter.addEventListener('change', renderReelList)

  reelForm.addEventListener('submit', function (e) {
    e.preventDefault()
    var subcategoryId = reelSubcategoryInput.value
    var subcat = HopStore.getSubcategories(reelCategoryInput.value).filter(function (s) {
      return s.id === subcategoryId
    })[0]
    if (!subcategoryId || !subcat) return

    var payload = {
      title: reelTitleInput.value.trim(),
      subcategoryId: subcategoryId,
      linkUrl: reelUrlInput.value.trim(),
      thumbnailUrl: reelThumbInput.value.trim(),
      ratio: reelRatioInput.value,
    }
    if (!payload.title) return
    if (subcat.type === 'photo' && !payload.thumbnailUrl) {
      setThumbStatus('An image is required for photo items.')
      return
    }

    if (reelEditingId.value) {
      HopStore.updateItem(reelEditingId.value, payload)
    } else {
      HopStore.addItem(payload)
    }
    reelForm.hidden = true
  })

  function openItemEditForm(item) {
    var subcat = HopStore.getSubcategories().filter(function (s) {
      return s.id === item.subcategoryId
    })[0]
    if (!subcat) return

    reelEditingId.value = item.id
    reelCategoryInput.value = subcat.categoryId
    populateSubcategorySelect(subcat.categoryId)
    reelSubcategoryInput.value = subcat.id
    applyFormForSubcategory(subcat)

    reelTitleInput.value = item.title
    reelUrlInput.value = item.linkUrl
    reelThumbInput.value = item.thumbnailUrl
    reelThumbFileInput.value = ''
    updateThumbPreview(item.thumbnailUrl)
    setThumbStatus('')
    reelRatioInput.value = HopUtils.normalizeRatio(item.ratio, subcat.type)
    reelSubmitBtn.textContent = 'Save changes'
    reelForm.hidden = false
  }

  function buildItemRow(item, subcatById, siblingCount, indexInGroup) {
    var li = document.createElement('li')
    li.className = 'admin-reel-row'

    var swatch = document.createElement('span')
    swatch.className = 'admin-reel-row__swatch'
    if (item.thumbnailUrl) {
      swatch.style.backgroundImage = 'url(' + JSON.stringify(item.thumbnailUrl).slice(1, -1) + ')'
    } else {
      swatch.style.background = HopUtils.placeholderGradient(item.id)
    }

    var info = document.createElement('div')
    info.className = 'admin-reel-row__info'
    var title = document.createElement('span')
    title.className = 'admin-reel-row__title'
    title.textContent = item.title
    var meta = document.createElement('span')
    meta.className = 'admin-reel-row__meta'
    var subcat = subcatById[item.subcategoryId]
    var subcatName = subcat ? subcat.name : 'Uncategorized'
    var ratioLabel = HopUtils.RATIO_LABELS[item.ratio] || item.ratio
    meta.textContent = subcatName + ' · ' + ratioLabel
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
      HopStore.reorderItem(item.id, -1)
    })

    var downBtn = document.createElement('button')
    downBtn.type = 'button'
    downBtn.className = 'admin-icon-btn'
    downBtn.textContent = '↓'
    downBtn.disabled = indexInGroup === siblingCount - 1
    downBtn.setAttribute('aria-label', 'Move down')
    downBtn.addEventListener('click', function () {
      HopStore.reorderItem(item.id, 1)
    })

    var editBtn = document.createElement('button')
    editBtn.type = 'button'
    editBtn.className = 'admin-icon-btn'
    editBtn.textContent = '✎'
    editBtn.setAttribute('aria-label', 'Edit')
    editBtn.addEventListener('click', function () {
      openItemEditForm(item)
    })

    var delBtn = document.createElement('button')
    delBtn.type = 'button'
    delBtn.className = 'admin-icon-btn admin-icon-btn--danger'
    delBtn.textContent = '✕'
    delBtn.setAttribute('aria-label', 'Delete')
    delBtn.addEventListener('click', function () {
      if (confirm('Delete "' + item.title + '"?')) HopStore.deleteItem(item.id)
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

  function buildItemGroup(title, items, subcatById, emptyText) {
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
    items.forEach(function (item, i) {
      ul.appendChild(buildItemRow(item, subcatById, items.length, i))
    })
    group.appendChild(ul)
    return group
  }

  function renderReelList() {
    var categories = HopStore.getCategories()
    var subcategories = HopStore.getSubcategories()
    var subcatById = {}
    subcategories.forEach(function (s) {
      subcatById[s.id] = s
    })

    var filterId = reelFilter.value
    var query = reelSearchInput.value.trim().toLowerCase()
    var items = filterId === 'all' ? HopStore.getItems() : HopStore.getItemsByCategory(filterId)
    if (query) {
      items = items.filter(function (it) {
        return it.title.toLowerCase().indexOf(query) !== -1
      })
    }

    reelListWrap.innerHTML = ''

    if (items.length === 0) {
      var hint = document.createElement('p')
      hint.className = 'admin-panel__hint'
      hint.textContent = query ? 'No matches for "' + reelSearchInput.value.trim() + '".' : 'No items here yet.'
      reelListWrap.appendChild(hint)
      return
    }

    var categoriesToShow = filterId === 'all' ? categories : categories.filter(function (c) { return c.id === filterId })

    categoriesToShow.forEach(function (cat) {
      var catSubs = subcategories.filter(function (s) {
        return s.categoryId === cat.id
      })
      if (catSubs.length === 0) return

      if (filterId === 'all') {
        var catHeading = document.createElement('h3')
        catHeading.className = 'admin-reel-group__title'
        catHeading.textContent = cat.name
        catHeading.style.marginTop = '18px'
        reelListWrap.appendChild(catHeading)
      }

      catSubs.forEach(function (sub) {
        var subItems = items.filter(function (it) {
          return it.subcategoryId === sub.id
        })
        if (filterId === 'all' && subItems.length === 0) return
        var groupTitle = sub.name + ' (' + (sub.type === 'photo' ? 'Photo' : 'Video') + ')'
        reelListWrap.appendChild(buildItemGroup(groupTitle, subItems, subcatById, 'No items yet.'))
      })
    })
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

  // ---------- Local development save ----------
  // Writes the draft straight to data.json on disk via tools/dev-server.js's
  // POST /__local-save__ endpoint — lets you see dashboard edits on the
  // local homepage immediately, without a GitHub token or a real publish.
  // Only offered when running on localhost/127.0.0.1: elsewhere (the real
  // deployed site) that endpoint doesn't exist, since GitHub Pages serves
  // static files only.

  if (isLocalDevServer()) {
    localSaveSection.hidden = false
  }

  function showLocalSaveMessage(text) {
    localSaveMessage.textContent = text
    localSaveMessage.hidden = false
  }

  // Guards against silently overwriting real content with an empty/near-empty
  // draft (e.g. a browser whose local draft never got seeded from the live
  // file) — compares against what's currently on disk first and asks for
  // confirmation if this save would shrink the catalog.
  function confirmIfShrinking(draftItemCount) {
    return fetch('data.json?_=' + Date.now(), { cache: 'no-store' })
      .then(function (res) {
        return res.ok ? res.json() : null
      })
      .catch(function () {
        return null
      })
      .then(function (live) {
        var liveItemCount = live && Array.isArray(live.items) ? live.items.length : 0
        if (liveItemCount > 0 && draftItemCount < liveItemCount) {
          return confirm(
            'The current data.json has ' + liveItemCount + ' item(s); your draft only has ' + draftItemCount +
            '. Saving will replace it with the smaller draft — continue?'
          )
        }
        return true
      })
  }

  localSaveBtn.addEventListener('click', function () {
    var draftItemCount = HopStore.getItems().length
    localSaveBtn.disabled = true
    showLocalSaveMessage('')
    localSaveMessage.hidden = true

    confirmIfShrinking(draftItemCount).then(function (proceed) {
      if (!proceed) {
        localSaveBtn.disabled = false
        return
      }
      doLocalSave()
    })
  })

  function doLocalSave() {
    localSaveBtn.textContent = 'Saving…'

    fetch('/__local-save__', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: HopStore.exportJson(),
    })
      .then(function (res) {
        if (!res.ok) {
          return res.text().then(function (text) {
            throw new Error(text || 'HTTP ' + res.status)
          })
        }
        showLocalSaveMessage('Saved — refresh the homepage tab to see it live.')
      })
      .catch(function (err) {
        showLocalSaveMessage(
          'Save failed: ' + err.message + '. Make sure the site is running via "node tools/dev-server.js", not Live Server or another static server.'
        )
      })
      .then(function () {
        localSaveBtn.disabled = false
        localSaveBtn.textContent = 'Save to local data.json'
      })
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

  // Fires whenever a save to this browser's storage fails — almost always
  // the quota being full, since every thumbnail image lives as base64 text
  // inside the one localStorage entry. Without this the edit just silently
  // didn't happen, with no indication why, which is what made this look
  // like "random" behavior that varied by device.
  HopStore.onError(function (err) {
    alert(
      'That change was NOT saved — this browser\'s storage is full ' +
      '(' + err.message + ').\n\n' +
      'This is caused by the total size of all your thumbnail images. To fix it: delete a few older/unused items, ' +
      'or use smaller images, then try again. Reloading this page will show your last successfully-saved state, ' +
      'not what you just tried to do.'
    )
  })

  // Deliberately last: everything above (every listener, every var this
  // depends on) must already be wired before rendering the dashboard for an
  // already-authenticated session. Doing this any earlier means a rendering
  // error here would abort the rest of the script — leaving every button
  // and form on the page dead with no explanation.
  if (sessionStorage.getItem(AUTH_KEY) === '1') {
    showAdmin()
  } else {
    showGate()
  }
})()
