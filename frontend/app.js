// Global State
let currentUser = null;
let fullAccNo = "";
let isAccMasked = true;

// Utility functions
const showLoader = (show) => document.getElementById('loader').style.display = show ? 'flex' : 'none';

const showAlert = (id, msg, type = 'error', timeout = 5000) => {
    const alert = document.getElementById(id);
    if (!alert) return;
    alert.textContent = msg;
    alert.className = `alert alert-${type}`;
    alert.style.display = 'block';
    if (timeout) setTimeout(() => alert.style.display = 'none', timeout);
};

const fetchAPI = async (url, options = {}) => {
    showLoader(true);
    try {
        const response = await fetch(url, {
            ...options,
            headers: { 'Content-Type': 'application/json', ...options.headers }
        });
        const data = await response.json();
        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = 'index.html';
            }
            throw new Error(data.message || 'Something went wrong');
        }
        return data;
    } catch (err) {
        throw err;
    } finally {
        showLoader(false);
    }
};

// Auth Functions
if (document.getElementById('login-form')) {
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        try {
            const data = await fetchAPI('/api/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            if (data.user.isAdmin) {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        } catch (err) {
            showAlert('login-alert', err.message);
        }
    });
}

if (document.getElementById('register-form')) {
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const body = {
            name: document.getElementById('reg-name').value,
            email: document.getElementById('reg-email').value,
            phone: document.getElementById('reg-phone').value,
            address: document.getElementById('reg-address').value,
            password: document.getElementById('reg-password').value,
            confirmPassword: document.getElementById('reg-confirm').value,
            securityQuestion: document.getElementById('reg-q').value,
            securityAnswer: document.getElementById('reg-a').value
        };
        try {
            const data = await fetchAPI('/api/register', {
                method: 'POST',
                body: JSON.stringify(body)
            });
            showAlert('register-alert', data.message, 'success');
            setTimeout(() => toggleAuth('login'), 2000);
        } catch (err) {
            showAlert('register-alert', err.message);
        }
    });
}

if (document.getElementById('forgot-form')) {
    document.getElementById('forgot-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const body = {
            email: document.getElementById('forgot-email').value,
            securityAnswer: document.getElementById('forgot-a').value,
            newPassword: document.getElementById('forgot-new-password').value
        };
        try {
            const data = await fetchAPI('/api/forgot-password', {
                method: 'POST',
                body: JSON.stringify(body)
            });
            showAlert('forgot-alert', data.message, 'success');
            setTimeout(() => toggleAuth('login'), 2000);
        } catch (err) {
            showAlert('forgot-alert', err.message);
        }
    });
}

// Dashboard Functions
const showSection = (sectionId) => {
    document.querySelectorAll('.dashboard-section').forEach(s => s.style.display = 'none');
    document.getElementById(`sec-${sectionId}`).style.display = 'block';
    
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    // Find nav item by onclick or content
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        if (item.getAttribute('onclick')?.includes(sectionId)) item.classList.add('active');
    });

    if (sectionId === 'summary') loadDashboardData();
    if (sectionId === 'beneficiaries') loadBeneficiaries();
    if (sectionId === 'transfer') loadBeneficiaryDropdown();
    if (sectionId === 'history') loadTransactions();
    if (sectionId === 'fd') loadFDs();
    if (sectionId === 'checkbook') loadCheckbookRequests();
    if (sectionId === 'profile') loadProfile();
};

const logout = async () => {
    try {
        await fetchAPI('/api/logout', { method: 'POST' });
        window.location.href = 'index.html';
    } catch (err) {
        console.error(err);
    }
};

const loadDashboardData = async () => {
    try {
        const profile = await fetchAPI('/api/profile');
        const balanceData = await fetchAPI('/api/balance');
        const transactions = await fetchAPI('/api/transactions?filter=5'); // last 5 for mini statement

        document.getElementById('welcome-msg').textContent = `Welcome, ${profile.name}`;
        document.getElementById('dash-balance').textContent = `₹${balanceData.balance.toFixed(2)}`;
        fullAccNo = balanceData.accountNumber;
        updateAccMaskDisplay();
        
        if (profile.lastLogin) {
            document.getElementById('last-login-ts').textContent = `Last Login: ${new Date(profile.lastLogin).toLocaleString()}`;
        }

        const tbody = document.getElementById('mini-statement-body');
        tbody.innerHTML = transactions.slice(0, 5).map(t => `
            <tr>
                <td>${new Date(t.date).toLocaleDateString()}</td>
                <td style="color: ${t.type === 'Credit' ? 'green' : 'red'}">${t.type}</td>
                <td>${t.description}</td>
                <td>₹${t.amount.toFixed(2)}</td>
            </tr>
        `).join('');
    } catch (err) {
        showAlert('global-alert', err.message);
    }
};

const toggleAccMask = () => {
    isAccMasked = !isAccMasked;
    updateAccMaskDisplay();
};

