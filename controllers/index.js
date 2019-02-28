const db = require('../models/db');
const nodemailer = require('nodemailer');
const config = require('../config/index.json');
const psw = require('../libs/password');
const path = require('path');
const validation = require('../libs/validation');
const fs = require('fs');
const util = require('util');
const rename = util.promisify(fs.rename);
const unlink = util.promisify(fs.unlink);

module.exports.index = async ctx => {
  const sendObj = {
    title: 'Home page',
    description: '“Главное — это музыка”',
    videoLink: 'https://www.youtube.com/watch?v=nBE85Qy_SLc',
    authorized: ctx.session.isAuth
  };

  const goods = db.getState().goods || [];
  const skills = db.getState().skills || {};

  ctx.render('pages/index', Object.assign({}, sendObj, { goods }, { skills }));
};

module.exports.mail = data => {
  const { name, email, text } = data;
  if (!name || !email || !text) {
    return Promise.resolve({
      msg: 'Все поля нужно заполнить!',
      status: 'Error'
    });
  }
  const transporter = nodemailer.createTransport(config.mail.smtp);
  const mailOptions = {
    from: `"${name}" <${email}>`,
    to: config.mail.smtp.auth.user,
    subject: config.mail.subject,
    text: text.trim().slice(0, 500) + `\n Отправлено с: <${email}>`
  };
  return transporter
    .sendMail(mailOptions)
    .then(() => {
      return { msg: 'Письмо успешно отправлено!', status: 'Ok' };
    })
    .catch(error => {
      console.log('Ошибка', error.message);
      return {
        msg: `При отправке письма произошла ошибка!: ${error}`,
        status: 'Error'
      };
    });
};

module.exports.login = async (ctx, next) => {};

module.exports.auth = async (ctx, next) => {};

module.exports.admin = async (ctx, next) => {
  ctx.render('pages/admin', {
    title: 'Admin page',
    msgfile: ctx.request.querystring.msgfile,
    msgskill: ctx.request.querystring.msgskill
  });
};

module.exports.goods = async (ctx, next) => {
  const { name, price } = ctx.request.body;
  const { name: picture, size, path: filePath } = ctx.request.files.photo;

  const responseErr = validation({ name }, { picture, size });
  if (responseErr) {
    await unlink(filePath);
    ctx.body = responseErr;
  }
  let fileName = path.join(process.cwd(), 'public', 'upload', picture);
  const errUpload = await rename(filePath, fileName);
  if (errUpload) {
    return ctx.redirect(
      '/admin/?msgfile=При загрузке картинки что-то пошло не так...'
    );
  }
  db.get('goods')
    .push({
      name,
      price,
      picture: path.join('upload', picture)
    })
    .write();
  ctx.redirect(`${ctx.path}/admin/?msgfile=Картинка успешно загружена`);
};

module.exports.skills = async (ctx, next) => {};
