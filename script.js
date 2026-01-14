function createDefaultRoutine() {
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

// Authentication System powered by Firebase
class AuthSystem {
    constructor(appInstance) {
        if (!window.firebase || !firebase.auth || !firebase.firestore) {
            throw new Error('Firebase SDK is required but was not found.');
        }

        this.appInstance = appInstance || null;
        this.auth = firebase.auth();
        this.db = firebase.firestore();
        this.currentUser = null;
        this.routineCache = null;

        if (this.appInstance && typeof this.appInstance.setAuthSystem === 'function') {
            this.appInstance.setAuthSystem(this);
        }

        this.init();
    }

    init() {
        this.setupAuthListeners();
        this.auth.onAuthStateChanged(async (user) => {
            try {
                await this.handleAuthStateChange(user);
            } catch (error) {
                console.error('Failed to process auth state change:', error);
            }
        });
    }

    setupAuthListeners() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
            });
        });

        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login().catch(error => {
                console.error('Login failed:', error);
            });
        });

        document.getElementById('signupForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.signup().catch(error => {
                console.error('Signup failed:', error);
            });
        });

        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout().catch(error => {
                console.error('Logout failed:', error);
            });
        });
    }

    switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.toggle('active', form.id === `${tab}-form`);
        });

        this.clearErrors();
    }

    clearErrors() {
        document.getElementById('login-error').textContent = '';
        document.getElementById('signup-error').textContent = '';
    }

    async handleAuthStateChange(user) {
        if (user) {
            this.currentUser = user;
            const library = await this.ensureUserRoutineLibrary(user);
            this.showApp();
            if (this.appInstance) {
                await this.appInstance.onUserAuthenticated(user, library);
            }
        } else {
            this.currentUser = null;
            this.routineCache = null;
            this.showAuth();
            if (this.appInstance) {
                await this.appInstance.onUserAuthenticated(null, null);
            }
        }
    }

    showAuth() {
        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('app-container').classList.add('hidden');
        this.clearErrors();
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        if (loginForm) loginForm.reset();
        if (signupForm) signupForm.reset();
    }

    showApp() {
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
    }

    async login() {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const errorEl = document.getElementById('login-error');

        if (!email || !password) {
            errorEl.textContent = 'Please fill in all fields';
            return;
        }

        try {
            await this.auth.signInWithEmailAndPassword(email, password);
            errorEl.textContent = '';
        } catch (error) {
            errorEl.textContent = this.getFriendlyError(error);
            throw error;
        }
    }

    async signup() {
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

        try {
            const credential = await this.auth.createUserWithEmailAndPassword(email, password);
            await this.ensureUserRoutineLibrary(credential.user, { forceCreate: true });
            errorEl.textContent = '';
        } catch (error) {
            errorEl.textContent = this.getFriendlyError(error);
            throw error;
        }
    }

    async logout() {
        await this.auth.signOut();
    }

    cloneRoutine(routine) {
        const source = routine && routine.steps ? routine : this.getDefaultRoutine();
        return JSON.parse(JSON.stringify(source));
    }

    createRoutinePack(name, daytimeRoutine, nighttimeRoutine) {
        const timestamp = Date.now();
        const id = `routine_${timestamp}_${Math.floor(Math.random() * 100000)}`;
        return {
            id,
            name: (name && name.trim()) || 'My Routine',
            createdAt: timestamp,
            updatedAt: timestamp,
            daytime: this.cloneRoutine(daytimeRoutine),
            nighttime: this.cloneRoutine(nighttimeRoutine)
        };
    }

    getCurrentRoutineName() {
        const library = this.routineLibrary;
        if (!library || !library.items) return '';
        const id = this.currentRoutineId || library.currentId;
        const pack = id ? library.items[id] : null;
        return pack && pack.name ? String(pack.name) : '';
    }

    createDefaultLibrary() {
        const pack = this.createRoutinePack('My Routine');
        return {
            currentId: pack.id,
            order: [pack.id],
            items: {
                [pack.id]: pack
            }
        };
    }

    normalizeLibrary(library) {
        let normalized = library && typeof library === 'object'
            ? JSON.parse(JSON.stringify(library))
            : null;

        if (!normalized || typeof normalized !== 'object') {
            return this.createDefaultLibrary();
        }

        normalized.items = normalized.items && typeof normalized.items === 'object'
            ? normalized.items
            : {};

        if (!Array.isArray(normalized.order)) {
            normalized.order = Object.keys(normalized.items);
        }

        normalized.order = normalized.order.filter(id => normalized.items[id]);

        if (normalized.order.length === 0 || Object.keys(normalized.items).length === 0) {
            return this.createDefaultLibrary();
        }

        if (!normalized.currentId || !normalized.items[normalized.currentId]) {
            normalized.currentId = normalized.order[0];
        }

        return normalized;
    }

    async ensureUserRoutineLibrary(user, options = {}) {
        if (!user) return null;

        const userRef = this.db.collection('users').doc(user.uid);
        const snapshot = await userRef.get();

        if (!snapshot.exists || options.forceCreate) {
            const library = this.createDefaultLibrary();
            await userRef.set({
                email: user.email || '',
                routineLibrary: library,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            this.routineCache = library;
            return library;
        }

        const data = snapshot.data() || {};
        const library = this.normalizeLibrary(data.routineLibrary);

        if (!data.routineLibrary) {
            await userRef.set({
                routineLibrary: library,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }

        this.routineCache = library;
        return library;
    }

    async fetchRoutineLibrary(forceReload = false) {
        if (!this.currentUser) return null;

        if (!forceReload && this.routineCache) {
            return this.normalizeLibrary(this.routineCache);
        }

        const library = await this.ensureUserRoutineLibrary(this.currentUser);
        return this.normalizeLibrary(library);
    }

    async saveRoutineLibrary(library) {
        if (!this.currentUser) {
            throw new Error('Cannot save routines without an authenticated user.');
        }

        const normalized = this.normalizeLibrary(library);
        const userRef = this.db.collection('users').doc(this.currentUser.uid);

        await userRef.set({
            routineLibrary: normalized,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        this.routineCache = normalized;
        return normalized;
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

    getFriendlyError(error) {
        if (!error || !error.code) return 'Something went wrong. Please try again.';

        const code = error.code;
        if (code === 'auth/email-already-in-use') return 'Email already registered. Please login.';
        if (code === 'auth/invalid-email') return 'Please enter a valid email address.';
        if (code === 'auth/wrong-password' || code === 'auth/user-not-found') return 'Invalid email or password.';
        if (code === 'auth/weak-password') return 'Password must be at least 6 characters.';

        return error.message || 'Something went wrong. Please try again.';
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
        this.productCatalog = [];
        this.filteredCatalog = [];
        this.currentRoutineId = null;
        this.libraryElements = {};
        this.statusTimeout = null;
        this.authSystem = null;
        this.routineLibrary = null;
        this.isLibraryLoading = false;
        this.pendingSaveTimeout = null;
        this.pendingSaveDelay = 600;
        this.init();
    }

    init() {
        // Day/Night toggle
        const toggle = document.getElementById('dayNightToggle');
        toggle.addEventListener('change', (e) => {
            this.handleModeToggle(e.target.checked);
        });
        toggle.checked = true; // Default to daytime

        // App tabs
        this.setupAppTabs();
        this.setupProductsTab();
        this.setupRoutineLibrary();

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

    setAuthSystem(authSystem) {
        this.authSystem = authSystem;
    }

    async onUserAuthenticated(user, routineLibrary) {
        if (!user) {
            this.routineLibrary = null;
            this.currentRoutineId = null;
            this.setRoutineControlsDisabled(true);
            this.renderSteps(createDefaultRoutine());
            this.refreshRoutineLibraryUI('Login to manage routines.');
            return;
        }

        this.routineLibrary = routineLibrary ? this.normalizeLibrary(routineLibrary) : this.normalizeLibrary(null);
        this.currentRoutineId = this.routineLibrary.currentId || null;
        this.setRoutineControlsDisabled(false);
        this.loadRoutine({ statusMessage: 'Routines synced.' });
    }

    normalizeLibrary(library) {
        const normalized = library && typeof library === 'object'
            ? JSON.parse(JSON.stringify(library))
            : null;

        if (!normalized || !normalized.items || typeof normalized.items !== 'object') {
            const pack = this.createRoutinePack('My Routine');
            return {
                currentId: pack.id,
                order: [pack.id],
                items: { [pack.id]: pack }
            };
        }

        if (!Array.isArray(normalized.order)) {
            normalized.order = Object.keys(normalized.items);
        }

        normalized.order = normalized.order.filter(id => normalized.items[id]);

        if (!normalized.currentId || !normalized.items[normalized.currentId]) {
            normalized.currentId = normalized.order[0] || Object.keys(normalized.items)[0] || null;
        }

        if (!normalized.currentId) {
            const pack = this.createRoutinePack('My Routine');
            normalized.currentId = pack.id;
            normalized.order = [pack.id];
            normalized.items = { [pack.id]: pack };
        }

        return normalized;
    }

    ensureRoutineLibrary() {
        if (!this.getCurrentUser()) {
            this.routineLibrary = null;
            return null;
        }

        if (!this.routineLibrary) {
            this.routineLibrary = this.normalizeLibrary(null);
            this.queueLibrarySave();
        }

        return this.routineLibrary;
    }

    queueLibrarySave() {
        if (!this.authSystem || !this.getCurrentUser() || !this.routineLibrary) {
            return;
        }

        this.setRoutineStatus('Saving online...', 10000);

        if (this.pendingSaveTimeout) {
            clearTimeout(this.pendingSaveTimeout);
        }

        this.pendingSaveTimeout = setTimeout(() => {
            this.flushLibrarySave();
        }, this.pendingSaveDelay);
    }

    async flushLibrarySave() {
        if (!this.authSystem || !this.getCurrentUser() || !this.routineLibrary) {
            return;
        }

        const snapshot = JSON.parse(JSON.stringify(this.routineLibrary));
        try {
            this.isLibraryLoading = true;
            const saved = await this.authSystem.saveRoutineLibrary(snapshot);
            this.routineLibrary = this.normalizeLibrary(saved);
            this.setRoutineStatus('Saved online.');
        } catch (error) {
            console.error('Failed to save routines:', error);
            this.setRoutineStatus('Online save failed.');
        } finally {
            this.isLibraryLoading = false;
            this.pendingSaveTimeout = null;
        }
    }

    getCurrentUser() {
        return this.authSystem ? this.authSystem.currentUser : null;
    }

    getDefaultRoutine() {
        return this.authSystem ? this.authSystem.getDefaultRoutine() : createDefaultRoutine();
    }

    cloneRoutine(routine) {
        if (this.authSystem) {
            return this.authSystem.cloneRoutine(routine);
        }
        const source = routine && routine.steps ? routine : this.getDefaultRoutine();
        return JSON.parse(JSON.stringify(source));
    }

    createRoutinePack(name, daytimeRoutine, nighttimeRoutine) {
        if (this.authSystem) {
            return this.authSystem.createRoutinePack(name, daytimeRoutine, nighttimeRoutine);
        }
        const timestamp = Date.now();
        const id = `routine_${timestamp}_${Math.floor(Math.random() * 100000)}`;
        return {
            id,
            name: (name && name.trim()) || 'My Routine',
            createdAt: timestamp,
            updatedAt: timestamp,
            daytime: this.cloneRoutine(daytimeRoutine),
            nighttime: this.cloneRoutine(nighttimeRoutine)
        };
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

    setupRoutineLibrary() {
        const selector = document.getElementById('routine-selector');
        const status = document.getElementById('routine-status');
        const newBtn = document.getElementById('routine-new-btn');
        const renameBtn = document.getElementById('routine-rename-btn');
        const deleteBtn = document.getElementById('routine-delete-btn');

        this.libraryElements = {
            selector,
            status,
            newBtn,
            renameBtn,
            deleteBtn
        };

        if (selector) {
            selector.addEventListener('change', (e) => {
                const routineId = e.target.value;
                this.handleRoutineSelection(routineId);
            });
        }

        if (newBtn) {
            newBtn.addEventListener('click', () => this.createNewRoutine());
        }

        if (renameBtn) {
            renameBtn.addEventListener('click', () => this.renameRoutine());
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteRoutine());
        }

        this.refreshRoutineLibraryUI('Login to manage routines.');
    }

    handleModeToggle(isDaytimeChecked) {
        const previousMode = this.isDaytime ? 'daytime' : 'nighttime';

        if (this.getCurrentUser()) {
            this.autoSave({ modeOverride: previousMode });
        }

        this.isDaytime = !!isDaytimeChecked;
        this.updateMode();

        const modeName = this.isDaytime ? 'Daytime' : 'Nighttime';
        this.loadRoutine({ statusMessage: `${modeName} routine loaded.` });
    }

    setRoutineControlsDisabled(disabled) {
        const { selector, newBtn, renameBtn, deleteBtn } = this.libraryElements;
        const buttons = [newBtn, renameBtn, deleteBtn];
        if (selector) selector.disabled = disabled;
        buttons.forEach(btn => {
            if (btn) {
                btn.disabled = disabled;
            }
        });
    }

    setRoutineStatus(message, timeout = 2500) {
        const { status } = this.libraryElements;
        if (!status) return;

        if (this.statusTimeout) {
            clearTimeout(this.statusTimeout);
            this.statusTimeout = null;
        }

        status.textContent = message || '';

        if (message) {
            this.statusTimeout = setTimeout(() => {
                status.textContent = '';
                this.statusTimeout = null;
            }, timeout);
        }
    }

    refreshRoutineLibraryUI(message) {
        const { selector, deleteBtn } = this.libraryElements;

        if (!selector) return;

        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            selector.innerHTML = '<option value="">Default Routine (not saved)</option>';
            selector.value = '';
            this.setRoutineControlsDisabled(true);
            if (message !== undefined) {
                this.setRoutineStatus(message);
            }
            return;
        }

        let library = this.ensureRoutineLibrary();
        let needsSave = false;

        if (!Array.isArray(library.order) || library.order.length === 0) {
            const pack = this.createRoutinePack('My Routine');
            library.items[pack.id] = pack;
            library.order = [pack.id];
            library.currentId = pack.id;
            this.currentRoutineId = pack.id;
            needsSave = true;
        }

        if (!this.currentRoutineId || !library.items[this.currentRoutineId]) {
            this.currentRoutineId = library.currentId || library.order[0];
        }

        library.currentId = this.currentRoutineId;
        this.routineLibrary = library;

        const options = library.order
            .filter(id => library.items[id])
            .map(id => {
                const pack = library.items[id];
                const name = (pack && pack.name) ? pack.name : 'Routine';
                return `<option value="${id}">${name}</option>`;
            });

        selector.innerHTML = options.join('');
        if (library.currentId && library.items[library.currentId]) {
            selector.value = library.currentId;
        }

        this.setRoutineControlsDisabled(false);

        if (deleteBtn) {
            const availableCount = library.order.filter(id => library.items[id]).length;
            deleteBtn.disabled = availableCount <= 1;
        }

        if (message !== undefined) {
            this.setRoutineStatus(message);
        }

        if (needsSave) {
            this.queueLibrarySave();
        }
    }

    getRoutineContext(modeOverride) {
        if (!this.getCurrentUser()) return null;

        const library = this.ensureRoutineLibrary();
        if (!library || !library.items) return null;

        const targetMode = (() => {
            if (modeOverride === 'daytime' || modeOverride === 'nighttime') return modeOverride;
            if (typeof modeOverride === 'boolean') return modeOverride ? 'daytime' : 'nighttime';
            if (typeof modeOverride === 'string') {
                const lowered = modeOverride.toLowerCase();
                if (lowered === 'daytime' || lowered === 'nighttime') return lowered;
            }
            return this.isDaytime ? 'daytime' : 'nighttime';
        })();

        const currentId = this.currentRoutineId || library.currentId;
        const pack = currentId ? library.items[currentId] : null;
        if (!pack) return null;

        let routine = pack && pack[targetMode] ? pack[targetMode] : this.getDefaultRoutine();
        const migrated = this.migrateRoutine(routine);
        if (pack) {
            pack[targetMode] = migrated;
        }

        const dirty = routine !== migrated;
        return {
            library,
            pack,
            mode: targetMode,
            routine: migrated,
            dirty
        };
    }

    commitContext(context, options = {}) {
        if (!context) return;

        const library = this.ensureRoutineLibrary();

        if (context.library && context.library !== library) {
            this.routineLibrary = this.normalizeLibrary(context.library);
        }

        const activeLibrary = this.ensureRoutineLibrary();

        if (context.pack) {
            activeLibrary.items[context.pack.id] = context.pack;
        }

        if (context.library && context.library.order) {
            activeLibrary.order = [...context.library.order];
        }

        if (options.updateTimestamp && context.pack) {
            context.pack.updatedAt = Date.now();
        }

        if (context.library && context.library.currentId) {
            activeLibrary.currentId = context.library.currentId;
        }

        if (context.currentId) {
            activeLibrary.currentId = context.currentId;
        }

        if (this.currentRoutineId && activeLibrary.items[this.currentRoutineId]) {
            activeLibrary.currentId = this.currentRoutineId;
        }

        this.routineLibrary = this.normalizeLibrary(activeLibrary);

        if (this.getCurrentUser()) {
            this.queueLibrarySave();
        }
    }

    handleRoutineSelection(routineId) {
        if (!this.getCurrentUser()) {
            this.refreshRoutineLibraryUI('Login to manage routines.');
            return;
        }

        this.autoSave();

        const library = this.ensureRoutineLibrary();
        if (!library.items[routineId]) {
            this.refreshRoutineLibraryUI();
            return;
        }

        this.currentRoutineId = routineId;
        library.currentId = routineId;
        this.queueLibrarySave();

        const pack = library.items[routineId];
        const name = pack && pack.name ? pack.name : 'Routine';
        this.loadSteps({ statusMessage: `Switched to "${name}".` });
        this.updateChecklistTitle();
    }

    createNewRoutine() {
        if (!this.getCurrentUser()) {
            this.setRoutineStatus('Login to create routines.');
            return;
        }

        this.autoSave();

        const library = this.ensureRoutineLibrary();
        if (!library) return;

        const defaultName = 'New Routine';
        const nameInput = prompt('Enter a name for the new routine:', defaultName);
        if (!nameInput || !nameInput.trim()) {
            this.setRoutineStatus('Routine creation cancelled.');
            return;
        }

        const trimmedName = nameInput.trim();
        const emptyRoutine = { steps: [], products: {} };
        const newPack = this.createRoutinePack(trimmedName, emptyRoutine, emptyRoutine);

        library.items[newPack.id] = newPack;
        library.order.push(newPack.id);
        library.currentId = newPack.id;
        this.currentRoutineId = newPack.id;

        this.queueLibrarySave();
        this.loadSteps({ statusMessage: `Created routine "${trimmedName}". Add steps to begin.` });
        this.refreshRoutineLibraryUI();
    }

    renameRoutine() {
        if (!this.getCurrentUser()) {
            this.setRoutineStatus('Login to rename routines.');
            return;
        }

        this.autoSave();

        const library = this.ensureRoutineLibrary();
        const pack = library.items[this.currentRoutineId];
        if (!pack) return;

        const currentName = pack.name || 'My Routine';
        const nameInput = prompt('Rename routine:', currentName);
        if (!nameInput || !nameInput.trim() || nameInput.trim() === currentName) {
            return;
        }

        pack.name = nameInput.trim();
        pack.updatedAt = Date.now();
        library.items[pack.id] = pack;
        this.queueLibrarySave();
        this.refreshRoutineLibraryUI(`Renamed routine to "${pack.name}".`);
        this.updateChecklistTitle();
    }

    deleteRoutine() {
        if (!this.getCurrentUser()) {
            this.setRoutineStatus('Login to delete routines.');
            return;
        }

        this.autoSave();

        const library = this.ensureRoutineLibrary();
        const pack = library.items[this.currentRoutineId];
        if (!pack) return;

        const availableIds = library.order.filter(id => library.items[id]);
        if (availableIds.length <= 1) {
            this.setRoutineStatus('Keep at least one routine.');
            return;
        }

        const confirmDelete = confirm(`Delete routine "${pack.name}"? This cannot be undone.`);
        if (!confirmDelete) return;

        delete library.items[pack.id];
        library.order = library.order.filter(id => id !== pack.id);
        const fallbackId = library.order.find(id => library.items[id]);
        library.currentId = fallbackId || library.order[0] || null;
        this.currentRoutineId = library.currentId;

        this.queueLibrarySave();
        this.loadSteps({ statusMessage: 'Routine deleted.' });
        this.refreshRoutineLibraryUI();
        this.updateChecklistTitle();
    }

    // Import/export removed now that Firebase is the source of truth.

    setProductsStatus(text) {
        const statusEl = document.getElementById('products-status');
        if (statusEl) statusEl.textContent = text;
    }

    ensureProductsLoaded() {
        if ((this.productCatalog && this.productCatalog.length > 0) || (this.allProducts && this.allProducts.length > 0)) {
            this.applyProductsFilter();
            return;
        }

        this.productCatalog = this.getBuiltInProductCatalog();
        const count = this.productCatalog.reduce((acc, c) => acc + ((c.items || []).length), 0);
        this.setProductsStatus(`Loaded ${count} products across ${this.productCatalog.length} categories.`);
        this.applyProductsFilter();
    }

    applyProductsFilter() {
        const searchInput = document.getElementById('products-search');
        const q = (searchInput ? searchInput.value : '').trim().toLowerCase();

        if (this.productCatalog && this.productCatalog.length > 0) {
            const filteredCatalog = (this.productCatalog || []).map(category => {
                const name = category && category.name ? String(category.name) : '';
                const items = Array.isArray(category.items) ? category.items : [];
                const filteredItems = q
                    ? items.filter(item => {
                        const n = (item && item.name) ? String(item.name).toLowerCase() : '';
                        const concern = (item && item.concern) ? String(item.concern).toLowerCase() : '';
                        const cat = name.toLowerCase();
                        return n.includes(q) || concern.includes(q) || cat.includes(q);
                    })
                    : items;
                return { ...category, items: filteredItems };
            }).filter(category => (category.items || []).length > 0);

            this.filteredCatalog = filteredCatalog;
            this.renderProducts();
            return;
        }

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

        if (this.filteredCatalog && this.filteredCatalog.length > 0) {
            const html = this.filteredCatalog.map(category => {
                const title = category && category.name ? String(category.name) : 'Category';
                const cards = (category.items || []).map(item => {
                    const name = item && item.name ? String(item.name) : 'Product';
                    const link = item && item.link ? String(item.link) : '';
                    const img = item && item.image ? String(item.image) : '';
                    const imgFallback = item && item.imageFallback ? String(item.imageFallback) : '';

                    const linkHtml = link
                        ? `<a class="product-card-link" href="${link}" target="_blank" rel="noopener noreferrer">Buy</a>`
                        : '';

                    const imgHtml = img
                        ? `<img class="product-card-img" src="${img}" data-fallback="${imgFallback}" alt="${name}" onerror="if(this.dataset.fallback && this.src!==this.dataset.fallback){this.src=this.dataset.fallback;return;}this.style.display='none'" />`
                        : '';

                    return `
                        <div class="product-card">
                            <div class="product-card-media">${imgHtml}</div>
                            <div class="product-card-body">
                                <div class="product-card-title">${name}</div>
                                ${linkHtml}
                            </div>
                        </div>
                    `;
                }).join('');

                return `
                    <section class="product-category">
                        <h3 class="product-category-title">${title}</h3>
                        <div class="product-cards">${cards || ''}</div>
                    </section>
                `;
            }).join('');

            listEl.innerHTML = `<div class="product-categories">${html}</div>`;
            return;
        }

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
        const result = this.extractCatalogFromWorkbook(workbook);
        const catalog = result && result.catalog ? result.catalog : [];
        const products = result && Array.isArray(result.products) ? result.products : [];

        if (catalog.length === 0 && products.length === 0) {
            this.setProductsStatus('No products found in uploaded Excel.');
            return;
        }

        if (catalog.length > 0) {
            this.productCatalog = catalog;
            const count = catalog.reduce((acc, c) => acc + ((c.items || []).length), 0);
            this.setProductsStatus(`Loaded ${count} products across ${catalog.length} categories from uploaded Excel.`);
        } else {
            this.allProducts = products;
            this.setProductsStatus(`Loaded ${products.length} products from uploaded Excel.`);
        }
        this.applyProductsFilter();
    }

    buildProductLink(productName) {
        return 'https://example.com/buy?ref=YOURCODE';
    }

    getBuiltInProductCatalog() {
        const addCategory = (name, folderName, products) => {
            const items = (products || []).map(p => {
                const productName = String(p || '').trim();
                const cleanImageName = productName.replace(/[^\w\s.-]/g, ' ').replace(/\s+/g, ' ').trim();
                const primaryImagePath = encodeURI(`Images/${cleanImageName}.png`);

                const slug = this.slugifyProductName(productName);
                const fallbackImagePath = slug ? encodeURI(`Images/${slug}.png`) : '';
                
                return {
                    name: productName,
                    concern: '',
                    link: this.buildProductLink(productName),
                    image: primaryImagePath,
                    imageFallback: fallbackImagePath
                };
            }).filter(i => i.name);
            return { name, items };
        };

        return [
            addCategory('Acne', 'Acne', [
                'Medicube 10 Azelaic Acid Niacinamide Foam Cleanser',
                'Medicube Zero Pore Blackhead Mud Facial Mask',
                'Medicube Zero Pore Pad 2.0',
                'Medicube Exosome Cica Calming Pad',
                'Cica Daily Soothing Beauty Mask',
                'Tretinoin'
            ]),
            addCategory('Wrinkles', 'Wrinkles', [
                'Tretinoin',
                'Celimax The Vita A Retinal Shot Tightening Booster',
                'Medicube PDRN Overnight Wrapping Mask',
                'ZIIP Golden Gel'
            ]),
            addCategory('Fine Lines', 'Fine Lines', [
                'The Ordinary Volufiline 92% + Pal-Isoleucine',
                'Celimax The Vita A Retinal Shot Tightening Booster'
            ]),
            addCategory('Cleansers', 'Cleansers', [
                'Medicube PDRN Jelly to Foam Cleanser',
                'Snow Aqua 0 Ginseng Deep Cleansing Oil',
                'Thayers Hydrating Milky Cleanser'
            ]),
            addCategory('Masks', 'Masks', [
                'Medicube PDRN Overnight Wrapping Mask',
                'Embryolisse 3-in-1 Secret Paste',
                'Medicube Zero Pore Blackhead Mud Mask'
            ]),
            addCategory('General', 'General  Supportive Skincare', [
                'Embryolisse 3-in-1 Secret Paste',
                'Estradiol Vaginal Cream USP 0.01%'
            ])
        ].filter(c => (c.items || []).length > 0);
    }

    async loadProductsFromWorkbookPath(path) {
        if (!window.XLSX) {
            return { catalog: [], products: [] };
        }

        const resp = await fetch(path);
        if (!resp.ok) {
            return { catalog: [], products: [] };
        }

        const arrayBuffer = await resp.arrayBuffer();
        const workbook = window.XLSX.read(arrayBuffer, { type: 'array' });
        return this.extractCatalogFromWorkbook(workbook);
    }

    slugifyProductName(name) {
        return String(name || '')
            .toLowerCase()
            .replace(/&/g, ' and ')
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .slice(0, 120);
    }

    normalizeCategoryFolderName(name) {
        return String(name || '').trim();
    }

    extractCatalogFromWorkbook(workbook) {
        const fallback = () => {
            const products = this.extractProductsFromWorkbook(workbook);
            return { catalog: [], products };
        };

        try {
            const sheet = workbook.Sheets && (workbook.Sheets['Sheet3'] || workbook.Sheets['sheet3']);
            if (!sheet) return fallback();

            const rows = window.XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
            if (!rows || rows.length === 0) return fallback();

            const catalog = [];
            let currentCategory = null;

            const isBlank = (v) => v == null || String(v).trim() === '';
            const isCategoryRow = (row) => {
                const a = row && row[0] != null ? String(row[0]).trim() : '';
                if (!a) return false;
                const b = row && row[1] != null ? String(row[1]).trim() : '';
                const c = row && row[2] != null ? String(row[2]).trim() : '';
                return !!a && isBlank(b) && isBlank(c) && a.toLowerCase() !== 'product';
            };
            const isHeaderRow = (row) => {
                const a = row && row[0] != null ? String(row[0]).trim().toLowerCase() : '';
                const b = row && row[1] != null ? String(row[1]).trim().toLowerCase() : '';
                const c = row && row[2] != null ? String(row[2]).trim().toLowerCase() : '';
                return a === 'product' && (b.includes('primary') || b.includes('concern')) && c.includes('link');
            };

            rows.forEach(row => {
                if (!row || row.length === 0) return;

                if (isCategoryRow(row)) {
                    const name = String(row[0]).trim();
                    currentCategory = { name, items: [] };
                    catalog.push(currentCategory);
                    return;
                }

                if (isHeaderRow(row)) {
                    return;
                }

                const productName = row[0] != null ? String(row[0]).trim() : '';
                const concern = row[1] != null ? String(row[1]).trim() : '';
                const link = row[2] != null ? String(row[2]).trim() : '';

                if (!productName) return;

                if (!currentCategory) {
                    currentCategory = { name: 'Products', items: [] };
                    catalog.push(currentCategory);
                }

                const categoryFolder = this.normalizeCategoryFolderName(currentCategory.name);
                const slug = this.slugifyProductName(productName);
                const image = slug ? `Images/${categoryFolder}/${slug}.png` : '';

                currentCategory.items.push({
                    name: productName,
                    concern,
                    link,
                    image
                });
            });

            const normalizedCatalog = catalog
                .map(c => ({ name: c.name, items: (c.items || []).filter(i => i && i.name) }))
                .filter(c => (c.items || []).length > 0);

            if (normalizedCatalog.length === 0) {
                return fallback();
            }

            const flat = normalizedCatalog.flatMap(c => (c.items || []).map(i => i.name));
            return { catalog: normalizedCatalog, products: flat };
        } catch {
            return fallback();
        }
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

    loadSteps(options = {}) {
        const { statusMessage } = options;

        if (!this.getCurrentUser()) {
            this.renderSteps(this.getDefaultRoutine());
            const message = statusMessage !== undefined ? statusMessage : 'Login to manage routines.';
            this.refreshRoutineLibraryUI(message);
            return;
        }

        const context = this.getRoutineContext();
        if (!context || !context.routine) {
            this.renderSteps(this.getDefaultRoutine());
            const message = statusMessage !== undefined ? statusMessage : 'No routines available.';
            this.refreshRoutineLibraryUI(message);
            return;
        }

        this.renderSteps(context.routine);
        this.refreshRoutineLibraryUI(statusMessage);
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
        if (!this.getCurrentUser()) {
            alert('Please login to add steps');
            return;
        }

        const context = this.getRoutineContext();
        if (!context || !context.routine) return;

        const stepName = prompt('Enter step name:', 'New Step');
        if (!stepName || !stepName.trim()) return;

        this.stepCounter++;
        const stepId = `step_${this.stepCounter}`;

        const routine = context.routine;

        // Determine new order
        let newOrder;
        if (position === null || position > routine.steps.length) {
            newOrder = routine.steps.length + 1;
        } else {
            newOrder = Math.max(1, Math.min(routine.steps.length + 1, position));
            routine.steps.forEach(step => {
                if (step.order >= newOrder) {
                    step.order++;
                }
            });
        }

        const newStep = {
            id: stepId,
            name: stepName.trim(),
            order: newOrder,
            isSPF: false
        };

        routine.steps.push(newStep);
        routine.products[stepId] = [{ name: 'Product', checked: false, notes: '' }];

        routine.steps.sort((a, b) => a.order - b.order);
        routine.steps.forEach((step, index) => {
            step.order = index + 1;
        });

        context.pack[context.mode] = routine;
        this.commitContext(context, { updateTimestamp: true });

        this.renderSteps(routine);
    }

    shiftStep(stepId, direction) {
        if (!this.getCurrentUser()) return;

        const context = this.getRoutineContext();
        if (!context || !context.routine) return;

        const routine = context.routine;

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

        context.pack[context.mode] = routine;
        this.commitContext(context, { updateTimestamp: true });

        this.renderSteps(routine);
    }

    deleteStep(stepId) {
        if (!this.getCurrentUser()) return;

        if (!confirm('Are you sure you want to delete this step? All products in this step will be removed.')) {
            return;
        }

        const context = this.getRoutineContext();
        if (!context || !context.routine) return;

        const routine = context.routine;

        // Remove step
        routine.steps = routine.steps.filter(s => s.id !== stepId);
        delete routine.products[stepId];

        // Reorder remaining steps
        routine.steps.forEach((step, index) => {
            step.order = index + 1;
        });

        context.pack[context.mode] = routine;
        this.commitContext(context, { updateTimestamp: true });

        this.renderSteps(routine);
    }

    updateStepName(stepId, stepName) {
        if (!this.getCurrentUser()) return;

        const context = this.getRoutineContext();
        if (!context || !context.routine) return;

        const routine = context.routine;

        const step = routine.steps.find(s => s.id === stepId);
        if (step) {
            step.name = stepName.trim() || 'New Step';
            const stepNumber = step.order;
            const titleDisplay = document.querySelector(`[data-step-id="${stepId}"] .step-title-display`);
            if (titleDisplay) {
                titleDisplay.textContent = `${stepNumber} Step ${step.name}`;
            }
        }

        context.pack[context.mode] = routine;
        this.commitContext(context, { updateTimestamp: true });
    }

    loadRoutine(options = {}) {
        this.loadSteps(options);
    }

    updateChecklistTitle() {
        const titleEl = document.getElementById('checklist-title');
        if (!titleEl) return;

        const name = this.getCurrentRoutineName();
        if (name) {
            titleEl.textContent = name;
        } else {
            titleEl.textContent = 'Routine';
        }
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

    autoSave(options = {}) {
        if (!this.getCurrentUser()) return;

        const context = this.getRoutineContext(options.modeOverride);
        if (!context || !context.routine) return;

        const baseRoutine = context.routine;
        const updatedRoutine = {
            steps: Array.isArray(baseRoutine.steps) ? baseRoutine.steps.map(step => ({ ...step })) : [],
            products: {}
        };

        updatedRoutine.steps.forEach(step => {
            const productsList = document.querySelector(`[data-step="${step.id}"]`);

            if (!productsList) {
                updatedRoutine.products[step.id] = (baseRoutine.products && baseRoutine.products[step.id]) ? baseRoutine.products[step.id] : [];
                return;
            }

            updatedRoutine.products[step.id] = [];
            Array.from(productsList.children).forEach(productItem => {
                const nameInput = productItem.querySelector('.product-name');
                const checkbox = productItem.querySelector('.product-checkbox');
                const notesTextarea = productItem.querySelector('.product-notes');

                updatedRoutine.products[step.id].push({
                    name: (nameInput && nameInput.value ? nameInput.value.trim() : '') || 'Product',
                    checked: !!(checkbox && checkbox.checked),
                    notes: (notesTextarea && notesTextarea.value ? notesTextarea.value.trim() : '')
                });
            });
        });

        context.pack[context.mode] = updatedRoutine;
        context.routine = updatedRoutine;
        this.commitContext(context, { updateTimestamp: true });
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

        this.updateChecklistTitle();
        
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
        const targetMode = this.isDaytime ? 'daytime' : 'nighttime';
        const modeLabel = this.isDaytime ? 'Daytime' : 'Nighttime';

        const buildRoutineSection = (title, routine) => {
            const migrated = this.migrateRoutine(routine);
            const sortedSteps = [...(migrated.steps || [])].sort((a, b) => a.order - b.order);
            let section = `<div class="print-routine">`;
            section += `<h2 class="print-routine-title">${title}</h2>`;
            section += `<div class="print-grid">`;

            sortedSteps.forEach(step => {
                if (step.isSPF && !this.isDaytime) return;
                const products = (migrated.products && migrated.products[step.id]) ? migrated.products[step.id] : [];
                if (!products || products.length === 0) return;

                section += `<div class="print-step">`;
                section += `<h3>${step.order}. ${step.name}</h3>`;
                section += '<ul class="print-items">';

                products.forEach(product => {
                    const checked = product.checked ? 'checked' : '';
                    const name = product.name || 'Product';
                    const notes = (product.notes || '').trim();
                    section += `<li class="print-item ${checked}">`;
                    section += `<span class="print-checkbox"></span>`;
                    section += `<span class="print-name">${name}${notes ? `<span class=\"print-notes\">Notes: ${notes}</span>` : ''}</span>`;
                    section += `</li>`;
                });

                section += '</ul></div>';
            });

            section += `</div></div>`;
            return section;
        };

        const sections = [];

        if (this.getCurrentUser() && this.routineLibrary && this.routineLibrary.items) {
            const library = this.routineLibrary;
            const orderedIds = (library.order || []).filter(id => library.items[id]);
            const packs = orderedIds.map(id => library.items[id]);

            if (packs.length > 1) {
                const listText = packs.map((p, idx) => `${idx + 1}. ${p && p.name ? p.name : 'Routine'}`).join('\n');
                const selection = prompt(
                    `Select routines to print (${modeLabel}):\n\n${listText}\n\nEnter numbers separated by commas (example: 1,2) or type "all":`,
                    'all'
                );

                if (selection == null) {
                    return;
                }

                const raw = selection.trim().toLowerCase();
                let selectedIndexes = [];

                if (raw === 'all') {
                    selectedIndexes = packs.map((_, idx) => idx);
                } else {
                    selectedIndexes = raw
                        .split(',')
                        .map(s => parseInt(s.trim(), 10) - 1)
                        .filter(n => Number.isFinite(n) && n >= 0 && n < packs.length);
                }

                const uniqueIndexes = Array.from(new Set(selectedIndexes));
                uniqueIndexes.forEach(idx => {
                    const pack = packs[idx];
                    if (!pack) return;
                    const routine = (pack && pack[targetMode]) ? pack[targetMode] : this.getDefaultRoutine();
                    const title = (pack && pack.name) ? pack.name : `Routine ${idx + 1}`;
                    sections.push(buildRoutineSection(title, routine));
                });
            }
        }

        if (sections.length === 0) {
            // Fallback: print the currently selected routine only.
            const title = this.getCurrentRoutineName() || 'Routine';
            sections.push(buildRoutineSection(title, this.getCurrentRoutine()));
        }

        const printWindow = window.open('', '_blank');
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
                .print-routine {
                    margin-top: 14px;
                    page-break-inside: avoid;
                }
                .print-routine-title {
                    font-size: 14px;
                    color: #ff1493;
                    margin: 8px 0;
                    text-align: left;
                    border-bottom: 1px solid #ffc0e5;
                    padding-bottom: 4px;
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
                    text-decoration: none;
                    color: inherit;
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
                .print-notes {
                    display: block;
                    margin-top: 2px;
                    font-size: 8px;
                    color: #666;
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
                <div class="print-mode">${modeLabel} Routines</div>
            </div>
            ${sections.join('')}
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
        if (!this.getCurrentUser()) return this.getDefaultRoutine();

        const context = this.getRoutineContext();
        if (!context || !context.routine) {
            return this.getDefaultRoutine();
        }

        return context.routine;
    }
}

// Initialize the application
let auth;
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new SkincareApp();
    auth = new AuthSystem(app);
    
    // If user was already logged in, load their routine now
    if (auth.currentUser) {
        app.loadRoutine();
    }
    
    // Listen for mode changes to reload routine
    document.getElementById('dayNightToggle').addEventListener('change', () => {
        setTimeout(() => app.loadRoutine(), 100);
    });
});

