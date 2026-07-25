var HopStore = (function () {
  var STORAGE_KEY = 'hop_data'
  var PASSCODE_KEY = 'hop_admin_passcode'
  var DEFAULT_PASSCODE = 'prachar2026'

  var listeners = []

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

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj))
  }

  function read() {
    var raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return clone(HOP_SEED)
    try {
      var parsed = JSON.parse(raw)
      if (!Array.isArray(parsed.categories) || !Array.isArray(parsed.reels)) throw new Error('bad shape')
      // Backfill fields added after some browsers already had data saved.
      parsed.reels.forEach(function (r) {
        if (r.orientation !== 'horizontal') r.orientation = 'vertical'
      })
      return parsed
    } catch (e) {
      return clone(HOP_SEED)
    }
  }

  function write(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    notify()
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

  function deleteCategory(id) {
    var data = read()
    data.categories = data.categories.filter(function (c) {
      return c.id !== id
    })
    data.reels = data.reels.filter(function (r) {
      return r.categoryId !== id
    })
    write(data)
  }

  // --- Reels ---

  function getReels(categoryId) {
    var reels = read().reels
    var filtered = categoryId
      ? reels.filter(function (r) {
          return r.categoryId === categoryId
        })
      : reels
    return filtered.slice().sort(function (a, b) {
      return a.order - b.order
    })
  }

  function addReel(input) {
    var data = read()
    var countInCategory = data.reels.filter(function (r) {
      return r.categoryId === input.categoryId
    }).length
    var reel = {
      id: uid('reel'),
      categoryId: input.categoryId,
      title: input.title,
      instagramUrl: input.instagramUrl,
      thumbnailUrl: input.thumbnailUrl || '',
      orientation: input.orientation === 'horizontal' ? 'horizontal' : 'vertical',
      order: countInCategory,
    }
    data.reels.push(reel)
    write(data)
    return reel
  }

  function updateReel(id, patch) {
    var data = read()
    var reel = data.reels.filter(function (r) {
      return r.id === id
    })[0]
    if (!reel) return
    for (var key in patch) {
      if (Object.prototype.hasOwnProperty.call(patch, key)) reel[key] = patch[key]
    }
    write(data)
  }

  function deleteReel(id) {
    var data = read()
    data.reels = data.reels.filter(function (r) {
      return r.id !== id
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
      if (!Array.isArray(parsed.categories) || !Array.isArray(parsed.reels)) {
        return { ok: false, error: 'JSON must contain "categories" and "reels" arrays.' }
      }
      write(parsed)
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
    getCategories: getCategories,
    addCategory: addCategory,
    renameCategory: renameCategory,
    reorderCategory: reorderCategory,
    deleteCategory: deleteCategory,
    getReels: getReels,
    addReel: addReel,
    updateReel: updateReel,
    deleteReel: deleteReel,
    exportJson: exportJson,
    downloadJson: downloadJson,
    importJson: importJson,
    resetToSeed: resetToSeed,
    checkPasscode: checkPasscode,
    setPasscode: setPasscode,
    getPasscodeHint: getPasscodeHint,
  }
})()
