const { validateCaptcha } = require('../utils/captcha');

const sendOtp = (req, res) => {
  const { mobile, captcha } = req.body;
  if (!validateCaptcha(req.session.captcha, captcha)) {
    return res.status(400).json({ message: 'Invalid captcha' });
  }
  // شبیه‌سازی ارسال OTP
  console.log(`OTP successfully sent to: ${mobile}`);
  res.status(200).json({ message: 'OTP ارسال شد', otp: req.session.otp });
};

module.exports = { sendOtp };
