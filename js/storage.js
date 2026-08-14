var HopStore = (function () {
  var STORAGE_KEY = 'hop_data'
  var PASSCODE_KEY = 'hop_admin_passcode'
  var DEFAULT_PASSCODE = 'prachar2026'

  var listeners = []
  var errorListeners = []

  function notify() {
    for (var i = 0; i < listeners.length; i++) listeners[i]()
  }

  function subscribe(fn) {
    listeners.push(fn)
    return function () {
      var idx = listeners.indexOf(fn)
      if (idx !== -1) listeners.splice(idx, 1)
    }
  }

  // Fires when a write to localStorage fails — almost always the browser's
  // per-origin storage quota (commonly ~5MB, often less on mobile), since
  // the whole draft — including every thumbnail as base64 text — lives in
  // one localStorage entry. Without this, a failed write used to throw
  // uncaught out of whatever button triggered it: the edit silently didn't
  // save, with no indication why, on some devices and not others.
  function onError(fn) {
    errorListeners.push(fn)
  }

  function notifyError(err) {
    for (var i = 0; i < errorListeners.length; i++) errorListeners[i](err)
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj))
  }

  function read() {
    var raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return clone(HOP_SEED)
    try {
      var parsed = JSON.parse(raw)
      var normalized = HopUtils.normalizeSiteData(parsed)
      if (!normalized) throw new Error('bad shape')
      // Migration (or ratio clamping) may have changed the shape — write it
      // back once so the next read() call sees already-current data instead
      // of re-migrating from scratch every time.
      if (normalized !== parsed) localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
      return normalized
    } catch (e) {
      return clone(HOP_SEED)
    }
  }

  function hasLocalData() {
    return localStorage.getItem(STORAGE_KEY) !== null
  }

  // Fetches the currently-published data.json (the file "Publish" writes to
  // the repo) and overwrites the local draft with it — used to start a fresh
  // admin session from what's actually live, or to discard local edits and
  // resync with the published version.
  function loadFromPublished() {
    return fetch('data.json?_=' + Date.now(), { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('data.json request failed: ' + res.status)
        return res.json()
      })
      .then(function (data) {
        var normalized = HopUtils.normalizeSiteData(data)
        if (!normalized) throw new Error('data.json has an unexpected shape')
        if (!write(normalized)) {
          // write() already fired onError with the storage-full detail —
          // this flag lets callers avoid stacking a second, redundant alert
          // on top of that for this specific failure reason.
          var err = new Error('could not save to this browser\'s storage (likely full)')
          err.isStorageFull = true
          throw err
        }
        return normalized
      })
  }

  // Returns whether the write actually succeeded — callers that need to
  // know (loadFromPublished, importJson) check this; callers that don't
  // (every plain CRUD mutator) can ignore it, since notifyError already
  // handles telling the user.
  function write(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (e) {
      // Swallowed here (not re-thrown) so the button/form that triggered
      // this doesn't blow up with an uncaught exception — notifyError lets
      // the UI show what actually happened instead.
      notifyError(e)
      return false
    }
    notify()
    return true
  }

  function uid(prefix) {
    return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
  }

  // --- Categories ---

  function getCategories() {
    return read().categories.slice().sort(function (a, b) {
      return a.order - b.order
    })
  }

  function addCategory(name) {
    var data = read()
    var slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    var category = {
      id: uid('cat'),
      name: name.trim(),
      slug: slug || uid('cat'),
      order: data.categories.length,
    }
    data.categories.push(category)
    write(data)
    return category
  }

  function renameCategory(id, name) {
    var data = read()
    var cat = data.categories.filter(function (c) {
      return c.id === id
    })[0]
    if (!cat) return
    cat.name = name.trim()
    write(data)
  }

  function reorderCategory(id, direction) {
    var data = read()
    var sorted = data.categories.slice().sort(function (a, b) {
      return a.order - b.order
    })
    var idx = sorted.findIndex(function (c) {
      return c.id === id
    })
    var swapIdx = idx + direction
    if (idx === -1 || swapIdx < 0 || swapIdx >= sorted.length) return
    var a = sorted[idx]
    var b = sorted[swapIdx]
    var tmp = a.order
    a.order = b.order
    b.order = tmp
    write(data)
  }

  // Deleting a category cascades two levels: its subcategories, then the
  // items that belonged to those subcategories.
  function deleteCategory(id) {
    var data = read()
    var removedSubIds = data.subcategories
      .filter(function (s) { return s.categoryId === id })
      .map(function (s) { return s.id })
    data.categories = data.categories.filter(function (c) {
      return c.id !== id
    })
    data.subcategories = data.subcategories.filter(function (s) {
      return s.categoryId !== id
    })
    data.items = data.items.filter(function (it) {
      return removedSubIds.indexOf(it.subcategoryId) === -1
    })
    write(data)
  }

  // --- Subcategories ---

  function getSubcategories(categoryId) {
    var subs = read().subcategories
    var filtered = categoryId
      ? subs.filter(function (s) {
          return s.categoryId === categoryId
        })
      : subs
    return filtered.slice().sort(function (a, b) {
      return a.order - b.order
    })
  }

  function addSubcategory(categoryId, name, type) {
    var data = read()
    var countInCategory = data.subcategories.filter(function (s) {
      return s.categoryId === categoryId
    }).length
    var slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    var subcategory = {
      id: uid('sub'),
      categoryId: categoryId,
      name: name.trim(),
      slug: slug || uid('sub'),
      type: type === 'photo' ? 'photo' : 'video',
      order: countInCategory,
    }
    data.subcategories.push(subcategory)
    write(data)
    return subcategory
  }

  function renameSubcategory(id, name) {
    var data = read()
    var sub = data.subcategories.filter(function (s) {
      return s.id === id
    })[0]
    if (!sub) return
    sub.name = name.trim()
    write(data)
  }

  function reorderSubcategory(id, direction) {
    var data = read()
    var sub = data.subcategories.filter(function (s) {
      return s.id === id
    })[0]
    if (!sub) return
    var siblings = data.subcategories
      .filter(function (s) {
        return s.categoryId === sub.categoryId
      })
      .sort(function (a, b) {
        return a.order - b.order
      })
    var idx = siblings.findIndex(function (s) {
      return s.id === id
    })
    var swapIdx = idx + direction
    if (idx === -1 || swapIdx < 0 || swapIdx >= siblings.length) return
    var a = siblings[idx]
    var b = siblings[swapIdx]
    var tmp = a.order
    a.order = b.order
    b.order = tmp
    write(data)
  }

  // Deleting a subcategory cascades to its items.
  function deleteSubcategory(id) {
    var data = read()
    data.subcategories = data.subcategories.filter(function (s) {
      return s.id !== id
    })
    data.items = data.items.filter(function (it) {
      return it.subcategoryId !== id
    })
    write(data)
  }

  // --- Items ---

  function getItems(subcategoryId) {
    var items = read().items
    var filtered = subcategoryId
      ? items.filter(function (it) {
          return it.subcategoryId === subcategoryId
        })
      : items
    return filtered.slice().sort(function (a, b) {
      return a.order - b.order
    })
  }

  // Resolves every subcategory under a category first, then returns the
  // items belonging to any of them — used by the admin "All categories"
  // filter view, which groups by category rather than one subcategory at a
  // time.
  function getItemsByCategory(categoryId) {
    var subIds = getSubcategories(categoryId).map(function (s) {
      return s.id
    })
    return read()
      .items.filter(function (it) {
        return subIds.indexOf(it.subcategoryId) !== -1
      })
      .sort(function (a, b) {
        return a.order - b.order
      })
  }

  function addItem(input) {
    var data = read()
    var subcat = data.subcategories.filter(function (s) {
      return s.id === input.subcategoryId
    })[0]
    var type = subcat ? subcat.type : 'video'
    var countInSubcategory = data.items.filter(function (it) {
      return it.subcategoryId === input.subcategoryId
    }).length
    var item = {
      id: uid('item'),
      subcategoryId: input.subcategoryId,
      title: input.title,
      linkUrl: input.linkUrl || '',
      thumbnailUrl: input.thumbnailUrl || '',
      ratio: HopUtils.normalizeRatio(input.ratio, type),
      order: countInSubcategory,
    }
    data.items.push(item)
    write(data)
    return item
  }

  // Reorders an item among its siblings within the same subcategory.
  function reorderItem(id, direction) {
    var data = read()
    var item = data.items.filter(function (it) {
      return it.id === id
    })[0]
    if (!item) return
    var siblings = data.items
      .filter(function (it) {
        return it.subcategoryId === item.subcategoryId
      })
      .sort(function (a, b) {
        return a.order - b.order
      })
    var idx = siblings.findIndex(function (it) {
      return it.id === id
    })
    var swapIdx = idx + direction
    if (idx === -1 || swapIdx < 0 || swapIdx >= siblings.length) return
    var a = siblings[idx]
    var b = siblings[swapIdx]
    var tmp = a.order
    a.order = b.order
    b.order = tmp
    write(data)
  }

  function updateItem(id, patch) {
    var data = read()
    var item = data.items.filter(function (it) {
      return it.id === id
    })[0]
    if (!item) return
    for (var key in patch) {
      if (Object.prototype.hasOwnProperty.call(patch, key)) item[key] = patch[key]
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'ratio') || Object.prototype.hasOwnProperty.call(patch, 'subcategoryId')) {
      var subcat = data.subcategories.filter(function (s) {
        return s.id === item.subcategoryId
      })[0]
      item.ratio = HopUtils.normalizeRatio(item.ratio, subcat ? subcat.type : 'video')
    }
    write(data)
  }

  function deleteItem(id) {
    var data = read()
    data.items = data.items.filter(function (it) {
      return it.id !== id
    })
    write(data)
  }

  // --- Data tools ---

  function exportJson() {
    return JSON.stringify(read(), null, 2)
  }

  function downloadJson() {
    var blob = new Blob([exportJson()], { type: 'application/json' })
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    a.href = url
    a.download = 'seed.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function importJson(json) {
    try {
      var parsed = JSON.parse(json)
      var normalized = HopUtils.normalizeSiteData(parsed)
      if (!normalized) {
        return { ok: false, error: 'JSON must contain "categories"/"subcategories"/"items" (or legacy "categories"/"reels") arrays.' }
      }
      if (!write(normalized)) {
        return { ok: false, error: 'could not save to this browser\'s storage (likely full)' }
      }
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message || 'Invalid JSON' }
    }
  }

  function resetToSeed() {
    write(clone(HOP_SEED))
  }

  // --- Admin passcode (soft client-side gate only, not real security) ---

  function checkPasscode(input) {
    var stored = localStorage.getItem(PASSCODE_KEY) || DEFAULT_PASSCODE
    return input === stored
  }

  function setPasscode(next) {
    localStorage.setItem(PASSCODE_KEY, next)
  }

  function getPasscodeHint() {
    return localStorage.getItem(PASSCODE_KEY) ? 'custom passcode set' : 'default: "' + DEFAULT_PASSCODE + '"'
  }

  return {
    subscribe: subscribe,
    onError: onError,
    getCategories: getCategories,
    addCategory: addCategory,
    renameCategory: renameCategory,
    reorderCategory: reorderCategory,
    deleteCategory: deleteCategory,
    getSubcategories: getSubcategories,
    addSubcategory: addSubcategory,
    renameSubcategory: renameSubcategory,
    reorderSubcategory: reorderSubcategory,
    deleteSubcategory: deleteSubcategory,
    getItems: getItems,
    getItemsByCategory: getItemsByCategory,
    addItem: addItem,
    reorderItem: reorderItem,
    updateItem: updateItem,
    deleteItem: deleteItem,
    exportJson: exportJson,
    downloadJson: downloadJson,
    importJson: importJson,
    resetToSeed: resetToSeed,
    hasLocalData: hasLocalData,
    loadFromPublished: loadFromPublished,
    checkPasscode: checkPasscode,
    setPasscode: setPasscode,
    getPasscodeHint: getPasscodeHint,
  }
})()
