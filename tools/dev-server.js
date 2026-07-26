// Local development server for House of Prachar.
//
// Serves this repo as static files (same as Live Server / `python -m
// http.server`) AND adds one extra thing neither of those can do: a
// POST /__local-save__ endpoint that writes the dashboard's draft straight
// to data.json on disk. That's what lets the "Save to local data.json"
// button in admin.html show your edits on the local homepage immediately,
// without going through GitHub.
//
// Usage:  node tools/dev-server.js [port]      (default port 5503)
//
// This is a dev-only convenience — it has no auth beyond whatever the
// dashboard's own passcode gate provides, and only ever writes to the single
// data.json file at the repo root. Don't expose it beyond your own machine.

var http = require('http')
var fs = require('fs')
var path = require('path')
var url = require('url')

var ROOT = path.resolve(__dirname, '..')
var DATA_FILE = path.join(ROOT, 'data.json')
var BACKUP_FILE = path.join(ROOT, 'data.json.bak')
var PORT = Number(process.argv[2]) || 5503

var MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
}

function serveStatic(req, res, pathname) {
  if (pathname === '/') pathname = '/index.html'

  // Resolve within ROOT only — reject anything that escapes it (e.g. "..").
  var filePath = path.normalize(path.join(ROOT, decodeURIComponent(pathname)))
  if (filePath.indexOf(ROOT) !== 0) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }

  fs.readFile(filePath, function (err, data) {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('Not found: ' + pathname)
      return
    }
    var ext = path.extname(filePath).toLowerCase()
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' })
    res.end(data)
  })
}

function handleLocalSave(req, res) {
  var chunks = []
  req.on('data', function (chunk) {
    chunks.push(chunk)
  })
  req.on('end', function () {
    var body = Buffer.concat(chunks).toString('utf8')
    var parsed
    try {
      parsed = JSON.parse(body)
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'text/plain' })
      res.end('Invalid JSON: ' + e.message)
      return
    }
    if (!Array.isArray(parsed.categories) || !Array.isArray(parsed.subcategories) || !Array.isArray(parsed.items)) {
      res.writeHead(400, { 'Content-Type': 'text/plain' })
      res.end('Expected an object with "categories"/"subcategories"/"items" arrays.')
      return
    }

    // Always keep one copy of whatever was on disk right before this write —
    // a single rolling backup, overwritten each save. The dashboard already
    // warns before a save that would shrink the catalog, but this is the
    // last line of defense if that ever gets bypassed or the draft was bad
    // in a way the size check doesn't catch.
    try {
      if (fs.existsSync(DATA_FILE)) fs.copyFileSync(DATA_FILE, BACKUP_FILE)
    } catch (e) {
      console.error('Warning: could not write data.json.bak before saving:', e.message)
    }

    fs.writeFile(DATA_FILE, JSON.stringify(parsed, null, 2), function (err) {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' })
        res.end('Could not write data.json: ' + err.message)
        return
      }
      console.log('Saved draft to data.json (' + parsed.categories.length + ' categories, ' + parsed.items.length + ' items) — previous version backed up to data.json.bak')
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true }))
    })
  })
}

var server = http.createServer(function (req, res) {
  var pathname = url.parse(req.url).pathname

  if (req.method === 'POST' && pathname === '/__local-save__') {
    handleLocalSave(req, res)
    return
  }

  serveStatic(req, res, pathname)
})

server.listen(PORT, function () {
  console.log('House of Prachar dev server running at http://127.0.0.1:' + PORT + '/')
  console.log('The dashboard\'s "Save to local data.json" button will write straight to ' + DATA_FILE)
})
