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

  const prefix = options.prefix || '/';
  if (typeof prefix !== 'string') {
    throw new TypeError("The 'prefix' option must be a string");
  }
  if (prefix[0] !== '/') {
    throw new TypeError("The 'prefix' option must start with a '/' character");
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

  app.get(prefix + (prefix.endsWith('/') ? '*' : '/*'), (req, res) => {
    const pathname = '/' + req.params['*'];
    const stream = send(req.stream, pathname, sendOptions);
    stream.on('directory', onDirectory);
    stream.on('headers', onHeaders);
    res.send(stream);
  });

  function onDirectory() {
    this.error(404, new Error('Not Found: ' + this.req.url));
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
