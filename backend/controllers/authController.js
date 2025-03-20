const { generateCaptcha, validateCaptcha } = require('../utils/captcha');
const { generateOTP } = require('../utils/otp');

// Store users in memory (temporary solution)
const users = new Map();

// مخزن موقت برای ذخیره OTP ها (فقط برای محیط توسعه)
// در محیط تولید از Redis یا Cache مناسب دیگری استفاده کنید
const otpStore = new Map();

/**
 * Step 1: Generate and send CAPTCHA to the user
 */
exports.sendCaptcha = async (req, res) => {
  console.log('Generating new CAPTCHA...');
  
  if (!req.session) {
    console.error('Session not initialized');
    return res.status(500).json({
      success: false,
      message: 'خطا در مدیریت نشست. لطفاً صفحه را رفرش کنید.'
    });
  }

  try {
    // Generate a new CAPTCHA
    const captcha = generateCaptcha();
    console.log('CAPTCHA generated successfully');
    console.log('CAPTCHA text:', captcha.text);
    console.log('Session ID:', req.sessionID);
    
    // Store CAPTCHA text in session
    req.session.captcha = captcha.text;
    await req.session.save();
    
    // Send CAPTCHA image to client
    res.json({
      success: true,
      image: captcha.data,
      message: 'کد CAPTCHA با موفقیت ایجاد شد.'
    });
  } catch (error) {
    console.error('Error in sendCaptcha controller:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در تولید CAPTCHA. لطفاً دوباره تلاش کنید.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * For backward compatibility - Verify CAPTCHA and send OTP
 */
exports.verifyCaptcha = (req, res) => {
  const { captcha } = req.body;
  
  console.log(`Verifying CAPTCHA for session: ${req.sessionID}`);
  console.log(`Received CAPTCHA: ${captcha}`);
  console.log(`Stored CAPTCHA: ${req.session.captcha}`);
  
  if (!captcha || !req.session.captcha || req.session.captcha !== captcha) {
    return res.status(400).json({ 
      success: false, 
      message: 'کد CAPTCHA نادرست است. لطفاً دوباره تلاش کنید.' 
    });
  }

  // If CAPTCHA is correct, proceed to send OTP
  const otp = generateOTP();
  req.session.otp = otp;
  
  // Send success response with OTP
  res.json({ 
    success: true, 
    message: 'کد CAPTCHA صحیح است. لطفاً کد OTP را وارد کنید.', 
    otp 
  });
};

/**
 * Step 2: Verify CAPTCHA and login/register user
 */
exports.verifyCaptchaAndLogin = async (req, res) => {
  const { captcha, mobile } = req.body;
  
  // Validate required fields
  if (!captcha || !mobile) {
    return res.status(400).json({ 
      success: false, 
      message: 'لطفاً کد CAPTCHA و شماره موبایل را وارد کنید.' 
    });
  }
  
  // Log for debugging
  console.log(`Verifying CAPTCHA for session: ${req.sessionID}`);
  console.log(`Received CAPTCHA: ${captcha}`);
  console.log(`Stored CAPTCHA: ${req.session.captcha}`);
  
  // Verify CAPTCHA
  if (!req.session.captcha || req.session.captcha !== captcha) {
    return res.status(401).json({ 
      success: false, 
      message: 'کد CAPTCHA نادرست است. لطفاً دوباره تلاش کنید.' 
    });
  }
  
  try {
    // Check if user exists in memory
    let user = users.get(mobile);
    
    // Create user if not exists
    if (!user) {
      user = { 
        mobile, 
        createdAt: new Date() 
      };
      users.set(mobile, user);
    }
    
    // Clear CAPTCHA from session after successful verification
    req.session.captcha = null;
    
    // Send success response
    res.json({ 
      success: true, 
      message: 'ورود موفقیت‌آمیز بود.', 
      user 
    });
  } catch (error) {
    console.error('Error during login process:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطا در فرآیند ورود. لطفاً دوباره تلاش کنید.' 
    });
  }
};

/**
 * ذخیره OTP برای یک شماره موبایل مشخص
 */
exports.storeOTP = (mobile, otp) => {
  // استفاده از شماره موبایل به عنوان کلید
  otpStore.set(mobile, {
    otp,
    timestamp: Date.now(),
    attempts: 0
  });
  
  // حذف خودکار OTP پس از 10 دقیقه
  setTimeout(() => {
    if (otpStore.has(mobile)) {
      otpStore.delete(mobile);
    }
  }, 10 * 60 * 1000);
  
  return mobile;
};

/**
 * بررسی OTP ارسال شده توسط کاربر
 */
exports.verifyOTP = async (req, res) => {
  const { otp, mobile } = req.body;
  
  // بررسی داده‌های ورودی
  if (!otp) {
    return res.status(400).json({
      success: false,
      message: 'لطفاً کد OTP را وارد کنید'
    });
  }
  
  if (!mobile) {
    return res.status(400).json({
      success: false,
      message: 'شماره موبایل الزامی است'
    });
  }
  
  // بررسی وجود OTP در مخزن
  if (!otpStore.has(mobile)) {
    return res.status(400).json({
      success: false,
      message: 'کد OTP نامعتبر است یا منقضی شده است'
    });
  }
  
  // دریافت اطلاعات OTP ذخیره شده
  const storedData = otpStore.get(mobile);
  
  // بررسی منقضی نشدن OTP (10 دقیقه)
  if (Date.now() - storedData.timestamp > 10 * 60 * 1000) {
    otpStore.delete(mobile);
    return res.status(400).json({
      success: false,
      message: 'کد OTP منقضی شده است. لطفاً دوباره تلاش کنید'
    });
  }
  
  // بررسی تعداد تلاش‌های ناموفق
  storedData.attempts++;
  if (storedData.attempts > 3) {
    otpStore.delete(mobile);
    return res.status(400).json({
      success: false,
      message: 'تعداد تلاش‌های شما بیش از حد مجاز است. لطفاً دوباره تلاش کنید'
    });
  }
  
  // مقایسه OTP
  if (otp === storedData.otp) {
    // حذف OTP پس از تأیید موفق
    otpStore.delete(mobile);
    
    // اطلاعات کاربر برای ارسال به کلاینت
    const user = {
      mobile,
      loginTime: new Date().toISOString()
    };
    
    // در یک سیستم واقعی، اینجا می‌توان توکن JWT ایجاد کرد
    
    return res.json({
      success: true,
      message: 'ورود موفقیت‌آمیز بود',
      user
    });
  } else {
    // OTP نادرست
    return res.status(400).json({
      success: false,
      message: 'کد OTP نادرست است'
    });
  }
};
