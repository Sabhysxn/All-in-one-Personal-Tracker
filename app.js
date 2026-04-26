 // =====================================================
        // AUTHENTICATION CHECK
        // =====================================================
        if (typeof Auth !== 'undefined') {
            Auth.requireAuth();
        }

        // =====================================================
        // GLOBAL VARIABLES & INITIALIZATION
        // =====================================================
        let expenses = JSON.parse(localStorage.getItem(Auth ? Auth.getUserStorageKey('expenses') : 'expenses')) || [];
        let budgets = JSON.parse(localStorage.getItem(Auth ? Auth.getUserStorageKey('budgets') : 'budgets')) || {};
        let goals = JSON.parse(localStorage.getItem(Auth ? Auth.getUserStorageKey('goals') : 'goals')) || [];
        let tasks = JSON.parse(localStorage.getItem(Auth ? Auth.getUserStorageKey('tasks') : 'tasks')) || [];
        let habits = JSON.parse(localStorage.getItem(Auth ? Auth.getUserStorageKey('habits') : 'habits')) || [];
        let subscriptions = JSON.parse(localStorage.getItem(Auth ? Auth.getUserStorageKey('subscriptions') : 'subscriptions')) || [];
        let timeEntries = JSON.parse(localStorage.getItem(Auth ? Auth.getUserStorageKey('timeEntries') : 'timeEntries')) || [];

        // Helper function for user-specific storage
        function getStorageKey(key) {
            return Auth ? Auth.getUserStorageKey(key) : key;
        }

        // =====================================================
        // NAVIGATION & THEME FUNCTIONS
        // =====================================================
        function showSection(sectionId) {
            // Hide all sections
            document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Remove active class from all nav links
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            
            // Show selected section
            document.getElementById(sectionId).classList.add('active');
            
            // Add active class to clicked nav link
            event.target.closest('.nav-link').classList.add('active');
            
            // Close sidebar on mobile
            if (window.innerWidth <= 768) {
                document.getElementById('sidebar').classList.remove('active');
            }
            
            // Refresh the section data
            refreshSection(sectionId);
        }

        function toggleSidebar() {
            document.getElementById('sidebar').classList.toggle('active');
        }

        function toggleTheme() {
            const html = document.documentElement;
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        }

        // Load saved theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);

        function logout() {
            if (confirm('Are you sure you want to logout?')) {
                if (typeof Auth !== 'undefined') {
                    Auth.logout();
                }
                window.location.href = 'login.html';
            }
        }

        // =====================================================
        // DASHBOARD FUNCTIONS
        // =====================================================
        function updateDashboard() {
            const totalIncome = expenses
                .filter(e => e.type === 'income')
                .reduce((sum, e) => sum + parseFloat(e.amount), 0);
            
            const totalExpenses = expenses
                .filter(e => e.type === 'expense')
                .reduce((sum, e) => sum + parseFloat(e.amount), 0);
            
            const netBalance = totalIncome - totalExpenses;
            
            document.getElementById('dashTotalIncome').textContent = `${totalIncome.toFixed(2)}`;
            document.getElementById('dashTotalExpenses').textContent = `${totalExpenses.toFixed(2)}`;
            document.getElementById('dashNetBalance').textContent = `${netBalance.toFixed(2)}`;
            document.getElementById('dashActiveGoals').textContent = goals.length;
            
            const pendingTasks = tasks.filter(t => t.status !== 'done').length;
            document.getElementById('dashPendingTasks').textContent = pendingTasks;
            document.getElementById('dashActiveHabits').textContent = habits.length;
            document.getElementById('dashSubscriptions').textContent = subscriptions.length;
            
            const weekHours = timeEntries
                .filter(e => isThisWeek(new Date(e.date)))
                .reduce((sum, e) => sum + parseFloat(e.hours), 0);
            document.getElementById('dashHoursWeek').textContent = `${weekHours.toFixed(1)}h`;
        }

        // =====================================================
        // EXPENSE TRACKER FUNCTIONS
        // =====================================================
        document.getElementById('expenseForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const expense = {
                id: Date.now(),
                type: document.getElementById('expenseType').value,
                amount: parseFloat(document.getElementById('expenseAmount').value),
                category: document.getElementById('expenseCategory').value,
                description: document.getElementById('expenseDesc').value,
                date: document.getElementById('expenseDate').value
            };
            
            expenses.push(expense);
            localStorage.setItem(getStorageKey('expenses'), JSON.stringify(expenses));
            
            this.reset();
            document.getElementById('expenseDate').valueAsDate = new Date();
            displayExpenses();
            updateDashboard();
        });

        function displayExpenses() {
            const tbody = document.getElementById('expenseTableBody');
            tbody.innerHTML = '';
            
            expenses.slice().reverse().forEach(expense => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${new Date(expense.date).toLocaleDateString()}</td>
                    <td><span class="badge badge-${expense.type}">${expense.type}</span></td>
                    <td>${expense.category}</td>
                    <td>${expense.description}</td>
                    <td class="${expense.type === 'income' ? 'text-success' : 'text-danger'}">
                        ${expense.type === 'income' ? '+' : '-'}${expense.amount.toFixed(2)}
                    </td>
                    <td>
                        <button class="btn btn-danger btn-small" onclick="deleteExpense(${expense.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
            });
        }

        function deleteExpense(id) {
            if (confirm('Delete this transaction?')) {
                expenses = expenses.filter(e => e.id !== id);
                localStorage.setItem(getStorageKey('expenses'), JSON.stringify(expenses));
                displayExpenses();
                updateDashboard();
            }
        }

        // =====================================================
        // BUDGET TRACKER FUNCTIONS
        // =====================================================
        document.getElementById('budgetForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const category = document.getElementById('budgetCategory').value;
            const amount = parseFloat(document.getElementById('budgetAmount').value);
            
            budgets[category] = amount;
            localStorage.setItem(getStorageKey('budgets'), JSON.stringify(budgets));
            
            this.reset();
            displayBudgets();
        });

        function displayBudgets() {
            const container = document.getElementById('budgetOverview');
            container.innerHTML = '';
            
            Object.keys(budgets).forEach(category => {
                const budget = budgets[category];
                const spent = expenses
                    .filter(e => e.type === 'expense' && e.category === category)
                    .reduce((sum, e) => sum + parseFloat(e.amount), 0);
                
                const percentage = (spent / budget) * 100;
                const status = percentage > 100 ? 'danger' : percentage > 80 ? 'warning' : 'success';
                
                const budgetCard = document.createElement('div');
                budgetCard.style.marginBottom = '1.5rem';
                budgetCard.innerHTML = `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <strong>${category}</strong>
                        <span>${spent.toFixed(2)} / ${budget.toFixed(2)}</span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar ${status}" style="width: ${Math.min(percentage, 100)}%">
                            ${percentage.toFixed(0)}%
                        </div>
                    </div>
                    ${percentage > 100 ? '<p class="text-danger" style="margin-top: 0.5rem; font-size: 0.875rem;">⚠️ Over budget!</p>' : ''}
                `;
                container.appendChild(budgetCard);
            });
        }

        // =====================================================
        // GOALS & SAVINGS TRACKER FUNCTIONS
        // =====================================================
        document.getElementById('goalForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const goal = {
                id: Date.now(),
                name: document.getElementById('goalName').value,
                target: parseFloat(document.getElementById('goalTarget').value),
                current: 0,
                deadline: document.getElementById('goalDeadline').value
            };
            
            goals.push(goal);
            localStorage.setItem(getStorageKey('goals'), JSON.stringify(goals));
            
            this.reset();
            displayGoals();
            updateDashboard();
        });

        function displayGoals() {
            const container = document.getElementById('goalsList');
            container.innerHTML = '';
            
            if (goals.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No goals yet. Create your first goal!</p>';
                return;
            }
            
            goals.forEach(goal => {
                const percentage = (goal.current / goal.target) * 100;
                const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                
                const goalCard = document.createElement('div');
                goalCard.style.marginBottom = '1.5rem';
                goalCard.style.padding = '1rem';
                goalCard.style.border = '1px solid var(--border)';
                goalCard.style.borderRadius = '8px';
                
                goalCard.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                        <div>
                            <h4 style="margin-bottom: 0.25rem;">${goal.name}</h4>
                            <p style="font-size: 0.875rem; color: var(--text-secondary);">
                                ${daysLeft > 0 ? `${daysLeft} days left` : 'Deadline passed'}
                            </p>
                        </div>
                        <button class="btn btn-danger btn-small" onclick="deleteGoal(${goal.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span>${goal.current.toFixed(2)} / ${goal.target.toFixed(2)}</span>
                            <span>${percentage.toFixed(0)}%</span>
                        </div>
                        <div class="progress-bar-container">
                            <div class="progress-bar ${percentage >= 100 ? 'success' : ''}" style="width: ${Math.min(percentage, 100)}%"></div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <input type="number" id="contribute-${goal.id}" placeholder="Amount" 
                               style="flex: 1; padding: 0.5rem; border: 1px solid var(--border); border-radius: 6px; 
                               background: var(--bg-card); color: var(--text-primary);" step="0.01">
                        <button class="btn btn-success btn-small" onclick="contributeToGoal(${goal.id})">
                            <i class="fas fa-plus"></i> Add
                        </button>
                    </div>
                `;
                
                container.appendChild(goalCard);
            });
        }

        function contributeToGoal(id) {
            const input = document.getElementById(`contribute-${id}`);
            const amount = parseFloat(input.value);
            
            if (!amount || amount <= 0) {
                alert('Please enter a valid amount');
                return;
            }
            
            const goal = goals.find(g => g.id === id);
            if (goal) {
                goal.current += amount;
                localStorage.setItem(getStorageKey('goals'), JSON.stringify(goals));
                displayGoals();
                updateDashboard();
            }
        }

        function deleteGoal(id) {
            if (confirm('Delete this goal?')) {
                goals = goals.filter(g => g.id !== id);
                localStorage.setItem(getStorageKey('goals'), JSON.stringify(goals));
                displayGoals();
                updateDashboard();
            }
        }

        // =====================================================
        // TASK MANAGEMENT (KANBAN) FUNCTIONS
        // =====================================================
        document.getElementById('taskForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const task = {
                id: Date.now(),
                title: document.getElementById('taskTitle').value,
                description: document.getElementById('taskDesc').value,
                status: 'todo'
            };
            
            tasks.push(task);
            localStorage.setItem(getStorageKey('tasks'), JSON.stringify(tasks));
            
            this.reset();
            displayTasks();
            updateDashboard();
        });

        function displayTasks() {
            const todoContainer = document.getElementById('todoTasks');
            const progressContainer = document.getElementById('progressTasks');
            const doneContainer = document.getElementById('doneTasks');
            
            todoContainer.innerHTML = '';
            progressContainer.innerHTML = '';
            doneContainer.innerHTML = '';
            
            tasks.forEach(task => {
                const taskCard = document.createElement('div');
                taskCard.className = 'task-card';
                taskCard.draggable = true;
                taskCard.setAttribute('data-id', task.id);
                taskCard.ondragstart = drag;
                
                taskCard.innerHTML = `
                    <div class="task-card-title">${task.title}</div>
                    <div class="task-card-desc">${task.description || 'No description'}</div>
                    <button class="btn btn-danger btn-small" onclick="deleteTask(${task.id})" style="margin-top: 0.5rem;">
                        <i class="fas fa-trash"></i>
                    </button>
                `;
                
                if (task.status === 'todo') {
                    todoContainer.appendChild(taskCard);
                } else if (task.status === 'progress') {
                    progressContainer.appendChild(taskCard);
                } else {
                    doneContainer.appendChild(taskCard);
                }
            });
        }

        function allowDrop(ev) {
            ev.preventDefault();
        }

        function drag(ev) {
            ev.dataTransfer.setData('text', ev.target.getAttribute('data-id'));
        }

        function drop(ev) {
            ev.preventDefault();
            const taskId = parseInt(ev.dataTransfer.getData('text'));
            const newStatus = ev.currentTarget.getAttribute('data-status');
            
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                task.status = newStatus;
                localStorage.setItem(getStorageKey('tasks'), JSON.stringify(tasks));
                displayTasks();
                updateDashboard();
            }
        }

        function deleteTask(id) {
            if (confirm('Delete this task?')) {
                tasks = tasks.filter(t => t.id !== id);
                localStorage.setItem(getStorageKey('tasks'), JSON.stringify(tasks));
                displayTasks();
                updateDashboard();
            }
        }

        // =====================================================
        // HABIT TRACKER FUNCTIONS
        // =====================================================
        document.getElementById('habitForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const habit = {
                id: Date.now(),
                name: document.getElementById('habitName').value,
                completedDates: []
            };
            
            habits.push(habit);
            localStorage.setItem(getStorageKey('habits'), JSON.stringify(habits));
            
            this.reset();
            displayHabits();
            updateDashboard();
        });

        function displayHabits() {
            const container = document.getElementById('habitsList');
            container.innerHTML = '';
            
            if (habits.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No habits yet. Start building good habits!</p>';
                return;
            }
            
            habits.forEach(habit => {
                const streak = calculateStreak(habit.completedDates);
                const today = new Date().toISOString().split('T')[0];
                const completedToday = habit.completedDates.includes(today);
                
                const habitCard = document.createElement('div');
                habitCard.className = 'habit-item';
                habitCard.innerHTML = `
                    <div class="habit-info">
                        <h4>${habit.name}</h4>
                        <p style="font-size: 0.875rem; color: var(--text-secondary);">
                            ${completedToday ? '✅ Completed today' : '⏳ Not completed today'}
                        </p>
                    </div>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <div class="habit-streak">
                            <i class="fas fa-fire"></i> ${streak} day${streak !== 1 ? 's' : ''}
                        </div>
                        <button class="btn btn-success btn-small" onclick="toggleHabit(${habit.id})" 
                                ${completedToday ? 'disabled' : ''}>
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-danger btn-small" onclick="deleteHabit(${habit.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                
                container.appendChild(habitCard);
            });
        }

        function toggleHabit(id) {
            const habit = habits.find(h => h.id === id);
            if (habit) {
                const today = new Date().toISOString().split('T')[0];
                if (!habit.completedDates.includes(today)) {
                    habit.completedDates.push(today);
                    localStorage.setItem(getStorageKey('habits'), JSON.stringify(habits));
                    displayHabits();
                    updateDashboard();
                }
            }
        }

        function calculateStreak(completedDates) {
            if (completedDates.length === 0) return 0;
            
            const sorted = completedDates.sort().reverse();
            let streak = 0;
            let currentDate = new Date();
            
            for (let dateStr of sorted) {
                const date = new Date(dateStr);
                const diffDays = Math.floor((currentDate - date) / (1000 * 60 * 60 * 24));
                
                if (diffDays === streak) {
                    streak++;
                } else {
                    break;
                }
            }
            
            return streak;
        }

        function deleteHabit(id) {
            if (confirm('Delete this habit?')) {
                habits = habits.filter(h => h.id !== id);
                localStorage.setItem(getStorageKey('habits'), JSON.stringify(habits));
                displayHabits();
                updateDashboard();
            }
        }

        // =====================================================
        // SUBSCRIPTION TRACKER FUNCTIONS
        // =====================================================
        document.getElementById('subscriptionForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const subscription = {
                id: Date.now(),
                name: document.getElementById('subName').value,
                cost: parseFloat(document.getElementById('subCost').value),
                renewalDate: document.getElementById('subRenewal').value
            };
            
            subscriptions.push(subscription);
            localStorage.setItem(getStorageKey('subscriptions'), JSON.stringify(subscriptions));
            
            this.reset();
            displaySubscriptions();
            updateDashboard();
        });

        function displaySubscriptions() {
            const tbody = document.getElementById('subscriptionTableBody');
            const totalEl = document.getElementById('subTotal');
            tbody.innerHTML = '';
            
            const total = subscriptions.reduce((sum, sub) => sum + sub.cost, 0);
            totalEl.textContent = `${total.toFixed(2)}`;
            
            subscriptions.forEach(sub => {
                const daysUntil = Math.ceil((new Date(sub.renewalDate) - new Date()) / (1000 * 60 * 60 * 24));
                
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${sub.name}</td>
                    <td>${sub.cost.toFixed(2)}</td>
                    <td>${new Date(sub.renewalDate).toLocaleDateString()}</td>
                    <td class="${daysUntil < 7 ? 'text-warning' : ''}">${daysUntil} days</td>
                    <td>
                        <button class="btn btn-danger btn-small" onclick="deleteSubscription(${sub.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
            });
        }

        function deleteSubscription(id) {
            if (confirm('Delete this subscription?')) {
                subscriptions = subscriptions.filter(s => s.id !== id);
                localStorage.setItem(getStorageKey('subscriptions'), JSON.stringify(subscriptions));
                displaySubscriptions();
                updateDashboard();
            }
        }

        // =====================================================
        // TIME TRACKER FUNCTIONS
        // =====================================================
        document.getElementById('timeForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const entry = {
                id: Date.now(),
                activity: document.getElementById('timeActivity').value,
                hours: parseFloat(document.getElementById('timeHours').value),
                date: document.getElementById('timeDate').value
            };
            
            timeEntries.push(entry);
            localStorage.setItem(getStorageKey('timeEntries'), JSON.stringify(timeEntries));
            
            this.reset();
            document.getElementById('timeDate').valueAsDate = new Date();
            displayTimeEntries();
            updateDashboard();
        });

        function displayTimeEntries() {
            const tbody = document.getElementById('timeTableBody');
            tbody.innerHTML = '';
            
            const today = new Date().toISOString().split('T')[0];
            const todayHours = timeEntries
                .filter(e => e.date === today)
                .reduce((sum, e) => sum + e.hours, 0);
            
            const weekHours = timeEntries
                .filter(e => isThisWeek(new Date(e.date)))
                .reduce((sum, e) => sum + e.hours, 0);
            
            const monthHours = timeEntries
                .filter(e => isThisMonth(new Date(e.date)))
                .reduce((sum, e) => sum + e.hours, 0);
            
            document.getElementById('timeTodayHours').textContent = `${todayHours.toFixed(1)}h`;
            document.getElementById('timeWeekHours').textContent = `${weekHours.toFixed(1)}h`;
            document.getElementById('timeMonthHours').textContent = `${monthHours.toFixed(1)}h`;
            
            timeEntries.slice().reverse().forEach(entry => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${new Date(entry.date).toLocaleDateString()}</td>
                    <td>${entry.activity}</td>
                    <td>${entry.hours}h</td>
                    <td>
                        <button class="btn btn-danger btn-small" onclick="deleteTimeEntry(${entry.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
            });
        }

        function deleteTimeEntry(id) {
            if (confirm('Delete this entry?')) {
                timeEntries = timeEntries.filter(e => e.id !== id);
                localStorage.setItem(getStorageKey('timeEntries'), JSON.stringify(timeEntries));
                displayTimeEntries();
                updateDashboard();
            }
        }

        // =====================================================
        // UTILITY FUNCTIONS
        // =====================================================
        function isThisWeek(date) {
            const now = new Date();
            const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
            weekStart.setHours(0, 0, 0, 0);
            return date >= weekStart;
        }

        function isThisMonth(date) {
            const now = new Date();
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }

        function refreshSection(sectionId) {
            switch(sectionId) {
                case 'dashboard':
                    updateDashboard();
                    break;
                case 'expenses':
                    displayExpenses();
                    break;
                case 'budget':
                    displayBudgets();
                    break;
                case 'goals':
                    displayGoals();
                    break;
                case 'tasks':
                    displayTasks();
                    break;
                case 'habits':
                    displayHabits();
                    break;
                case 'subscriptions':
                    displaySubscriptions();
                    break;
                case 'time':
                    displayTimeEntries();
                    break;
            }
        }

        // =====================================================
        // INITIALIZE APP ON LOAD
        // =====================================================
        document.addEventListener('DOMContentLoaded', function() {
            // Set default dates to today
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('expenseDate').value = today;
            document.getElementById('timeDate').value = today;
            
            // Load all data
            updateDashboard();
            displayExpenses();
            displayBudgets();
            displayGoals();
            displayTasks();
            displayHabits();
            displaySubscriptions();
            displayTimeEntries();
            
            // Add demo data if this is first time
            if (expenses.length === 0 && localStorage.getItem('demoLoaded') !== 'true') {
                loadDemoData();
            }
        });

        // =====================================================
        // DEMO DATA (FOR LEARNING/TESTING)
        // =====================================================
        function loadDemoData() {
            // Demo expenses
            const demoExpenses = [
                { id: Date.now() - 10000, type: 'income', amount: 3000, category: 'Salary', description: 'Monthly Salary', date: '2026-01-01' },
                { id: Date.now() - 9000, type: 'expense', amount: 50, category: 'Food', description: 'Grocery Shopping', date: '2026-01-05' },
                { id: Date.now() - 8000, type: 'expense', amount: 30, category: 'Transport', description: 'Gas', date: '2026-01-07' },
                { id: Date.now() - 7000, type: 'expense', amount: 100, category: 'Entertainment', description: 'Movie & Dinner', date: '2026-01-10' },
                { id: Date.now() - 6000, type: 'expense', amount: 200, category: 'Bills', description: 'Electricity Bill', date: '2026-01-12' }
            ];
            
            // Demo budgets
            const demoBudgets = {
                'Food': 500,
                'Transport': 200,
                'Entertainment': 300,
                'Bills': 400,
                'Shopping': 350
            };
            
            // Demo goals
            const demoGoals = [
                { id: Date.now() - 5000, name: 'Emergency Fund', target: 5000, current: 1200, deadline: '2026-12-31' },
                { id: Date.now() - 4000, name: 'Vacation Trip', target: 2000, current: 500, deadline: '2026-06-30' }
            ];
            
            // Demo tasks
            const demoTasks = [
                { id: Date.now() - 3000, title: 'Complete project proposal', description: 'Finalize and submit the Q1 proposal', status: 'todo' },
                { id: Date.now() - 2000, title: 'Review code changes', description: 'Review PR #123', status: 'progress' },
                { id: Date.now() - 1000, title: 'Update documentation', description: 'Add API docs', status: 'done' }
            ];
            
            // Demo habits
            const demoHabits = [
                { id: Date.now() - 500, name: 'Morning Exercise', completedDates: ['2026-01-16', '2026-01-17', '2026-01-18'] },
                { id: Date.now() - 400, name: 'Read for 30 minutes', completedDates: ['2026-01-18'] }
            ];
            
            // Demo subscriptions
            const demoSubscriptions = [
                { id: Date.now() - 300, name: 'Netflix', cost: 15.99, renewalDate: '2026-02-01' },
                { id: Date.now() - 200, name: 'Spotify', cost: 9.99, renewalDate: '2026-01-25' },
                { id: Date.now() - 100, name: 'Cloud Storage', cost: 4.99, renewalDate: '2026-02-15' }
            ];
            
            // Demo time entries
            const demoTimeEntries = [
                { id: Date.now() - 90, activity: 'Study Programming', hours: 3, date: '2026-01-16' },
                { id: Date.now() - 80, activity: 'Work on Project', hours: 5, date: '2026-01-17' },
                { id: Date.now() - 70, activity: 'Meeting', hours: 2, date: '2026-01-18' }
            ];
            
            // Save demo data
            expenses = demoExpenses;
            budgets = demoBudgets;
            goals = demoGoals;
            tasks = demoTasks;
            habits = demoHabits;
            subscriptions = demoSubscriptions;
            timeEntries = demoTimeEntries;
            
            localStorage.setItem(getStorageKey('expenses'), JSON.stringify(expenses));
            localStorage.setItem(getStorageKey('budgets'), JSON.stringify(budgets));
            localStorage.setItem(getStorageKey('goals'), JSON.stringify(goals));
            localStorage.setItem(getStorageKey('tasks'), JSON.stringify(tasks));
            localStorage.setItem(getStorageKey('habits'), JSON.stringify(habits));
            localStorage.setItem(getStorageKey('subscriptions'), JSON.stringify(subscriptions));
            localStorage.setItem(getStorageKey('timeEntries'), JSON.stringify(timeEntries));
            localStorage.setItem('demoLoaded', 'true');
            
            // Refresh all displays
            updateDashboard();
            displayExpenses();
            displayBudgets();
            displayGoals();
            displayTasks();
            displayHabits();
            displaySubscriptions();
            displayTimeEntries();
            
            alert('Demo data loaded! Explore the app to see all features in action.');
        }

        // Add button to clear all data (for testing)
        window.clearAllData = function() {
            if (confirm('This will delete ALL data. Are you sure?')) {
                localStorage.clear();
                       location.reload();
            }
        };