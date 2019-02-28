const Router = require('koa-router');
const router = new Router();
const koaBody = require('koa-body');
const controllers = require('../controllers');

router.get('/', controllers.index);
router.post('/', koaBody(), async ctx => {
  try {
    const result = await controllers.mail(ctx.request.body);
    ctx.body = result;
  } catch (err) {
    ctx.body = {
      msg: `При отправке письма произошла ошибка!: ${err}`,
      status: 'Error'
    };
  }
});

router.get('/login', controllers.login);
router.post('/login', koaBody(), controllers.auth);

router.get('/admin', controllers.admin);
router.post(
  '/admin/goods',
  koaBody({
    multipart: true,
    formidable: {
      uploadDir: process.cwd() + '/public/upload'
    }
  }),
  controllers.goods
);
router.post('/admin/skills', koaBody(), controllers.skills);

module.exports = router;
