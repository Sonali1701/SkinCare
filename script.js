// Authentication System
class AuthSystem {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('skincareUsers') || '{}');
        this.currentUser = null;
        this.init();
    }

    init() {
        // Check if user is already logged in
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser && this.users[savedUser]) {
            this.currentUser = savedUser;
            this.showApp();
        } else {
            this.showAuth();
        }

        // Setup event listeners
        this.setupAuthListeners();
    }

    setupAuthListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        // Signup form
        document.getElementById('signupForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.signup();
        });

        // Logout button
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });
    }

    switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });

        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(`${tab}-form`).classList.add('active');

        // Clear error messages
        document.getElementById('login-error').textContent = '';
        document.getElementById('signup-error').textContent = '';
    }

    login() {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const errorEl = document.getElementById('login-error');

        if (!email || !password) {
            errorEl.textContent = 'Please fill in all fields';
            return;
        }

        if (this.users[email] && this.users[email].password === password) {
            this.currentUser = email;
            localStorage.setItem('currentUser', email);
            this.showApp();
            errorEl.textContent = '';
        } else {
            errorEl.textContent = 'Invalid email or password';
        }
    }

    signup() {
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const errorEl = document.getElementById('signup-error');

        if (!email || !password) {
            errorEl.textContent = 'Please fill in all fields';
            return;
        }

        if (password.length < 6) {
            errorEl.textContent = 'Password must be at least 6 characters';
            return;
        }

        if (this.users[email]) {
            errorEl.textContent = 'Email already registered. Please login.';
            return;
        }

        // Create new user
        this.users[email] = {
            password: password,
            routines: {
                daytime: this.getDefaultRoutine(),
                nighttime: this.getDefaultRoutine()
            }
        };

        localStorage.setItem('skincareUsers', JSON.stringify(this.users));
        this.currentUser = email;
        localStorage.setItem('currentUser', email);
        this.showApp();
        errorEl.textContent = '';
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.showAuth();
        // Clear forms
        document.getElementById('loginForm').reset();
        document.getElementById('signupForm').reset();
    }

    showAuth() {
        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('app-container').classList.add('hidden');
    }

    showApp() {
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        // Load routine after app is initialized
        if (app) {
            app.loadRoutine();
        }
    }

    getDefaultRoutine() {
        return {
            cleanser: [{ name: 'Product', checked: false, notes: '' }],
            toner: [{ name: 'Product', checked: false, notes: '' }],
            serum: [{ name: 'Product', checked: false, notes: '' }],
            massage: [{ name: 'Product', checked: false, notes: '' }],
            tool: [{ name: 'Product', checked: false, notes: '' }],
            treatment: [{ name: 'Product', checked: false, notes: '' }],
            spf: [{ name: 'Product', checked: false, notes: '' }]
        };
    }
}

// Product Database - All available products
const PRODUCT_DATABASE = [
    'Tretinoin',
    'ZIIP Golden Gel',
    'Medicube 10 Azelaic Acid Niacinamide Foam Cleanser',
    'Medicube PDRN Jelly to Foam Cleanser',
    'Snow Aqua 0 Ginseng Deep Cleansing Oil',
    'Medicube PDRN Overnight Wrapping Mask with Jelly Brush',
    'Medicube Zero Pore Blackhead Mud Facial Mask',
    'Embryolisse 3-in-1 Secret Paste',
    'Cica Daily Soothing Beauty Mask',
    'Medicube - Zero Pore Pad 2.0',
    'Medicube Exosome Cica Calming Pad',
    'Estradiol Vaginal Cream USP, 0.01%',
    'Thayers Face Care Hydrating Milky Cleanser with Snow Mushroom',
    'Celimax The Vita A Retinal Shot Tightening Booster',
    'The Ordinary Volufiline 92% + Pal-Isoleucine 1% Plumping Serum',
    'Mylan Tretinoin 0.1% Cream',
    'Antimicrobial and Antiseptic Soap and Skin Cleanser',
    'Walgreens Dye-Free Antiseptic Skin Cleanser',
    'Minoxidil 5% topical aerosol hair growth treatmen',
    'Numbuzin No.9 NAD+ Retinol Volumetox Eye Cream.',
    'Numbuzin No. 9 NAD+ Bio Super Defense Glow Sunscreen.',
    'Dr. Althea 147 Barrier Cream',
    'Dr. Althea 345 Relief Cream duo pack.',
    'Dr. Althea Pure Grinding Cleansing Balm',
    'Medicube PDRN Pink Niacinamide Milky Toner.',
    'SVA Organics Rose Water.',
    'Medicube Deep Vita C 70 Pads',
    'Medicube Exosome Cica Calming Pads',
    'belif The True Cream Moisturizing Bomb.',
    'Peter Thomas Roth Water Drench Hyaluronic Cloud Cream Hydrating Moisturizer.',
    'Medicube Collagen Jelly Cream',
    'Shiseido Firming Massage Mask',
    'Medicube One Day Exosome Shot Pore Ampoule 7500',
    'REJURAN Intensive Eye Cream',
    'Medicube Deep Vita C Capsule Cream',
    'Medicube TXA Niacinamide Capsule Cream',
    'Whip It Hydrating Whipped Cream',
    'Point of View Drench It Soothing Priming Milk.',
    'Point of view Drip It Nourishing Glow Serum.',
    'Rejuran Turnover Ampoule with c-PDRN 0.5%',
    'Good Molecules Super Peptide Serum.',
    'VT Cosmetics Cica Reedle Shot 700',
    'Medicube Exosome Cica Ampoule',
    'Qure Micro-Infusion System or Targeted Patches',
    'ISDIN Photo Eryfotona Ageless Ultralight Emulsion',
    'Embryolisse Lait-Crème Concentré',
    'Celimax Pore + Dark Spot Brightening Cream.',
    'Medicube Deep Vita C Pad',
    // Tool products
    'Red Light Mask',
    'Red Light Neck',
    'Guacha tool',
    'Red light therapy',
    'Microneedle',
    'Microneedle infusion',
    'Medicube Age R Booster Pro',
    'AngelLift',
    'INIA Flare',
    'Face cupping',
    'INIA Lumin',
    'Nuderma Clinical'
];

