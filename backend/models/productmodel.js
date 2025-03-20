// مسیر: models/productmodel.js

const { ObjectId } = require('mongodb');
const { getDB } = require('../dbconfig');
const bcrypt = require('bcrypt'); // بارگذاری bcrypt
require('dotenv').config(); // بارگذاری متغیرهای محیطی

const prices = {
  a3: parseFloat(process.env.PRICE_A3),
  a4: parseFloat(process.env.PRICE_A4),
  a5: parseFloat(process.env.PRICE_A5),
};

/**
 * تابع برای ایجاد یک محصول جدید
 */
const createproduct = async (productData) => {
  try {
    const db = getDB();
    const collection = db.collection('products');

    const product = {
      name: productData.name,
      image1: productData.image1,
      image2: productData.image2,
      productcode: productData.productcode,
      tags: productData.tags,
      prices: {
        a3: prices.a3,
        a4: prices.a4,
        a5: prices.a5,
      },
      createdat: new Date(),
      updatedat: new Date(),
    };

    const result = await collection.insertOne(product);
    return {
      acknowledged: result.acknowledged,
      insertedid: result.insertedId,
    };
  } catch (err) {
    console.error(err.message);
    throw err;
  }
};

/**
 * تابع برای دریافت همه محصولات
 */
const getproducts = async () => {
  try {
    const db = getDB();
    const collection = db.collection('products');
    return await collection.find({}).toArray();
  } catch (err) {
    console.error(err.message);
    throw err;
  }
};

/**
 * تابع برای دریافت محصول بر اساس ID
 */
const getproductbyid = async (id) => {
  try {
    const db = getDB();
    const collection = db.collection('products');
    return await collection.findOne({ _id: new ObjectId(id) });  // استفاده از new ObjectId(id)
  } catch (err) {
    console.error(err.message);
    throw err;
  }
};

/**
 * تابع برای به‌روزرسانی محصول بر اساس ID
 */
const updateproductbyid = async (id, updateData) => {
  try {
    const db = getDB();
    const collection = db.collection('products');

    delete updateData.prices;

    updateData.updatedat = new Date();

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },  // استفاده از new ObjectId(id)
      { $set: updateData }
    );
    return result;
  } catch (err) {
    console.error(err.message);
    throw err;
  }
};

/**
 * تابع برای حذف محصول بر اساس ID
 */
const deleteproductbyid = async (id) => {
  try {
    const db = getDB();
    const collection = db.collection('products');
    const result = await collection.deleteOne({ _id: new ObjectId(id) });  // استفاده از new ObjectId(id)
    return result;
  } catch (err) {
    console.error(err.message);
    throw err;
  }
};

/**
 * تابع برای جستجوی محصولات بر اساس نام با صفحه‌بندی
 */
const searchproductsbyname = async (name, page = 1, limit = 10) => {
  try {
    const db = getDB();
    const collection = db.collection('products');
    const query = {
      name: { $regex: name, $options: 'i' },
    };
    const total = await collection.countDocuments(query);
    const results = await collection
      .find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .toArray();

    return {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalpages: Math.ceil(total / limit),
      results,
    };
  } catch (err) {
    console.error(err.message);
    throw err;
  }
};

/**
 * تابع برای جستجوی محصولات بر اساس کد محصول با صفحه‌بندی
 */
const searchproductsbycode = async (productcode, page = 1, limit = 10) => {
  try {
    const db = getDB();
    const collection = db.collection('products');
    const query = { productcode };
    const total = await collection.countDocuments(query);
    const results = await collection
      .find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .toArray();

    return {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalpages: Math.ceil(total / limit),
      results,
    };
  } catch (err) {
    console.error(err.message);
    throw err;
  }
};

/**
 * تابع برای جستجوی محصولات بر اساس تگ‌ها با صفحه‌بندی
 */
const searchproductsbytags = async (tags, page = 1, limit = 10) => {
  try {
    const db = getDB();
    const collection = db.collection('products');
    const query = { tags: { $in: tags } };
    const total = await collection.countDocuments(query);
    const results = await collection
      .find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .toArray();

    return {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalpages: Math.ceil(total / limit),
      results,
    };
  } catch (err) {
    console.error(err.message);
    throw err;
  }
};

/**
 * تابع برای دریافت محصولات بر اساس تگ
 */
const getProductsByTag = async (tag) => {
  try {
    const db = getDB();
    const collection = db.collection('products');
    return await collection.find({ tags: tag }).toArray();
  } catch (err) {
    console.error(err.message);
    throw err;
  }
};

const createIndexes = async () => {
  try {
    const db = getDB();
    const collection = db.collection('products');
    await collection.createIndex({ name: 'text', productcode: 1, tags: 1 });
    console.log('Indexes created successfully');
  } catch (err) {
    console.error('Error creating indexes:', err.message);
  }
};

module.exports = {
  createproduct,
  getproducts,
  getproductbyid,
  updateproductbyid,
  deleteproductbyid,
  searchproductsbyname,
  searchproductsbycode,
  searchproductsbytags,
  getProductsByTag,
  createIndexes, // اضافه کردن تابع ایجاد ایندکس
};
