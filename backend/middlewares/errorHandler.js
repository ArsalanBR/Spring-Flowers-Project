const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'مشکلی در سرور رخ داده است';
  res.status(statusCode).json({ message });
};

module.exports = errorHandler;