// Main Application
class SkincareApp {
    constructor() {
        this.isDaytime = true;
        this.init();
    }

    init() {
        // Day/Night toggle
        const toggle = document.getElementById('dayNightToggle');
        toggle.addEventListener('change', (e) => {
            this.isDaytime = e.target.checked;
            this.updateMode();
        });
        toggle.checked = true; // Default to daytime

        // Save button
        document.getElementById('save-btn').addEventListener('click', () => {
            this.saveRoutine();
        });

        // Print button
        document.getElementById('print-btn').addEventListener('click', () => {
            this.printRoutine();
        });

        // Add product buttons
        document.querySelectorAll('.add-product-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const step = e.target.dataset.step;
                this.addProduct(step);
            });
        });

        // Initial mode update
        this.updateMode();
    }

    updateMode() {
        const label = document.getElementById('mode-label');
        const spfColumn = document.getElementById('spf-column');
        
        if (this.isDaytime) {
            label.textContent = 'Daytime';
            spfColumn.classList.remove('hidden-night');
        } else {
            label.textContent = 'Nighttime';
            spfColumn.classList.add('hidden-night');
        }
    }

    loadRoutine() {
        if (!auth.currentUser) return;

        const users = JSON.parse(localStorage.getItem('skincareUsers') || '{}');
        const user = users[auth.currentUser];
        if (!user) return;

        const mode = this.isDaytime ? 'daytime' : 'nighttime';
        const routine = user.routines[mode] || auth.getDefaultRoutine();

        // Load each step
        Object.keys(routine).forEach(step => {
            const productsList = document.querySelector(`[data-step="${step}"]`);
            if (!productsList) return;

            productsList.innerHTML = '';
            routine[step].forEach((product, index) => {
                const productEl = this.createProductElement(step, product, index);
                productsList.appendChild(productEl);
            });
        });
    }

    createProductElement(step, product, index) {
        const productItem = document.createElement('div');
        productItem.className = 'product-item';
        productItem.dataset.step = step;
        productItem.dataset.index = index;

        // Product name input with autocomplete
        const nameWrapper = document.createElement('div');
        nameWrapper.className = 'product-name-wrapper';
        
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'product-name';
        nameInput.placeholder = 'Search or type product name...';
        nameInput.value = product.name || '';
        nameInput.autocomplete = 'off';
        nameInput.addEventListener('input', (e) => {
            this.handleProductSearch(e.target, nameWrapper);
            this.autoSave();
        });
        nameInput.addEventListener('focus', (e) => {
            this.handleProductSearch(e.target, nameWrapper);
        });

        // Autocomplete dropdown
        const autocompleteList = document.createElement('div');
        autocompleteList.className = 'autocomplete-list';
        nameWrapper.appendChild(nameInput);
        nameWrapper.appendChild(autocompleteList);

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'product-checkbox';
        checkbox.checked = product.checked || false;
        checkbox.addEventListener('change', () => this.autoSave());

        const notesTextarea = document.createElement('textarea');
        notesTextarea.className = 'product-notes';
        notesTextarea.placeholder = 'Add notes...';
        notesTextarea.value = product.notes || '';
        notesTextarea.addEventListener('input', () => this.autoSave());

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '×';
        deleteBtn.className = 'delete-product-btn';
        deleteBtn.addEventListener('click', () => {
            this.deleteProduct(step, index);
        });

        // Close autocomplete when clicking outside
        const closeAutocomplete = (e) => {
            if (!nameWrapper.contains(e.target)) {
                autocompleteList.innerHTML = '';
                const productItem = nameWrapper.closest('.product-item');
                if (productItem) {
                    productItem.classList.remove('dropdown-open');
                }
            }
        };
        document.addEventListener('click', closeAutocomplete);

        productItem.appendChild(nameWrapper);
        productItem.appendChild(deleteBtn);
        productItem.appendChild(checkbox);
        productItem.appendChild(notesTextarea);

        return productItem;
    }

    handleProductSearch(input, wrapper) {
        const query = input.value.toLowerCase().trim();
        const autocompleteList = wrapper.querySelector('.autocomplete-list');
        const productItem = wrapper.closest('.product-item');
        
        if (query.length < 1) {
            autocompleteList.innerHTML = '';
            if (productItem) {
                productItem.classList.remove('dropdown-open');
            }
            return;
        }

        // Filter products that match the query
        const matches = PRODUCT_DATABASE.filter(product => 
            product.toLowerCase().includes(query)
        ).slice(0, 8); // Limit to 8 results

        if (matches.length === 0) {
            autocompleteList.innerHTML = '';
            if (productItem) {
                productItem.classList.remove('dropdown-open');
            }
            return;
        }

        // Create dropdown items
        autocompleteList.innerHTML = '';
        if (productItem) {
            productItem.classList.add('dropdown-open');
        }
        
        matches.forEach(product => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.textContent = product;
            item.addEventListener('click', () => {
                input.value = product;
                autocompleteList.innerHTML = '';
                if (productItem) {
                    productItem.classList.remove('dropdown-open');
                }
                input.focus();
                this.autoSave();
            });
            autocompleteList.appendChild(item);
        });
    }

    addProduct(step) {
        const productsList = document.querySelector(`[data-step="${step}"]`);
        if (!productsList) return;

        const newProduct = {
            name: 'Product',
            checked: false,
            notes: ''
        };

        const productEl = this.createProductElement(step, newProduct, productsList.children.length);
        productsList.appendChild(productEl);
        this.autoSave();
    }

    deleteProduct(step, index) {
        const productsList = document.querySelector(`[data-step="${step}"]`);
        if (!productsList) return;

        const productItem = productsList.children[index];
        if (productsList.children.length <= 1) {
            alert('You must have at least one product per step.');
            return;
        }

        productItem.remove();
        this.autoSave();
    }

    autoSave() {
        if (!auth.currentUser) return;

        const users = JSON.parse(localStorage.getItem('skincareUsers') || '{}');
        const user = users[auth.currentUser];
        if (!user) return;

        const mode = this.isDaytime ? 'daytime' : 'nighttime';
        const routine = {};

        // Collect data from each step
        ['cleanser', 'toner', 'serum', 'massage', 'tool', 'treatment', 'spf'].forEach(step => {
            const productsList = document.querySelector(`[data-step="${step}"]`);
            if (!productsList) return;

            routine[step] = [];
            Array.from(productsList.children).forEach(productItem => {
                const nameInput = productItem.querySelector('.product-name');
                const checkbox = productItem.querySelector('.product-checkbox');
                const notesTextarea = productItem.querySelector('.product-notes');

                routine[step].push({
                    name: nameInput.value.trim() || 'Product',
                    checked: checkbox.checked,
                    notes: notesTextarea.value.trim()
                });
            });
        });

        user.routines[mode] = routine;
        users[auth.currentUser] = user;
        localStorage.setItem('skincareUsers', JSON.stringify(users));
    }

    saveRoutine() {
        // Save the routine first
        this.autoSave();
        
        // Get the current routine for display
        const routine = this.getCurrentRoutine();

        // Show save confirmation
        const saveBtn = document.getElementById('save-btn');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Saved!';
        saveBtn.style.background = '#ff1493';
        setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.style.background = '';
        }, 2000);

        // Show checklist summary
        this.showChecklistSummary(routine);
    }

    showChecklistSummary(routine) {
        const checklistSummary = document.getElementById('checklist-summary');
        const checklistContent = document.getElementById('checklist-content');
        
        const stepNames = {
            cleanser: '1. Cleanser',
            toner: '2. Toner',
            serum: '3. Conductive Serum',
            massage: '4. Massage',
            tool: '5. Tool',
            treatment: '6. Treatment',
            spf: '7. SPF'
        };

        let html = '<div class="checklist-grid">';
        
        Object.keys(stepNames).forEach(step => {
            if (step === 'spf' && !this.isDaytime) return;
            
            const products = routine[step] || [];
            if (products.length === 0) return;

            html += `<div class="checklist-step">`;
            html += `<h3>${stepNames[step]}</h3>`;
            html += '<ul class="checklist-items">';
            
            products.forEach(product => {
                const checked = product.checked ? 'checked' : '';
                const name = product.name || 'Product';
                html += `<li class="checklist-item ${checked}">`;
                html += `<span class="check-icon">${product.checked ? '✓' : '○'}</span>`;
                html += `<span class="check-name">${name}</span>`;
                if (product.notes) {
                    html += `<span class="check-notes">${product.notes}</span>`;
                }
                html += `</li>`;
            });
            
            html += '</ul></div>';
        });

        html += '</div>';
        checklistContent.innerHTML = html;
        checklistSummary.classList.remove('hidden');
        
        // Scroll to checklist
        checklistSummary.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    printRoutine() {
        // Create print-friendly version
        const printWindow = window.open('', '_blank');
        const routine = this.getCurrentRoutine();
        
        const stepNames = {
            cleanser: '1. Cleanser',
            toner: '2. Toner',
            serum: '3. Conductive Serum',
            massage: '4. Massage',
            tool: '5. Tool',
            treatment: '6. Treatment',
            spf: '7. SPF'
        };

        let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Skincare Routine Checklist</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: Arial, sans-serif;
                    padding: 20px;
                    font-size: 10px;
                    line-height: 1.3;
                }
                .print-header {
                    text-align: center;
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #ff1493;
                }
                .print-header h1 {
                    font-size: 18px;
                    color: #ff1493;
                    margin-bottom: 5px;
                }
                .print-mode {
                    font-size: 11px;
                    color: #666;
                }
                .print-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 12px;
                    margin-top: 10px;
                }
                .print-step {
                    break-inside: avoid;
                    page-break-inside: avoid;
                }
                .print-step h3 {
                    font-size: 11px;
                    color: #ff1493;
                    margin-bottom: 6px;
                    font-weight: bold;
                    border-bottom: 1px solid #ffc0e5;
                    padding-bottom: 3px;
                }
                .print-items {
                    list-style: none;
                    font-size: 9px;
                }
                .print-item {
                    padding: 4px 0;
                    display: flex;
                    align-items: flex-start;
                    gap: 6px;
                }
                .print-item.checked {
                    text-decoration: line-through;
                    color: #999;
                }
                .print-checkbox {
                    width: 10px;
                    height: 10px;
                    border: 1.5px solid #ff1493;
                    display: inline-block;
                    flex-shrink: 0;
                    margin-top: 2px;
                }
                .print-item.checked .print-checkbox {
                    background: #ff1493;
                    position: relative;
                }
                .print-item.checked .print-checkbox::after {
                    content: '✓';
                    color: white;
                    font-size: 7px;
                    position: absolute;
                    top: -1px;
                    left: 1px;
                }
                .print-name {
                    flex: 1;
                }
                @media print {
                    @page {
                        size: letter;
                        margin: 0.5cm;
                    }
                    body {
                        padding: 10px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="print-header">
                <h1>Skincare Routine Checklist</h1>
                <div class="print-mode">${this.isDaytime ? 'Daytime' : 'Nighttime'} Routine</div>
            </div>
            <div class="print-grid">
        `;

        Object.keys(stepNames).forEach(step => {
            if (step === 'spf' && !this.isDaytime) return;
            
            const products = routine[step] || [];
            if (products.length === 0) return;

            html += `<div class="print-step">`;
            html += `<h3>${stepNames[step]}</h3>`;
            html += '<ul class="print-items">';
            
            products.forEach(product => {
                const checked = product.checked ? 'checked' : '';
                const name = product.name || 'Product';
                html += `<li class="print-item ${checked}">`;
                html += `<span class="print-checkbox"></span>`;
                html += `<span class="print-name">${name}</span>`;
                html += `</li>`;
            });
            
            html += '</ul></div>';
        });

        html += `
            </div>
        </body>
        </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        
        setTimeout(() => {
            printWindow.print();
        }, 250);
    }

    getCurrentRoutine() {
        if (!auth.currentUser) return {};

        const users = JSON.parse(localStorage.getItem('skincareUsers') || '{}');
        const user = users[auth.currentUser];
        if (!user) return {};

        const mode = this.isDaytime ? 'daytime' : 'nighttime';
        return user.routines[mode] || {};
    }
}

// Initialize the application
let auth;
let app;

document.addEventListener('DOMContentLoaded', () => {
    auth = new AuthSystem();
    app = new SkincareApp();
    
    // If user was already logged in, load their routine now
    if (auth.currentUser) {
        app.loadRoutine();
    }
    
    // Listen for mode changes to reload routine
    document.getElementById('dayNightToggle').addEventListener('change', () => {
        setTimeout(() => app.loadRoutine(), 100);
    });
});

