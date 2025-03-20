/**
 * ماژول احراز هویت کاربر
 * مدیریت ورود کاربر با شماره موبایل، کپچا و کد تایید
 */
const auth = {
    backendUrl: 'http://localhost:3000',
    captchaToken: '',
    captchaFetchInProgress: false,
    isLoggedIn: false,
    isCaptchaVerified: false,

    /**
     * راه‌اندازی اولیه ماژول احراز هویت
     */
    init() {
        // پیدا کردن عناصر فرم
        const sendOtpButton = document.getElementById("send-otp-button");
        const verifyCaptchaButton = document.getElementById("verify-captcha-button");
        const verifyOtpButton = document.getElementById("verify-otp-button");
        const changeCaptchaButton = document.getElementById("change-captcha-button");
        
        // بررسی موجود بودن عناصر قبل از اضافه کردن رویدادها
        if (sendOtpButton) sendOtpButton.addEventListener("click", this.handleSendOtp.bind(this));
        if (verifyCaptchaButton) verifyCaptchaButton.addEventListener("click", this.handleVerifyCaptcha.bind(this));
        if (verifyOtpButton) verifyOtpButton.addEventListener("click", this.handleVerifyOtp.bind(this));
        if (changeCaptchaButton) changeCaptchaButton.addEventListener("click", this.handleChangeCaptcha.bind(this));
        
        // تنظیم فیلدهای ورودی
        this.setupInputFields();
        
        // تنظیم عنصر تصویر کپچا
        this.setupCaptchaImage();
        
        console.log('Auth module initialized');
    },
    
    /**
     * تنظیم ویژگی‌های فیلدهای ورودی
     */
    setupInputFields() {
        const captchaInput = document.getElementById("captcha-input");
        const otpInput = document.getElementById("otp-input");
        
        if (captchaInput) {
            captchaInput.setAttribute('maxlength', '4');
            captchaInput.setAttribute('pattern', '[0-9]{4}');
            captchaInput.setAttribute('inputmode', 'numeric');
            captchaInput.setAttribute('placeholder', 'کد 4 رقمی را وارد کنید');
        }
        
        if (otpInput) {
            otpInput.setAttribute('maxlength', '4');
            otpInput.setAttribute('pattern', '[0-9]{4}');
            otpInput.setAttribute('inputmode', 'numeric');
            otpInput.setAttribute('placeholder', 'کد 4 رقمی را وارد کنید');
        }
    },
    
    /**
     * تنظیم عنصر تصویر کپچا
     */
    setupCaptchaImage() {
        const captchaContainer = document.getElementById("captcha-container");
        if (!captchaContainer) return;
        
        // بررسی وجود تصویر کپچا
        let captchaImage = document.getElementById("captcha-image");
        if (!captchaImage) {
            captchaImage = document.createElement('img');
            captchaImage.id = "captcha-image";
            captchaImage.alt = "تصویر کپچای امنیتی";
            captchaContainer.insertBefore(captchaImage, document.getElementById("captcha-input"));
            
            // تنظیم استایل‌های پایه
            captchaImage.style.display = 'block';
            captchaImage.style.margin = '10px auto';
            captchaImage.style.maxWidth = '85%';
            captchaImage.style.borderRadius = '8px';
        }
    },
    
    /**
     * مدیریت درخواست ارسال کد تایید
     * @param {Event} event 
     */
    async handleSendOtp(event) {
        event.preventDefault();
        const phoneNumberInput = document.getElementById("phone-number");
        const phoneNumberContainer = document.getElementById("phone-number-container");
        const captchaContainer = document.getElementById("captcha-container");
        
        if (!phoneNumberInput || !captchaContainer || !phoneNumberContainer) {
            console.error('Auth form elements not found');
            return;
        }
        
        const phoneNumber = phoneNumberInput.value.trim();
        if (phoneNumber === "") {
            alert("لطفاً شماره موبایل خود را وارد کنید.");
            return;
        }
        
        // بررسی فرمت شماره موبایل
        if (!/^09\d{9}$/.test(phoneNumber)) {
            alert("شماره موبایل باید با ۰۹ شروع شده و ۱۱ رقم باشد.");
            return;
        }
        
        // مخفی کردن باکس شماره موبایل
        phoneNumberContainer.style.display = "none";
        
        // نمایش باکس کپچا
        captchaContainer.style.display = "block";
        
        console.log('Phone number submitted:', phoneNumber);
        await this.fetchCaptcha();
    },
    
    /**
     * مدیریت تأیید کپچا
     * @param {Event} event 
     */
    async handleVerifyCaptcha(event) {
        event.preventDefault();
        const captchaInput = document.getElementById("captcha-input");
        const phoneNumberInput = document.getElementById("phone-number");
        const captchaContainer = document.getElementById("captcha-container");
        const otpContainer = document.getElementById("otp-container");
        
        if (!captchaInput || !phoneNumberInput || !captchaContainer || !otpContainer) {
            console.error('Captcha verification elements not found');
            return;
        }
        
        const captchaValue = captchaInput.value.trim();
        const phoneNumber = phoneNumberInput.value.trim();
        
        if (captchaValue === "") {
            alert("لطفاً کد کپچا را وارد کنید.");
            return;
        }
        
        if (!this.captchaToken) {
            alert("توکن کپچا نامعتبر است. لطفاً صفحه را رفرش کنید.");
            await this.fetchCaptcha();
            return;
        }
        
        try {
            console.log('Verifying CAPTCHA');
            
            const response = await fetch(`${this.backendUrl}/api/auth/verify-captcha`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ 
                    captcha: captchaValue,
                    mobile: phoneNumber,
                    token: this.captchaToken
                })
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                this.isCaptchaVerified = true;
                
                // مخفی کردن باکس کپچا
                captchaContainer.style.display = "none";
                
                // نمایش باکس کد تایید
                otpContainer.style.display = "block";
                
                console.log('CAPTCHA verified successfully');
                
                // نمایش کد تایید در محیط توسعه
                if (result.otp) {
                    console.log('Development OTP:', result.otp);
                    alert(`کد کپچا تأیید شد. رمز یک بار مصرف را وارد کنید (${result.otp})`);
                } else {
                    alert("کد کپچا تأیید شد. لطفاً رمز یک بار مصرف را وارد کنید.");
                }
                
                // تمرکز روی فیلد کد تایید
                document.getElementById("otp-input").focus();
                
                // پاک کردن توکن بعد از استفاده موفق
                this.captchaToken = '';
            } else {
                console.error('CAPTCHA verification failed:', result.message);
                alert(result.message || "خطا در تأیید کپچا");
                
                if (result.message && (
                    result.message.includes('منقضی شده') || 
                    result.message.includes('نشست') || 
                    result.message.includes('توکن')
                )) {
                    // دریافت کپچای جدید در صورت منقضی شدن توکن
                    await this.fetchCaptcha();
                }
            }
        } catch (error) {
            console.error('CAPTCHA verification error:', error);
            alert("خطا در ارتباط با سرور. لطفاً مجدداً تلاش کنید.");
            await this.fetchCaptcha();
        }
    },
    
    /**
     * مدیریت تأیید کد یکبار مصرف
     * @param {Event} event 
     */
    async handleVerifyOtp(event) {
        event.preventDefault();
        const otpInput = document.getElementById("otp-input");
        const phoneNumberInput = document.getElementById("phone-number");
        
        if (!otpInput || !phoneNumberInput) {
            console.error('OTP verification elements not found');
            return;
        }
        
        const otpValue = otpInput.value.trim();
        const phoneNumber = phoneNumberInput.value.trim();
        
        if (otpValue === "") {
            alert("لطفاً کد تایید را وارد کنید.");
            return;
        }
        
        try {
            console.log('Verifying OTP');
            
            const response = await fetch(`${this.backendUrl}/api/auth/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ 
                    otp: otpValue,
                    mobile: phoneNumber
                })
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                console.log('OTP verified successfully');
                this.isLoggedIn = true;
                
                // ذخیره اطلاعات کاربر
                localStorage.setItem('userToken', result.token);
                localStorage.setItem('userMobile', phoneNumber);
                
                // بروزرسانی رابط کاربری
                this.updateUIAfterLogin(phoneNumber);
                
                // بستن منوی کشویی بعد از مدت کوتاهی
                setTimeout(() => {
                    document.querySelector('.dropdown-menu').style.display = 'none';
                }, 1500);
            } else {
                console.error('OTP verification failed:', result.message);
                alert(result.message || "کد تایید نامعتبر است.");
            }
        } catch (error) {
            console.error('OTP verification error:', error);
            alert("خطا در ارتباط با سرور. لطفاً مجدداً تلاش کنید.");
        }
    },
    
    /**
     * مدیریت تغییر تصویر کپچا
     * @param {Event} event 
     */
    async handleChangeCaptcha(event) {
        event.preventDefault();
        await this.fetchCaptcha();
    },
    
    /**
     * دریافت تصویر کپچا از سرور
     */
    async fetchCaptcha() {
        // جلوگیری از درخواست‌های همزمان
        if (this.captchaFetchInProgress) return;
        this.captchaFetchInProgress = true;
        
        const captchaImage = document.getElementById('captcha-image');
        if (!captchaImage) {
            console.error('Captcha image element not found');
            this.captchaFetchInProgress = false;
            return;
        }
        
        try {
            console.log('Fetching new CAPTCHA');
            
            // نمایش حالت بارگذاری
            captchaImage.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0Ij48cGF0aCBmaWxsPSJub25lIiBkPSJNMCAwaDI0djI0SDB6Ii8+PHBhdGggZD0iTTEyIDJhMSAxIDAgMCAxIDEgMXYzYTEgMSAwIDAgMS0yIDBWM2ExIDEgMCAwIDEgMS0xem0wIDE1YTEgMSAwIDAgMSAxIDF2M2ExIDEgMCAwIDEtMiAwdi0zYTEgMSAwIDAgMSAxLTF6bTEwLTVhMSAxIDAgMCAxLTEgMWgtM2ExIDEgMCAwIDEgMC0yaDNhMSAxIDAgMCAxIDEgMXpNNyAxMmExIDEgMCAwIDEtMSAxSDNhMSAxIDAgMCAxIDAtMmgzYTEgMSAwIDAgMSAxIDF6bTEyLjcxIDcuMjlhMSAxIDAgMCAxLTEuNDIgMGwtMi0yYTEgMSAwIDAgMSAxLjQyLTEuNDJsMiAyYTEgMSAwIDAgMSAwIDEuNDJ6TTcuMjkgNy4yOWExIDEgMCAwIDEtMS40MiAwbC0yLTJhMSAxIDAgMCAxIDEuNDItMS40MmwyIDJhMSAxIDAgMCAxIDAgMS40MnptMTIgLjEyYTEgMSAwIDAgMS0xLjQyIDEuNDJsLTItMmExIDEgMCAwIDEgMS40Mi0xLjQybDIgMmExIDEgMCAwIDEgMCAxLjQyek03LjI5IDE2LjcxYTEgMSAwIDAgMSAxLjQyIDEuNDJsLTIgMmExIDEgMCAwIDEtMS40Mi0xLjQybDItMnoiIGZpbGw9InJnYmEoMTgzLDE4MywxODMsMSkiLz48L3N2Zz4=';
            captchaImage.style.opacity = '0.5';
            
            const response = await fetch(`${this.backendUrl}/api/auth/captcha`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                // ذخیره توکن کپچا
                this.captchaToken = result.token;
                
                // نمایش تصویر کپچا
                captchaImage.src = result.captchaImage;
                captchaImage.style.opacity = '1';
                
                console.log('CAPTCHA fetched successfully');
            } else {
                console.error('CAPTCHA fetch failed:', result.message);
                alert(result.message || "خطا در دریافت کپچا");
            }
        } catch (error) {
            console.error('CAPTCHA fetch error:', error);
            alert("خطا در ارتباط با سرور. لطفاً مجدداً تلاش کنید.");
        } finally {
            this.captchaFetchInProgress = false;
        }
    },
    
    /**
     * بروزرسانی رابط کاربری پس از ورود
     * @param {string} phoneNumber 
     */
    updateUIAfterLogin(phoneNumber) {
        const userNameSpan = document.querySelector(".user-name");
        const loginForm = document.querySelector(".login-form");
        const loggedInMenu = document.querySelector(".logged-in-menu");
        
        if (userNameSpan) {
            // نمایش شماره موبایل کاربر (با قالب ستاره‌دار برای امنیت)
            const maskedNumber = phoneNumber.replace(/(\d{4})(\d{3})(\d{4})/, '$1***$3');
            userNameSpan.textContent = maskedNumber;
        }
        
        if (loginForm) loginForm.style.display = "none";
        if (loggedInMenu) loggedInMenu.style.display = "block";
        
        // اضافه کردن گوش‌دهنده برای دکمه خروج
        const logoutButton = loggedInMenu?.querySelector("li:last-child");
        if (logoutButton) {
            logoutButton.addEventListener("click", this.handleLogout.bind(this));
        }
    },
    
    /**
     * مدیریت خروج کاربر
     */
    handleLogout() {
        // پاک کردن داده‌های کاربر
        localStorage.removeItem('userToken');
        localStorage.removeItem('userMobile');
        
        // بازنشانی وضعیت ماژول
        this.isLoggedIn = false;
        this.isCaptchaVerified = false;
        
        // بازنشانی رابط کاربری
        const userNameSpan = document.querySelector(".user-name");
        const loginForm = document.querySelector(".login-form");
        const loggedInMenu = document.querySelector(".logged-in-menu");
        const dropdownMenu = document.querySelector(".dropdown-menu");
        
        if (userNameSpan) userNameSpan.textContent = "ورود";
        if (loginForm) {
            loginForm.style.display = "block";
            this.resetAuthForm();
        }
        if (loggedInMenu) loggedInMenu.style.display = "none";
        if (dropdownMenu) dropdownMenu.style.display = "none";
        
        console.log('User logged out');
    },
    
    /**
     * بازنشانی فرم احراز هویت
     */
    resetAuthForm() {
        // بازنشانی فیلدهای ورودی
        const phoneNumberInput = document.getElementById("phone-number");
        const captchaInput = document.getElementById("captcha-input");
        const otpInput = document.getElementById("otp-input");
        
        if (phoneNumberInput) phoneNumberInput.value = "";
        if (captchaInput) captchaInput.value = "";
        if (otpInput) otpInput.value = "";
        
        // بازنشانی نمایش بخش‌ها
        const phoneNumberContainer = document.getElementById("phone-number-container");
        const captchaContainer = document.getElementById("captcha-container");
        const otpContainer = document.getElementById("otp-container");
        
        if (phoneNumberContainer) phoneNumberContainer.style.display = "block";
        if (captchaContainer) captchaContainer.style.display = "none";
        if (otpContainer) otpContainer.style.display = "none";
    },
    
    /**
     * بررسی وضعیت ورود کاربر با توکن ذخیره شده
     */
    checkLoginStatus() {
        const token = localStorage.getItem('userToken');
        const mobile = localStorage.getItem('userMobile');
        
        if (token && mobile) {
            this.isLoggedIn = true;
            this.updateUIAfterLogin(mobile);
            console.log('User is already logged in');
            return true;
        }
        
        return false;
    }
};

// بررسی وضعیت ورود کاربر هنگام بارگذاری ماژول
document.addEventListener('DOMContentLoaded', () => {
    auth.checkLoginStatus();
});

// صادر کردن ماژول برای استفاده در فایل‌های دیگر
export default auth; 