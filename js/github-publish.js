// Publishes dashboard edits straight to the GitHub repo behind this site,
// using GitHub's Contents API from the browser (no server involved). This is
// how "Save in dashboard" is able to update houseofprachar.com for everyone:
// it commits data.json to the repo, and GitHub Pages auto-rebuilds from it.
var HopPublish = (function () {
  var OWNER = 'OjhaHardik'
  var REPO = 'houseofprachaar'
  var BRANCH = 'main'
  var FILE_PATH = 'data.json'
  var TOKEN_KEY = 'hop_github_token'

  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || ''
  }

  function setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  }

  function hasToken() {
    return Boolean(getToken())
  }

  function contentsUrl() {
    return 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents/' + FILE_PATH
  }

  function pagesUrl() {
    return 'https://houseofprachar.com/'
  }

  function repoUrl() {
    return 'https://github.com/' + OWNER + '/' + REPO
  }

  function base64EncodeUtf8(str) {
    return btoa(unescape(encodeURIComponent(str)))
  }

  function authHeaders(token) {
    return {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    }
  }

  function readErrorMessage(res) {
    return res
      .json()
      .then(function (body) {
        return body && body.message ? body.message : 'GitHub error ' + res.status
      })
      .catch(function () {
        return 'GitHub error ' + res.status
      })
  }

  // Resolves { ok: true, url } on success, or rejects with an Error whose
  // message is safe to show directly to the admin.
  function publish(jsonString, commitMessage) {
    var token = getToken()
    if (!token) return Promise.reject(new Error('No GitHub token saved yet — add one below first.'))

    return fetch(contentsUrl() + '?ref=' + BRANCH, { headers: authHeaders(token) })
      .then(function (res) {
        if (res.status === 404) return null // data.json doesn't exist in the repo yet
        if (res.status === 401) throw new Error('GitHub rejected the token (unauthorized). Generate a new one.')
        if (res.status === 403) throw new Error('Token doesn’t have write access to this repo’s contents.')
        if (!res.ok) return readErrorMessage(res).then(function (msg) { throw new Error(msg) })
        return res.json()
      })
      .then(function (existing) {
        var body = {
          message: commitMessage || 'Publish content update from dashboard',
          content: base64EncodeUtf8(jsonString),
          branch: BRANCH,
        }
        if (existing && existing.sha) body.sha = existing.sha

        return fetch(contentsUrl(), {
          method: 'PUT',
          headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders(token)),
          body: JSON.stringify(body),
        })
      })
      .then(function (res) {
        if (!res.ok) return readErrorMessage(res).then(function (msg) { throw new Error(msg) })
        return res.json()
      })
      .then(function (result) {
        return { ok: true, commitUrl: result && result.commit ? result.commit.html_url : repoUrl() }
      })
  }

  return {
    getToken: getToken,
    setToken: setToken,
    hasToken: hasToken,
    publish: publish,
    pagesUrl: pagesUrl,
    repoUrl: repoUrl,
  }
})()
