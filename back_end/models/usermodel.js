const { ObjectId } = require('mongodb');
const { getDB } = require('../dbconfig');
const bcrypt = require('bcrypt');
require('dotenv').config();

/**
 * تابع برای ایجاد کاربر جدید
 */
const createUser = async (userData) => {
  try {
    const db = getDB();
    const collection = db.collection('users');

    // هش کردن رمز عبور
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = {
      mobile: userData.mobile,
      password: hashedPassword,
      role: userData.role || 'customer', // نقش ثابت 'customer' به صورت پیش‌فرض
      favorites: [],
      orders: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(user);
    return result;
  } catch (err) {
    console.error(err.message);
    throw err;
  }
};

/**
 * تابع برای افزودن سفارش به کاربر
 */
const addOrderToUser = async (mobile, orderData) => {
  try {
    const db = getDB();
    const collection = db.collection('users');

    const orderString = JSON.stringify(orderData); // تبدیل جزئیات سفارش به رشته متنی

    const updateData = {
      $push: { orders: orderString },
      $set: { updatedAt: new Date() },
    };

    const result = await collection.updateOne({ mobile }, updateData);
    return result;
  } catch (err) {
    console.error(err.message);
    throw err;
  }
};

/**
 * تابع برای دریافت سفارشات کاربر
 */
const getUserOrders = async (mobile) => {
  try {
    const db = getDB();
    const collection = db.collection('users');

    const user = await collection.findOne({ mobile }, { projection: { orders: 1 } });
    return user ? user.orders : [];
  } catch (err) {
    console.error(err.message);
    throw err;
  }
};

/**
 * تابع برای افزودن محصول به علاقه‌مندی‌های کاربر
 */
const addUserFavorite = async (mobile, productId) => {
  try {
    const db = getDB();
    const collection = db.collection('users');

    const updateData = {
      $addToSet: { favorites: productId },
      $set: { updatedAt: new Date() },
    };

    const result = await collection.updateOne({ mobile }, updateData);
    return result;
  } catch (err) {
    console.error(err.message);
    throw err;
  }
};

/**
 * تابع برای دریافت علاقه‌مندی‌های کاربر
 */
const getUserFavorites = async (mobile) => {
  try {
    const db = getDB();
    const collection = db.collection('users');

    const user = await collection.findOne({ mobile }, { projection: { favorites: 1 } });
    return user ? user.favorites : [];
  } catch (err) {
    console.error(err.message);
    throw err;
  }
};

/**
 * تابع برای ورود کاربر (Login)
 */
const loginUser = async (mobile, password) => {
  try {
    const db = getDB();
    const collection = db.collection('users');

    const user = await collection.findOne({ mobile });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    return user;
  } catch (err) {
    console.error(err.message);
    throw err;
  }
};

/**
 * تابع برای به‌روزرسانی پروفایل کاربر (بدون به‌روزرسانی رمز عبور)
 */
const updateUserProfile = async (mobile, updateData) => {
  try {
    const db = getDB();
    const collection = db.collection('users');

    delete updateData.password; // حذف فیلد رمز عبور از داده‌های به‌روزرسانی

    updateData.updatedAt = new Date();

    const result = await collection.updateOne(
      { mobile },
      { $set: updateData }
    );
    return result;
  } catch (err) {
    console.error(err.message);
    throw err;
  }
};

/**
 * تابع برای به‌روزرسانی شماره موبایل کاربر
 */
const updateUserMobile = async (mobile, newMobile) => {
  try {
    const db = getDB();
    const collection = db.collection('users');

    const updateData = {
      mobile: newMobile,
      updatedAt: new Date(),
    };

    const result = await collection.updateOne(
      { mobile },
      { $set: updateData }
    );
    return result;
  } catch (err) {
    console.error(err.message);
    throw err;
  }
};

/**
 * تابع برای دریافت همه سفارشات بر حسب زمان
 */
const getAllOrders = async () => {
  try {
    const db = getDB();
    const collection = db.collection('orders');
    return await collection.find().sort({ createdAt: -1 }).toArray();
  } catch (err) {
    console.error(err.message);
    throw err;
  }
};

/**
 * تابع برای دریافت کاربر بر اساس شماره موبایل
 */
const getUserByMobile = async (mobile) => {
  try {
    const db = getDB();
    const collection = db.collection('users');
    return await collection.findOne({ mobile });
  } catch (err) {
    console.error(err.message);
    throw err;
  }
};

module.exports = {
  createUser,
  addOrderToUser,
  getUserOrders,
  addUserFavorite,
  getUserFavorites,
  loginUser,
  getAllOrders,
  updateUserProfile,
  updateUserMobile,
  getUserByMobile,
};
