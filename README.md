# @medley/serve-static

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
const serveStatic = require('@medley/serve-static');

const app = medley();

// Serve files in the "static" folder from the root "/" URL
app.registerPlugin(serveStatic, {
  root: path.join(__dirname, 'static')
});

// Serve files for URLs with the "/static" prefix
app.use('/static', (staticApp) => {
  staticApp.registerPlugin(serveStatic, {
    root: path.join(__dirname, 'static')
  });
});
// A request to "/static/index.html" will get "index.html" in the "static" folder
```

### Options

#### `root` (required)

The absolute path of the directory that contains the files to serve.
The file to serve will be determined by combining `req.url` with the
provided root directory.

#### `setHeaders`

Default: `undefined`

A function to set custom headers on the response. Setting headers must be done
synchronously. The function receives the following arguments:

+ `res` - Node's [`ServerResponse`](https://nodejs.org/api/http.html#http_class_http_serverresponse) object for the request.
+ `filePath` - The absolute path of the file that is being sent.
+ `stats` - The [stats](https://nodejs.org/api/fs.html#fs_class_fs_stats) object of the file that is being sent.

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
app.use('/static', (staticApp) => {
  staticApp.registerPlugin(serveStatic, {
    root: path.join(__dirname, 'static')
  });
  
  staticApp.setErrorHandler((err, req, res) => {
    if (err.status === 404) {
      res.notFound(); // Forward 404 errors to the not-found handler
    } else {
      res.send(err.status + ' Error');
    }
  });
});
```
