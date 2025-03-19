/**
 * ماژول تولید و بررسی کد CAPTCHA
 * 
 * از کتابخانه svg-captcha برای تولید تصاویر CAPTCHA استفاده می‌کند
 */
const svgCaptcha = require('svg-captcha');

/**
 * تنظیمات پیش‌فرض CAPTCHA
 */
const defaultOptions = {
  size: 4,           // تعداد ارقام CAPTCHA
  noise: 2,          // میزان نویز تصویر
  color: true,       // رنگی بودن تصویر
  width: 150,        // عرض تصویر
  height: 50,        // ارتفاع تصویر
  fontSize: 45,      // اندازه فونت
  charPreset: '0123456789', // فقط اعداد
  background: '#f0f0f0', // رنگ پس‌زمینه
};

/**
 * تولید کد CAPTCHA جدید
 * 
 * @param {Object} options - تنظیمات سفارشی
 * @returns {Object} - شامل متن و تصویر SVG کد CAPTCHA
 */
exports.generateCaptcha = (options = {}) => {
  // ترکیب تنظیمات پیش‌فرض با تنظیمات سفارشی
  const mergedOptions = { ...defaultOptions, ...options };
  
  // تولید CAPTCHA
  const captcha = svgCaptcha.create(mergedOptions);
  
  return {
    text: captcha.text,  // متن کد CAPTCHA
    data: captcha.data   // داده SVG تصویر CAPTCHA
  };
};

/**
 * بررسی صحت کد CAPTCHA
 * 
 * @param {string} text - متن اصلی کد CAPTCHA
 * @param {string} userInput - ورودی کاربر
 * @returns {boolean} - نتیجه بررسی
 */
exports.validateCaptcha = (text, userInput) => {
  if (!text || !userInput) {
    return false;
  }
  
  return text === userInput;
};
