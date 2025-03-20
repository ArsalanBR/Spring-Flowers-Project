const express = require('express');
const {
  createUser,
  addOrderToUser,
  getUserOrders,
  addUserFavorite,
  getUserFavorites,
  loginUser,
  getAllOrders,
  updateUserMobile, // اضافه کردن تابع به‌روزرسانی شماره موبایل
  getUserByMobile // اضافه کردن تابع جدید
} = require('../models/usermodel');
const { getDB } = require('../dbconfig');
const bcrypt = require('bcrypt');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const adminMiddleware = require('../middlewares/adminMiddleware');
const router = express.Router();

/**
 * روت برای ایجاد کاربر جدید
 */
router.post('/users', async (req, res) => {
  try {
    const result = await createUser(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * روت برای ورود کاربر (Login)
 */
router.post('/login', async (req, res) => {
  try {
    const { mobile, password } = req.body;
    const user = await loginUser(mobile, password);

    // ایجاد JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * روت برای افزودن سفارش به کاربر
 */
router.post('/users/orders', async (req, res) => {
  try {
    const { mobile, orderData } = req.body;
    const result = await addOrderToUser(mobile, orderData);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * روت برای دریافت سفارشات کاربر
 */
router.get('/users/:mobile/orders', async (req, res) => {
  try {
    const { mobile } = req.params;
    const results = await getUserOrders(mobile);
    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * روت برای افزودن محصول به علاقه‌مندی‌های کاربر
 */
router.post('/users/favorites', async (req, res) => {
  try {
    const { mobile, productId } = req.body;
    const result = await addUserFavorite(mobile, productId);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * روت برای دریافت علاقه‌مندی‌های کاربر
 */
router.get('/users/:mobile/favorites', async (req, res) => {
  try {
    const { mobile } = req.params;
    const results = await getUserFavorites(mobile);
    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * روت برای دریافت همه کاربران همراه با نقش‌هایشان
 */
router.get('/users', async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection('users');
    const users = await collection.find({}, { projection: { password: 0 } }).toArray();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * روت موقت برای ایجاد کاربر ادمین
 * توجه: بعد از استفاده، این مسیر باید حذف شود.
 */
router.post('/admin/create', async (req, res) => {
  try {
    const { mobile, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      mobile,
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const db = getDB();
    const collection = db.collection('users');
    const result = await collection.insertOne(user);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * روت برای دریافت اطلاعات کاربر جاری
 */
router.get('/user/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'توکن احراز هویت نیاز است' });
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'توکن معتبر نیست' });
      }

      res.status(200).json(user);
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * روت برای دریافت لیست تمام سفارشات بر حسب زمان
 */
router.get('/orders', async (req, res) => {
  try {
    const orders = await getAllOrders();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * روت برای به‌روزرسانی شماره موبایل کاربر
 */
router.put('/users/:mobile', async (req, res) => {
  try {
    const { mobile } = req.params;
    const { newMobile } = req.body;
    const result = await updateUserMobile(mobile, newMobile);
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }
    res.status(200).json({ message: 'شماره موبایل با موفقیت به‌روزرسانی شد' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * روت برای دریافت اطلاعات کاربر بر اساس شماره موبایل
 */
router.get('/users/:mobile', async (req, res) => {
  try {
    const { mobile } = req.params;
    const user = await getUserByMobile(mobile);
    if (!user) {
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * روت برای ارسال OTP
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { mobile } = req.body;
    // شبیه‌سازی ارسال OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    console.log(`OTP generated for ${mobile}: ${otp}`);
    res.status(200).json({ message: 'OTP ارسال شد' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
