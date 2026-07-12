// Monetization functionality

class Monetization {
    constructor() {
        this.plans = [];
        this.isAnnualBilling = false;
        this.init();
    }

    async init() {
        await this.loadPlans();
        this.setupEventListeners();
        this.renderPlans();
    }

    async loadPlans() {
        try {
            this.plans = await API.get('/monetization/api/plans');
            console.log('Loaded plans:', this.plans);
            if (!this.plans || this.plans.length === 0) {
                throw new Error('No plans received from API');
            }
        } catch (error) {
            console.error('Failed to load plans:', error);
            NotificationSystem.show('Failed to load subscription plans', 'error');
        }
    }

    setupEventListeners() {
        // Billing toggle
        const billingToggle = document.getElementById('billing-toggle');
        if (billingToggle) {
            billingToggle.addEventListener('change', (e) => {
                this.isAnnualBilling = e.target.checked;
                this.renderPlans();
            });
        }
    }

    renderPlans() {
        const container = document.getElementById('plans-grid');
        if (!container) return;

        container.innerHTML = this.plans.map(plan => `
            <div class="plan-card ${plan.recommended ? 'recommended' : ''}">
                ${plan.recommended ? '<div class="plan-badge">Most Popular</div>' : ''}
                
                <h3 class="plan-name">${plan.name}</h3>
                
                <div class="plan-price">
                    $${this.calculatePrice(plan.price)}
                </div>
                
                <div class="plan-period">
                    per ${this.isAnnualBilling ? 'year' : 'month'}
                    ${this.isAnnualBilling ? '<br><small>(Save 20%)</small>' : ''}
                </div>
                
                <ul class="plan-features">
                    ${plan.features.map(feature => `
                        <li>
                            <i class="fas fa-check"></i>
                            ${feature}
                        </li>
                    `).join('')}
                </ul>
                
                <button class="btn ${plan.recommended ? 'btn-primary' : 'btn-outline'} plan-button">
                    ${plan.id === 'basic' ? 'Get Started' : 'Subscribe Now'}
                </button>
            </div>
        `).join('');

        // Add event listeners to subscription buttons
        container.querySelectorAll('.plan-button').forEach((button, index) => {
            button.addEventListener('click', () => {
                this.handleSubscription(this.plans[index]);
            });
        });
    }

    calculatePrice(monthlyPrice) {
        if (this.isAnnualBilling) {
            // Apply 20% discount for annual billing
            const annualPrice = monthlyPrice * 12 * 0.8;
            return annualPrice.toFixed(2);
        }
        return monthlyPrice.toFixed(2);
    }

    handleSubscription(plan) {
        if (plan.id === 'basic') {
            NotificationSystem.show('Basic plan activated', 'success');
            return;
        }

        // Redirect to payment page for paid plans
        window.location.href = `/monetization/payment?plan=${plan.id}&billing=${this.isAnnualBilling ? 'annual' : 'monthly'}`;
    }
}

// Payment Page Functionality
class PaymentManager {
    constructor() {
        this.currentMethod = 'card';
        this.isProcessing = false;
        this.init();
    }

    init() {
        this.setupPaymentMethods();
        this.setupFormValidation();
        this.setupCardFormatting();
        this.setupAddressToggle();
        this.setupFormSubmission();
        this.loadOrderDetails();
        this.setupSecurityFeatures();
    }

