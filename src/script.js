// Tag prototype
class Tag {
    constructor(name, color) {
        this.name = name;
        this.color = color;
    }
}
// Task prototype
class Task {
    constructor(title, description, tags = []) {
        this.title = title;
        this.description = description;
        this.tags = tags;
        this.isDone = false;
        this.isUrgent = false;
        this.isImportant = false;
        this.createdAt = new Date();
        this.dueDate = null;
        this.pomodoroSessions = 0; // Track completed pomodoro sessions
        this.estimatedPomodoros = 1; // Estimated pomodoros needed
    }
}
// Task manager
class TodoApp {
    constructor() {
        this.tasks = [];
        this.tags = [];
        this.selectedTagNames = [];
        this.selectedStatus = "all";
        this.isEisenView = false;
        //Sorting
        this.currentSort = 'date';
        this.currentSortDirection = 'desc';
        // Get UI elements
        this.importantUI = document.getElementById("isImportant");
        this.urgentUI = document.getElementById("isUrgent");
        this.tasksContainer = document.getElementById("tasksContainer");
        this.mainContainer = document.getElementById("container");
        this.tagsFilterContainer = document.getElementById("tag-filters");
        this.modalTagsContainer = document.getElementById("modalTags");
        this.addModal = document.getElementById("addModal");
        this.addNewBtn = document.getElementById("addNew");
        this.cancelAdd = document.getElementById("cancelBtn");
        this.taskTitleInput = document.getElementById("taskTitle");
        this.taskDescriptionInput = document.getElementById("description");
        this.taskForm = document.getElementById("NewTaskForm");
        this.addTagform = document.getElementById("addNewtagForm");
        this.tagAddBtn = document.getElementById("addTagBtn");
        //progress bar
        this.progressBar = document.getElementById("progressBar");
        this.progressText = document.getElementById("progressText");
        //due date
        this.dueDateInput = document.getElementById("dueDate");
        //sorting
        this.sortBtn = document.getElementById("sort-btn");
        this.sortDropdown = document.getElementById("sort-dropdown");
        // Bind methods
        this.loadFromLocalStorage();
        this.bindUI();
        this.renderTagFilters();
        //add sort methodes here
        this.sortTasks();
        this.updateSortBtnText();
        this.keyboard();
        this.renderTasks(true);
        this.pomodoroTimer = new PomodoroTimer(this);
    }
    bindUI() {
        // Open modal and render tags
        this.addNewBtn.addEventListener('click', () => {
            this.addModal.classList.remove('hidden');
            const modalContent = this.addModal.querySelector(".bg-white");
            if (modalContent) {
                modalContent.classList.add("modal-content");
            }
            this.renderModalTags();
        });
        this.cancelAdd.addEventListener('click', () => {
            this.resetTaskForm();
            this.addModal.classList.add('hidden');
            if (this.taskForm._editHandler) {
                this.taskForm.removeEventListener('submit', this.taskForm._editHandler);
                this.taskForm._editHandler = null;
            }
        });
        this.addModal.addEventListener('click', (e) => {
            if (e.target === this.addModal) {
                this.resetTaskForm();
                this.addModal.classList.add('hidden');
                if (this.taskForm._editHandler) {
                    this.taskForm.removeEventListener('submit', this.taskForm._editHandler);
                    this.taskForm._editHandler = null;
                }
            }
        });
        // Add tag from form
        this.tagAddBtn.addEventListener('click', () => {
            const nameInput = document.getElementById("newTagName");
            const name = nameInput.value.trim();
            const color = document.getElementById("newTagColor").value;
            if (!name) return;
            const exists = this.tags.some(tag => tag.name.toLowerCase() === name.toLowerCase());
            if (exists) {
                alert("Tag must be unique!");
                return;
            }
            this.addTag(new Tag(name, color));
            nameInput.value = "";
            this.renderModalTags();
            this.renderTagFilters();
            this.addTagform.classList.add("hidden");
        });
        // Submit new task
        this.taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = this.taskTitleInput.value.trim();
            const description = this.taskDescriptionInput.value.trim();
            const isImportantT = this.importantUI.checked;
            const isUrgentT = this.urgentUI.checked;
            if (!title) return;
            const dueDate = this.dueDateInput.value ? new Date(this.dueDateInput.value) : null;
            const selectedTags = this.tags.filter(tag => this.selectedTagNames.includes(tag.name));
            const newTask = new Task(title, description, selectedTags);
            newTask.isImportant = isImportantT;
            newTask.isUrgent = isUrgentT;
            newTask.dueDate = dueDate;
            this.tasks.push(newTask);
            this.saveToLocalStorage();
            // Reset form
            this.taskTitleInput.value = "";
            this.taskDescriptionInput.value = "";
            this.selectedTagNames = [];
            this.importantUI.checked = false;
            this.urgentUI.checked = false;
            this.dueDateInput.value = "";
            this.addModal.classList.add("hidden");
            this.renderView();
        });
        this.statusButtons = Array.from(document.querySelectorAll("#status-filter button"));
        this.statusButtons.forEach(button => {
            button.addEventListener('click', () => {
                const status = button.getAttribute("data-status");
                this.selectedStatus = status;
                // Remove active styles
                this.statusButtons.forEach(btn => btn.classList.remove('ring-1', 'ring-offset-1', 'ring-gray-400'));
                // Add active style to clicked button
                button.classList.add('ring-1', 'ring-offset-1', 'ring-gray-400');
                this.renderView();
            });
        });
        // Add default style to "All"
        this.statusButtons.forEach(btn => {
            if (btn.getAttribute("data-status") === 'all') {
                btn.classList.add('ring-1', 'ring-offset-1', 'ring-gray-400');
                btn.click();
            }
        });
        //easter egg: ligne thought title
        const appName = document.getElementById("appName");
        appName.addEventListener("click", () => {
            appName.classList.toggle("line-through");
            appName.classList.toggle("opacity-80");
        });
        appName.addEventListener('dblclick', () => {
            this.clear();
            this.renderTasks();
        });
        const toggleEisen = document.getElementById("toggleEisenView");
        toggleEisen.addEventListener('click', () => {
            this.isEisenView = !this.isEisenView;
            this.renderView();
        });
        //sorting listeners
        this.sortBtn.addEventListener('click', () => {
            this.sortDropdown.classList.toggle('hidden');
        });
        const sortOptions = document.querySelectorAll(".sort-option");
        sortOptions.forEach(option => {
            const sortType = option.getAttribute("data-sort");
            if (sortType === this.currentSort) {
                option.classList.add("bg-gray-100");
                const arrow = document.createElement("span");
                arrow.className = 'sort-arrow ml-2';
                arrow.innerHTML = this.currentSortDirection === 'asc' ? '↑' : '↓';
                option.appendChild(arrow);
            }
            option.addEventListener('click', () => {
                const sortType = option.getAttribute("data-sort");
                document.querySelectorAll('.sort-arrow').forEach(arr => {
                    arr.remove();
                });
                if (this.currentSort === sortType) {
                    this.currentSortDirection = this.currentSortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    this.currentSort = sortType;
                    this.currentSortDirection = 'asc';
                    sortOptions.forEach(opt => {
                        opt.classList.remove('bg-gray-100');
                    });
                }
                option.classList.add("bg-gray-100");
                const arrow = document.createElement("span");
                arrow.className = 'sort-arrow ml-2';
                arrow.innerHTML = this.currentSortDirection === 'asc' ? '↑' : '↓';
                option.appendChild(arrow);
                this.updateSortBtnText();
                this.sortTasks();
                this.sortDropdown.classList.add('hidden');
            });
        });
        document.addEventListener('click', (e) => {
            if (!this.sortDropdown.contains(e.target) && !this.sortBtn.contains(e.target)) {
                this.sortDropdown.classList.add("hidden");
            }
        });
    }
    addTag(tag) {
        this.tags.push(tag);
        this.saveToLocalStorage();
    }
    renderTagFilters() {
        this.tagsFilterContainer.innerHTML = '';
        // Add "Deselect All" button
        if (this.tags.length > 0) {
            const clearBtn = document.createElement("button");
            clearBtn.textContent = "Deselect All";
            clearBtn.className = "mb-2 mr-2 py-1 px-3 bg-white ring text-gray-800 rounded-full hover:bg-gray-400 cursor-pointer";
            clearBtn.addEventListener('click', () => {
                this.selectedTagNames = [];
                this.renderTagFilters();
                this.renderView();
            });
            this.tagsFilterContainer.appendChild(clearBtn);
        }
        // Render tag buttons
        let delay = 0;
        this.tags.forEach(tag => {
            const isSelected = this.selectedTagNames.includes(tag.name);
            const btn = document.createElement("button");
            btn.className = `cursor-pointer shrink-0 py-1 px-3 flex items-center gap-2 border-0 hover:bg-gray-200 rounded-2xl ${
            isSelected ? 'ring-1 ring-gray-400' : ''
        }`;
            btn.style.animationDelay = `${delay}ms`;
            delay += 50;
            btn.innerHTML = `
            <div class="w-[25px] h-[25px] rounded-full shrink-0" style="background-color: ${tag.color}"></div>
            <span class="text-[15px]">${tag.name}</span>
        `;
            btn.addEventListener('click', () => {
                const index = this.selectedTagNames.indexOf(tag.name);
                if (index > -1) {
                    this.selectedTagNames.splice(index, 1);
                    btn.classList.remove("pulse");
                } else {
                    this.selectedTagNames.push(tag.name);
                    btn.classList.add("pulse");
                }
                this.renderTagFilters();
                this.renderView();
            });
            this.tagsFilterContainer.appendChild(btn);
        });
    }
    renderModalTags() {
        this.modalTagsContainer.innerHTML = "";
        if (this.tags.length === 0) {
            this.modalTagsContainer.innerHTML = "<p>No tags for now</p>";
        } else {
            this.tags.forEach(tag => {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = `shrink-0 py-2 px-3 flex items-center gap-2 border-0 hover:bg-gray-200 cursor-pointer rounded-2xl ${this.selectedTagNames.includes(tag.name) ? 'ring-2 ring-offset-2' : ''}`;
                btn.innerHTML = `
                    <div class="relative group">
            <div class="w-[25px] h-[25px] rounded-full shrink-0" style="background-color: ${tag.color}"></div>
            <button type="button" class="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs text-white bg-gray-500 hidden group-hover:block delete-tag">&times;</button>
        </div>
                    <span class="text-[15px]">${tag.name}</span>
                `;
                btn.addEventListener('click', () => {
                    const index = this.selectedTagNames.indexOf(tag.name);
                    if (index > -1) {
                        this.selectedTagNames.splice(index, 1);
                    } else {
                        this.selectedTagNames.push(tag.name);
                    }
                    this.renderModalTags();
                });
                //delete tag button
                const deleteBtn = btn.querySelector(".delete-tag");
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm(`Delete ${tag.name}?`)) {
                        this.tags = this.tags.filter(t => t !== tag);
                        this.tasks.forEach(task => {
                            task.tags = task.tags.filter(t => t.name !== tag.name);
                        });
                        this.renderModalTags();
                        this.renderTagFilters();
                        this.saveToLocalStorage();
                        this.renderView();
                    }
                });
                this.modalTagsContainer.appendChild(btn);
            });
        }
        // "+" Button for Add New Tag Form
        const addBtn = document.createElement("button");
        addBtn.type = "button";
        addBtn.id = "showAddtagInModal";
        addBtn.className = "flex items-center justify-center gap-1 bg-[#69665C] text-white ml-3 px-3 py-2 rounded-full hover:bg-[#5e5b52] w-[25px] h-[25px] cursor-pointer";
        addBtn.innerHTML = `<span class="text-sm">
        <svg class="w-5 h-5 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-7 7V5"/>
</svg>
        </span>`;
        addBtn.addEventListener('click', () => {
            this.addTagform.classList.toggle("hidden");
        });
        this.modalTagsContainer.appendChild(addBtn);
    }
    renderTasks(isInitialRender = false) {
        this.mainContainer.innerHTML = '';
        const tasksContainer = document.createElement("div");
        tasksContainer.className = 'columns-1 md:columns-2 gap-3 space-y-3 p-5';
        this.mainContainer.appendChild(tasksContainer);
        if (this.tasks.length === 0) {
            const msg = document.createElement("h3");
            msg.className = 'text-lg text-gray-700 text-center';
            msg.textContent = "There's no tasks yet, try adding one now!";
            tasksContainer.appendChild(msg);
        } else {
            this.deleteEmpty();
            tasksContainer.innerHTML = "";
            const filteredTasks = this.filterTasks();
            filteredTasks.forEach((task, index) => {
                const card = document.createElement("div");
                // Add initial animation state for first render
                if (isInitialRender) {
                    card.className = "relative break-inside-avoid bg-[#FFF9DE] p-6 rounded-2xl task-card opacity-0 translate-y-6 transition-all duration-500 ease-out";
                    // Add animation delay based on index for staggered effect
                    card.style.transitionDelay = `${index * 100}ms`;
                } else {
                    card.className = "relative break-inside-avoid bg-[#FFF9DE] p-6 rounded-2xl task-card";
                }
                const tagDots = task.tags.map(tag => `<span class="h-[25px] w-[25px] rounded-full" style="background-color: ${tag.color}"></span>`).join('');
                //due date formatting
                let dueDateHTML = '';
                if (task.dueDate) {
                    let dueStyle;
                    let formattedDue;
                    // If task is completed, always use gray style
                    if (task.isDone) {
                        dueStyle = 'text-gray-400';
                        formattedDue = this.formatDueDate(task.dueDate, task);
                    } else {
                        // For incomplete tasks, use status-based styling
                        const dueDateStat = this.getDueDateStatus(task.dueDate, task);
                        dueStyle = this.getDueDateStyle(dueDateStat);
                        formattedDue = this.formatDueDate(task.dueDate, task);
                    }
                    dueDateHTML = `<p class="mr-7 ${dueStyle}" id="due-date-place-holder"> ${formattedDue} </p>`
                }
                card.innerHTML = `
                <div class="absolute top-3 right-4 text-xl font-bold text-gray-600 hover:text-gray-900 group">
                    <button aria-label="Options" class="options cursor-pointer">⋮</button>
                    <div class="hidden group-hover:block absolute right-0 top-3 mt-1 bg-white rounded shadow-md z-10 options-menu">
                        <button class="block w-full px-4 py-2 text-left border-b-1 hover:bg-gray-100 text-gray-500 text-sm edit-btn cursor-pointer">Edit</button>
                        <button class="block w-full px-4 py-2 text-left hover:bg-gray-100 delete-btn text-gray-500 text-sm cursor-pointer">Delete</button>
                    </div>
                </div>
                <main class="mb-5">
                    <h2 class="transition-all duration-300 text-2xl mb-3 ${task.isDone ? 'line-through opacity-50' : ''}">${task.title}</h2>
                    <p class="transition-all duration-300 text-gray-800 ${task.isDone ? 'line-through opacity-50' : ''}">${task.description}</p>
                </main>
                <footer class="flex justify-between items-end">
                    <div class="flex gap-2">${tagDots}</div>
                    <div class="flex justify-between">
                    ${dueDateHTML}
                    <div>
                        <input type="checkbox" ${task.isDone ? 'checked' : ''} />
                        <label class="cursor-pointer">Done</label>
                    </div>
                    </div>
                </footer>
            `;
                // Trigger animation for initial render
                if (isInitialRender) {
                    // Force a reflow to ensure the initial state is applied
                    card.offsetHeight;
                    // Use setTimeout to start animation after a brief delay
                    setTimeout(() => {
                        card.classList.remove('opacity-0', 'translate-y-6');
                        card.classList.add('opacity-100', 'translate-y-0');
                    }, 50);
                }
                // change to done
                const checkbox = card.querySelector("input[type='checkbox']");
                checkbox.addEventListener('change', () => {
                    const mainElement = card.querySelector("main");
                    if (checkbox.checked) {
                        mainElement.classList.add("done-task");
                    } else {
                        mainElement.classList.remove("done-task");
                    }
                    task.isDone = checkbox.checked;
                    this.saveToLocalStorage();
                    this.renderTasks();
                });
                // Delete task logic
                card.querySelector(".delete-btn").addEventListener('click', () => {
                    this.tasks = this.tasks.filter(t => t !== task);
                    this.updateCounters();
                    this.saveToLocalStorage();
                    this.renderTasks();
                });
                card.querySelector('.edit-btn').addEventListener('click', () => {
                    this.openEditModal(task);
                });
                tasksContainer.appendChild(card);
                //make the three dots clickable
                const threeDots = card.querySelector(".options");
                const menu = card.querySelector(".options-menu");
                threeDots.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Close all other menus
                    document.querySelectorAll(".options-menu").forEach(otherMenu => {
                        if (otherMenu !== menu) {
                            otherMenu.classList.add("hidden");
                        }
                    });
                    // Toggle this menu
                    if (menu.classList.contains("hidden")) {
                        menu.classList.remove("hidden");
                    } else {
                        menu.classList.add("hidden");
                    }
                });
                // Close menu when clicking outside
                document.addEventListener('click', (e) => {
                    if (!menu.contains(e.target) && !threeDots.contains(e.target)) {
                        menu.classList.add("hidden");
                    }
                });
                if (task.isDone === false) {
                    //double click edit
                    const titleEd = card.querySelector("h2");
                    titleEd.addEventListener("dblclick", () => {
                        const input = document.createElement("input");
                        input.type = "text";
                        input.value = task.title;
                        input.className = "text-xl font-bold text-gray-800 w-full bg-transparent pl-2 py-1 focus:outline-none";
                        titleEd.replaceWith(input);
                        input.focus();
                        input.addEventListener("blur", () => {
                            task.title = input.value.trim() || task.title;
                            this.saveToLocalStorage();
                            this.renderTasks();
                        });
                        input.addEventListener("keypress", (e) => {
                            if (e.key == "Enter") {
                                input.blur();
                            }
                        });
                    });
                    const descEd = card.querySelector("p");
                    descEd.addEventListener("dblclick", () => {
                        const textarea = document.createElement("textarea");
                        textarea.value = task.description;
                        textarea.className = "text-gray-600 w-full bg-transparent resize-none focus:outline-none";
                        descEd.replaceWith(textarea);
                        textarea.focus();
                        textarea.addEventListener("blur", () => {
                            task.description = textarea.value.trim();
                            this.renderTasks();
                        });
                        textarea.addEventListener("keypress", (e) => {
                            if (e.key == "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                textarea.blur();
                            }
                        });
                    });
                }
            });
            this.updateCounters();
            this.updateProgressBar();
        }
    }
    deleteEmpty() {
        this.tasks = this.tasks.filter(t => t.title.length > 0);
    }
    openEditModal(task) {
        const oldHandler = this.taskForm._editHandler;
        if (oldHandler) {
            this.taskForm.removeEventListener('submit', oldHandler);
        }
        const modalContent = this.addModal.querySelector(".bg-white");
        if (modalContent) {
            modalContent.classList.add("modal-content");
        }
        this.taskTitleInput.value = task.title;
        this.taskDescriptionInput.value = task.description;
        this.importantUI.checked = task.isImportant;
        this.urgentUI.checked = task.isUrgent;
        this.selectedTagNames = task.tags.map(t => t.name);
        const wasDone = task.isDone;
        if (task.dueDate) {
            const dateString = new Date(task.dueDate).toISOString().split('T')[0];
            this.dueDateInput.value = dateString;
        } else {
            this.dueDateInput.value = "";
        }
        this.renderModalTags();
        this.addModal.classList.remove("hidden");
        const submitBtn = this.taskForm.querySelector('input[type="submit"]');
        submitBtn.value = 'Update';
        const handler = (e) => {
            e.preventDefault();
            task.title = this.taskTitleInput.value.trim();
            task.description = this.taskDescriptionInput.value.trim();
            task.isImportant = this.importantUI.checked;
            task.isUrgent = this.urgentUI.checked;
            task.tags = this.tags.filter(tag => this.selectedTagNames.includes(tag.name));
            task.isDone = wasDone;
            task.dueDate = this.dueDateInput.value ? new Date(this.dueDateInput.value) : null;
            this.addModal.classList.add("hidden");
            this.taskForm.reset();
            this.selectedTagNames = [];
            submitBtn.value = "Add";
            this.taskForm.removeEventListener('submit', handler);
            this.saveToLocalStorage();
            this.renderTasks();
        }
        this.taskForm._editHandler = handler;
        this.taskForm.addEventListener('submit', handler);
    }
    updateProgressBar() {
        if (this.progressBar && this.progressText) {
            const total = this.tasks.length;
            const done = this.tasks.filter(t => t.isDone === true).length;
            const percentage = total === 0 ? 0 : Math.round((done / total) * 100);
            if (this.progressBar) {
                // Store the old width for comparison
                const oldWidth = this.progressBar.style.width;
                const newWidth = `${percentage}%`;
                // Only animate if there's a change
                if (oldWidth !== newWidth) {
                    // Add animation class if it's an increase
                    if ((parseInt(oldWidth) || 0) < percentage) {
                        this.progressBar.classList.add("pulse");
                        setTimeout(() => {
                            this.progressBar.classList.remove("pulse");
                        }, 500);
                        if (parseInt(newWidth) === 100) {
                            animateTaskCompletion(150);
                        }
                    }
                    this.progressBar.style.width = newWidth;
                }
                this.progressText.textContent = `${percentage}%`;
                // Add animation to text if high achievement
                if (percentage >= 80) {
                    this.progressText.classList.add("pulse");
                    setTimeout(() => {
                        this.progressText.classList.remove("pulse");
                    }, 500);
                }
            }
        }
    }
    saveToLocalStorage() {
        const data = {
            tasks: this.tasks,
            tags: this.tags
        };
        localStorage.setItem('todoAppData', JSON.stringify(data));
    }
    loadFromLocalStorage() {
        try {
            const data = JSON.parse(localStorage.getItem('todoAppData'));
            if (data) {
                this.tags = data.tags.map(t => new Tag(t.name, t.color));
                this.tasks = data.tasks.map(tsk => {
                    const tskTags = tsk.tags.map(t => new Tag(t.name, t.color));
                    const tsks = new Task(tsk.title, tsk.description, tskTags);
                    tsks.isImportant = tsk.isImportant;
                    tsks.isUrgent = tsk.isUrgent;
                    tsks.isDone = tsk.isDone;
                    tsks.createdAt = tsk.createdAt;
                    tsks.dueDate = tsk.dueDate ? new Date(tsk.dueDate) : null;
                    tsks.pomodoroSessions = tsk.pomodoroSessions ? tsk.pomodoroSessions : 0;
                    tsks.estimatedPomodoros = 1;
                    return tsks;
                });
            }
        } catch (error) {
            console.error("Can't load data from local storage.");
            this.tags = [];
            this.tasks = [];
        }
    }
    clear() {
        if (confirm("Want you clear all app data?")) {
            this.tasks = [];
            this.tags = [];
            this.saveToLocalStorage();
            this.updateCounters();
            this.updateProgressBar();
            this.renderTasks();
            this.renderTagFilters();
        }
    }
    resetTaskForm() {
        this.taskForm.reset();
        const submitBtn = this.taskForm.querySelector('input[type="submit"]');
        submitBtn.value = 'Add';
        this.selectedTagNames = [];
        if (this.taskForm._editHandler) {
            this.taskForm.removeEventListener('submit', this.taskForm._editHandler);
            this.taskForm._editHandler = null;
        }
    }
    updateCounters() {
        //Updating counter
        const allCount = document.getElementById("all-count");
        const doneCount = document.getElementById("done-count");
        const ongoingCount = document.getElementById("ongoing-count");
        allCount.textContent = this.tasks.length;
        doneCount.textContent = this.tasks.filter(t => t.isDone === true).length;
        ongoingCount.textContent = this.tasks.filter(t => t.isDone === false).length;
    }
    renderEisenView() {
        this.updateCounters();
        this.mainContainer.innerHTML = '';
        const container = document.createElement("div");
        container.className = 'grid grid-cols-1 md:grid-cols-2 h-full gap-0.5 bg-[#69665C]';
        const quarters = {
            doFirst: [],
            schedule: [],
            delegate: [],
            eliminate: []
        }
        const labels = {
            doFirst: "Do First",
            schedule: "Schedule",
            delegate: "Delegate",
            eliminate: "Eliminate"
        }
        const emptyMsg = {
            doFirst: "Tasks with deadlines or consequences, but there is none!",
            schedule: "Tasks with unclear deadline but contribute in long-time success, but there is none!",
            delegate: "Tasks that must be done but don't need specific skill set, but there is none",
            eliminate: "Distractions and unnecessary tasks, better that you have none!"
        }
        //Filtering
        const toFilter = this.filterTasks().filter(t => !t.isDone);
        toFilter.forEach(task => {
            if (task.isUrgent && task.isImportant) {
                quarters.doFirst.push(task);
            } else if (!task.isUrgent && task.isImportant) {
                quarters.schedule.push(task);
            } else if (task.isUrgent && !task.isImportant) {
                quarters.delegate.push(task);
            } else {
                quarters.eliminate.push(task);
            }
        });
        //Rendering
        for (const key in quarters) {
            const quart = document.createElement("div");
            quart.className = 'bg-white p-4';
            const title = document.createElement("h2");
            title.textContent = labels[key];
            title.className = 'mb-3 font-bold text-center';
            quart.appendChild(title);
            if (quarters[key].length === 0) {
                const msg = document.createElement("h3");
                msg.className = 'text-gray-600 text-center';
                msg.textContent = emptyMsg[key];
                quart.appendChild(msg);
            } else {
                quarters[key].forEach(task => {
                    const taskCard = document.createElement("div");
                    taskCard.className = 'relative break-inside-avoid bg-[#FFF9DE] p-2 rounded-2xl flex justify-between items-center mb-2 task-card fade-in';
                    const tags = task.tags.map(tag => `<span class="inline-block w-[7px] h-[7px] rounded-full mr-1" style="background-color: ${tag.color}"></span>`).join("");
                    taskCard.innerHTML = `
            <div class="flex">
                <div class="grid grid-cols-1 grid-flow-col gap-x-[1px] place-items-center" style="grid-template-rows: repeat(3, auto);">
                ${tags}
                </div>
            <h2 class="text-xl ml-3">${task.title}</h2>
           </div> 
            <label for="isDone" class="mr-3"><input type="checkbox" name="isdone" ${task.isDone ? 'checked' : ''}></label>
        
            `;
                    const checkbox = taskCard.querySelector("input[type='checkbox']");
                    checkbox.checked = task.isDone;
                    checkbox.addEventListener('change', () => {
                        task.isDone = checkbox.checked;
                        this.saveToLocalStorage();
                        this.updateProgressBar();
                        this.renderEisenView();
                    })
                    const titleED = taskCard.querySelector("h2");
                    titleED.addEventListener('dblclick', () => {
                        const input = document.createElement('input');
                        input.type = 'text';
                        input.value = task.title;
                        input.className = 'text-xl font-bold text-gray-800 w-full bg-transparent pl-2 py-1 focus:outline-none';
                        titleED.replaceWith(input);
                        input.focus();
                        input.addEventListener('blur', () => {
                            task.title = input.value.trim() || task.title;
                            this.saveToLocalStorage();
                            this.renderEisenView();
                        });
                        input.addEventListener('keypress', (e) => {
                            if (e.key === "Enter") {
                                input.blur();
                            }
                        });
                    });
                    quart.appendChild(taskCard);
                });
            }
            container.appendChild(quart);
        }
        this.mainContainer.appendChild(container);
    }
    //Due date formatting
    getDueDateStatus(dueDate, task) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        dueDate = new Date(dueDate);
        dueDate.setHours(0, 0, 0, 0);
        let status;
        if (today > dueDate) {
            status = 'overdue';
            if (task) task.isUrgent = true;
        } else if (dueDate.getTime() === today.getTime()) {
            status = 'today';
            if (task) task.isUrgent = true;
        } else if (dueDate.getTime() === tomorrow.getTime()) {
            status = 'tomorrow';
            if (task) task.isUrgent = true;
        } else {
            const threeDays = new Date(today);
            threeDays.setDate(threeDays.getDate() + 3);
            if (dueDate <= threeDays) {
                status = 'approaching';
                if (task) task.isUrgent = true;
            } else {
                status = 'future';
            }
        }
        return status;
    }
    getDueDateStyle(status) {
        switch (status) {
            case 'overdue':
                return 'font-semibold text-[#FF3B30]';
            case 'today':
                return 'font-semibold text-[#FF9500]';
            case 'tomorrow':
                return 'text-[#FFCC00]';
            case 'approaching':
                return 'text-[#34C759]';
            default:
                return 'text-[#8E8E93]';
        }
    }
    formatDueDate(date, task) {
        const due = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dueDateStr = due.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric'
        });
        // Set hours to 0 for comparison
        const dueTime = new Date(due).setHours(0, 0, 0, 0);
        const todayTime = today.getTime();
        const tomorrowTime = tomorrow.getTime();
        if (dueTime === todayTime && !task.isDone) {
            return `Today (${dueDateStr})`;
        } else if (dueTime === tomorrowTime && !task.isDone) {
            return `Tomorrow (${dueDateStr})`;
        } else if (dueTime < todayTime && !task.isDone) {
            return `Overdue! (${dueDateStr})`;
        } else {
            return dueDateStr;
        }
    }
    //Sorting
    updateSortBtnText() {
        if (!this.currentSort) return;
        const icon = this.sortBtn.querySelector("span");
        switch (this.currentSort) {
            case 'date':
                this.sortBtn.innerHTML = `<svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10 7L2 7" stroke="#1e2939" stroke-width="1.5" stroke-linecap="round"/>
<path d="M8 12H2" stroke="#1e2939" stroke-width="1.5" stroke-linecap="round"/>
<path d="M10 17H2" stroke="#1e2939" stroke-width="1.5" stroke-linecap="round"/>
<circle cx="17" cy="12" r="5" stroke="#1e2939" stroke-width="1.5"/>
<path d="M17 10V11.8462L18 13" stroke="#1e2939" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
                break;
            case 'deadline':
                this.sortBtn.innerHTML = `<svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M1.25 7C1.25 6.58579 1.58579 6.25 2 6.25H10C10.4142 6.25 10.75 6.58579 10.75 7C10.75 7.41421 10.4142 7.75 10 7.75H2C1.58579 7.75 1.25 7.41421 1.25 7ZM1.25 12C1.25 11.5858 1.58579 11.25 2 11.25H8C8.41421 11.25 8.75 11.5858 8.75 12C8.75 12.4142 8.41421 12.75 8 12.75H2C1.58579 12.75 1.25 12.4142 1.25 12ZM1.25 17C1.25 16.5858 1.58579 16.25 2 16.25H10C10.4142 16.25 10.75 16.5858 10.75 17C10.75 17.4142 10.4142 17.75 10 17.75H2C1.58579 17.75 1.25 17.4142 1.25 17Z" fill="#1e2939"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M17 17C19.7614 17 22 14.7614 22 12C22 9.23858 19.7614 7 17 7C14.2386 7 12 9.23858 12 12C12 14.7614 14.2386 17 17 17ZM17.75 10C17.75 9.58579 17.4142 9.25 17 9.25C16.5858 9.25 16.25 9.58579 16.25 10V11.8462C16.25 12.0266 16.3151 12.201 16.4332 12.3374L17.4332 13.4912C17.7045 13.8042 18.1782 13.838 18.4912 13.5668C18.8042 13.2955 18.838 12.8218 18.5668 12.5088L17.75 11.5664V10Z" fill="#1e2939"/>
</svg>`;
                break;
            case 'title':
                this.sortBtn.innerHTML = `<svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M13 7L3 7" stroke="#1e2939" stroke-width="1.5" stroke-linecap="round"/>
<path d="M10 12H3" stroke="#1e2939" stroke-width="1.5" stroke-linecap="round"/>
<path d="M8 17H3" stroke="#1e2939" stroke-width="1.5" stroke-linecap="round"/>
<path d="M11.3161 16.6922C11.1461 17.07 11.3145 17.514 11.6922 17.6839C12.07 17.8539 12.514 17.6855 12.6839 17.3078L11.3161 16.6922ZM16.5 7L17.1839 6.69223C17.0628 6.42309 16.7951 6.25 16.5 6.25C16.2049 6.25 15.9372 6.42309 15.8161 6.69223L16.5 7ZM20.3161 17.3078C20.486 17.6855 20.93 17.8539 21.3078 17.6839C21.6855 17.514 21.8539 17.07 21.6839 16.6922L20.3161 17.3078ZM19.3636 13.3636L20.0476 13.0559L19.3636 13.3636ZM13.6364 12.6136C13.2222 12.6136 12.8864 12.9494 12.8864 13.3636C12.8864 13.7779 13.2222 14.1136 13.6364 14.1136V12.6136ZM12.6839 17.3078L17.1839 7.30777L15.8161 6.69223L11.3161 16.6922L12.6839 17.3078ZM21.6839 16.6922L20.0476 13.0559L18.6797 13.6714L20.3161 17.3078L21.6839 16.6922ZM20.0476 13.0559L17.1839 6.69223L15.8161 7.30777L18.6797 13.6714L20.0476 13.0559ZM19.3636 12.6136H13.6364V14.1136H19.3636V12.6136Z" fill="#1e2939"/>
</svg>`;
                break;
            case 'priority':
                this.sortBtn.innerHTML = `<svg fill="#1e2939" width="24px" height="24px" viewBox="0 0 24 24" id="sort-descending" data-name="Flat Line" xmlns="http://www.w3.org/2000/svg" class="icon flat-line"><polyline id="primary" points="2 8 6 4 10 8" style="fill: none; stroke: #1e2939; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2;"></polyline><path id="primary-2" data-name="primary" d="M6,4V19M20,7H15m5,5H13m7,5H10" style="fill: none; stroke: #1e2939; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2;"></path></svg>`;
                break;
        }
    }
    sortTasks() {
        if (!this.currentSort) return;
        this.tasks.sort((a, b) => {
            let comparison = 0;
            // First sort by completion status if that's not what we're explicitly sorting by
            if (this.currentSort !== 'status') {
                // Always put completed items at the bottom regardless of other sort criteria
                if (a.isDone !== b.isDone) {
                    return a.isDone ? 1 : -1;
                }
            }
            // Then apply the selected sort
            switch (this.currentSort) {
                case 'title':
                    // Handle null/empty titles
                    const titleA = (a.title || '').toLowerCase();
                    const titleB = (b.title || '').toLowerCase();
                    comparison = titleA.localeCompare(titleB);
                    break;
                case 'date':
                    // Ensure we're comparing valid timestamps
                    const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
                    const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
                    comparison = dateA - dateB;
                    break;
                case 'deadline':
                    // Special handling for tasks with/without due dates
                    if (a.dueDate === null && b.dueDate === null) {
                        comparison = 0; // Both have no due date, consider equal
                    } else if (a.dueDate === null) {
                        return 1; // Tasks without due dates come last (regardless of direction)
                    } else if (b.dueDate === null) {
                        return -1; // Tasks with due dates come first (regardless of direction)
                    } else {
                        // Both have due dates, compare them
                        const dueDateA = new Date(a.dueDate).getTime();
                        const dueDateB = new Date(b.dueDate).getTime();
                        comparison = dueDateA - dueDateB;
                    }
                    break;
                case 'priority':
                    // Sort by urgency and importance
                    const priorityA = (a.isUrgent ? 2 : 0) + (a.isImportant ? 1 : 0);
                    const priorityB = (b.isUrgent ? 2 : 0) + (b.isImportant ? 1 : 0);
                    comparison = priorityB - priorityA; // Higher priority first
                    break;
                default:
                    return 0;
            }
            // Apply sort direction
            return this.currentSortDirection === 'asc' ? comparison : -comparison;
        });
        // Update the view
        this.renderView();
    }
    //filter task
    filterTasks() {
        return this.tasks.filter(task => {
            // Tag filtering
            const tagMatch = this.selectedTagNames.length === 0 || this.selectedTagNames.every(tagName => task.tags.some(tag => tagName === tag.name));
            // Status filtering
            const statusMatch = this.selectedStatus === "all" || (this.selectedStatus === "done" && task.isDone) || (this.selectedStatus === "on going" && !task.isDone);
            return tagMatch && statusMatch;
        });
    }
    //KeyBoard Shortcuts
    keyboard() {
        window.addEventListener('keydown', (e) => {
            // Open add task modal: alt + n
            if (e.altKey && e.key === 'n') {
                e.preventDefault();
                this.addNewBtn.click();
            }
            // ESC to close modal
            if (e.key === 'Escape' && !this.addModal.classList.contains('hidden')) {
                e.preventDefault();
                this.cancelAdd.click();
            }
            // When modal is open
            if (!this.addModal.classList.contains('hidden')) {
                // Toggle add tag form: t
                if (e.key === 't' && !e.ctrlKey && !e.altKey) {
                    // Check if the event target is an input, textarea or any other element where typing should be allowed
                    const isInputField = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable;
                    if (!isInputField) {
                        e.preventDefault();
                        this.addTagform.classList.toggle('hidden');
                    }
                }
                // Enter to add new tag (when tag form is visible)
                if (e.key === 'Enter' && !e.ctrlKey && !this.addTagform.classList.contains('hidden')) {
                    // Only if the tag form is the active form and not inside the main task form inputs
                    const activeElement = document.activeElement;
                    const isInTaskForm = this.taskForm.contains(activeElement) && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA');
                    if (!isInTaskForm) {
                        e.preventDefault();
                        this.tagAddBtn.click();
                    }
                }
                // ctrl + enter to add new task
                if (e.ctrlKey && e.key === 'Enter') {
                    e.preventDefault();
                    const submitBtn = this.taskForm.querySelector('input[type="submit"]');
                    submitBtn.click();
                }
            }
            // Filter shortcuts: 1, 2, 3
            const pomo = document.getElementById("pomoModal");
            if (this.addModal.classList.contains('hidden') && pomo.classList.contains('hidden')) {
                if (!e.ctrlKey && !e.altKey && !e.shiftKey) {
                    if (e.key === '1') {
                        e.preventDefault();
                        this.statusButtons.find(btn => btn.getAttribute('data-status') === 'all')?.click();
                    } else if (e.key === '3') {
                        e.preventDefault();
                        this.statusButtons.find(btn => btn.getAttribute('data-status') === 'on going')?.click();
                    } else if (e.key === '2') {
                        e.preventDefault();
                        this.statusButtons.find(btn => btn.getAttribute('data-status') === 'done')?.click();
                    }
                }
            }
            // Toggle Eisenhower view: alt + e
            if (e.altKey && e.key === 'e') {
                e.preventDefault();
                const toggleEisen = document.getElementById("toggleEisenView");
                toggleEisen.click();
            }
        });
        // Help Modal Event Listeners
        document.addEventListener('keydown', (e) => {
            const helpModal = document.getElementById('helpModal');
            const closeHelpBtn = document.getElementById('closeHelpBtn');
            // Open help modal with F1 key
            if (e.key === 'F1') {
                e.preventDefault(); // Prevent default F1 behavior (browser help)
                helpModal.classList.remove('hidden');
            }
            // Close help modal with Escape key
            if (e.key === 'Escape' && !helpModal.classList.contains('hidden')) {
                e.preventDefault();
                helpModal.classList.add('hidden');
            }
        });
        // Close button click handler
        document.getElementById('closeHelpBtn').addEventListener('click', () => {
            document.getElementById('helpModal').classList.add('hidden');
        });
        // Also close modal when clicking outside of it (optional)
        document.getElementById('helpModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('helpModal')) {
                document.getElementById('helpModal').classList.add('hidden');
            }
        });
    }
    renderView() {
        if (this.isEisenView) {
            this.renderEisenView();
        } else {
            this.renderTasks();
        }
    }
    //pomo
    getIncompleteTasks() {
        return this.tasks.filter(task => !task.isDone);
    }
    // Method to get task by title instead of ID
    getTaskByTitle(taskTitle) {
        return this.tasks.find(task => task.title === taskTitle);
    }
    // Method to update task pomodoro count by title
    updateTaskPomodoroCount(taskTitle) {
        const taskIndex = this.tasks.findIndex(task => task.title === taskTitle);
        if (taskIndex !== -1) {
            this.tasks[taskIndex].pomodoroSessions = (this.tasks[taskIndex].pomodoroSessions || 0) + 1;
            this.saveToLocalStorage();
            this.renderTasks(true);
        }
    }
}
class PomodoroTimer {
    constructor(todoApp = null) {
        this.todoApp = todoApp; // Reference to TodoApp instance
        this.isRunning = false;
        this.currentPhase = 'focus'; // 'focus', 'shortBreak', 'longBreak'
        this.timeLeft = 25 * 60; // 25 minutes in seconds
        this.selectedTask = null;
        this.sessionCount = 0;
        this.timer = null;
        // Phase durations in seconds (editable)
        this.phaseDurations = {
            focus: 25 * 60,
            shortBreak: 5 * 60,
            longBreak: 15 * 60
        };
        this.initializeEventListeners();
        this.loadTimerSettings();
        this.initializeTimeSettings();
    }
    initializeEventListeners() {
        // Modal controls
        const openPomodoroBtn = document.getElementById('openPomodoro');
        const closePomodoroBtn = document.getElementById('closePomodoroBtn');
        if (openPomodoroBtn) {
            openPomodoroBtn.addEventListener('click', () => this.openModal());
        }
        if (closePomodoroBtn) {
            closePomodoroBtn.addEventListener('click', () => this.closeModal());
        }
        // Timer controls
        const startPauseBtn = document.getElementById('startPauseBtn');
        const skipBtn = document.getElementById('skipBtn');
        const changeTaskBtn = document.getElementById('changeTaskBtn');
        if (startPauseBtn) {
            startPauseBtn.addEventListener('click', () => this.toggleTimer());
        }
        if (skipBtn) {
            skipBtn.addEventListener('click', () => this.skipPhase());
        }
        if (changeTaskBtn) {
            changeTaskBtn.addEventListener('click', () => this.showTaskSelection());
        }
        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            const modal = document.getElementById('pomoModal');
            if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
                this.closeModal();
            }
        });
        // Time setting controls
        this.initializeTimeControls();
    }
    openModal() {
        const modal = document.getElementById('pomoModal');
        if (modal) {
            modal.classList.remove('hidden');
            this.showTaskSelection();
        }
    }
    closeModal() {
        const modal = document.getElementById('pomoModal');
        if (modal) {
            modal.classList.add('hidden');
            this.pauseTimer();
        }
    }
    showTaskSelection() {
        const taskPhase = document.getElementById('taskSelectionPhase');
        const timerPhase = document.getElementById('timerPhase');
        if (taskPhase && timerPhase) {
            taskPhase.classList.remove('hidden');
            taskPhase.classList.add('fade-in');
            timerPhase.classList.add('hidden');
            // Populate task options from TodoApp
            this.populateTaskOptions();
        }
    }
    // New method to populate task options from TodoApp
    populateTaskOptions() {
        const taskContainer = document.querySelector('#taskSelectionPhase .space-y-3');
        if (!taskContainer || !this.todoApp) return;
        const incompleteTasks = this.todoApp.getIncompleteTasks();
        taskContainer.innerHTML = '';
        if (incompleteTasks.length === 0) {
            taskContainer.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <p class="mb-4">No tasks available. Add some tasks to get started!</p>
                    <button id="addTaskFromPomodoro" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                        Add New Task
                    </button>
                </div>
            `;
            // Add event listener for quick task creation
            const addTaskBtn = document.getElementById('addTaskFromPomodoro');
            if (addTaskBtn) {
                addTaskBtn.addEventListener('click', () => {
                    this.closeModal();
                    // Trigger the main app's add task functionality
                    if (this.todoApp && this.todoApp.addNewBtn) {
                        this.todoApp.addNewBtn.click();
                    }
                });
            }
            return;
        }
        incompleteTasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = 'task-option border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-colors';
            taskElement.setAttribute('data-task-title', task.title);
            // Create priority indicators
            let priorityBadges = '';
            if (task.isUrgent && task.isImportant) {
                priorityBadges = '<span class="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Urgent & Important</span>';
            } else if (task.isUrgent) {
                priorityBadges = '<span class="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">Urgent</span>';
            } else if (task.isImportant) {
                priorityBadges = '<span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Important</span>';
            }
            // Create tags display
            const tagsHtml = task.tags && task.tags.length > 0 ? task.tags.map(tag => `<span class="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">${typeof tag === 'string' ? tag : tag.name || 'Tag'}</span>`).join(' ') : '';
            // Format due date
            let dueDateHtml = '';
            if (task.dueDate) {
                const dueDate = new Date(task.dueDate);
                const today = new Date();
                const diffTime = dueDate - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays === 0) {
                    dueDateHtml = '<span class="text-sm text-red-600">Due: Today</span>';
                } else if (diffDays === 1) {
                    dueDateHtml = '<span class="text-sm text-orange-600">Due: Tomorrow</span>';
                } else if (diffDays > 0) {
                    dueDateHtml = `<span class="text-sm text-gray-500">Due: ${diffDays} days</span>`;
                } else {
                    dueDateHtml = '<span class="text-sm text-red-600">Overdue</span>';
                }
            }
            taskElement.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <h4 class="font-medium text-gray-800">${task.title}</h4>
                        <p class="text-sm text-gray-600 mt-1">${task.description || 'No description'}</p>
                        <div class="flex items-center gap-2 mt-2">
                            ${tagsHtml}
                            ${priorityBadges}
                            <span class="text-xs text-gray-500 flex">
                            <svg width="15px" height="15px" viewBox="0 -84 1192 1192" class="icon"  version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M669.591 153.454c-18.985-2.194-296.93-29.681-420.625 185.388-82.721 143.802-64.011 339.6 49.164 450.18 95.362 93.18 224.617 93.417 280.587 93.492 45.125 0.087 195.236 0.374 310.206-112.714 99.725-98.042 167.799-276.236 92.693-426.894-81.163-162.725-275.625-185.238-312.025-189.452z" fill="#FA1919" /><path d="M886.404 222.775c-12.902 6.706 33.743 77.013 39.89 176.226 11.942 191.172-135.638 340.31-152.727 357.138-97.905 96.222-199.3 114.683-194.912 126.413 5.809 15.581 186.982 9.786 310.206-112.714 116.528-115.929 145.723-298.874 92.693-426.894-28.558-69.047-82.871-126.55-95.151-120.168zM746.888 267.552c2.493-23.137 20.282-32.411 14.846-41.746-7.403-12.652-42.52 1.048-119.669 6.494-20.568 1.446-30.852 2.183-44.54 1.857-74.656-1.695-118.685-29.119-125.766-17.901-4.264 6.757 12.155 16.068 18.113 36.237 16.056 54.25-64.61 115.929-54.736 128.271 11.406 14.31 117.014-70.319 160.507-38.967 19.397 13.986 19.060 45.737 34.33 46.385 12.216 0.524 15.158-19.658 31.55-32.411 41.81-32.698 124.854 18.698 133.768 3.54 7.53-12.902-53.241-46.484-48.403-91.759z" fill="#C40000" /><path d="M570.564 907.508c-27.249 0-75.005-1.109-130.252-14.348-76.788-18.386-142.107-53.926-194.251-105.633-40.226-39.89-73.546-90.513-96.26-146.358-1.45-3.066-2.297-6.66-2.297-10.452 0-13.77 11.162-24.931 24.931-24.931 10.772 0 19.949 6.832 23.434 16.4 20.3 49.849 49.755 94.725 85.257 129.94 107.203 106.418 250.383 105.708 297.415 105.483 46.197-0.224 186.785-0.922 292.816-105.532 104.312-102.916 160.718-293.576 74.544-434.486-91.447-149.524-290.123-150.696-364.942-151.194-76.041-0.449-278.232-1.645-371.897 151.17-28.446 46.484-42.819 99.899-42.708 158.836 0 13.77-11.162 24.931-24.931 24.931 0 0 0 0 0 0-13.77 0-24.931-11.162-24.931-24.931 0 0 0 0 0 0-0.125-67.314 17.177-131.287 50.063-184.927 46.597-76.041 120.916-128.033 220.977-154.572 79.443-20.993 153.787-20.543 193.727-20.369 39.504 0.287 113.025 0.723 190.922 22.14 97.942 26.926 170.779 78.37 216.315 152.915 23.685 38.818 39.104 82.272 45.687 129.231 6.097 43.492 4.525 88.868-4.649 134.865-17.452 87.409-62.328 171.937-123.097 231.86-51.508 50.81-115.841 86.013-191.247 104.635-60.322 14.897-111.666 15.146-136.348 15.271z" fill="#000000" /><path d="M148.692 575.625c-12.093-0.020-22.164-8.645-24.419-20.078q-0.387-2.023-0.735-3.893c-0.262-1.357-0.412-2.917-0.412-4.513 0-13.773 11.165-24.938 24.938-24.938 12.177 0 22.315 8.728 24.502 20.271q0.336 1.838 0.661 3.508c0.286 1.417 0.45 3.045 0.45 4.713 0 13.77-11.162 24.931-24.931 24.931-0.008 0-0.019 0-0.027 0z" fill="#000000" /><path d="M579.962 137.723c13.375-9.973 44.951 0.188 56.207 19.944 11.431 20.107-5.697 36.886 4.225 51.247 18.412 26.627 96.807-3.739 103.141 12.652 3.278 8.439-16.268 15.557-21.653 35.016-11.73 42.382 58.426 89.839 50.15 101.918-9.337 13.625-97.232-48.902-136.111-19.447-19.209 14.548-17.452 44.689-28.421 44.876-13.6 0.224-11.93-46.622-37.396-61.331-42.708-24.669-130.003 59.449-141.348 47.12-10.185-11.069 62.964-75.753 44.128-127.884-6.358-17.602-20.182-25.404-16.455-32.909 8.588-17.277 88.942 24.321 113.675-2.992 17.29-19.048-7.179-55.497 9.86-68.211z" fill="#6BE166" /></svg>
                            ${task.pomodoroSessions || 0} sessions</span>
                        </div>
                    </div>
                    <div class="flex flex-col items-end gap-1 ml-2">
                        ${dueDateHtml}
                    </div>
                </div>
            `;
            taskElement.addEventListener('click', () => this.selectTask(taskElement));
            taskContainer.appendChild(taskElement);
        });
    }
    // Initialize time settings display and controls
    initializeTimeSettings() {
        this.updateTimeSettingsDisplay();
    }
    // Initialize time editing controls
    initializeTimeControls() {
        const focusTimeEl = document.getElementById('focusTime');
        const shortBreakTimeEl = document.getElementById('short-break-time');
        const longBreakTimeEl = document.getElementById('long-break-time');
        // Make time elements editable
        if (focusTimeEl) {
            this.makeTimeEditable(focusTimeEl, 'focus');
        }
        if (shortBreakTimeEl) {
            this.makeTimeEditable(shortBreakTimeEl, 'shortBreak');
        }
        if (longBreakTimeEl) {
            this.makeTimeEditable(longBreakTimeEl, 'longBreak');
        }
    }
    // Make time elements clickable and editable
    makeTimeEditable(element, phase) {
        element.style.cursor = 'pointer';
        element.title = 'Click to edit';
        element.addEventListener('click', () => {
            const currentMinutes = Math.floor(this.phaseDurations[phase] / 60);
            const input = document.createElement('input');
            input.type = 'number';
            input.min = '1';
            input.max = '60';
            input.value = currentMinutes;
            input.className = 'w-16 text-center text-2xl font-bold bg-transparent border-b-2 border-gray-300 focus:border-blue-500 outline-none';
            input.style.color = element.style.color || getComputedStyle(element).color;
            const originalText = element.textContent;
            element.textContent = '';
            element.appendChild(input);
            input.focus();
            input.select();
            const finishEditing = () => {
                const newMinutes = parseInt(input.value) || currentMinutes;
                this.phaseDurations[phase] = newMinutes * 60;
                // Update display
                element.textContent = newMinutes;
                // Update current timer if we're editing the current phase
                if (this.currentPhase === phase && !this.isRunning) {
                    this.timeLeft = this.phaseDurations[phase];
                    this.updateTimerDisplay();
                    this.updateProgress();
                }
                // Save to localStorage
                this.saveTimerSettings();
            };
            input.addEventListener('blur', finishEditing);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    finishEditing();
                } else if (e.key === 'Escape') {
                    element.textContent = originalText;
                }
            });
        });
    }
    // Update time settings display
    updateTimeSettingsDisplay() {
        const focusTimeEl = document.getElementById('focusTime');
        const shortBreakTimeEl = document.getElementById('short-break-time');
        const longBreakTimeEl = document.getElementById('long-break-time');
        if (focusTimeEl) {
            focusTimeEl.textContent = Math.floor(this.phaseDurations.focus / 60);
        }
        if (shortBreakTimeEl) {
            shortBreakTimeEl.textContent = Math.floor(this.phaseDurations.shortBreak / 60);
        }
        if (longBreakTimeEl) {
            longBreakTimeEl.textContent = Math.floor(this.phaseDurations.longBreak / 60);
        }
    }
    // Save timer settings to localStorage
    saveTimerSettings() {
        localStorage.setItem('pomodoroSettings', JSON.stringify(this.phaseDurations));
    }
    // Load timer settings from localStorage
    loadTimerSettings() {
        const savedSettings = localStorage.getItem('pomodoroSettings');
        if (savedSettings) {
            this.phaseDurations = {
                ...this.phaseDurations,
                ...JSON.parse(savedSettings)
            };
            this.timeLeft = this.phaseDurations[this.currentPhase];
            this.updateTimeSettingsDisplay();
        }
    }
    showTimerPhase() {
        const taskPhase = document.getElementById('taskSelectionPhase');
        const timerPhase = document.getElementById('timerPhase');
        if (taskPhase && timerPhase) {
            taskPhase.classList.add('hidden');
            timerPhase.classList.remove('hidden');
            timerPhase.classList.add('fade-in');
            this.updateTimerDisplay();
            this.updatePhaseDisplay();
        }
    }
    selectTask(taskElement) {
        const taskTitle = taskElement.getAttribute('data-task-title');
        const taskTitleEl = taskElement.querySelector('h4');
        const taskDescEl = taskElement.querySelector('p');
        this.selectedTask = {
            title: taskTitle,
            displayTitle: taskTitleEl ? taskTitleEl.textContent : taskTitle,
            description: taskDescEl ? taskDescEl.textContent : 'No description'
        };
        // Update selected task display
        const selectedTaskTitle = document.getElementById('selectedTaskTitle');
        const selectedTaskDesc = document.getElementById('selectedTaskDesc');
        if (selectedTaskTitle) selectedTaskTitle.textContent = this.selectedTask.displayTitle;
        if (selectedTaskDesc) selectedTaskDesc.textContent = this.selectedTask.description;
        // Transition to timer phase
        setTimeout(() => this.showTimerPhase(), 200);
    }
    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }
    startTimer() {
        this.isRunning = true;
        const startPauseBtn = document.getElementById('startPauseBtn');
        if (startPauseBtn) {
            startPauseBtn.innerHTML = `<svg fill="#fff" width="20px" height="20px" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg">
