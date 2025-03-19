/**
 * اجرای کد پس از بارگذاری کامل صفحه
 */
document.addEventListener("DOMContentLoaded", () => {
    // انتخاب عناصر مورد نیاز در صفحه
    const userSection = document.querySelector(".user-section");
    const userNameSpan = document.querySelector(".user-name");
    const dropdownMenu = document.querySelector(".dropdown-menu");
    const loginForm = document.querySelector(".login-form");
    const loggedInMenu = document.querySelector(".logged-in-menu");
    const sendOtpButton = document.getElementById("send-otp-button");
    const phoneNumberInput = document.getElementById("phone-number");
    const phoneNumberContainer = document.getElementById("phone-number-container"); 
    const captchaContainer = document.getElementById("captcha-container");
    const captchaInput = document.getElementById("captcha-input");
    const verifyCaptchaButton = document.getElementById("verify-captcha-button");
    const otpContainer = document.getElementById("otp-container");
    const otpInput = document.getElementById("otp-input");
    const verifyOtpButton = document.getElementById("verify-otp-button");
    const changeCaptchaButton = document.getElementById("change-captcha-button");
    
    // ایجاد عنصر تصویر کپچا
    const captchaImage = document.createElement('img');
    captchaContainer.insertBefore(captchaImage, captchaInput);

    // تنظیم ورودی کپچا به عدد 4 رقمی
    captchaInput.setAttribute('maxlength', '4');
    captchaInput.setAttribute('pattern', '[0-9]{4}');
    captchaInput.setAttribute('inputmode', 'numeric');
    captchaInput.setAttribute('placeholder', 'کد 4 رقمی را وارد کنید');

    // تنظیم ورودی کد تایید به عدد 4 رقمی
    otpInput.setAttribute('maxlength', '4');
    otpInput.setAttribute('pattern', '[0-9]{4}');
    otpInput.setAttribute('inputmode', 'numeric');
    otpInput.setAttribute('placeholder', 'کد 4 رقمی را وارد کنید');

    // تنظیم ظاهر تصویر کپچا
    captchaImage.style.display = 'block';
    captchaImage.style.margin = '10px auto';
    captchaImage.style.maxWidth = '85%';
    captchaImage.style.borderRadius = '8px';
    captchaImage.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
    captchaImage.id = 'captcha-image';

    // متغیرهای مورد نیاز
    let isLoggedIn = false; // وضعیت لاگین کاربر
    let isCaptchaVerified = false; // وضعیت تایید کپچا
    let captchaFetchInProgress = false; // وضعیت درخواست کپچا
    let captchaToken = ''; // توکن کپچا برای تایید

    // آدرس سرور بک‌اند
    const backendUrl = 'http://localhost:3000';

    /**
     * مدیریت منوی کاربر
     */
    // نمایش یا مخفی کردن منوی کشویی با کلیک روی بخش کاربر
    userSection.addEventListener("click", () => {
        dropdownMenu.style.display = dropdownMenu.style.display === "block" ? "none" : "block";
    });

    // بستن منو با کلیک خارج از آن
    document.addEventListener("click", (event) => {
        if (!userSection.contains(event.target) && !dropdownMenu.contains(event.target)) {
            dropdownMenu.style.display = "none";
        }
    });

    // جلوگیری از بسته شدن منو وقتی روی خود منو یا فرم کلیک می‌کنیم
    dropdownMenu.addEventListener("click", (event) => {
        event.stopPropagation();
    });

    /**
     * مدیریت ورود کاربر
     */
    // ارسال شماره موبایل و نمایش کپچا
    sendOtpButton.addEventListener("click", async (event) => {
        event.preventDefault();
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
        console.log('Showing CAPTCHA container');
        
        // دریافت کپچا
        await fetchCaptcha();
    });

    // مدیریت تأیید کپچا
    verifyCaptchaButton.addEventListener("click", async (event) => {
        event.preventDefault();
        const captchaValue = captchaInput.value.trim();
        const phoneNumber = phoneNumberInput.value.trim();

        if (captchaValue === "") {
            alert("لطفاً کد کپچا را وارد کنید.");
            return;
        }

        if (!captchaToken) {
            alert("توکن کپچا نامعتبر است. لطفاً صفحه را رفرش کنید.");
            await fetchCaptcha();
            return;
        }

        try {
            console.log('Verifying CAPTCHA value');
            
            const response = await fetch(`${backendUrl}/api/auth/verify-captcha`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ 
                    captcha: captchaValue,
                    mobile: phoneNumber,
                    token: captchaToken
                })
            });

            const result = await response.json();
            console.log('CAPTCHA verification response status:', response.status);

            if (response.ok && result.success) {
                isCaptchaVerified = true;
                
                // مخفی کردن باکس کپچا
                captchaContainer.style.display = "none";
                
                // نمایش باکس کد تایید
                otpContainer.style.display = "block";
                
                // نمایش کد تایید در محیط توسعه
                if (result.otp) {
                    console.log('OTP received:', result.otp);
                    alert(`کد کپچا تأیید شد. رمز یک بار مصرف را وارد کنید (${result.otp})`);
                } else {
                    alert("کد کپچا تأیید شد. لطفاً رمز یک بار مصرف را وارد کنید.");
                }
                
                // تمرکز روی فیلد کد تایید
                otpInput.focus();
                
                // پاک کردن توکن کپچا پس از استفاده موفق
                captchaToken = '';
            } else {
                console.error('CAPTCHA verification failed:', result.message);
                alert(result.message || "خطا در تأیید کپچا");
                
                // دریافت کپچای جدید در صورت منقضی شدن توکن
                if (result.message && (
                    result.message.includes('منقضی شده') || 
                    result.message.includes('نشست') || 
                    result.message.includes('توکن')
                )) {
                    await fetchCaptcha();
                }
            }
        } catch (error) {
            console.error('CAPTCHA verification error:', error);
            alert("خطا در ارتباط با سرور. لطفاً مجدداً تلاش کنید.");
            await fetchCaptcha();
        }
    });

    // مدیریت تأیید کد یکبار مصرف
    verifyOtpButton.addEventListener("click", async (event) => {
        event.preventDefault();
        const otpValue = otpInput.value.trim();
        const phoneNumber = phoneNumberInput.value.trim();

        if (otpValue === "") {
            alert("لطفاً کد تایید را وارد کنید.");
            return;
        }

        try {
            console.log('Verifying OTP');
            
            const response = await fetch(`${backendUrl}/api/auth/verify-otp`, {
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
            console.log('OTP verification response status:', response.status);

            if (response.ok && result.success) {
                console.log('OTP verified successfully');
                isLoggedIn = true;
                
                // ذخیره اطلاعات کاربر
                localStorage.setItem('userToken', result.token);
                localStorage.setItem('userMobile', phoneNumber);
                
                // به‌روزرسانی رابط کاربری پس از ورود
                updateUIAfterLogin(phoneNumber);
                
                // بستن منوی کشویی پس از مدتی
                setTimeout(() => {
                    dropdownMenu.style.display = "none";
                }, 1500);
            } else {
                console.error('OTP verification failed:', result.message);
                alert(result.message || "کد تایید نامعتبر است.");
            }
        } catch (error) {
            console.error('OTP verification error:', error);
            alert("خطا در ارتباط با سرور. لطفاً مجدداً تلاش کنید.");
        }
    });

    // تغییر تصویر کپچا
    changeCaptchaButton.addEventListener("click", async (event) => {
        event.preventDefault();
        await fetchCaptcha();
    });

    /**
     * دریافت و نمایش کپچا
     */
    async function fetchCaptcha() {
        // جلوگیری از ارسال همزمان چند درخواست
        if (captchaFetchInProgress) {
            console.log('CAPTCHA fetch already in progress');
            return;
        }
        
        captchaFetchInProgress = true;
        
        try {
            console.log('Fetching new CAPTCHA...');
            
            // نمایش وضعیت بارگذاری
            captchaImage.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0Ij48cGF0aCBmaWxsPSJub25lIiBkPSJNMCAwaDI0djI0SDB6Ii8+PHBhdGggZD0iTTEyIDJhMSAxIDAgMCAxIDEgMXYzYTEgMSAwIDAgMS0yIDBWM2ExIDEgMCAwIDEgMS0xem0wIDE1YTEgMSAwIDAgMSAxIDF2M2ExIDEgMCAwIDEtMiAwdi0zYTEgMSAwIDAgMSAxLTF6bTEwLTVhMSAxIDAgMCAxLTEgMWgtM2ExIDEgMCAwIDEgMC0yaDNhMSAxIDAgMCAxIDEgMXpNNyAxMmExIDEgMCAwIDEtMSAxSDNhMSAxIDAgMCAxIDAtMmgzYTEgMSAwIDAgMSAxIDF6bTEyLjcxIDcuMjlhMSAxIDAgMCAxLTEuNDIgMGwtMi0yYTEgMSAwIDAgMSAxLjQyLTEuNDJsMiAyYTEgMSAwIDAgMSAwIDEuNDJ6TTcuMjkgNy4yOWExIDEgMCAwIDEtMS40MiAwbC0yLTJhMSAxIDAgMCAxIDEuNDItMS40MmwyIDJhMSAxIDAgMCAxIDAgMS40MnptMTIgLjEyYTEgMSAwIDAgMS0xLjQyIDEuNDJsLTItMmExIDEgMCAwIDEgMS40Mi0xLjQybDIgMmExIDEgMCAwIDEgMCAxLjQyek03LjI5IDE2LjcxYTEgMSAwIDAgMSAxLjQyIDEuNDJsLTIgMmExIDEgMCAwIDEtMS40Mi0xLjQybDItMnoiIGZpbGw9InJnYmEoMTgzLDE4MywxODMsMSkiLz48L3N2Zz4=';
            captchaImage.style.opacity = '0.5';
            
            const response = await fetch(`${backendUrl}/api/auth/generate-captcha`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });
            
            console.log('CAPTCHA response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, text: ${errorText}`);
            }
            
            const result = await response.json();
            console.log('CAPTCHA response received');
            
            if (result.success && result.image && result.token) {
                // ذخیره توکن برای تایید بعدی
                captchaToken = result.token;
                console.log('CAPTCHA token received');
                
                // نمایش تصویر کپچا
                captchaImage.src = `data:image/svg+xml;base64,${btoa(result.image)}`;
                captchaImage.style.opacity = '1';
                
                // تنظیم وضعیت فیلد کپچا
                captchaInput.disabled = false;
                captchaInput.value = '';
                
                // تمرکز روی فیلد کپچا
                captchaInput.focus();
                
                verifyCaptchaButton.disabled = false;
            } else {
                throw new Error(result.message || 'پاسخ نامعتبر کپچا');
            }
        } catch (error) {
            console.error('Error fetching CAPTCHA:', error);
            alert("خطا در دریافت کپچا. لطفاً مجدداً تلاش کنید.");
            
            // برگشت به مرحله ورود شماره موبایل در صورت خطا
            resetAuthForm();
        } finally {
            captchaFetchInProgress = false;
        }
    }

    /**
     * به‌روزرسانی رابط کاربری پس از ورود
     */
    function updateUIAfterLogin(phoneNumber) {
        // نمایش شماره موبایل کاربر (با قالب ستاره‌دار برای امنیت)
        const maskedNumber = phoneNumber.replace(/(\d{4})(\d{3})(\d{4})/, '$1***$3');
        userNameSpan.textContent = maskedNumber;
        
        // تنظیم جهت نمایش شماره موبایل از چپ به راست
        userNameSpan.style.direction = "ltr";
        userNameSpan.style.textAlign = "left";
        userNameSpan.style.display = "inline-block";

        // مخفی کردن فرم ورود و نمایش منوی کاربر
        loginForm.style.display = "none";
        loggedInMenu.style.display = "block";

        console.log('User interface updated after login');
    }

    /**
     * بازنشانی فرم احراز هویت
     */
    function resetAuthForm() {
        // مخفی کردن تمام باکس‌ها به جز شماره موبایل
        captchaContainer.style.display = "none";
        otpContainer.style.display = "none";
        
        // نمایش باکس شماره موبایل
        phoneNumberContainer.style.display = "block";
        
        // پاکسازی مقادیر ورودی
        phoneNumberInput.value = "";
        captchaInput.value = "";
        otpInput.value = "";
        
        // پاکسازی وضعیت‌ها
        isCaptchaVerified = false;
        captchaToken = '';
        
        console.log('Auth form reset');
    }

    /**
     * تنظیم اولیه رابط کاربری بر اساس وضعیت ورود
     */
    function initializeUI() {
        // بررسی وضعیت ورود از localStorage
        const token = localStorage.getItem('userToken');
        const mobile = localStorage.getItem('userMobile');
        
        if (token && mobile) {
            isLoggedIn = true;
            updateUIAfterLogin(mobile);
            console.log('User already logged in');
        } else {
            // مخفی کردن تمام باکس‌ها به جز شماره موبایل
            captchaContainer.style.display = "none";
            otpContainer.style.display = "none";
            
            userNameSpan.textContent = "ورود";
            loginForm.style.display = "block";
            loggedInMenu.style.display = "none";
            
            // نمایش فقط باکس شماره موبایل
            phoneNumberContainer.style.display = "block";
        }
        
        console.log('UI initialized');
    }

    // اجرای تنظیم اولیه رابط کاربری
    initializeUI();

    /**
     * مدیریت محصولات
     */
    // دریافت عناصر مورد نیاز
    const products = document.querySelectorAll(".product");
    const modal = document.getElementById("product-modal");
    const modalImage = document.getElementById("modal-image");
    const closeModal = document.querySelector(".close");

    // نمایش مودال با کلیک روی تصویر محصول
    products.forEach(product => {
        product.querySelector(".product-image").addEventListener("click", () => {
            modalImage.src = product.getAttribute("data-image");
            modal.style.display = "block";
        });
    });

    // بستن مودال با کلیک روی دکمه بستن
    closeModal.addEventListener("click", () => {
        modal.style.display = "none";
    });

    // بستن مودال با کلیک خارج از تصویر
    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

    // مدیریت انتخاب سایز محصولات
    const productSizes = document.querySelectorAll(".product-sizes input");
    const addToCartButtons = document.querySelectorAll(".add-to-cart-button");

    productSizes.forEach(size => {
        size.addEventListener("change", (event) => {
            const product = event.target.closest(".product");
            const anyChecked = Array.from(product.querySelectorAll(".product-sizes input")).some(input => input.checked);
            product.querySelector(".add-to-cart-button").disabled = !anyChecked;
        });
    });

    // مدیریت افزودن به سبد خرید
    addToCartButtons.forEach(button => {
        button.addEventListener("click", (event) => {
            const product = event.target.closest(".product");
            const selectedSizes = Array.from(product.querySelectorAll(".product-sizes input"))
                .filter(input => input.checked)
                .map(input => input.value);
                
            const productName = product.getAttribute("data-name");
            const productPrice = product.getAttribute("data-price");
            
            console.log('Adding to cart:', productName, selectedSizes);
            alert(`محصول "${productName}" با سایز ${selectedSizes.join(', ')} به سبد خرید اضافه شد.`);
        });
    });
});