const updateAccMaskDisplay = () => {
    const display = isAccMasked ? `XXXXXX${fullAccNo.slice(-4)}` : fullAccNo;
    document.getElementById('dash-acc-no').textContent = display;
    document.getElementById('eye-icon').textContent = isAccMasked ? '👁️' : '🕶️';
};

// Form Handlers
const setupForm = (formId, url, method, alertId, successMsg, callback) => {
    const form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const body = Object.fromEntries(formData.entries());
        try {
            const data = await fetchAPI(url, { method, body: JSON.stringify(body) });
            showAlert(alertId || 'global-alert', successMsg || data.message, 'success');
            form.reset();
            if (callback) callback(data);
        } catch (err) {
            showAlert(alertId || 'global-alert', err.message);
        }
    });
};

// Specific Handlers
if (document.getElementById('deposit-form')) {
    document.getElementById('deposit-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const amount = document.getElementById('dep-amount').value;
        try {
            await fetchAPI('/api/deposit', { method: 'POST', body: JSON.stringify({ amount }) });
            showAlert('global-alert', 'Deposit successful!', 'success');
            showSection('summary');
        } catch (err) { showAlert('global-alert', err.message); }
    });
}

if (document.getElementById('withdraw-form')) {
    document.getElementById('withdraw-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const amount = document.getElementById('with-amount').value;
        try {
            await fetchAPI('/api/withdraw', { method: 'POST', body: JSON.stringify({ amount }) });
            showAlert('global-alert', 'Withdrawal successful!', 'success');
            showSection('summary');
        } catch (err) { showAlert('global-alert', err.message); }
    });
}

const loadBeneficiaries = async () => {
    try {
        const bens = await fetchAPI('/api/beneficiaries');
        const tbody = document.getElementById('ben-list-body');
        if (bens.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#999;">No beneficiaries added yet.</td></tr>';
        } else {
            tbody.innerHTML = bens.map(b => `
                <tr>
                    <td>${b.nickname}</td>
                    <td>${b.beneficiaryAccount}</td>
                    <td><button class="btn btn-primary" style="background:red; width:auto; padding:5px 10px" onclick="deleteBeneficiary('${b._id}')">Delete</button></td>
                </tr>
            `).join('');
        }
    } catch (err) {
        showAlert('global-alert', 'Failed to load beneficiaries: ' + err.message);
    }
};

const deleteBeneficiary = async (id) => {
    if (confirm('Delete this beneficiary?')) {
        await fetchAPI(`/api/beneficiaries/${id}`, { method: 'DELETE' });
        loadBeneficiaries();
    }
};

if (document.getElementById('beneficiary-form')) {
    document.getElementById('beneficiary-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const beneficiaryAccount = document.getElementById('ben-acc').value.trim();
        const confirmAccount = document.getElementById('ben-confirm').value.trim();
        const nickname = document.getElementById('ben-nick').value.trim();

        // Client-side validation first
        if (beneficiaryAccount !== confirmAccount) {
            showAlert('ben-alert', 'Account numbers do not match. Please check and try again.');
            return;
        }
        if (beneficiaryAccount.length !== 10 || !/^\d+$/.test(beneficiaryAccount)) {
            showAlert('ben-alert', 'Account number must be exactly 10 digits.');
            return;
        }

        const body = { beneficiaryAccount, confirmAccount, nickname };
        try {
            const data = await fetchAPI('/api/beneficiaries', { method: 'POST', body: JSON.stringify(body) });
            showAlert('ben-alert', data.message || 'Beneficiary added successfully!', 'success');
            document.getElementById('beneficiary-form').reset();
            loadBeneficiaries();
        } catch (err) {
            showAlert('ben-alert', err.message);
        }
    });
}

const loadBeneficiaryDropdown = async () => {
    const select = document.getElementById('trans-beneficiary');
    select.innerHTML = '<option value="">Loading beneficiaries...</option>';
    select.disabled = true;
    try {
        const bens = await fetchAPI('/api/beneficiaries');
        if (bens.length === 0) {
            select.innerHTML = '<option value="">-- No beneficiaries added yet --</option>';
            select.disabled = true;
            showAlert('global-alert', 'Please add a beneficiary first before making a transfer.', 'error', 6000);
        } else {
            select.innerHTML = '<option value="">-- Select Beneficiary --</option>' +
                bens.map(b => `<option value="${b.beneficiaryAccount}">${b.nickname} (${b.beneficiaryAccount})</option>`).join('');
            select.disabled = false;
        }
    } catch (err) {
        select.innerHTML = '<option value="">-- Failed to load --</option>';
        select.disabled = true;
        showAlert('global-alert', 'Failed to load beneficiaries: ' + err.message);
    }
};

if (document.getElementById('transfer-form')) {
    document.getElementById('transfer-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const body = {
            beneficiaryAccount: document.getElementById('trans-beneficiary').value,
            amount: document.getElementById('trans-amount').value,
            transactionPin: document.getElementById('trans-pin').value,
            description: document.getElementById('trans-desc').value
        };
        try {
            await fetchAPI('/api/transfer', { method: 'POST', body: JSON.stringify(body) });
            showAlert('global-alert', 'Transfer successful!', 'success');
            showSection('summary');
        } catch (err) { showAlert('global-alert', err.message); }
    });
}