<title>pause</title>
<path d="M5.92 24.096q0 0.832 0.576 1.408t1.44 0.608h4.032q0.832 0 1.44-0.608t0.576-1.408v-16.16q0-0.832-0.576-1.44t-1.44-0.576h-4.032q-0.832 0-1.44 0.576t-0.576 1.44v16.16zM18.016 24.096q0 0.832 0.608 1.408t1.408 0.608h4.032q0.832 0 1.44-0.608t0.576-1.408v-16.16q0-0.832-0.576-1.44t-1.44-0.576h-4.032q-0.832 0-1.408 0.576t-0.608 1.44v16.16z"></path>
</svg>`;
            startPauseBtn.classList.remove('bg-red-500', 'hover:bg-red-600');
            startPauseBtn.classList.add('bg-yellow-500', 'hover:bg-yellow-600');
        }
        // Add pulse animation to timer
        const progressRing = document.querySelector('.progress-ring');
        if (progressRing) {
            progressRing.classList.add('pulse-gentle');
        }
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            this.updateProgress();
            if (this.timeLeft <= 0) {
                this.completePhase();
            }
        }, 1000);
    }
    pauseTimer() {
        this.isRunning = false;
        const startPauseBtn = document.getElementById('startPauseBtn');
        if (startPauseBtn) {
            startPauseBtn.innerHTML = `<svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M21.4086 9.35258C23.5305 10.5065 23.5305 13.4935 21.4086 14.6474L8.59662 21.6145C6.53435 22.736 4 21.2763 4 18.9671L4 5.0329C4 2.72368 6.53435 1.26402 8.59661 2.38548L21.4086 9.35258Z" fill="#fff"/>
