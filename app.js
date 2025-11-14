class FutureDecide {
    constructor() {
        this.currentMode = 'wheel';
        this.spinning = false;
        this.wheelData = {
            min: 1,
            max: 20,
            numbers: [],
            usedNumbers: new Set(),
            mapping: []
        };
        this.taskData = {
            tasks: [],
            usedTasks: []
        };
        this.punishmentData = {
            punishments: [],
            usedPunishments: []
        };
        this.currentTheme = 'blue';
        this.noReplacementWheel = false;
        this.noReplacementTask = false;
        this.noReplacementPunishment = false;
        this.importType = 'task';
        
        this.init();
    }

    init() {
        this.loadState();
        this.setupEventListeners();
        this.buildWheel();
        this.renderTasks();
        this.renderPunishments();
        this.updateUI();
        
        if (this.taskData.tasks.length === 0) {
            this.loadSampleTasks();
        }
        
        if (this.punishmentData.punishments.length === 0) {
            this.loadSamplePunishments();
        }
    }

    loadState() {
        try {
            const saved = localStorage.getItem('futureDecideState');
            if (saved) {
                const state = JSON.parse(saved);
                this.wheelData.min = state.wheelMin || 1;
                this.wheelData.max = state.wheelMax || 20;
                this.wheelData.usedNumbers = new Set(state.usedNumbers || []);
                this.taskData.tasks = state.tasks || [];
                this.taskData.usedTasks = state.usedTasks || [];
                this.punishmentData.punishments = state.punishments || [];
                this.punishmentData.usedPunishments = state.usedPunishments || [];
                this.currentTheme = state.theme || 'blue';
                this.noReplacementWheel = state.noReplacementWheel || false;
                this.noReplacementTask = state.noReplacementTask || false;
                this.noReplacementPunishment = state.noReplacementPunishment || false;
                
                document.body.setAttribute('data-theme', this.currentTheme);
                document.getElementById('noReplacementWheel').checked = this.noReplacementWheel;
                document.getElementById('noReplacementTask').checked = this.noReplacementTask;
                document.getElementById('noReplacementPunishment').checked = this.noReplacementPunishment;
            }
        } catch (e) {
            console.error('Failed to load state:', e);
        }
    }

    saveState() {
        const state = {
            wheelMin: this.wheelData.min,
            wheelMax: this.wheelData.max,
            usedNumbers: Array.from(this.wheelData.usedNumbers),
            tasks: this.taskData.tasks,
            usedTasks: this.taskData.usedTasks,
            punishments: this.punishmentData.punishments,
            usedPunishments: this.punishmentData.usedPunishments,
            theme: this.currentTheme,
            noReplacementWheel: this.noReplacementWheel,
            noReplacementTask: this.noReplacementTask,
            noReplacementPunishment: this.noReplacementPunishment
        };
        localStorage.setItem('futureDecideState', JSON.stringify(state));
    }

    setupEventListeners() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.getAttribute('data-mode');
                this.switchMode(mode);
            });
        });

        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        
        document.getElementById('minRange').addEventListener('change', (e) => {
            this.wheelData.min = parseInt(e.target.value);
            this.buildWheel();
        });
        
        document.getElementById('maxRange').addEventListener('change', (e) => {
            this.wheelData.max = parseInt(e.target.value);
            this.buildWheel();
        });
        
        document.getElementById('quickRanges').addEventListener('change', (e) => {
            if (e.target.value) {
                const [min, max] = e.target.value.split(',').map(Number);
                this.wheelData.min = min;
                this.wheelData.max = max;
                document.getElementById('minRange').value = min;
                document.getElementById('maxRange').value = max;
                this.buildWheel();
            }
        });

        document.getElementById('spinBtn').addEventListener('click', () => this.spinWheel());
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && this.currentMode === 'wheel' && !this.spinning) {
                this.spinWheel();
            }
        });

        document.getElementById('noReplacementWheel').addEventListener('change', (e) => {
            this.noReplacementWheel = e.target.checked;
            this.saveState();
            this.updateUI();
        });

        document.getElementById('undoWheelBtn').addEventListener('click', () => this.undoWheel());
        document.getElementById('resetWheelBtn').addEventListener('click', () => this.resetWheel());

        document.getElementById('addTaskBtn').addEventListener('click', () => this.addTask());
        document.getElementById('taskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask();
            }
        });

        document.getElementById('generateTaskBtn').addEventListener('click', () => this.generateTask());
        document.getElementById('noReplacementTask').addEventListener('change', (e) => {
            this.noReplacementTask = e.target.checked;
            this.saveState();
            this.updateUI();
        });

        document.getElementById('undoTaskBtn').addEventListener('click', () => this.undoTask());
        document.getElementById('resetTasksBtn').addEventListener('click', () => this.resetTasks());
        document.getElementById('exportTasksBtn').addEventListener('click', () => this.exportTasks());
        document.getElementById('importTasksBtn').addEventListener('click', () => this.showImportModal());

        document.getElementById('modalCancel').addEventListener('click', () => this.hideModal());
        document.getElementById('importCancel').addEventListener('click', () => this.hideImportModal());
        document.getElementById('importConfirm').addEventListener('click', () => this.handleImport());

        document.getElementById('addPunishmentBtn').addEventListener('click', () => this.addPunishment());
        document.getElementById('punishmentInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addPunishment();
            }
        });

        document.getElementById('rollPunishmentBtn').addEventListener('click', () => this.rollPunishment());
        document.getElementById('noReplacementPunishment').addEventListener('change', (e) => {
            this.noReplacementPunishment = e.target.checked;
            this.saveState();
            this.updateUI();
        });

        document.getElementById('undoPunishmentBtn').addEventListener('click', () => this.undoPunishment());
        document.getElementById('resetPunishmentsBtn').addEventListener('click', () => this.resetPunishments());
        document.getElementById('exportPunishmentsBtn').addEventListener('click', () => this.exportPunishments());
        document.getElementById('importPunishmentsBtn').addEventListener('click', () => this.showImportPunishmentModal());
    }

    switchMode(mode) {
        this.currentMode = mode;
        
        document.querySelectorAll('.mode-section').forEach(section => {
            section.classList.remove('active');
        });
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        let modeId;
        if (mode === 'wheel') {
            modeId = 'wheelMode';
        } else if (mode === 'task') {
            modeId = 'taskMode';
        } else if (mode === 'punishment') {
            modeId = 'punishmentsMode';
        }
        
        document.getElementById(modeId).classList.add('active');
        document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
    }

    toggleTheme() {
        const themes = ['blue', 'purple', 'cyan'];
        const currentIndex = themes.indexOf(this.currentTheme);
        this.currentTheme = themes[(currentIndex + 1) % themes.length];
        document.body.setAttribute('data-theme', this.currentTheme);
        this.saveState();
    }

    buildWheel() {
        const { min, max } = this.wheelData;
        const total = max - min + 1;
        const maxVisible = 120;
        
        if (total >= 120 && !this.wheelConfirmed) {
            this.showConfirmModal(
                `Large Range Detected`,
                `You're creating a wheel with ${total} numbers. For better performance and visibility, we recommend sampling to ${Math.min(maxVisible, total)} visible slices. The result will still cover the full range.`,
                () => {
                    this.wheelConfirmed = true;
                    this.buildWheel();
                }
            );
            return;
        }

        this.wheelData.numbers = [];
        for (let i = min; i <= max; i++) {
            this.wheelData.numbers.push(i);
        }

        const visible = Math.min(total, maxVisible);
        this.wheelData.mapping = [];
        
        for (let i = 0; i < visible; i++) {
            const value = min + Math.floor((i * total) / visible);
            this.wheelData.mapping.push(value);
        }

        this.renderWheel();
        this.saveState();
    }

    renderWheel() {
        const wheelGroup = document.getElementById('wheelGroup');
        const { mapping } = this.wheelData;
        const sliceAngle = 360 / mapping.length;
        
        let svgContent = '';
        
        mapping.forEach((num, i) => {
            const startAngle = i * sliceAngle - 90;
            const endAngle = (i + 1) * sliceAngle - 90;
            const isUsed = this.wheelData.usedNumbers.has(num);
            
            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;
            
            const x1 = Math.cos(startRad) * 150;
            const y1 = Math.sin(startRad) * 150;
            const x2 = Math.cos(endRad) * 150;
            const y2 = Math.sin(endRad) * 150;
            
            const largeArc = sliceAngle > 180 ? 1 : 0;
            
            const hue = (i * 360) / mapping.length;
            const fillColor = isUsed 
                ? 'rgba(100, 100, 100, 0.3)' 
                : `hsla(${hue}, 70%, 60%, 0.6)`;
            
            svgContent += `
                <path class="wheel-slice ${isUsed ? 'used' : ''}" 
                      d="M 0 0 L ${x1} ${y1} A 150 150 0 ${largeArc} 1 ${x2} ${y2} Z"
                      fill="${fillColor}"
                      stroke="rgba(255, 255, 255, 0.2)"
                      stroke-width="1"/>
            `;
            
            if (mapping.length <= 50) {
                const midAngle = (startAngle + endAngle) / 2;
                const midRad = (midAngle * Math.PI) / 180;
                const textX = Math.cos(midRad) * 100;
                const textY = Math.sin(midRad) * 100;
                
                svgContent += `
                    <text class="slice-text" 
                          x="${textX}" 
                          y="${textY}" 
                          text-anchor="middle" 
                          dominant-baseline="middle"
                          transform="rotate(${midAngle + 90}, ${textX}, ${textY})">
                        ${num}
                    </text>
                `;
            }
        });
        
        wheelGroup.innerHTML = svgContent;
    }

    spinWheel() {
        if (this.spinning) return;
        
        const availableNumbers = this.wheelData.numbers.filter(
            num => !this.wheelData.usedNumbers.has(num)
        );
        
        if (availableNumbers.length === 0) {
            alert('All numbers have been used! Reset the wheel to continue.');
            return;
        }

        this.spinning = true;
        document.getElementById('spinBtn').disabled = true;
        
        const wheelGroup = document.getElementById('wheelGroup');
        const duration = 5000;
        const startTime = performance.now();
        const totalRotation = 1800 + Math.random() * 360;
        
        const easeOutCubic = (t) => {
            return 1 - Math.pow(1 - t, 3);
        };
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easedProgress = easeOutCubic(progress);
            const currentAngle = totalRotation * easedProgress;
            
            wheelGroup.style.transform = `translate(200px, 200px) rotate(${currentAngle}deg)`;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.finishSpin(currentAngle);
            }
        };
        
        requestAnimationFrame(animate);
    }

    finishSpin(finalAngle) {
        const normalizedAngle = ((finalAngle % 360) + 360) % 360;
        const { mapping, numbers, min, max } = this.wheelData;
        const total = max - min + 1;
        
        let selectedNumber;
        
        if (total <= 120) {
            const sliceAngle = 360 / mapping.length;
            const selectedIndex = Math.floor((360 - normalizedAngle) / sliceAngle) % mapping.length;
            selectedNumber = mapping[selectedIndex];
        } else {
            const availableNumbers = numbers.filter(
                num => !this.wheelData.usedNumbers.has(num)
            );
            
            if (availableNumbers.length === 0) {
                selectedNumber = numbers[0];
            } else {
                const angleRatio = normalizedAngle / 360;
                const indexInRange = Math.floor(angleRatio * availableNumbers.length);
                selectedNumber = availableNumbers[indexInRange];
            }
        }
        
        if (this.noReplacementWheel && this.wheelData.usedNumbers.has(selectedNumber)) {
            const availableNumbers = numbers.filter(
                num => !this.wheelData.usedNumbers.has(num)
            );
            if (availableNumbers.length > 0) {
                selectedNumber = availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
            }
        }
        
        if (this.noReplacementWheel) {
            this.wheelData.usedNumbers.add(selectedNumber);
        }
        
        this.showResult(selectedNumber);
        this.renderWheel();
        this.saveState();
        
        this.spinning = false;
        document.getElementById('spinBtn').disabled = false;
    }

    showResult(number) {
        const resultPanel = document.getElementById('resultPanel');
        const resultNumber = document.getElementById('resultNumber');
        
        resultNumber.textContent = number;
        resultPanel.classList.remove('hidden');
        
        this.updateUI();
    }

    undoWheel() {
        const usedArray = Array.from(this.wheelData.usedNumbers);
        if (usedArray.length > 0) {
            const lastUsed = usedArray[usedArray.length - 1];
            this.wheelData.usedNumbers.delete(lastUsed);
            this.renderWheel();
            this.saveState();
            this.updateUI();
        }
    }

    resetWheel() {
        this.wheelData.usedNumbers.clear();
        this.wheelConfirmed = false;
        document.getElementById('resultPanel').classList.add('hidden');
        this.renderWheel();
        this.saveState();
        this.updateUI();
    }

    updateUI() {
        const usedNumbersPanel = document.getElementById('usedNumbersPanel');
        const usedNumbersList = document.getElementById('usedNumbersList');
        
        if (this.noReplacementWheel && this.wheelData.usedNumbers.size > 0) {
            usedNumbersPanel.classList.remove('hidden');
            usedNumbersList.innerHTML = Array.from(this.wheelData.usedNumbers)
                .map(num => `
                    <div class="used-item">
                        <span>${num}</span>
                        <button onclick="app.restoreNumber(${num})" aria-label="Restore ${num}">×</button>
                    </div>
                `).join('');
        } else {
            usedNumbersPanel.classList.add('hidden');
        }

        const usedTasksPanel = document.getElementById('usedTasksPanel');
        const usedTasksList = document.getElementById('usedTasksList');
        
        if (this.noReplacementTask && this.taskData.usedTasks.length > 0) {
            usedTasksPanel.classList.remove('hidden');
            usedTasksList.innerHTML = this.taskData.usedTasks
                .map((task, index) => `
                    <div class="used-item">
                        <span>${task}</span>
                        <button onclick="app.restoreTask(${index})" aria-label="Restore task">×</button>
                    </div>
                `).join('');
        } else {
            usedTasksPanel.classList.add('hidden');
        }

        const usedPunishmentsPanel = document.getElementById('usedPunishmentsPanel');
        const usedPunishmentsList = document.getElementById('usedPunishmentsList');
        
        if (this.noReplacementPunishment && this.punishmentData.usedPunishments.length > 0) {
            usedPunishmentsPanel.classList.remove('hidden');
            usedPunishmentsList.innerHTML = this.punishmentData.usedPunishments
                .map((punishment, index) => `
                    <div class="used-item">
                        <span>${punishment}</span>
                        <button onclick="app.restorePunishment(${index})" aria-label="Restore punishment">×</button>
                    </div>
                `).join('');
        } else {
            usedPunishmentsPanel.classList.add('hidden');
        }
    }

    restoreNumber(num) {
        this.wheelData.usedNumbers.delete(num);
        this.renderWheel();
        this.saveState();
        this.updateUI();
    }

    loadSampleTasks() {
        this.taskData.tasks = [
            "Review project documentation",
            "Update database schema",
            "Refactor authentication module",
            "Write unit tests",
            "Deploy to staging environment",
            "Schedule team meeting",
            "Optimize API performance",
            "Create design mockups"
        ];
        this.renderTasks();
        this.saveState();
    }

    addTask() {
        const input = document.getElementById('taskInput');
        const text = input.value.trim();
        
        if (text && text.length <= 120) {
            this.taskData.tasks.push(text);
            input.value = '';
            this.renderTasks();
            this.saveState();
        }
    }

    removeTask(index) {
        this.taskData.tasks.splice(index, 1);
        this.renderTasks();
        this.saveState();
    }

    renderTasks() {
        const grid = document.getElementById('tasksGrid');
        grid.innerHTML = this.taskData.tasks.map((task, index) => `
            <div class="task-card" data-index="${index}">
                <div class="task-text">${task}</div>
                <button class="task-remove" onclick="app.removeTask(${index})" aria-label="Remove task">×</button>
            </div>
        `).join('');
    }

    async generateTask() {
        const availableTasks = this.taskData.tasks.filter(
            task => !this.taskData.usedTasks.includes(task)
        );
        
        if (availableTasks.length === 0) {
            alert('All tasks have been used! Reset to continue.');
            return;
        }

        const cards = document.querySelectorAll('.task-card');
        cards.forEach(card => {
            card.classList.add('shuffling');
        });

        await new Promise(resolve => setTimeout(resolve, 500));

        cards.forEach(card => {
            card.classList.remove('shuffling');
        });

        const selectedTask = availableTasks[Math.floor(Math.random() * availableTasks.length)];
        const selectedIndex = this.taskData.tasks.indexOf(selectedTask);
        const selectedCard = document.querySelector(`[data-index="${selectedIndex}"]`);
        
        if (selectedCard) {
            selectedCard.classList.add('selected');
            
            setTimeout(() => {
                selectedCard.classList.remove('selected');
            }, 2000);
        }

        if (this.noReplacementTask) {
            this.taskData.usedTasks.push(selectedTask);
        }

        this.saveState();
        this.updateUI();
    }

    undoTask() {
        if (this.taskData.usedTasks.length > 0) {
            this.taskData.usedTasks.pop();
            this.saveState();
            this.updateUI();
        }
    }

    resetTasks() {
        this.taskData.usedTasks = [];
        this.saveState();
        this.updateUI();
    }

    restoreTask(index) {
        this.taskData.usedTasks.splice(index, 1);
        this.saveState();
        this.updateUI();
    }

    exportTasks() {
        const json = JSON.stringify(this.taskData.tasks, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'futuredecide-tasks.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    showImportModal() {
        this.importType = 'task';
        document.getElementById('importModal').classList.remove('hidden');
    }

    handleImport() {
        if (this.importType === 'task') {
            this.importTasks();
        } else if (this.importType === 'punishment') {
            this.importPunishments();
        }
    }

    hideImportModal() {
        document.getElementById('importModal').classList.add('hidden');
        document.getElementById('importTextarea').value = '';
    }

    importTasks() {
        const textarea = document.getElementById('importTextarea');
        try {
            const imported = JSON.parse(textarea.value);
            if (Array.isArray(imported)) {
                this.taskData.tasks = imported.filter(task => 
                    typeof task === 'string' && task.length <= 120
                );
                this.renderTasks();
                this.saveState();
                this.hideImportModal();
            } else {
                alert('Invalid format. Please provide an array of strings.');
            }
        } catch (e) {
            alert('Invalid JSON. Please check your input.');
        }
    }

    showConfirmModal(title, message, onConfirm) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalMessage').textContent = message;
        document.getElementById('modal').classList.remove('hidden');
        
        const confirmBtn = document.getElementById('modalConfirm');
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newConfirmBtn.addEventListener('click', () => {
            onConfirm();
            this.hideModal();
        });
    }

    hideModal() {
        document.getElementById('modal').classList.add('hidden');
    }

    loadSamplePunishments() {
        this.punishmentData.punishments = [
            "Do 20 push-ups",
            "Clean the kitchen",
            "No screen time for 1 hour",
            "Write a handwritten apology",
            "Organize your workspace",
            "Do the dishes",
            "Take out the trash",
            "No dessert for today"
        ];
        this.renderPunishments();
        this.saveState();
    }

    addPunishment() {
        const input = document.getElementById('punishmentInput');
        const text = input.value.trim();
        
        if (text && text.length <= 120) {
            this.punishmentData.punishments.push(text);
            input.value = '';
            this.renderPunishments();
            this.saveState();
        }
    }

    removePunishment(index) {
        this.punishmentData.punishments.splice(index, 1);
        this.renderPunishments();
        this.saveState();
    }

    renderPunishments() {
        const grid = document.getElementById('punishmentsGrid');
        grid.innerHTML = this.punishmentData.punishments.map((punishment, index) => `
            <div class="task-card" data-index="${index}">
                <div class="task-text">${punishment}</div>
                <button class="task-remove" onclick="app.removePunishment(${index})" aria-label="Remove punishment">×</button>
            </div>
        `).join('');
    }

    async rollPunishment() {
        const availablePunishments = this.punishmentData.punishments.filter(
            punishment => !this.punishmentData.usedPunishments.includes(punishment)
        );
        
        if (availablePunishments.length === 0) {
            alert('All punishments have been used! Reset to continue.');
            return;
        }

        const cards = document.querySelectorAll('#punishmentsGrid .task-card');
        cards.forEach(card => {
            card.classList.add('shuffling');
        });

        await new Promise(resolve => setTimeout(resolve, 600));

        cards.forEach(card => {
            card.classList.remove('shuffling');
        });

        const selectedPunishment = availablePunishments[Math.floor(Math.random() * availablePunishments.length)];
        const selectedIndex = this.punishmentData.punishments.indexOf(selectedPunishment);
        const selectedCard = document.querySelector(`#punishmentsGrid [data-index="${selectedIndex}"]`);
        
        if (selectedCard) {
            selectedCard.classList.add('selected');
            
            setTimeout(() => {
                selectedCard.classList.remove('selected');
            }, 2000);
        }

        if (this.noReplacementPunishment) {
            this.punishmentData.usedPunishments.push(selectedPunishment);
        }

        this.saveState();
        this.updateUI();
    }

    undoPunishment() {
        if (this.punishmentData.usedPunishments.length > 0) {
            this.punishmentData.usedPunishments.pop();
            this.saveState();
            this.updateUI();
        }
    }

    resetPunishments() {
        this.punishmentData.usedPunishments = [];
        this.saveState();
        this.updateUI();
    }

    restorePunishment(index) {
        this.punishmentData.usedPunishments.splice(index, 1);
        this.saveState();
        this.updateUI();
    }

    exportPunishments() {
        const json = JSON.stringify(this.punishmentData.punishments, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'futuredecide-punishments.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    showImportPunishmentModal() {
        this.importType = 'punishment';
        document.getElementById('importModal').classList.remove('hidden');
    }

    importPunishments() {
        const textarea = document.getElementById('importTextarea');
        try {
            const imported = JSON.parse(textarea.value);
            if (Array.isArray(imported)) {
                this.punishmentData.punishments = imported.filter(punishment => 
                    typeof punishment === 'string' && punishment.length <= 120
                );
                this.renderPunishments();
                this.saveState();
                this.hideImportModal();
            } else {
                alert('Invalid format. Please provide an array of strings.');
            }
        } catch (e) {
            alert('Invalid JSON. Please check your input.');
        }
    }
}

const app = new FutureDecide();
