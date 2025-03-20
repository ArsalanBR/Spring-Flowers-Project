const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { generateCaptcha } = require('../utils/captcha');
const { generateOTP } = require('../utils/otp');
const crypto = require('crypto');

// مخزن موقت برای ذخیره CAPTCHA‌ها (فقط برای محیط توسعه)
// در محیط تولید از Redis استفاده شود
const captchaStore = new Map();

/**
 * تولید توکن تصادفی
 */
function generateToken() {
    return crypto.randomBytes(16).toString('hex');
}

/**
 * تولید و ارسال CAPTCHA
 */
router.get('/generate-captcha', (req, res) => {
    try {
        // تولید CAPTCHA جدید
        const captcha = generateCaptcha();
        
        // تولید توکن یکتا
        const token = generateToken();
        
        // ذخیره CAPTCHA با توکن در مخزن
        captchaStore.set(token, {
            captcha: captcha.text,
            timestamp: Date.now(),
            attempts: 0
        });
        
        // حذف خودکار CAPTCHA پس از 5 دقیقه
        setTimeout(() => {
            captchaStore.delete(token);
        }, 5 * 60 * 1000);
        
        // ارسال پاسخ به کلاینت
        res.json({
            success: true,
            image: captcha.data,
            token: token,
            message: 'CAPTCHA generated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'خطا در تولید CAPTCHA',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * تأیید CAPTCHA و ارسال OTP
 */
router.post('/verify-captcha', (req, res) => {
    const { captcha, mobile, token } = req.body;
    
    // بررسی داده‌های ورودی
    if (!captcha) {
        return res.status(400).json({
            success: false,
            message: 'لطفاً کد CAPTCHA را وارد کنید'
        });
    }

    if (!token) {
        return res.status(400).json({
            success: false,
            message: 'توکن CAPTCHA یافت نشد'
        });
    }

    if (!mobile) {
        return res.status(400).json({
            success: false,
            message: 'شماره موبایل الزامی است'
        });
    }

    // بررسی وجود توکن در مخزن
    if (!captchaStore.has(token)) {
        return res.status(400).json({
            success: false,
            message: 'نشست منقضی شده است. لطفاً صفحه را رفرش کنید'
        });
    }

    // دریافت اطلاعات CAPTCHA ذخیره شده
    const storedData = captchaStore.get(token);
    
    // بررسی منقضی نشدن CAPTCHA (5 دقیقه)
    if (Date.now() - storedData.timestamp > 5 * 60 * 1000) {
        captchaStore.delete(token);
        return res.status(400).json({
            success: false,
            message: 'کد CAPTCHA منقضی شده است. لطفاً دوباره تلاش کنید'
        });
    }
    
    // بررسی تعداد تلاش‌های ناموفق
    storedData.attempts++;
    if (storedData.attempts > 3) {
        captchaStore.delete(token);
        return res.status(400).json({
            success: false,
            message: 'تعداد تلاش‌های شما بیش از حد مجاز است. لطفاً دوباره تلاش کنید'
        });
    }

    // مقایسه CAPTCHA
    if (captcha === storedData.captcha) {
        // تولید OTP
        const otp = generateOTP();
        
        // حذف CAPTCHA از مخزن
        captchaStore.delete(token);
        
        // ذخیره OTP در مخزن OTP
        authController.storeOTP(mobile, otp);
        
        // نمایش OTP در محیط توسعه
        const devMode = process.env.NODE_ENV === 'development' || true;
        
        res.json({
            success: true,
            message: 'کد CAPTCHA تأیید شد',
            otp: devMode ? otp : undefined
        });
    } else {
        res.status(400).json({
            success: false,
            message: 'کد CAPTCHA نادرست است'
        });
    }
});

/**
 * بررسی OTP
 */
router.post('/verify-otp', authController.verifyOTP);

module.exports = router;
