const express = require('express');
const router = express.Router();
const { generateCaptcha, validateCaptcha } = require('../utils/captcha');
const otpController = require('../controllers/otpController');

// Generate and send a CAPTCHA image
router.get('/captcha', (req, res) => {
  console.log('CAPTCHA route called - /captcha');
  try {
    const captcha = generateCaptcha();
    req.session.captcha = captcha.text;
    console.log(`Generated CAPTCHA: ${captcha.text} for session: ${req.sessionID}`);
    
    res.json({
      success: true,
      image: captcha.data,
      message: 'CAPTCHA generated'
    });
  } catch (error) {
    console.error('Error in CAPTCHA route:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating CAPTCHA',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.post('/verify-captcha', (req, res) => {
  console.log('Received request for /verify-captcha');
  if (!req.session) {
    console.error('Session not initialized');
    return res.status(500).json({ message: 'Session not initialized' });
  }

  const { captcha } = req.body;
  const sessionId = req.sessionID;

  console.log('Verifying CAPTCHA for session:', sessionId);
  console.log('Received CAPTCHA:', captcha);
  console.log('Stored CAPTCHA:', req.session.captcha);

  if (!req.session.captcha) {
    return res.status(400).json({ message: 'You must get a CAPTCHA first' });
  }

  const now = Date.now();
  const captchaAge = now - (req.session.captchaTimestamp || 0);
  if (captchaAge > 5 * 60 * 1000) {
    delete req.session.captcha;
    delete req.session.captchaTimestamp;
    return res.status(400).json({ message: 'CAPTCHA has expired' });
  }

  if (captcha === req.session.captcha) {
    req.session.captchaVerified = true;
    delete req.session.captcha;
    delete req.session.captchaTimestamp;

    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ message: 'Error saving session' });
      }
      res.status(200).json({ message: 'CAPTCHA verified successfully' });
    });
  } else {
    res.status(400).json({ message: 'Incorrect CAPTCHA' });
  }
});

router.post('/send-otp', (req, res) => {
  console.log('Received request for /send-otp');
  const { captcha } = req.body;
  if (!req.session.captchaVerified || !validateCaptcha(req.session.captcha, captcha)) {
    return res.status(400).json({ message: 'CAPTCHA must be verified first' });
  }
  const { mobile } = req.body;
  console.log('Sending OTP to:', mobile);
  otpController.sendOtp(req, res);
});

module.exports = router;
