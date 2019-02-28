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

module.exports.login = async ctx => {
  if (ctx.session.isAuth) {
    return ctx.render('pages/admin');
  }
  ctx.render('pages/login', {
    title: 'Login page',
    msglogin: ctx.request.query.msglogin
  });
};

module.exports.auth = async ctx => {
  const { email, password } = ctx.request.body;
  let status = '';
  const user = db.getState().user;

  if (user.email === email && psw.validPassword(password)) {
    ctx.session.isAuth = true;
    ctx.redirect('/admin');
  } else {
    status = encodeURIComponent('Введен неверный логин или пароль');
    ctx.redirect(`/login/?msglogin=${status}`);
  }
};

module.exports.admin = async ctx => {
  if (!ctx.session.isAuth) {
    return ctx.redirect('/');
  }
  ctx.render('pages/admin', {
    title: 'Admin page',
    msgfile: ctx.request.query.msgfile,
    msgskill: ctx.request.query.msgskill
  });
};

module.exports.goods = async ctx => {
  const { name, price } = ctx.request.body;
  const { name: picture, size, path: filePath } = ctx.request.files.photo;
  let status = '';

  const responseErr = validation({ name }, { picture, size });
  if (responseErr) {
    await unlink(filePath);
    return ctx.redirect(`/admin/?msgfile=${responseErr.mes}`);
  }
  let fileName = path.join(process.cwd(), 'public', 'upload', picture);
  const errUpload = await rename(filePath, fileName);
  if (errUpload) {
    status = encodeURIComponent('При загрузке картинки что-то пошло не так...');
    return ctx.redirect(`/admin/?msgfile=${status}`);
  }
  db.get('goods')
    .push({
      name,
      price,
      picture: path.join('upload', picture)
    })
    .write();
  status = encodeURIComponent('Картинка успешно загружена');
  ctx.redirect(`/admin/?msgfile=${status}`);
};

module.exports.skills = async ctx => {
  const { age, concerts, cities, years } = ctx.request.body;
  let status = '';

  if (!age || !concerts || !cities || !years) {
    status = encodeURIComponent('Все поля обязательны к заполнению');
    return ctx.redirect(`/admin/?msgskill=${status}`);
  }

  db.get('skills')
    .set('age', age)
    .set('concerts', concerts)
    .set('cities', cities)
    .set('years', years)
    .write();
  status = encodeURIComponent('Данные успешно загружены!');
  ctx.redirect(`/admin/?msgskill=${status}`);
};
