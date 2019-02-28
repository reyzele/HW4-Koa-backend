module.exports = (fields, files) => {
  let response;

  if (!fields.name) {
    response = {
      mes: 'name',
      status: 'Error'
    };
  }

  if (files.fileName === '' || files.size === 0) {
    response = {
      mes: 'picture',
      status: 'Error'
    };
  }

  return response;
};
