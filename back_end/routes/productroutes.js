const express = require('express');
const {
  createproduct,
  getproducts,
  getproductbyid,
  updateproductbyid,
  deleteproductbyid,
  searchproductsbyname,
  searchproductsbycode,
  searchproductsbytags,
  getProductsByTag
} = require('../models/productmodel');
const { getDB } = require('../dbconfig');
const { ObjectId } = require('mongodb');
const adminMiddleware = require('../middlewares/adminMiddleware');
const router = express.Router();

/**
 * روت برای ایجاد یک محصول جدید توسط ادمین
 */
router.post('/products', adminMiddleware, async (req, res, next) => {
  try {
    const result = await createproduct(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err); // استفاده از next برای مدیریت خطا
  }
});

/**
 * روت برای به‌روزرسانی محصول بر اساس ID توسط ادمین
 */
router.put('/products/:id', adminMiddleware, async (req, res) => {
  try {
    const result = await updateproductbyid(req.params.id, req.body);
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'محصول یافت نشد' });
    }
    res.status(200).json({ message: 'محصول با موفقیت به‌روزرسانی شد' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * روت برای حذف محصول بر اساس ID توسط ادمین
 */
router.delete('/products/:id', adminMiddleware, async (req, res) => {
  try {
    const result = await deleteproductbyid(req.params.id);
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'محصول یافت نشد' });
    }
    res.status(200).json({ message: 'محصول با موفقیت حذف شد' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * روت برای دریافت همه محصولات
 */
router.get('/products', async (req, res) => {
  try {
    const results = await getproducts();
    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * روت برای دریافت محصول بر اساس ID
 */
router.get('/products/:id', async (req, res) => {
  try {
    const result = await getproductbyid(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'محصول یافت نشد' });
    }
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * روت برای جستجوی محصولات بر اساس نام با صفحه‌بندی
 */
router.get('/search/name', async (req, res) => {
  try {
    const { name, page = 1, limit = 10 } = req.query;
    if (!name) {
      return res.status(400).json({ message: 'پارامتر نام مورد نیاز است.' });
    }

    const results = await searchproductsbyname(name, page, limit);
    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * روت برای جستجوی محصولات بر اساس کد محصول
 */
router.get('/search/code', async (req, res) => {
  try {
    const { productcode, page = 1, limit = 10 } = req.query;
    if (!productcode) {
      return res.status(400).json({ message: 'پارامتر کد محصول مورد نیاز است.' });
    }

    const results = await searchproductsbycode(productcode, page, limit);
    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * روت برای جستجوی محصولات بر اساس تگ‌ها با صفحه‌بندی
 */
router.get('/search/tags', async (req, res) => {
  try {
    const { tags, page = 1, limit = 10 } = req.query;
    if (!tags) {
      return res.status(400).json({ message: 'پارامتر تگ‌ها مورد نیاز است.' });
    }
    const tagsArray = tags.split(','); // تبدیل تگ‌های جدا شده با کاما به آرایه

    const results = await searchproductsbytags(tagsArray, page, limit);
    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * روت برای دریافت محصولات بر اساس تگ
 */
router.get('/products/tags/:tag', async (req, res) => {
  try {
    const { tag } = req.params;
    const results = await getProductsByTag(tag);
    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
