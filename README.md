# @medley/serve-static

[![npm Version](https://img.shields.io/npm/v/@medley/serve-static.svg)](https://www.npmjs.com/package/@medley/serve-static)
[![Build Status](https://travis-ci.org/medleyjs/serve-static.svg?branch=master)](https://travis-ci.org/medleyjs/serve-static)
[![Coverage Status](https://coveralls.io/repos/github/medleyjs/serve-static/badge.svg?branch=master)](https://coveralls.io/github/medleyjs/serve-static?branch=master)
[![dependencies Status](https://img.shields.io/david/medleyjs/serve-static.svg)](https://david-dm.org/medleyjs/serve-static)

[Medley](https://www.npmjs.com/package/@medley/medley) plugin for serving static files.

## Installation

```sh
npm install @medley/serve-static --save
# or
yarn add @medley/serve-static
```

## Usage

```js
const medley = require('@medley/medley');
const path = require('path');

const app = medley();

app.register(require('@medley/serve-static'), {
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

app.register(require('@medley/serve-static'), {
  root: path.join(__dirname, 'static'),
  prefix: '/static/'
});
// A request to "/static/styles.css" will get 'styles.css' in the './static' folder
```

Tip: Registering the plugin on a prefixed sub-app is an alternative to
using this option.

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

app.register(require('@medley/serve-static'), {
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

### About Errors

The `send` module is only designed to work with the native Node `http` module,
so handling errors when using this module with Medley doesn’t work very well
(without writing major workarounds that could end up hurting performance).

For this reason, if an error occurs while trying to send a file (including 404
errors when a file isn’t found), the error will be sent to Medley's
[`onErrorSending`](https://github.com/medleyjs/medley/blob/master/docs/Medley.md#onerrorsending)
function and a response will be sent automatically.
