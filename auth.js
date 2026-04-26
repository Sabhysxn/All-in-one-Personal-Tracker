// =====================================================
// AUTHENTICATION SYSTEM
// =====================================================

// Simple hash function for demo purposes (not secure for production)
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
}

// Initialize users storage if not exists
if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify({}));
}

// Check if user is logged in
function isLoggedIn() {
    return sessionStorage.getItem('currentUser') !== null;
}

// Get current user
function getCurrentUser() {
    return sessionStorage.getItem('currentUser');
}

// Login function
function login(username, password) {
    const users = JSON.parse(localStorage.getItem('users'));
    const hashedPassword = simpleHash(password);

    if (users[username] && users[username].password === hashedPassword) {
        sessionStorage.setItem('currentUser', username);
        return true;
    }
    return false;
}

// Register new user
function register(username, password) {
    const users = JSON.parse(localStorage.getItem('users'));

    if (users[username]) {
        return false; // User already exists
    }

    users[username] = {
        password: simpleHash(password),
        created: new Date().toISOString()
    };

    localStorage.setItem('users', JSON.stringify(users));
    return true;
}

// Logout function
function logout() {
    sessionStorage.removeItem('currentUser');
    // Clear user-specific data or keep it?
    // For now, we'll keep the data
}

// Get user-specific storage key
function getUserStorageKey(baseKey) {
    const user = getCurrentUser();
    return user ? `${user}_${baseKey}` : baseKey;
}

// Initialize user data if first login
function initializeUserData() {
    const user = getCurrentUser();
    if (!user) return;

    // Initialize user-specific data
    const dataKeys = ['expenses', 'budgets', 'goals', 'tasks', 'habits', 'subscriptions', 'timeEntries'];

    dataKeys.forEach(key => {
        const userKey = getUserStorageKey(key);
        if (!localStorage.getItem(userKey)) {
            localStorage.setItem(userKey, JSON.stringify([]));
        }
    });

    // Initialize budgets as object
    const budgetKey = getUserStorageKey('budgets');
    if (!localStorage.getItem(budgetKey)) {
        localStorage.setItem(budgetKey, JSON.stringify({}));
    }
}

// Redirect to login if not authenticated
function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
    } else {
        initializeUserData();
    }
}

// Redirect to main app if authenticated
function redirectIfAuthenticated() {
    if (isLoggedIn()) {
        window.location.href = 'index.html';
    }
}

// DOM ready functions for login page
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const loginBtn = document.getElementById('loginBtn');

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;

            if (!username || !password) {
                showError('Please fill in all fields');
                return;
            }

            loginBtn.disabled = true;
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

            // Simulate async operation
            setTimeout(() => {
                if (login(username, password)) {
                    window.location.href = 'index.html';
                } else {
                    showError('Invalid username or password');
                    loginBtn.disabled = false;
                    loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
                }
            }, 500);
        });
    }
});

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';

    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

function registerUser() {
    const username = prompt('Enter username:');
    const password = prompt('Enter password:');

    if (username && password) {
        if (register(username.trim(), password)) {
            alert('Account created successfully! Please login.');
        } else {
            alert('Username already exists. Please choose a different username.');
        }
    }
}

// Export functions for use in other files
window.Auth = {
    isLoggedIn,
    getCurrentUser,
    login,
    register,
    logout,
    getUserStorageKey,
    requireAuth,
    redirectIfAuthenticated
};