    setupPaymentMethods() {
        const methodTabs = document.querySelectorAll('.method-tab');
        const methodContents = document.querySelectorAll('.method-content');

        methodTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const method = tab.dataset.method;
                this.currentMethod = method;
                
                // Update tabs
                methodTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Update contents
                methodContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === method + '-content') {
                        content.classList.add('active');
                    }
                });
                
                // Update processing method display
                const processingMethod = document.getElementById('processing-method');
                if (processingMethod) {
                    processingMethod.textContent = tab.textContent.trim();
                }
                
                // Add visual feedback
                tab.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    tab.style.transform = 'scale(1)';
                }, 150);
            });
        });
    }

    setupCardFormatting() {
        // Card number formatting
        const cardNumberInput = document.getElementById('card-number');
        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 16) value = value.slice(0, 16);
                
                // Add spaces every 4 digits
                value = value.replace(/(\d{4})/g, '$1 ').trim();
                e.target.value = value;
                
                // Detect card type and highlight icon
                this.detectCardType(value.replace(/\s/g, ''));
            });
        }

        // Expiration date formatting
        const expDateInput = document.getElementById('expiry-date');
        if (expDateInput) {
            expDateInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 4) value = value.slice(0, 4);
                
                if (value.length > 2) {
                    value = value.slice(0, 2) + '/' + value.slice(2);
                }
                e.target.value = value;
                
                // Validate expiration date
                this.validateExpirationDate(value);
            });
        }

        // CVV formatting
        const cvvInput = document.getElementById('cvv');
        if (cvvInput) {
            cvvInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 4) value = value.slice(0, 4);
                e.target.value = value;
            });
        }
    }

    detectCardType(cardNumber) {
        const cardIcons = document.querySelectorAll('.card-icons i');
        cardIcons.forEach(icon => icon.classList.remove('active'));

        if (cardNumber.startsWith('4')) {
            document.querySelector('.fa-cc-visa')?.classList.add('active');
        } else if (cardNumber.startsWith('5') || cardNumber.startsWith('2')) {
            document.querySelector('.fa-cc-mastercard')?.classList.add('active');
        } else if (cardNumber.startsWith('3')) {
            document.querySelector('.fa-cc-amex')?.classList.add('active');
        } else if (cardNumber.startsWith('6')) {
            document.querySelector('.fa-cc-discover')?.classList.add('active');
        }
    }

    validateExpirationDate(expiry) {
        const expDateInput = document.getElementById('expiry-date');
        if (!expDateInput || expiry.length < 5) return;

        const [month, year] = expiry.split('/');
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear() % 100;
        const currentMonth = currentDate.getMonth() + 1;

        const isValid = (
            parseInt(month) >= 1 && parseInt(month) <= 12 &&
            (parseInt(year) > currentYear || 
             (parseInt(year) === currentYear && parseInt(month) >= currentMonth))
        );

        expDateInput.style.borderColor = isValid ? 'var(--success)' : 'var(--danger)';
    }

    setupAddressToggle() {
        const sameAsProfile = document.getElementById('same-as-profile');
        const customAddress = document.getElementById('custom-address');

        if (sameAsProfile && customAddress) {
            sameAsProfile.addEventListener('change', () => {
                customAddress.style.display = sameAsProfile.checked ? 'none' : 'block';
                
                // Add smooth transition
                if (!sameAsProfile.checked) {
                    customAddress.style.opacity = '0';
                    customAddress.style.transform = 'translateY(-10px)';
                    setTimeout(() => {
                        customAddress.style.transition = 'all 0.3s ease';
                        customAddress.style.opacity = '1';
                        customAddress.style.transform = 'translateY(0)';
                    }, 50);
                }
            });
        }
    }

    setupFormValidation() {
        const form = document.getElementById('payment-form');
        if (!form) return;

        const inputs = form.querySelectorAll('input[required], select[required]');
        
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Required field validation
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }

        // Specific field validations
        switch (field.id) {
            case 'card-number':
                const cardNumber = value.replace(/\s/g, '');
                if (cardNumber.length < 13 || cardNumber.length > 19) {
                    isValid = false;
                    errorMessage = 'Please enter a valid card number';
                }
                break;
            case 'expiry-date':
                if (value.length !== 5 || !value.includes('/')) {
                    isValid = false;
                    errorMessage = 'Please enter a valid expiry date (MM/YY)';
                }
                break;
            case 'cvv':
                if (value.length < 3 || value.length > 4) {
                    isValid = false;
                    errorMessage = 'Please enter a valid CVV';
                }
                break;
            case 'cardholder-name':
                if (value.length < 2) {
                    isValid = false;
                    errorMessage = 'Please enter the cardholder name';
                }
                break;
        }

        this.showFieldValidation(field, isValid, errorMessage);
        return isValid;
    }

    showFieldValidation(field, isValid, errorMessage) {
        // Remove existing error
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        // Update field styling
        field.style.borderColor = isValid ? 'var(--success)' : 'var(--danger)';

        // Add error message if invalid
        if (!isValid && errorMessage) {
            const errorEl = document.createElement('div');
            errorEl.className = 'field-error';
            errorEl.textContent = errorMessage;
            errorEl.style.color = 'var(--danger)';
            errorEl.style.fontSize = '0.8rem';
            errorEl.style.marginTop = '0.25rem';
            field.parentNode.appendChild(errorEl);
        }
    }

    clearFieldError(field) {
        field.style.borderColor = 'var(--border-color)';
        const errorEl = field.parentNode.querySelector('.field-error');
        if (errorEl) {
            errorEl.remove();
        }
    }

    setupFormSubmission() {
        const form = document.getElementById('payment-form');
        const submitButton = document.getElementById('submit-payment');
        const paypalButton = document.getElementById('paypal-button');
        const applepayButton = document.getElementById('applepay-button');

        if (form && submitButton) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processPayment();
            });
        }

        if (paypalButton) {
            paypalButton.addEventListener('click', () => this.processPayPal());
        }

        if (applepayButton) {
            applepayButton.addEventListener('click', () => this.processApplePay());
        }
    }

    loadOrderDetails() {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const plan = urlParams.get('plan') || 'premium';
        const billing = urlParams.get('billing') || 'monthly';
        
        // Update order summary based on URL parameters
        this.updateOrderSummary(plan, billing);
    }

    updateOrderSummary(plan, billing) {
        // Plan prices
        const prices = {
            'premium': { monthly: 19.99, annual: 191.90 },
            'vip': { monthly: 29.99, annual: 287.90 }
        };
        
        const planNames = {
            'premium': 'Premium Membership',
            'vip': 'VIP Membership'
        };
        
        const price = prices[plan] ? prices[plan][billing] : 19.99;
        const planName = planNames[plan] || 'Premium Membership';
        
        // Update DOM elements
        const planEl = document.querySelector('.summary-item span:last-child');
        if (planEl && planEl.textContent.includes('Premium')) {
            planEl.textContent = planName;
        }
        
        const billingEl = document.querySelectorAll('.summary-item')[1]?.querySelector('span:last-child');
        if (billingEl) {
            billingEl.textContent = billing === 'annual' ? 'Annual' : 'Monthly';
        }
        
        const totalEl = document.querySelector('.summary-item.total span:last-child');
        if (totalEl) {
            totalEl.textContent = `$${price}`;
        }
        
        const submitBtn = document.getElementById('submit-payment');
        if (submitBtn) {
            submitBtn.innerHTML = `
                <i class="fas fa-lock"></i>
                Complete Payment - $${price}
            `;
        }
    }

    setupSecurityFeatures() {
        // Add security indicators
        this.addSecurityIndicators();
        
        // Setup form encryption simulation
        this.setupFormEncryption();
    }

    addSecurityIndicators() {
        const formInputs = document.querySelectorAll('#payment-form input');
        formInputs.forEach(input => {
            input.addEventListener('focus', () => {
                input.style.boxShadow = '0 0 0 3px rgba(76, 175, 80, 0.1)';
            });
            
            input.addEventListener('blur', () => {
                input.style.boxShadow = 'none';
            });
        });
    }

    setupFormEncryption() {
        // Simulate form data encryption
        const cardNumberInput = document.getElementById('card-number');
        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', () => {
                // Add encryption indicator
                const encryptionIcon = document.querySelector('.security-info i');
                if (encryptionIcon) {
                    encryptionIcon.style.color = 'var(--success)';
                    encryptionIcon.style.animation = 'pulse 1s ease-in-out';
                }
            });
        }
    }

    async processPayment() {
        if (this.isProcessing) return;
        
        // Validate form
        if (!this.validateForm()) {
            this.showError('Please fix the errors in the form before proceeding.');
            return;
        }
        
        this.isProcessing = true;
        this.showProcessingModal();
        
        try {
            // Simulate payment processing
            await this.simulatePaymentAPI();
            
            // Hide processing modal
            this.hideProcessingModal();
            
            // Redirect to success page
            const urlParams = new URLSearchParams(window.location.search);
            const plan = urlParams.get('plan') || 'premium';
            const billing = urlParams.get('billing') || 'monthly';
            
            window.location.href = `/monetization/payment/success?plan=${plan}&billing=${billing}`;
            
        } catch (error) {
            this.hideProcessingModal();
            this.showError(error.message || 'Payment failed. Please try again.');
        } finally {
            this.isProcessing = false;
        }
    }

    async processPayPal() {
        this.showProcessingModal();
        
        try {
            await this.simulatePaymentAPI(1500);
            this.hideProcessingModal();
            
            const urlParams = new URLSearchParams(window.location.search);
            const plan = urlParams.get('plan') || 'premium';
            const billing = urlParams.get('billing') || 'monthly';
            
            window.location.href = `/monetization/payment/success?plan=${plan}&billing=${billing}`;
        } catch (error) {
            this.hideProcessingModal();
            this.showError('PayPal payment failed. Please try again.');
        }
    }

    async processApplePay() {
        this.showProcessingModal();
        
        try {
            await this.simulatePaymentAPI(1000);
            this.hideProcessingModal();
            
            const urlParams = new URLSearchParams(window.location.search);
            const plan = urlParams.get('plan') || 'premium';
            const billing = urlParams.get('billing') || 'monthly';
            
            window.location.href = `/monetization/payment/success?plan=${plan}&billing=${billing}`;
        } catch (error) {
            this.hideProcessingModal();
            this.showError('Apple Pay payment failed. Please try again.');
        }
    }

    validateForm() {
        const form = document.getElementById('payment-form');
        if (!form) return true;
        
        const requiredFields = form.querySelectorAll('input[required], select[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        // Check terms acceptance
        const acceptTerms = document.getElementById('accept-terms');
        if (acceptTerms && !acceptTerms.checked) {
            this.showError('Please accept the terms and conditions to proceed.');
            isValid = false;
        }
        
        return isValid;
    }

    simulatePaymentAPI(delay = 2500) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // 95% success rate for demo
                if (Math.random() > 0.05) {
                    resolve({ status: 'success', transactionId: 'TXN-' + Date.now() });
                } else {
                    reject(new Error('Card declined. Please try another payment method.'));
                }
            }, delay);
        });
    }

    showProcessingModal() {
        const modal = document.getElementById('processing-modal');
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('show');
        }
    }

    hideProcessingModal() {
        const modal = document.getElementById('processing-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    }

    showError(message) {
        const modal = document.getElementById('error-modal');
        const messageEl = document.getElementById('error-message');
        
        if (modal && messageEl) {
            messageEl.textContent = message;
            modal.style.display = 'flex';
            modal.classList.add('show');
        }
    }
}

// Initialize monetization when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('plans-grid')) {
        window.monetizationApp = new Monetization();
    }
    
    if (document.getElementById('payment-form') || document.querySelector('.payment-container')) {
        window.paymentManager = new PaymentManager();
    }
    
    // Setup modal close handlers
    document.querySelectorAll('.modal-close, [data-dismiss="modal"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            }
        });
    });
    
    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            }
        });
    });
});