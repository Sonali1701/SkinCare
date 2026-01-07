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
            steps: [
                { id: 'step_1', name: 'Cleanser', order: 1, isSPF: false },
                { id: 'step_2', name: 'Toner', order: 2, isSPF: false },
                { id: 'step_3', name: 'Conductive Serum', order: 3, isSPF: false },
                { id: 'step_4', name: 'Massage', order: 4, isSPF: false },
                { id: 'step_5', name: 'Tool', order: 5, isSPF: false },
                { id: 'step_6', name: 'Treatment', order: 6, isSPF: false },
                { id: 'step_7', name: 'SPF', order: 7, isSPF: true }
            ],
            products: {
                step_1: [{ name: 'Product', checked: false, notes: '' }],
                step_2: [{ name: 'Product', checked: false, notes: '' }],
                step_3: [{ name: 'Product', checked: false, notes: '' }],
                step_4: [{ name: 'Product', checked: false, notes: '' }],
                step_5: [{ name: 'Product', checked: false, notes: '' }],
                step_6: [{ name: 'Product', checked: false, notes: '' }],
                step_7: [{ name: 'Product', checked: false, notes: '' }]
            }
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
        this.stepCounter = 7; // Start from 7 since we have 7 default steps
        this.activeAppTab = 'routine';
        this.allProducts = [];
        this.filteredProducts = [];
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

        // App tabs
        this.setupAppTabs();
        this.setupProductsTab();

        // Save button
        document.getElementById('save-btn').addEventListener('click', () => {
            this.saveRoutine();
        });

        // Print button
        document.getElementById('print-btn').addEventListener('click', () => {
            this.printRoutine();
        });

        // Add step buttons
        document.getElementById('add-step-start').addEventListener('click', () => {
            this.addStepAtPosition(1);
        });
        
        document.getElementById('add-step-end').addEventListener('click', () => {
            this.addStepAtPosition(null);
        });

        // Initial mode update
        this.updateMode();
        
        // Load or create default steps
        this.loadSteps();
    }

    setupAppTabs() {
        const tabButtons = document.querySelectorAll('.app-tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.appTab;
                this.switchAppTab(tab);
            });
        });

        this.switchAppTab(this.activeAppTab);
    }

    switchAppTab(tab) {
        this.activeAppTab = tab;

        document.querySelectorAll('.app-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.appTab === tab);
        });

        const routineContainer = document.querySelector('main.routine-container');
        const productsContainer = document.getElementById('products-container');

        if (routineContainer) {
            routineContainer.classList.toggle('hidden', tab !== 'routine');
        }
        if (productsContainer) {
            productsContainer.classList.toggle('hidden', tab !== 'products');
        }

        if (tab === 'products') {
            this.ensureProductsLoaded();
        }
    }

    setupProductsTab() {
        const searchInput = document.getElementById('products-search');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.applyProductsFilter();
            });
        }

        const fileInput = document.getElementById('products-file-input');
        if (fileInput) {
            fileInput.addEventListener('change', async (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;
                await this.loadProductsFromFile(file);
            });
        }
    }

    setProductsStatus(text) {
        const statusEl = document.getElementById('products-status');
        if (statusEl) statusEl.textContent = text;
    }

    ensureProductsLoaded() {
        if (this.allProducts && this.allProducts.length > 0) {
            this.applyProductsFilter();
            return;
        }

        this.setProductsStatus('Loading products from Excel...');
        this.loadProductsFromWorkbookPath('Skincare Routine.xlsx')
            .then(products => {
                if (products && products.length > 0) {
                    this.allProducts = products;
                    this.setProductsStatus(`Loaded ${products.length} products from Excel.`);
                } else {
                    this.allProducts = [...PRODUCT_DATABASE];
                    this.setProductsStatus(`Could not read Excel automatically. Showing ${this.allProducts.length} products from built-in list. You can use "Upload Excel".`);
                }
                this.applyProductsFilter();
            })
            .catch(() => {
                this.allProducts = [...PRODUCT_DATABASE];
                this.setProductsStatus(`Could not read Excel automatically. Showing ${this.allProducts.length} products from built-in list. You can use "Upload Excel".`);
                this.applyProductsFilter();
            });
    }

    applyProductsFilter() {
        const searchInput = document.getElementById('products-search');
        const q = (searchInput ? searchInput.value : '').trim().toLowerCase();

        const unique = Array.from(new Set((this.allProducts || []).map(p => (p || '').trim()).filter(Boolean)));
        const filtered = q
            ? unique.filter(p => p.toLowerCase().includes(q))
            : unique;

        this.filteredProducts = filtered;
        this.renderProducts();
    }

    renderProducts() {
        const listEl = document.getElementById('products-list');
        if (!listEl) return;

        const rows = (this.filteredProducts || []).map((p, idx) => {
            const safe = String(p);
            return `<tr><td>${idx + 1}</td><td>${safe}</td></tr>`;
        }).join('');

        listEl.innerHTML = `
            <table class="products-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Product</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows || '<tr><td colspan="2">No products found.</td></tr>'}
                </tbody>
            </table>
        `;
    }

    async loadProductsFromFile(file) {
        this.setProductsStatus('Reading uploaded Excel...');

        if (!window.XLSX) {
            this.setProductsStatus('Excel parser not available. Please check your internet connection (xlsx CDN).');
            return;
        }

        const arrayBuffer = await file.arrayBuffer();
        const workbook = window.XLSX.read(arrayBuffer, { type: 'array' });
        const products = this.extractProductsFromWorkbook(workbook);

        if (products.length === 0) {
            this.setProductsStatus('No products found in uploaded Excel.');
            return;
        }

        this.allProducts = products;
        this.setProductsStatus(`Loaded ${products.length} products from uploaded Excel.`);
        this.applyProductsFilter();
    }

    async loadProductsFromWorkbookPath(path) {
        if (!window.XLSX) {
            return [];
        }

        const resp = await fetch(path);
        if (!resp.ok) {
            return [];
        }

        const arrayBuffer = await resp.arrayBuffer();
        const workbook = window.XLSX.read(arrayBuffer, { type: 'array' });
        return this.extractProductsFromWorkbook(workbook);
    }

    extractProductsFromWorkbook(workbook) {
        try {
            const sheetNames = workbook.SheetNames || [];
            const all = [];

            sheetNames.forEach(name => {
                const ws = workbook.Sheets[name];
                if (!ws) return;

                const rows = window.XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });
                if (!rows || rows.length === 0) return;

                rows.forEach((row, rIdx) => {
                    if (!row) return;
                    row.forEach((cell, cIdx) => {
                        if (cell == null) return;
                        const text = String(cell).trim();
                        if (!text) return;
                        if (rIdx === 0 && cIdx === 0) {
                            // Allow header cells to be processed too (some sheets are just lists)
                        }
                        // Basic heuristics: filter out obvious non-product placeholders
                        if (text.length < 2) return;
                        all.push(text);
                    });
                });
            });

            // Try to reduce noise by removing common headers
            const banned = new Set(['product', 'products', 'notes', 'step', 'steps', 'brand']);
            return all
                .map(s => s.trim())
                .filter(s => s && !banned.has(s.toLowerCase()));
        } catch {
            return [];
        }
    }

    updateMode() {
        const label = document.getElementById('mode-label');
        
        if (this.isDaytime) {
            label.textContent = 'Daytime';
        } else {
            label.textContent = 'Nighttime';
        }
        
        // Update SPF step visibility
        document.querySelectorAll('.step-column[data-is-spf="true"]').forEach(column => {
            if (this.isDaytime) {
                column.classList.remove('hidden-night');
            } else {
                column.classList.add('hidden-night');
            }
        });
    }

    migrateRoutine(oldRoutine) {
        // Check if it's already in new format
        if (oldRoutine.steps && oldRoutine.products) {
            return oldRoutine;
        }

        // Old format: { cleanser: [...], toner: [...], ... }
        // New format: { steps: [...], products: { step_1: [...], ... } }
        const stepMapping = {
            cleanser: { name: 'Cleanser', order: 1, isSPF: false },
            toner: { name: 'Toner', order: 2, isSPF: false },
            serum: { name: 'Conductive Serum', order: 3, isSPF: false },
            massage: { name: 'Massage', order: 4, isSPF: false },
            tool: { name: 'Tool', order: 5, isSPF: false },
            treatment: { name: 'Treatment', order: 6, isSPF: false },
            spf: { name: 'SPF', order: 7, isSPF: true }
        };

        const newRoutine = {
            steps: [],
            products: {}
        };

        Object.keys(stepMapping).forEach((oldKey, index) => {
            const stepInfo = stepMapping[oldKey];
            const stepId = `step_${index + 1}`;
            
            newRoutine.steps.push({
                id: stepId,
                name: stepInfo.name,
                order: stepInfo.order,
                isSPF: stepInfo.isSPF
            });

            newRoutine.products[stepId] = oldRoutine[oldKey] || [{ name: 'Product', checked: false, notes: '' }];
        });

        return newRoutine;
    }

    loadSteps() {
        if (!auth.currentUser) {
            // Create default steps for new user
            this.renderSteps(auth.getDefaultRoutine());
            return;
        }

        const users = JSON.parse(localStorage.getItem('skincareUsers') || '{}');
        const user = users[auth.currentUser];
        if (!user) {
            this.renderSteps(auth.getDefaultRoutine());
            return;
        }

        const mode = this.isDaytime ? 'daytime' : 'nighttime';
        let routine = user.routines[mode];
        
        if (!routine) {
            routine = auth.getDefaultRoutine();
        } else {
            // Migrate old format to new format if needed
            routine = this.migrateRoutine(routine);
            
            // Save migrated routine back
            user.routines[mode] = routine;
            users[auth.currentUser] = user;
            localStorage.setItem('skincareUsers', JSON.stringify(users));
        }
        
        this.renderSteps(routine);
    }

    renderSteps(routine) {
        const routineGrid = document.getElementById('routine-grid');
        routineGrid.innerHTML = '';

        // Sort steps by order
        const sortedSteps = [...routine.steps].sort((a, b) => a.order - b.order);

        sortedSteps.forEach((step, index) => {
            const stepColumn = this.createStepColumn(step, routine.products[step.id] || []);
            routineGrid.appendChild(stepColumn);
        });

        // Update step counter
        if (sortedSteps.length > 0) {
            const stepIds = sortedSteps.map(s => {
                const match = s.id.match(/step_(\d+)/);
                return match ? parseInt(match[1]) : 0;
            });
            this.stepCounter = Math.max(...stepIds, 0);
        } else {
            this.stepCounter = 0;
        }
    }

    createStepColumn(step, products) {
        const stepColumn = document.createElement('div');
        stepColumn.className = 'step-column';
        stepColumn.dataset.stepId = step.id;
        stepColumn.dataset.isSpf = step.isSPF ? 'true' : 'false';
        
        if (step.isSPF && !this.isDaytime) {
            stepColumn.classList.add('hidden-night');
        }

        const stepNumber = step.order;
        
        // Step header with controls
        const stepHeader = document.createElement('div');
        stepHeader.className = 'step-header';
        
        // Step title display
        const titleDisplay = document.createElement('div');
        titleDisplay.className = 'step-title-display';
        titleDisplay.textContent = `${stepNumber} Step ${step.name}`;
        
        // Step title input (hidden by default)
        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.className = 'step-title-input hidden';
        titleInput.value = step.name;
        
        // Control buttons container
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'step-controls';
        
        // Add step before button
        const addBeforeBtn = document.createElement('button');
        addBeforeBtn.className = 'step-control-btn add-before-btn';
        addBeforeBtn.innerHTML = '⬆';
        addBeforeBtn.title = 'Add Step Before';
        addBeforeBtn.addEventListener('click', () => {
            this.addStepAtPosition(step.order);
        });
        
        // Add step after button
        const addAfterBtn = document.createElement('button');
        addAfterBtn.className = 'step-control-btn add-after-btn';
        addAfterBtn.innerHTML = '⬇';
        addAfterBtn.title = 'Add Step After';
        addAfterBtn.addEventListener('click', () => {
            this.addStepAtPosition(step.order + 1);
        });
        
        // Shift left button
        const shiftLeftBtn = document.createElement('button');
        shiftLeftBtn.className = 'step-control-btn shift-left-btn';
        shiftLeftBtn.innerHTML = '◀';
        shiftLeftBtn.title = 'Move Left';
        shiftLeftBtn.addEventListener('click', () => {
            this.shiftStep(step.id, 'left');
        });
        
        // Shift right button
        const shiftRightBtn = document.createElement('button');
        shiftRightBtn.className = 'step-control-btn shift-right-btn';
        shiftRightBtn.innerHTML = '▶';
        shiftRightBtn.title = 'Move Right';
        shiftRightBtn.addEventListener('click', () => {
            this.shiftStep(step.id, 'right');
        });
        
        // Rename button
        const renameBtn = document.createElement('button');
        renameBtn.className = 'step-control-btn rename-btn';
        renameBtn.innerHTML = '✏️';
        renameBtn.title = 'Rename Step';
        renameBtn.addEventListener('click', () => {
            titleDisplay.classList.add('hidden');
            titleInput.classList.remove('hidden');
            titleInput.focus();
            titleInput.select();
        });
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'step-control-btn delete-btn';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.title = 'Delete Step';
        deleteBtn.addEventListener('click', () => {
            this.deleteStep(step.id);
        });
        
        // Handle title input
        titleInput.addEventListener('blur', () => {
            const newName = titleInput.value.trim() || step.name;
            this.updateStepName(step.id, newName);
            titleDisplay.textContent = `${stepNumber} Step ${newName}`;
            titleDisplay.classList.remove('hidden');
            titleInput.classList.add('hidden');
        });
        
        titleInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.target.blur();
            }
            if (e.key === 'Escape') {
                titleInput.value = step.name;
                titleDisplay.classList.remove('hidden');
                titleInput.classList.add('hidden');
            }
        });

        controlsDiv.appendChild(addBeforeBtn);
        controlsDiv.appendChild(addAfterBtn);
        controlsDiv.appendChild(shiftLeftBtn);
        controlsDiv.appendChild(shiftRightBtn);
        controlsDiv.appendChild(renameBtn);
        controlsDiv.appendChild(deleteBtn);
        
        stepHeader.appendChild(titleDisplay);
        stepHeader.appendChild(titleInput);
        stepHeader.appendChild(controlsDiv);

        const stepDivider = document.createElement('div');
        stepDivider.className = 'step-divider';

        const productsList = document.createElement('div');
        productsList.className = 'products-list';
        productsList.dataset.step = step.id;

        // Add products
        if (products.length === 0) {
            products = [{ name: 'Product', checked: false, notes: '' }];
        }
        products.forEach((product, index) => {
            const productEl = this.createProductElement(step.id, product, index);
            productsList.appendChild(productEl);
        });

        const addProductBtn = document.createElement('button');
        addProductBtn.className = 'add-product-btn';
        addProductBtn.dataset.step = step.id;
        addProductBtn.textContent = '+ Add Product';
        addProductBtn.addEventListener('click', () => {
            this.addProduct(step.id);
        });

        stepColumn.appendChild(stepHeader);
        stepColumn.appendChild(stepDivider);
        stepColumn.appendChild(productsList);
        stepColumn.appendChild(addProductBtn);

        return stepColumn;
    }

    addStepAtPosition(position) {
        if (!auth.currentUser) {
            alert('Please login to add steps');
            return;
        }

        const stepName = prompt('Enter step name:', 'New Step');
        if (!stepName || !stepName.trim()) return;

        this.stepCounter++;
        const stepId = `step_${this.stepCounter}`;

        const users = JSON.parse(localStorage.getItem('skincareUsers') || '{}');
        const user = users[auth.currentUser];
        const mode = this.isDaytime ? 'daytime' : 'nighttime';
        let routine = user.routines[mode];
        
        if (!routine) {
            routine = auth.getDefaultRoutine();
        } else {
            // Migrate if needed
            routine = this.migrateRoutine(routine);
        }

        // Determine new order
        let newOrder;
        if (position === null || position > routine.steps.length) {
            // Add at the end
            newOrder = routine.steps.length + 1;
        } else {
            // Insert at specific position
            newOrder = Math.max(1, Math.min(routine.steps.length + 1, position));
            // Shift all steps at or after this position
            routine.steps.forEach(step => {
                if (step.order >= newOrder) {
                    step.order++;
                }
            });
        }

        // Create new step
        const newStep = {
            id: stepId,
            name: stepName.trim(),
            order: newOrder,
            isSPF: false
        };

        routine.steps.push(newStep);
        routine.products[stepId] = [{ name: 'Product', checked: false, notes: '' }];

        // Reorder all steps to ensure sequential ordering
        routine.steps.sort((a, b) => a.order - b.order);
        routine.steps.forEach((step, index) => {
            step.order = index + 1;
        });

        user.routines[mode] = routine;
        users[auth.currentUser] = user;
        localStorage.setItem('skincareUsers', JSON.stringify(users));

        this.renderSteps(routine);
    }

    shiftStep(stepId, direction) {
        if (!auth.currentUser) return;

        const users = JSON.parse(localStorage.getItem('skincareUsers') || '{}');
        const user = users[auth.currentUser];
        const mode = this.isDaytime ? 'daytime' : 'nighttime';
        let routine = user.routines[mode];
        
        if (!routine) {
            routine = auth.getDefaultRoutine();
        } else {
            // Migrate if needed
            routine = this.migrateRoutine(routine);
        }

        const step = routine.steps.find(s => s.id === stepId);
        if (!step) return;

        const currentOrder = step.order;
        let newOrder;

        if (direction === 'left') {
            newOrder = Math.max(1, currentOrder - 1);
        } else {
            newOrder = Math.min(routine.steps.length, currentOrder + 1);
        }

        if (newOrder === currentOrder) return;

        // Swap with the step at newOrder
        const otherStep = routine.steps.find(s => s.order === newOrder);
        if (otherStep) {
            step.order = newOrder;
            otherStep.order = currentOrder;
        }

        // Reorder all steps
        routine.steps.sort((a, b) => a.order - b.order);
        routine.steps.forEach((s, index) => {
            s.order = index + 1;
        });

        user.routines[mode] = routine;
        users[auth.currentUser] = user;
        localStorage.setItem('skincareUsers', JSON.stringify(users));

        this.renderSteps(routine);
    }

    deleteStep(stepId) {
        if (!auth.currentUser) return;

        if (!confirm('Are you sure you want to delete this step? All products in this step will be removed.')) {
            return;
        }

        const users = JSON.parse(localStorage.getItem('skincareUsers') || '{}');
        const user = users[auth.currentUser];
        const mode = this.isDaytime ? 'daytime' : 'nighttime';
        let routine = user.routines[mode];
        
        if (!routine) {
            routine = auth.getDefaultRoutine();
        } else {
            // Migrate if needed
            routine = this.migrateRoutine(routine);
        }

        // Remove step
        routine.steps = routine.steps.filter(s => s.id !== stepId);
        delete routine.products[stepId];

        // Reorder remaining steps
        routine.steps.forEach((step, index) => {
            step.order = index + 1;
        });

        user.routines[mode] = routine;
        users[auth.currentUser] = user;
        localStorage.setItem('skincareUsers', JSON.stringify(users));

        this.renderSteps(routine);
    }

    updateStepName(stepId, stepName) {
        if (!auth.currentUser) return;

        const users = JSON.parse(localStorage.getItem('skincareUsers') || '{}');
        const user = users[auth.currentUser];
        const mode = this.isDaytime ? 'daytime' : 'nighttime';
        let routine = user.routines[mode];
        
        if (!routine) {
            routine = auth.getDefaultRoutine();
        } else {
            // Migrate if needed
            routine = this.migrateRoutine(routine);
        }

        const step = routine.steps.find(s => s.id === stepId);
        if (step) {
            step.name = stepName.trim() || 'New Step';
            const stepNumber = step.order;
            const titleDisplay = document.querySelector(`[data-step-id="${stepId}"] .step-title-display`);
            if (titleDisplay) {
                titleDisplay.textContent = `${stepNumber} Step ${step.name}`;
            }
        }

        user.routines[mode] = routine;
        users[auth.currentUser] = user;
        localStorage.setItem('skincareUsers', JSON.stringify(users));
    }

    loadRoutine() {
        this.loadSteps();
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

        // Update products for each step
        routine.steps.forEach(step => {
            const productsList = document.querySelector(`[data-step="${step.id}"]`);
            if (!productsList) return;

            routine.products[step.id] = [];
            Array.from(productsList.children).forEach(productItem => {
                const nameInput = productItem.querySelector('.product-name');
                const checkbox = productItem.querySelector('.product-checkbox');
                const notesTextarea = productItem.querySelector('.product-notes');

                routine.products[step.id].push({
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
        this.showChecklistSummary(displayRoutine);
    }

    showChecklistSummary(routine) {
        const checklistSummary = document.getElementById('checklist-summary');
        const checklistContent = document.getElementById('checklist-content');
        
        // Sort steps by order
        const sortedSteps = [...routine.steps].sort((a, b) => a.order - b.order);

        let html = '<div class="checklist-grid">';
        
        sortedSteps.forEach(step => {
            // Skip SPF in nighttime mode
            if (step.isSPF && !this.isDaytime) return;
            
            const products = routine.products[step.id] || [];
            if (products.length === 0) return;

            html += `<div class="checklist-step">`;
            html += `<h3>${step.order}. ${step.name}</h3>`;
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
        let routine = this.getCurrentRoutine();
        
        // Migrate if needed
        if (!routine.steps || !Array.isArray(routine.steps)) {
            routine = this.migrateRoutine(routine);
        }
        
        // Sort steps by order
        const sortedSteps = [...routine.steps].sort((a, b) => a.order - b.order);

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

        sortedSteps.forEach(step => {
            // Skip SPF in nighttime mode
            if (step.isSPF && !this.isDaytime) return;
            
            const products = routine.products[step.id] || [];
            if (products.length === 0) return;

            html += `<div class="print-step">`;
            html += `<h3>${step.order}. ${step.name}</h3>`;
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
        if (!auth.currentUser) return auth.getDefaultRoutine();

        const users = JSON.parse(localStorage.getItem('skincareUsers') || '{}');
        const user = users[auth.currentUser];
        if (!user) return auth.getDefaultRoutine();

        const mode = this.isDaytime ? 'daytime' : 'nighttime';
        return user.routines[mode] || auth.getDefaultRoutine();
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

