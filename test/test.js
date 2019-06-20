'use strict';

const assert = require('assert');
const fs = require('fs');
const medley = require('@medley/medley');
const path = require('path');
const selfRequest = require('@medley/self-request');
const serveStatic = require('..');

const testStaticRoot = path.join(__dirname, '/static');

const indexContent = fs.readFileSync(path.join(testStaticRoot, 'index.html'), 'utf8');
const stylesContent = fs.readFileSync(path.join(testStaticRoot, 'styles.css'), 'utf8');
const nestedIndexContent = fs.readFileSync(path.join(testStaticRoot, 'nested/index.html'), 'utf8');

function makeApp() {
  const app = medley();
  app.register(selfRequest);
  return app;
}

describe('serve-static', () => {

  it('should throw if the root option is undefined', () => {
    assert.throws(
      () => serveStatic(null, {}),
      /^TypeError: The 'root' option is required$/
    );
    assert.throws(
      () => serveStatic(null, {root: undefined}),
      /^TypeError: The 'root' option is required$/
    );
  });

  it('should throw if the root option is not a string', () => {
    assert.throws(
      () => serveStatic(null, {root: null}),
      /^TypeError: The 'root' option must be a string$/
    );
    assert.throws(
      () => serveStatic(null, {root: 10}),
      /^TypeError: The 'root' option must be a string$/
    );
  });

  it('should throw if the root option is not an absolute path', () => {
    assert.throws(
      () => serveStatic(null, {root: 'relative/path'}),
      /^Error: The 'root' option must be an absolute path$/
    );
    assert.throws(
      () => serveStatic(null, {root: '../path/files'}),
      /^Error: The 'root' option must be an absolute path$/
    );
  });

  it('should throw if the prefix option is not a string', () => {
    assert.throws(
      () => serveStatic(null, {root: testStaticRoot, prefix: true}),
      /^TypeError: The 'prefix' option must be a string$/
    );
    assert.throws(
      () => serveStatic(null, {root: testStaticRoot, prefix: 10}),
      /^TypeError: The 'prefix' option must be a string$/
    );
  });

  it('should throw if the prefix option does not start with a "/"', () => {
    assert.throws(
      () => serveStatic(null, {root: testStaticRoot, prefix: 'v1'}),
      /^TypeError: The 'prefix' option must start with a '\/' character$/
    );
  });

  it('should throw if the setHeaders option is not a function', () => {
    assert.throws(
      () => serveStatic(null, {root: '/', setHeaders: 10}),
      /^TypeError: The 'setHeaders' option must be a function$/
    );
    assert.throws(
      () => serveStatic(null, {root: '/', setHeaders: true}),
      /^TypeError: The 'setHeaders' option must be a function$/
    );
  });

  it('should pass send options to the send module', () => {
    const pluginOptions = {
      root: testStaticRoot,
      acceptRanges: 'acceptRanges',
      cacheControl: 'cacheControl',
      dotfiles: 'dotfiles',
      etag: 'etag',
      extensions: 'extensions',
      immutable: 'immutable',
      index: 'index',
      lastModified: 'lastModified',
      maxAge: 'maxAge',
    };

    const serveStaticMock = require('proxyquire')('..', {
      send(req, pathName, options) {
        assert.strictEqual(pathName, '/index.html');
        assert.strictEqual(options.root, path.join(__dirname, '/static'));
        assert.strictEqual(options.acceptRanges, 'acceptRanges');
        assert.strictEqual(options.cacheControl, 'cacheControl');
        assert.strictEqual(options.dotfiles, 'dotfiles');
        assert.strictEqual(options.etag, 'etag');
        assert.strictEqual(options.extensions, 'extensions');
        assert.strictEqual(options.immutable, 'immutable');
        assert.strictEqual(options.index, 'index');
        assert.strictEqual(options.lastModified, 'lastModified');
        assert.strictEqual(options.maxAge, 'maxAge');

        return fs.createReadStream(path.join(testStaticRoot, 'index.html'));
      },
    });

    const app = makeApp();
    app.register(serveStaticMock, pluginOptions);

    return app.request('/index.html', {throwHttpErrors: true});
  });

  it('should serve the correct files from the root', () => {
    const app = makeApp();
    app.register(serveStatic, {root: testStaticRoot});

    return Promise.all([
      app.request('/'),
      app.request('/index.html'),
      app.request('/styles.css'),
      app.request('/nested/'),
      app.request('/nested/index.html'),
    ]).then((results) => {
      assert.strictEqual(results[0].body, indexContent);
      assert.strictEqual(results[1].body, indexContent);
      assert.strictEqual(results[2].body, stylesContent);
      assert.strictEqual(results[3].body, nestedIndexContent);
      assert.strictEqual(results[4].body, nestedIndexContent);
    });
  });

  it('should serve the correct files with a prefix', () => {
    const app = makeApp();

    app.register(serveStatic, {
      root: testStaticRoot,
      prefix: '/prefix',
    });

    return Promise.all([
      app.request('/prefix/'),
      app.request('/prefix/index.html'),
      app.request('/prefix/styles.css'),
      app.request('/prefix/nested/'),
      app.request('/prefix/nested/index.html'),
    ]).then((results) => {
      assert.strictEqual(results[0].body, indexContent);
      assert.strictEqual(results[1].body, indexContent);
      assert.strictEqual(results[2].body, stylesContent);
      assert.strictEqual(results[3].body, nestedIndexContent);
      assert.strictEqual(results[4].body, nestedIndexContent);
    });
  });

  it('should serve the correct files with a prefix with a trailing slash', () => {
    const app = makeApp();

    app.register(serveStatic, {
      root: testStaticRoot,
      prefix: '/prefix/',
    });

    return Promise.all([
      app.request('/prefix/'),
      app.request('/prefix/index.html'),
      app.request('/prefix/styles.css'),
      app.request('/prefix/nested/'),
      app.request('/prefix/nested/index.html'),
    ]).then((results) => {
      assert.strictEqual(results[0].body, indexContent);
      assert.strictEqual(results[1].body, indexContent);
      assert.strictEqual(results[2].body, stylesContent);
      assert.strictEqual(results[3].body, nestedIndexContent);
      assert.strictEqual(results[4].body, nestedIndexContent);
    });
  });

  it('should serve the correct files with a prefix created by a sub-app', () => {
    const app = makeApp();

    app.createSubApp('/prefix')
      .register(serveStatic, {root: testStaticRoot});

    return Promise.all([
      app.request('/prefix/'),
      app.request('/prefix/index.html'),
      app.request('/prefix/styles.css'),
      app.request('/prefix/nested/'),
      app.request('/prefix/nested/index.html'),
    ]).then((results) => {
      assert.strictEqual(results[0].body, indexContent);
      assert.strictEqual(results[1].body, indexContent);
      assert.strictEqual(results[2].body, stylesContent);
      assert.strictEqual(results[3].body, nestedIndexContent);
      assert.strictEqual(results[4].body, nestedIndexContent);
    });
  });

  it('should respond with a 404 to URLs without a trailing "/" if they do not point to a file', () => {
    const app = makeApp();

    app.register(serveStatic, {
      root: testStaticRoot,
      prefix: '/prefix',
    });

    return Promise.all([
      app.request('/prefix'),
      app.request('/prefix/nested'),
    ]).then((results) => {
      assert.strictEqual(results[0].statusCode, 404);
      assert.strictEqual(results[1].statusCode, 404);
    });
  });

  it('should serve files with the correct Content-Type', () => {
    const app = makeApp();
    app.register(serveStatic, {root: testStaticRoot});

    return Promise.all([
      app.request('/index.html'),
      app.request('/styles.css'),
    ]).then((results) => {
      assert.strictEqual(results[0].headers['content-type'], 'text/html; charset=UTF-8');
      assert.strictEqual(results[1].headers['content-type'], 'text/css; charset=UTF-8');
    });
  });

  it('should call the setHeaders function with the correct arguments', async () => {
    const app = makeApp();

    function setHeaders(res, filePath, stat) {
      assert.strictEqual(typeof res.end, 'function');
      assert.strictEqual(filePath, path.join(testStaticRoot, 'index.html'));
      assert.strictEqual(typeof stat.isDirectory, 'function');
    }

    app.register(serveStatic, {root: testStaticRoot, setHeaders});

    const res = await app.request('/index.html');

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body, indexContent);
    assert.strictEqual(res.headers['content-type'], 'text/html; charset=UTF-8');
  });

  it('should allow the setHeaders function to set and change headers', async () => {
    const app = makeApp();

    function setHeaders(res) {
      res.setHeader('x-custom-header', 'custom-value');
      res.setHeader('content-type', 'custom/type');
    }

    app.register(serveStatic, {root: testStaticRoot, setHeaders});

    const res = await app.request('/index.html');

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body, indexContent);
    assert.strictEqual(res.headers['x-custom-header'], 'custom-value');
    assert.strictEqual(res.headers['content-type'], 'custom/type');
  });

  it('should forward 403 errors to the default error handler', async () => {
    const app = makeApp();
    app.register(serveStatic, {root: testStaticRoot});

    const res = await app.request('/', {path: '/../index.html'});

    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.headers['content-type'], 'application/json');
    assert.deepStrictEqual(JSON.parse(res.body), {
      statusCode: 403,
      error: 'Forbidden',
      message: 'Forbidden',
    });
  });

  it('should forward 403 errors to the custom error handler', async () => {
    const app = makeApp();
    app.register(serveStatic, {root: testStaticRoot});

    app.setErrorHandler((err, req, res) => {
      assert.strictEqual(err.status, 403);
      assert.strictEqual(err.message, 'Forbidden');

      res.send('Custom error response');
    });

    const res = await app.request('/', {path: '/../index.html'});

    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.headers['content-type'], 'text/plain; charset=utf-8');
    assert.strictEqual(res.body, 'Custom error response');
  });

  it('should forward 404 errors to the default error handler', async () => {
    const app = makeApp();
    app.register(serveStatic, {root: testStaticRoot});

    const res = await app.request('/no-file.html');

    assert.strictEqual(res.statusCode, 404);
    assert.strictEqual(res.headers['content-type'], 'application/json');
    assert.strictEqual(JSON.parse(res.body).error, 'Not Found');
  });

  it('should forward 404 errors to the custom error handler', async () => {
    const app = makeApp();
    app.register(serveStatic, {root: testStaticRoot});

    app.setErrorHandler((err, req, res) => {
      assert.strictEqual(err.status, 404);
      assert(err.message.startsWith('ENOENT'));

      res.send('Not Found: ' + req.url);
    });

    const res = await app.request('/no-file.html');

    assert.strictEqual(res.statusCode, 404);
    assert.strictEqual(res.headers['content-type'], 'text/plain; charset=utf-8');
    assert.strictEqual(res.body, 'Not Found: /no-file.html');
  });

});
