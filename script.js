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
        app.loadRoutine();
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

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'product-name';
        nameInput.placeholder = 'Product';
        nameInput.value = product.name || 'Product';
        nameInput.addEventListener('input', () => this.saveRoutine());

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'product-checkbox';
        checkbox.checked = product.checked || false;
        checkbox.addEventListener('change', () => this.saveRoutine());

        const notesTextarea = document.createElement('textarea');
        notesTextarea.className = 'product-notes';
        notesTextarea.placeholder = 'Add notes...';
        notesTextarea.value = product.notes || '';
        notesTextarea.addEventListener('input', () => this.saveRoutine());

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '×';
        deleteBtn.className = 'delete-product-btn';
        deleteBtn.addEventListener('click', () => {
            this.deleteProduct(step, index);
        });

        productItem.appendChild(nameInput);
        productItem.appendChild(deleteBtn);
        productItem.appendChild(checkbox);
        productItem.appendChild(notesTextarea);

        return productItem;
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
        this.saveRoutine();
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
        this.saveRoutine();
    }

    saveRoutine() {
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

        // Show save confirmation
        const saveBtn = document.getElementById('save-btn');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Saved!';
        saveBtn.style.background = '#ff1493';
        setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.style.background = '';
        }, 2000);
    }

    printRoutine() {
        window.print();
    }
}

// Initialize the application
let auth;
let app;

document.addEventListener('DOMContentLoaded', () => {
    auth = new AuthSystem();
    app = new SkincareApp();
    
    // Listen for mode changes to reload routine
    document.getElementById('dayNightToggle').addEventListener('change', () => {
        setTimeout(() => app.loadRoutine(), 100);
    });
});

