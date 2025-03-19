/**
 * سرور اصلی وب سایت Spring Flowers Gallery
 */

// وارد کردن ماژول‌های مورد نیاز
const express = require('express');
const { connectDB } = require('./dbconfig');
require('dotenv').config();
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');

// روت‌های برنامه
const productRoutes = require('./routes/productroutes');
const userRoutes = require('./routes/userroutes');
const captchaRoutes = require('./routes/captcharoutes');
const authRoutes = require('./routes/authroutes');

// ایجاد نمونه اکسپرس
const app = express();

// اتصال به دیتابیس اگر نیاز باشد
if (process.env.USE_MONGO_STORE === 'true') {
  connectDB()
    .then(() => console.log('MongoDB connection established'))
    .catch(error => {
      console.error('Error connecting to MongoDB:', error.message);
      console.log('Continuing without database connection...');
    });
}

// تنظیم CORS
app.use(cors({
  origin: 'http://127.0.0.1:5500',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cache-Control']
}));

// میدلویرهای عمومی
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// تعریف روت‌ها
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes); 
app.use('/api/auth', authRoutes);
app.use('/api/captcha', captchaRoutes);

// روت اصلی برای تست
app.get('/', (req, res) => {
  res.json({ message: 'به API فروشگاه Spring Flowers خوش آمدید' });
});

// میدلویر مدیریت خطا
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'خطای سرور',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// مدیریت روت‌های نامعتبر
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'مسیر مورد نظر یافت نشد'
  });
});

// راه‌اندازی سرور
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  if (process.env.USE_MONGO_STORE === 'true') {
    console.log('MongoDB storage is enabled');
  } else {
    console.log('In-memory storage is enabled');
  }
});
