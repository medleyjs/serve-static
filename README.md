# @medley/serve-static

[![npm Version](https://img.shields.io/npm/v/@medley/serve-static.svg)](https://www.npmjs.com/package/@medley/serve-static)
[![Build Status](https://travis-ci.org/medleyjs/serve-static.svg?branch=master)](https://travis-ci.org/medleyjs/serve-static)
[![Coverage Status](https://coveralls.io/repos/github/medleyjs/serve-static/badge.svg?branch=master)](https://coveralls.io/github/medleyjs/serve-static?branch=master)
[![dependencies Status](https://img.shields.io/david/medleyjs/serve-static.svg)](https://david-dm.org/medleyjs/serve-static)

[Medley](https://www.npmjs.com/package/@medley/medley) plugin for serving static files.

## Installation

```sh
# npm
npm install @medley/serve-static --save

# yarn
yarn add @medley/serve-static
```

## Usage

```js
const medley = require('@medley/medley');
const path = require('path');

const app = medley();

app.registerPlugin(require('@medley/serve-static'), {
  root: path.join(__dirname, 'static')
});
// Serves files in the './static' folder from the root "/" URL
```

### Options

#### `root` (required)

The absolute path of the directory that contains the files to serve. The
file to serve will be determined by combining this value with `req.url`.

#### `prefix`

Default: `'/'`

A URL prefix that serves as a virtual mount path for the static directory.

```js
const medley = require('@medley/medley');
const path = require('path');

const app = medley();

app.registerPlugin(require('@medley/serve-static'), {
  root: path.join(__dirname, 'static'),
  prefix: '/static/'
});
// A request to "/static/styles.css" will get 'styles.css' in the './static' folder
```

#### `setHeaders`

Default: `undefined`

A function to set custom headers on the response. Setting headers must be done
synchronously. The function receives the following arguments:

+ `res` - Node's [`ServerResponse`](https://nodejs.org/api/http.html#http_class_http_serverresponse) object for the request.
+ `filePath` - The absolute path of the file that is being sent.
+ `stats` - The [fs stats](https://nodejs.org/api/fs.html#fs_class_fs_stats) object of the file that is being sent.

Example:

```js
// https://www.npmjs.com/package/content-disposition
const contentDisposition = require('content-disposition');

// Set header to force download
function setHeaders(res, filePath, stats) {
  res.setHeader('content-disposition', contentDisposition(filePath));
}

app.registerPlugin(require('@medley/serve-static'), {
  root: path.join(__dirname, 'downloads'),
  setHeaders: setHeaders
});
```

#### `send` Options

The following options are also supported and will be passed directly to the
[`send`](https://www.npmjs.com/package/send) module:

+ [`acceptRanges`](https://www.npmjs.com/package/send#acceptranges)
+ [`cacheControl`](https://www.npmjs.com/package/send#cachecontrol)
+ [`dotfiles`](https://www.npmjs.com/package/send#dotfiles)
+ [`etag`](https://www.npmjs.com/package/send#etag)
+ [`extensions`](https://www.npmjs.com/package/send#extensions)
+ [`immutable`](https://www.npmjs.com/package/send#immutable)
+ [`index`](https://www.npmjs.com/package/send#index)
+ [`lastModified`](https://www.npmjs.com/package/send#lastmodified)
+ [`maxAge`](https://www.npmjs.com/package/send#maxage)

### Handling Errors

If an error occurs while trying to send a file, the error will be passed to Medley's error handler.
This includes 404 errors for requests to paths without a matching file. A custom error handler can
be set with [`app.setErrorHandler()`](https://github.com/medleyjs/medley/blob/master/docs/App.md#set-error-handler).

To set a custom error handler that will only run for errors from `serve-static`, set the error
handler inside an [`app.use()`](https://github.com/medleyjs/medley/blob/master/docs/App.md#use)
function:

```js
app.use('/static/', (staticApp) => {
  staticApp.registerPlugin(require('@medley/serve-static'), {
    root: path.join(__dirname, 'static')
  });
  
  staticApp.setErrorHandler((err, req, res) => {
    // Send error response
  });
});
```

Note that calling `app.use()` with the `prefix` parameter is an alternative to using
the [`prefix`](#prefix) option above.
