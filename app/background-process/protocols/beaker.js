import { protocol } from 'electron'
import path from 'path'
import url from 'url'
import once from 'once'
import fs from 'fs'
import http from 'http'
import crypto from 'crypto'
import listenRandomPort from 'listen-random-port'
import errorPage from '../../lib/error-page'
import {archivesDebugPage} from '../networks/dat/debugging'

// constants
// =

// content security policies
const BEAKER_CSP = `
  default-src 'self' beaker:;
  img-src beaker-favicon: data: dat: http: https;
  style-src 'self' 'unsafe-inline' beaker:;
`.replace(/\n/g, '')

// globals
// =

var serverPort // port assigned to us
var requestNonce // used to limit access to the server from the outside

// exported api
// =

export function setup () {
  // generate a secret nonce
  requestNonce = '' + crypto.randomBytes(4).readUInt32LE(0)

  // setup the protocol handler
  protocol.registerHttpProtocol('beaker',
    (request, cb) => {
      // send requests to the protocol server
      cb({
        method: request.method,
        url: `http://localhost:${serverPort}/?url=${encodeURIComponent(request.url)}&nonce=${requestNonce}`
      })
    }, err => {
      if (err) {
        throw new Error('Failed to create protocol: beaker. ' + err)
      }
    }
  )

  // create the internal beaker HTTP server
  var server = http.createServer(beakerServer)
  listenRandomPort(server, { host: '127.0.0.1' }, (err, port) => serverPort = port)
}

// internal methods
// =

function beakerServer (req, res) {
  var cb = once((code, status, contentType, path) => {
    res.writeHead(code, status, {
      'Content-Type': (contentType || 'text/html'),
      'Content-Security-Policy': BEAKER_CSP,
      'Access-Control-Allow-Origin': '*'
    })
    if (typeof path === 'string') {
      fs.createReadStream(path).pipe(res)
    } else if (typeof path === 'function') {
      res.end(path())
    } else {
      res.end(errorPage(code + ' ' + status))
    }
  })
  var queryParams = url.parse(req.url, true).query
  var requestUrl = queryParams.url

  // check the nonce
  // (only want this process to access the server)
  if (queryParams.nonce !== requestNonce) {
    return cb(403, 'Forbidden')
  }

  // FIXME
  // if-casing every possible asset is pretty dumb
  // generalize this
  // -prf

  // browser ui
  if (requestUrl === 'beaker:shell-window') {
    return cb(200, 'OK', 'text/html', path.join(__dirname, 'shell-window.html'))
  }
  if (requestUrl === 'beaker:shell-window.js') {
    return cb(200, 'OK', 'application/javascript', path.join(__dirname, 'shell-window.build.js'))
  }
  if (requestUrl === 'beaker:shell-window.css') {
    return cb(200, 'OK', 'text/css', path.join(__dirname, 'stylesheets/shell-window.css'))
  }
  if (requestUrl === 'beaker:icons.css') {
    return cb(200, 'OK', 'text/css', path.join(__dirname, 'stylesheets/icons.css'))
  }

  // builtin pages
  for (let slug of ['start', 'apps', 'library', 'history', 'downloads', 'settings']) {
    if (requestUrl === `beaker:${slug}` || requestUrl.startsWith(`beaker:${slug}/`)) {
      return cb(200, 'OK', 'text/html', path.join(__dirname, 'builtin-pages.html'))
    }
  }
  if (requestUrl === 'beaker:builtin-pages.js') {
    return cb(200, 'OK', 'application/javascript', path.join(__dirname, 'builtin-pages.build.js'))
  }
  if (requestUrl === 'beaker:builtin-pages.css') {
    return cb(200, 'OK', 'text/css', path.join(__dirname, 'stylesheets/builtin-pages.css'))
  }

  // common assets
  if (requestUrl === 'beaker:font-photon-entypo') {
    return cb(200, 'OK', 'application/font-woff', path.join(__dirname, 'assets/fonts/photon-entypo.woff'))
  }
  if (requestUrl === 'beaker:font-source-sans-pro') {
    return cb(200, 'OK', 'application/font-woff2', path.join(__dirname, 'assets/fonts/source-sans-pro.woff2'))
  }
  if (requestUrl === 'beaker:font-source-sans-pro-le') {
    return cb(200, 'OK', 'application/font-woff2', path.join(__dirname, 'assets/fonts/source-sans-pro-le.woff2'))
  }
  if (requestUrl.startsWith('beaker:logo')) {
    return cb(200, 'OK', 'image/png', path.join(__dirname, 'assets/img/logo.png'))
  }

  // debugging
  if (requestUrl === 'beaker:internal-archives') {
    return cb(200, 'OK', 'text/html', archivesDebugPage)
  }

  return cb(404, 'Not Found')
}
