module.exports = (fields, files) => {
  let response;

  if (!fields.name) {
    response = {
      mes: 'Не указано название проекта',
      status: 'Error'
    };
  }

  if (files.fileName === '' || files.size === 0) {
    response = {
      mes: 'Не загружена картинка',
      status: 'Error'
    };
  }

  return response;
};
