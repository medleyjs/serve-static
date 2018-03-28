'use strict';

const path = require('path');
const send = require('send');

function serveStatic(app, options) {
  if (options.root === undefined) {
    throw new TypeError("The 'root' option is required");
  }
  if (typeof options.root !== 'string') {
    throw new TypeError("The 'root' option must be a string");
  }
  if (!path.isAbsolute(options.root)) {
    throw new Error("The 'root' option must be an absolute path");
  }

  const setHeaders = options.setHeaders || null;
  if (setHeaders !== null && typeof setHeaders !== 'function') {
    throw new TypeError("The 'setHeaders' option must be a function");
  }

  const sendOptions = {
    root: options.root,
    acceptRanges: options.acceptRanges,
    cacheControl: options.cacheControl,
    dotfiles: options.dotfiles,
    etag: options.etag,
    extensions: options.extensions,
    immutable: options.immutable,
    index: options.index,
    lastModified: options.lastModified,
    maxAge: options.maxAge,
  };

  if (!app.basePath.endsWith('/')) {
    app.get('', (req, res) => {
      sendFile(req, res, '/');
    });
  }

  app.get('/*', (req, res) => {
    sendFile(req, res, '/' + req.params['*']);
  });

  function sendFile(req, res, pathname) {
    const stream = send(req.stream, pathname, sendOptions);
    stream.on('headers', onHeaders);
    res.send(stream);
  }

  function onHeaders(nodeRes, filePath, stat) {
    // Since Medley automatically sets this to 'application/octet-stream'
    nodeRes.setHeader('content-type', '');

    if (setHeaders !== null) {
      setHeaders(nodeRes, filePath, stat);
    }
  }
}

serveStatic.meta = {
  name: '@medley/serve-static',
};

module.exports = serveStatic;