const loadTransactions = async () => {
    const filter = document.getElementById('hist-filter').value;
    const from = document.getElementById('hist-from').value;
    const to = document.getElementById('hist-to').value;
    let url = '/api/transactions?';
    if (filter) url += `filter=${filter}`;
    else if (from && to) url += `from=${from}&to=${to}`;

    const transactions = await fetchAPI(url);
    document.getElementById('history-body').innerHTML = transactions.map(t => `
        <tr>
            <td>${new Date(t.date).toLocaleDateString()}</td>
            <td style="color: ${t.type === 'Credit' ? 'green' : 'red'}">${t.type}</td>
            <td>${t.description}</td>
            <td>₹${t.amount.toFixed(2)}</td>
            <td>₹${t.balanceAfter.toFixed(2)}</td>
        </tr>
    `).join('');
};

const calcFD = () => {
    const amount = parseFloat(document.getElementById('fd-amount').value) || 0;
    const months = parseInt(document.getElementById('fd-tenure').value);
    let rate = 0;
    if (months == 3) rate = 5;
    else if (months == 6) rate = 6;
    else if (months == 12) rate = 7;
    else if (months == 24) rate = 7.5;
    else if (months == 36) rate = 8;
    const maturity = amount + (amount * rate * months / 12 / 100);
    document.getElementById('fd-calc-result').textContent = `Maturity Amount: ₹${maturity.toFixed(2)}`;
};

if (document.getElementById('fd-form')) {
    document.getElementById('fd-amount').addEventListener('input', calcFD);
    document.getElementById('fd-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const body = {
            amount: document.getElementById('fd-amount').value,
            tenureMonths: document.getElementById('fd-tenure').value
        };
        try {
            await fetchAPI('/api/fd/create', { method: 'POST', body: JSON.stringify(body) });
            showAlert('global-alert', 'Fixed Deposit Created!', 'success');
            showSection('fd');
        } catch (err) { showAlert('global-alert', err.message); }
    });
}

const loadFDs = async () => {
    const fds = await fetchAPI('/api/fd/list');
    document.getElementById('fd-list-body').innerHTML = fds.map(f => `
        <tr>
            <td>₹${f.amount.toFixed(2)}</td>
            <td>${f.interestRate}%</td>
            <td>${new Date(f.maturityDate).toLocaleDateString()}</td>
            <td>₹${f.maturityAmount.toFixed(2)}</td>
            <td>${f.status}</td>
        </tr>
    `).join('');
};

const requestCheckbook = async () => {
    try {
        await fetchAPI('/api/checkbook-request', { method: 'POST' });
        showAlert('global-alert', 'Checkbook request submitted!', 'success');
        loadCheckbookRequests();
    } catch (err) { showAlert('global-alert', err.message); }
};

const loadCheckbookRequests = async () => {
    const requests = await fetchAPI('/api/checkbook-requests');
    document.getElementById('checkbook-list-body').innerHTML = requests.map(r => `
        <tr>
            <td>${new Date(r.requestDate).toLocaleDateString()}</td>
            <td>${r.status}</td>
            <td>${r.approvedDate ? new Date(r.approvedDate).toLocaleDateString() : '-'}</td>
        </tr>
    `).join('');
};

const loadProfile = async () => {
    const p = await fetchAPI('/api/profile');
    document.getElementById('prof-acc').value = p.accountNumber;
    document.getElementById('prof-name').value = p.name;
    document.getElementById('prof-email').value = p.email;
    document.getElementById('prof-phone').value = p.phone;
    document.getElementById('prof-address').value = p.address;
};

if (document.getElementById('profile-form')) {
    document.getElementById('profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const body = {
            email: document.getElementById('prof-email').value,
            phone: document.getElementById('prof-phone').value,
            address: document.getElementById('prof-address').value
        };
        try {
            await fetchAPI('/api/profile', { method: 'PUT', body: JSON.stringify(body) });
            showAlert('global-alert', 'Profile updated!', 'success');
            loadDashboardData();
        } catch (err) { showAlert('global-alert', err.message); }
    });
}

if (document.getElementById('change-pass-form')) {
    document.getElementById('change-pass-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const body = {
            oldPassword: document.getElementById('pass-old').value,
            newPassword: document.getElementById('pass-new').value
        };
        try {
            await fetchAPI('/api/change-password', { method: 'POST', body: JSON.stringify(body) });
            showAlert('global-alert', 'Password changed successfully!', 'success');
            document.getElementById('change-pass-form').reset();
        } catch (err) { showAlert('global-alert', err.message); }
    });
}

// Initial Load
if (window.location.pathname.includes('dashboard.html')) {
    showSection('summary');
}
