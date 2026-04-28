const showLoader = (show) => document.getElementById('loader').style.display = show ? 'flex' : 'none';

const fetchAdminAPI = async (url, options = {}) => {
    showLoader(true);
    try {
        const response = await fetch(url, {
            ...options,
            headers: { 'Content-Type': 'application/json', ...options.headers }
        });
        const data = await response.json();
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
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

const showAlert = (id, msg, type = 'error') => {
    const alert = document.getElementById(id);
    alert.textContent = msg;
    alert.className = `alert alert-${type}`;
    alert.style.display = 'block';
    setTimeout(() => alert.style.display = 'none', 5000);
};

const showAdminSection = (sectionId) => {
    document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
    document.getElementById(`adm-${sectionId}`).style.display = 'block';
    
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        if (item.getAttribute('onclick')?.includes(sectionId)) item.classList.add('active');
    });

    if (sectionId === 'users') loadAllUsers();
    if (sectionId === 'transactions') loadAllTransactions();
    if (sectionId === 'checkbooks') loadPendingCheckbooks();
    if (sectionId === 'logs') loadLogs();
};

const loadAllUsers = async () => {
    const users = await fetchAdminAPI('/admin/users');
    document.getElementById('adm-users-body').innerHTML = users.map(u => `
        <tr>
            <td>${u.name}</td>
            <td>${u.email}</td>
            <td>${u.accountNumber}</td>
            <td>₹${u.balance.toFixed(2)}</td>
            <td>${new Date(u.createdAt).toLocaleDateString()}</td>
        </tr>
    `).join('');
};

const loadAllTransactions = async () => {
    const transactions = await fetchAdminAPI('/admin/transactions');
    document.getElementById('adm-trans-body').innerHTML = transactions.map(t => `
        <tr>
            <td>${t.userId?.name || 'N/A'}</td>
            <td>${new Date(t.date).toLocaleString()}</td>
            <td>${t.type}</td>
            <td>₹${t.amount.toFixed(2)}</td>
            <td>${t.description}</td>
        </tr>
    `).join('');
};

const loadPendingCheckbooks = async () => {
    const requests = await fetchAdminAPI('/admin/checkbook-requests');
    document.getElementById('adm-checkbook-body').innerHTML = requests.map(r => `
        <tr>
            <td>${r.userId?.name || 'N/A'} (${r.userId?.email || ''})</td>
            <td>${new Date(r.requestDate).toLocaleString()}</td>
            <td>${r.status}</td>
            <td>
                ${r.status === 'Pending' ? `
                    <button class="btn btn-primary" style="width:auto; padding:5px 10px; background:green" onclick="updateCheckbook('${r._id}', 'Approved')">Approve</button>
                    <button class="btn btn-primary" style="width:auto; padding:5px 10px; background:red" onclick="updateCheckbook('${r._id}', 'Rejected')">Reject</button>
                ` : '-'}
            </td>
        </tr>
    `).join('');
};

const updateCheckbook = async (id, status) => {
    try {
        await fetchAdminAPI(`/admin/checkbook/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        showAlert('admin-alert', `Request ${status}`, 'success');
        loadPendingCheckbooks();
    } catch (err) { showAlert('admin-alert', err.message); }
};

const loadLogs = async () => {
    const logs = await fetchAdminAPI('/admin/logs');
    document.getElementById('adm-logs-body').innerHTML = logs.map(l => `
        <tr>
            <td>${l.userId?.name || 'Guest'}</td>
            <td>${l.action}</td>
            <td>${l.ip}</td>
            <td>${new Date(l.timestamp).toLocaleString()}</td>
            <td>${l.details || '-'}</td>
        </tr>
    `).join('');
};

const logout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = 'index.html';
};

// Initial Load
if (window.location.pathname.includes('admin.html')) {
    showAdminSection('users');
}
