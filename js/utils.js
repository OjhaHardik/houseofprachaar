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

  // Every category splits into two subsections. Which one an item belongs to
  // is derived from its orientation rather than stored separately, so the
  // two can never drift out of sync.
  var POST_ORIENTATIONS = { square: 1, portrait: 1 }

  function isPostOrientation(orientation) {
    return Boolean(POST_ORIENTATIONS[orientation])
  }

  function sectionOf(orientation) {
    return isPostOrientation(orientation) ? 'post' : 'reel'
  }

  return {
    hashString: hashString,
    placeholderGradient: placeholderGradient,
    escapeHtml: escapeHtml,
    fileToCompressedDataUrl: fileToCompressedDataUrl,
    isPostOrientation: isPostOrientation,
    sectionOf: sectionOf,
  }
})()
