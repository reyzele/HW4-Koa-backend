const Koa = require('koa');
const app = new Koa();
const _static = require('koa-static');
const session = require('koa-session');
const Pug = require('koa-pug');
const fs = require('fs');
require('dotenv').load();
const pug = new Pug({
  viewPath: './views',
  pretty: false,
  basedir: './views',
  noCache: true,
  app: app
});
const config = require('./config');

app.use(_static('./public'));

const errorHandler = require('./libs/error');

app.use(errorHandler);

app.on('error', (err, ctx) => {
  ctx.render('error', {
    status: ctx.response.status,
    error: err
  });
});

const router = require('./routes');

app
  .use(session(config.session, app))
  .use(router.routes())
  .use(router.allowedMethods());

const port = process.env.PORT || 3000;

app.listen(port, () => {
  if (!fs.existsSync(config.upload)) {
    fs.mkdirSync(config.upload);
  }
  console.log('Server start on port: ', port);
});
