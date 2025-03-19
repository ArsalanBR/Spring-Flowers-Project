const crypto = require('crypto');

/**
 * ماژول تولید و بررسی کدهای یکبار مصرف (OTP)
 */

/**
 * تولید کد OTP تصادفی
 * 
 * @param {number} length - طول کد OTP (پیش‌فرض: 4)
 * @returns {string} - کد OTP تولید شده
 */
exports.generateOTP = (length = 4) => {
  let otp = '';
  
  // تولید ارقام تصادفی
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  
  return otp;
};

/**
 * بررسی صحت کد OTP
 * 
 * @param {string} storedOTP - کد OTP ذخیره شده
 * @param {string} userInput - کد وارد شده توسط کاربر
 * @returns {boolean} - نتیجه بررسی
 */
exports.validateOTP = (storedOTP, userInput) => {
  if (!storedOTP || !userInput) {
    return false;
  }
  
  return storedOTP === userInput;
};