</svg>`;
            startPauseBtn.classList.remove('bg-yellow-500', 'hover:bg-yellow-600');
            startPauseBtn.classList.add('bg-red-500', 'hover:bg-red-600');
        }
        // Remove pulse animation
        const progressRing = document.querySelector('.progress-ring');
        if (progressRing) {
            progressRing.classList.remove('pulse-gentle');
        }
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    skipPhase() {
        this.pauseTimer();
        this.completePhase();
    }
    completePhase() {
        this.pauseTimer();
        if (this.currentPhase === 'focus') {
            this.sessionCount++;
            // Update task pomodoro count in TodoApp
            if (this.todoApp && this.selectedTask) {
                this.todoApp.updateTaskPomodoroCount(this.selectedTask.title);
            }
            // After 4 focus sessions, take a long break
            this.currentPhase = (this.sessionCount % 4 === 0) ? 'longBreak' : 'shortBreak';
        } else {
            this.currentPhase = 'focus';
        }
        this.timeLeft = this.phaseDurations[this.currentPhase];
        this.updateTimerDisplay();
        this.updatePhaseDisplay();
        this.updateSessionProgress();
        // Show completion notification
        this.showPhaseCompletionNotification();
    }
    // New method to show phase completion notification
    showPhaseCompletionNotification() {
        if (Notification && Notification.permission === 'granted') {
            new Notification(`Pomodoro ${this.currentPhase === 'focus' ? 'Break' : 'Focus'} Time!`, {
                body: this.currentPhase === 'focus' ? 'Time to focus on your task' : 'Take a well-deserved break',
                icon: '🍅'
            });
        }
    }
    updateTimerDisplay() {
        const timerDisplay = document.getElementById('timerDisplay');
        if (timerDisplay) {
            const minutes = Math.floor(this.timeLeft / 60);
            const seconds = this.timeLeft % 60;
            const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            timerDisplay.textContent = display;
        }
    }
    updateProgress() {
        const totalTime = this.phaseDurations[this.currentPhase];
        const progress = (totalTime - this.timeLeft) / totalTime;
        const circumference = 2 * Math.PI * 54; // radius = 54
        const offset = circumference - (progress * circumference);
        const progressCircle = document.getElementById('progressCircle');
        if (progressCircle) {
            progressCircle.style.strokeDashoffset = offset;
        }
    }
    updatePhaseDisplay() {
        const phaseElement = document.getElementById('currentPhase');
        const progressCircle = document.getElementById('progressCircle');
        if (!phaseElement || !progressCircle) return;
        switch (this.currentPhase) {
            case 'focus':
                phaseElement.textContent = 'Focus Time';
                phaseElement.className = 'px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-medium';
                progressCircle.style.stroke = '#ef4444';
                break;
            case 'shortBreak':
                phaseElement.textContent = 'Short Break';
                phaseElement.className = 'px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium';
                progressCircle.style.stroke = '#22c55e';
                break;
            case 'longBreak':
                phaseElement.textContent = 'Long Break';
                phaseElement.className = 'px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium';
                progressCircle.style.stroke = '#3b82f6';
                break;
        }
        // Reset progress circle
        this.updateProgress();
    }
    updateSessionProgress() {
        const completedElement = document.getElementById('completedSessions');
        if (completedElement) {
            completedElement.textContent = `${this.sessionCount} completed today`;
        }
        const sessionElement = document.getElementById('sessionCount');
        if (sessionElement) {
            const currentSession = (this.sessionCount % 4) + 1;
            sessionElement.textContent = `Session ${currentSession} of 4`;
        }
        // Update session dots
        const dots = document.querySelectorAll('.session-dot');
        dots.forEach((dot, index) => {
            if (index < (this.sessionCount % 4)) {
                dot.classList.remove('bg-gray-300');
                dot.classList.add('bg-red-500');
            } else {
                dot.classList.remove('bg-red-500');
                dot.classList.add('bg-gray-300');
            }
        });
    }
    // Method to request notification permission
    requestNotificationPermission() {
        if (Notification && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
}

function animateTaskCompletion(amount) {
    // Create a celebratory animation when tasks are completed
    const confetti = document.createElement("div");
    confetti.className = "confetti-container";
    document.body.appendChild(confetti);
    // Create confetti particles
    for (let i = 0; i < amount; i++) {
        const particle = document.createElement("div");
        particle.className = "confetti-particle";
        particle.style.backgroundColor = `hsl(${Math.random() * 360}, 80%, 60%)`;
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.animationDuration = `${Math.random() * 1 + 1}s`;
        particle.style.animationDelay = `${Math.random() * 1}s`;
        confetti.appendChild(particle);
    }
    // Remove after animation completes
    setTimeout(() => {
        document.body.removeChild(confetti);
    }, 2500);
}
const confettiStyle = `
.confetti-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  pointer-events: none;
  z-index: 9999;
}

.confetti-particle {
  position: absolute;
  top: -10px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  animation: confettiFall linear forwards;
}

@keyframes confettiFall {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}
`;
// Add the confetti style to the document
const styleElement = document.createElement('style');
styleElement.textContent = confettiStyle;
document.head.appendChild(styleElement);
// Instantiate app
document.addEventListener('DOMContentLoaded', () => {
    // Initialize TodoApp first
    const todoApp = new TodoApp();
    // Request notification permission for Pomodoro timer
    if (todoApp.pomodoroTimer) {
        todoApp.pomodoroTimer.requestNotificationPermission();
    }
    window.todoApp = todoApp;
});
