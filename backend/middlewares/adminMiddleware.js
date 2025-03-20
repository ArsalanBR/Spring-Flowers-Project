const jwt = require('jsonwebtoken');
require('dotenv').config(); // افزودن این خط برای بارگذاری متغیرهای محیطی

const adminMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'توکن احراز هویت نیاز است' });
  }

  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'توکن معتبر نیست' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'دسترسی غیرمجاز' });
    }

    req.user = user;
    next();
  });
};

module.exports = adminMiddleware;
