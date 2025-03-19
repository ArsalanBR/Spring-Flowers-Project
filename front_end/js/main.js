// وارد کردن ماژول‌های مورد نیاز
import auth from './auth.js';

/**
 * ماژول مدیریت منوی کاربر
 * کنترل نمایش منوی کشویی و تعامل کاربر
 */
const userMenu = {
    init() {
        const userSection = document.querySelector(".user-section");
        const dropdownMenu = document.querySelector(".dropdown-menu");
        
        if (!userSection || !dropdownMenu) {
            console.error('User menu elements not found');
            return;
        }
        
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
        
        // جلوگیری از بسته شدن منو وقتی روی خود منو کلیک می‌شود
        dropdownMenu.addEventListener("click", (event) => {
            event.stopPropagation();
        });
        
        console.log('User menu initialized');
    }
};

/**
 * ماژول مدیریت محصولات 
 * کنترل نمایش محصولات، سایزها و سبد خرید
 */
const productManager = {
    init() {
        this.setupProductModal();
        this.setupProductSizes();
        this.setupAddToCartButtons();
        console.log('Product manager initialized');
    },
    
    // تنظیم مودال نمایش محصول
    setupProductModal() {
        const products = document.querySelectorAll(".product");
        const modal = document.getElementById("product-modal");
        const modalImage = document.getElementById("modal-image");
        const closeModal = document.querySelector(".close");
        
        if (!products.length || !modal || !modalImage || !closeModal) {
            console.warn('Product modal elements not found');
            return;
        }
        
        products.forEach(product => {
            const productImage = product.querySelector(".product-image");
            if (productImage) {
                productImage.addEventListener("click", () => {
                    modalImage.src = product.getAttribute("data-image");
                    modal.style.display = "block";
                });
            }
        });
        
        closeModal.addEventListener("click", () => {
            modal.style.display = "none";
        });
        
        window.addEventListener("click", (event) => {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        });
    },
    
    // تنظیم انتخاب سایز محصولات
    setupProductSizes() {
        const productSizes = document.querySelectorAll(".product-sizes input");
        
        productSizes.forEach(size => {
            size.addEventListener("change", (event) => {
                const product = event.target.closest(".product");
                if (!product) return;
                
                const anyChecked = Array.from(product.querySelectorAll(".product-sizes input"))
                    .some(input => input.checked);
                
                const addToCartButton = product.querySelector(".add-to-cart-button");
                if (addToCartButton) {
                    addToCartButton.disabled = !anyChecked;
                }
            });
        });
    },
    
    // تنظیم دکمه‌های اضافه کردن به سبد خرید
    setupAddToCartButtons() {
        const addToCartButtons = document.querySelectorAll(".add-to-cart-button");
        
        addToCartButtons.forEach(button => {
            button.addEventListener("click", (event) => {
                const product = event.target.closest(".product");
                if (!product) return;
                
                const selectedSizes = Array.from(product.querySelectorAll(".product-sizes input"))
                    .filter(input => input.checked)
                    .map(input => input.value);
                
                const productName = product.getAttribute("data-name");
                const productPrice = product.getAttribute("data-price");
                
                // افزودن به سبد خرید
                this.addToCart({
                    name: productName,
                    price: productPrice,
                    sizes: selectedSizes,
                    image: product.getAttribute("data-image")
                });
            });
        });
    },
    
    // افزودن محصول به سبد خرید
    addToCart(product) {
        console.log('Adding to cart:', product);
        // در اینجا منطق افزودن به سبد خرید اضافه می‌شود
        alert(`محصول "${product.name}" با سایز ${product.sizes.join(', ')} به سبد خرید اضافه شد.`);
    }
};

// راه‌اندازی اولیه برنامه هنگام بارگذاری صفحه
document.addEventListener('DOMContentLoaded', () => {
    auth.init();
    userMenu.init();
    productManager.init();
    console.log('Application initialized');
});

// صادر کردن ماژول‌ها برای استفاده در فایل‌های دیگر
export { userMenu, productManager }; 