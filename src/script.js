// Tag prototype
class tag {
    constructor(name, color) {
        this.name = name;
        this.color = color;
    }
}

// Task prototype
class task {
    constructor(title, description, tags = []) {
        this.title = title;
        this.description = description;
        this.tags = tags;
        this.isDone = false;
    }
}

// Task manager
class todoApp {
    constructor() {
        this.tasks = [];
        this.tags = [];
        this.selectedTagNames = [];
        this.selectedStatus = "all";
        // Get UI elements
        this.tasksContainer = document.getElementById("tasksContainer");
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
        
        // Bind methods
        this.loadFromLocalStorage();
        this.bindUI();
        this.renderTagFilters();
        this.renderTasks();
    }

    bindUI() {
        // Open modal and render tags
        this.addNewBtn.addEventListener('click', () => {
            this.addModal.classList.remove('hidden');
            this.renderModalTags();
        });

        this.cancelAdd.addEventListener('click', () => {
            this.resetTaskForm();
            this.addModal.classList.add('hidden');
        });

        this.addModal.addEventListener('click', (e) => {
            if (e.target === this.addModal) {
                this.resetTaskForm();
                this.addModal.classList.add('hidden');
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

            this.addTag(new tag(name, color));
            nameInput.value = "";

            //siham
            if(name.toLowerCase() === 'siham'){
                alert("Welcome Siham! it's a pleasure that you're testing me yourself.");
                let a = prompt("To ensure that you're tell me the secret word:\n Hint: a word you always say!");
                if(a.toLowerCase() === 'shibal'){
                    alert("Correct! you're really the one!");
                    alert("Happy that you're here!");
                    alert("Always be happy!");
                    alert("with or without me haha!");
                    alert("let me be by your side for the longest time possible, hopefully forever!");
                    alert("Thank you!");
                }
            }
                         
            this.renderModalTags();
            this.renderTagFilters();

            this.addTagform.classList.add("hidden");
        });

        // Submit new task
        this.taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = this.taskTitleInput.value.trim();
            const description = this.taskDescriptionInput.value.trim();
            if (!title) return;

            const selectedTags = this.tags.filter(tag => this.selectedTagNames.includes(tag.name));
            const Task = new task(title, description, selectedTags);
            this.tasks.push(Task);
            this.saveToLocalStorage();

            // Reset form
            this.taskTitleInput.value = "";
            this.taskDescriptionInput.value = "";
            this.selectedTagNames = [];
            this.addModal.classList.add("hidden");

            this.renderTasks();
        });
        this.statusButtons = Array.from(document.querySelectorAll("#status-filter button"));

        this.statusButtons.forEach(button => {
            button.addEventListener('click', () => {
                const status = button.getAttribute("data-status");
                this.selectedStatus = status;
        
                // Remove active styles
                this.statusButtons.forEach(btn =>
                    btn.classList.remove('ring-1', 'ring-offset-1', 'ring-gray-400')
                );
        
                // Add active style to clicked button
                button.classList.add('ring-1', 'ring-offset-1', 'ring-gray-400');
        
                
        
                this.renderTasks();
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
        appName.addEventListener("click", ()=>{
            appName.classList.toggle("line-through");
            appName.classList.toggle("opacity-80");
            
        });
        appName.addEventListener('dblclick', ()=>{
            this.clear();
        });
        
    }

    addTag(tag) {
        this.tags.push(tag);
        this.saveToLocalStorage();
       // this.renderTagFilters();
       // this.renderModalTags();
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
            this.renderTasks();
        });
        this.tagsFilterContainer.appendChild(clearBtn);
    }

    // Render tag buttons
    this.tags.forEach(tag => {
        const isSelected = this.selectedTagNames.includes(tag.name);
        const btn = document.createElement("button");
        btn.className = `cursor-pointer shrink-0 py-1 px-3 flex items-center gap-2 border-0 hover:bg-gray-200 rounded-2xl ${
            isSelected ? 'ring-1 ring-gray-400' : ''
        }`;
        btn.innerHTML = `
            <div class="w-[25px] h-[25px] rounded-full shrink-0" style="background-color: ${tag.color}"></div>
            <span class="text-[15px]">${tag.name}</span>
        `;
        btn.addEventListener('click', () => {
            const index = this.selectedTagNames.indexOf(tag.name);
            if (index > -1) {
                this.selectedTagNames.splice(index, 1);
            } else {
                this.selectedTagNames.push(tag.name);
            }
            
            this.renderTagFilters();
            this.renderTasks();
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
                deleteBtn.addEventListener('click', (e)=>{
                    e.stopPropagation();
                    if(confirm(`Delete ${tag.name}?`)){
                        this.tags = this.tags.filter(t => t !== tag);
                        this.tasks.forEach(task => {
                            task.tags = task.tags.filter(t => t.name !== tag.name);
                        });
                        this.renderModalTags();
                        this.renderTagFilters();
                        this.saveToLocalStorage();
                        this.renderTasks();
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

    renderTasks() {
        this.deleteEmpty();
        this.tasksContainer.innerHTML = "";
        const filteredTasks = this.tasks.filter(task => {
            const tagMatch =
                this.selectedTagNames.length === 0 ||
                this.selectedTagNames.every(tagName => task.tags.some(tag => tagName === tag.name));
    
            const statusMatch =
                this.selectedStatus === "all" ||
                (this.selectedStatus === "done" && task.isDone) ||
                (this.selectedStatus === "on going" && !task.isDone);
    
            return tagMatch && statusMatch;
        });
    
        filteredTasks.forEach(task => {
            const card = document.createElement("div");
            card.className = "relative break-inside-avoid bg-[#FFF9DE] p-6 rounded-2xl";
    
            const tagDots = task.tags.map(tag =>
                `<span class="h-[25px] w-[25px] rounded-full" style="background-color: ${tag.color}"></span>`
            ).join('');
    
            card.innerHTML = `
                <div class="absolute top-3 right-4 text-xl font-bold text-gray-600 hover:text-gray-900 group">
                    <button aria-label="Options" class="options cursor-pointer">⋮</button>
                    <div class="hidden group-hover:block absolute right-0 top-3 mt-1 bg-white  rounded shadow-md z-10 options-menu">
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
                    <div>
                        <input type="checkbox" ${task.isDone ? 'checked' : ''} />
                        <label class="cursor-pointer">Done</label>
                    </div>
                </footer>
            `;
    
            // ✅ Fix: Select the checkbox correctly and add event listener
            const checkbox = card.querySelector("input[type='checkbox']");
            checkbox.addEventListener('change', () => {
                task.isDone = checkbox.checked;
                this.saveToLocalStorage();
                this.renderTasks();
            });
            card.querySelector(".delete-btn").addEventListener('click', ()=>{
                this.tasks = this.tasks.filter(t => t !== task);
                this.saveToLocalStorage();
                this.renderTasks();
            });
            card.querySelector('.edit-btn').addEventListener('click', () => {
                this.openEditModal(task);
            });
            this.tasksContainer.appendChild(card);
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
            menu.classList.toggle("hidden");
        });

        // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                    if (!menu.contains(e.target) && !threeDots.contains(e.target)) {
                        menu.classList.add("hidden");
                    }
        });
           if(task.isDone === false){
             //double click edit
             const titleEd = card.querySelector("h2");
             titleEd.addEventListener("dblclick", ()=>{
                 const input = document.createElement("input");
                 input.type = "text";
                 input.value = task.title;
                 input.className = "text-xl font-bold text-gray-800 w-full bg-transparent pl-2 py-1 focus:outline-none";
                 titleEd.replaceWith(input);
                 input.focus();
 
                 input.addEventListener("blur", ()=>{
                     task.title = input.value.trim() || task.title;
                     this.saveToLocalStorage();
                     this.renderTasks();
                 });
 
                 input.addEventListener("keypress", (e)=>{
                     if(e.key == "Enter"){
                         input.blur();
                     }
                 });
 
             });
 
             const descEd = card.querySelector("p");
             descEd.addEventListener("dblclick", ()=>{
                 const textarea = document.createElement("textarea");
                 textarea.value = task.description;
                 textarea.className = "text-gray-600 w-full bg-transparent resize-none focus:outline-none";
                 descEd.replaceWith(textarea);
                 textarea.focus();
 
                 textarea.addEventListener("blur", ()=>{
                     task.description = textarea.value.trim();
                     this.renderTasks();
                 });
 
                 textarea.addEventListener("keypress", (e)=>{
                     if(e.key == "Enter" && !e.shiftKey){
                         e.preventDefault();
                         textarea.blur();
                     }
                 });
 
             });
           }

        });
        //Updating counter
        const allCount = document.getElementById("all-count");
        const doneCount = document.getElementById("done-count");
        const ongoingCount = document.getElementById("ongoing-count");
        
        allCount.textContent = this.tasks.length;
        doneCount.textContent = this.tasks.filter(t => t.isDone === true).length;
        ongoingCount.textContent = this.tasks.filter(t => t.isDone === false).length;

        this.updateProgressBar();
    }
    deleteEmpty(){
        this.tasks = this.tasks.filter(t => t.title.length > 0);
    }
    openEditModal(task){
        this.taskTitleInput.value = task.title;
        this.taskDescriptionInput.value = task.description;
        this.selectedTagNames = task.tags.map(t => t.name);
        this.renderModalTags();

        this.addModal.classList.remove("hidden");

        const submitBtn = this.taskForm.querySelector('input[type="submit"]');
        submitBtn.value = 'Update';

        const handler =  (e) =>{
            e.preventDefault();
            task.title = this.taskTitleInput.value.trim();
            task.description = this.taskDescriptionInput.value.trim();
            task.tags = this.tags.filter(tag => this.selectedTagNames.includes(tag.name));

            this.addModal.classList.add("hidden");
            this.taskForm.reset();
            this.selectedTagNames = [];
            submitBtn.value = "Add";
            this.taskForm.removeEventListener('submit', handler);
            this.saveToLocalStorage();
            this.renderTasks();
        }
        this.taskForm.addEventListener('submit', handler);
    }
    updateProgressBar(){
        const total = this.tasks.length;
        const done = this.tasks.filter(t => t.isDone === true).length;
        const percentage = total === 0 ? 0 : Math.round((done/total)*100);

        this.progressBar.style.width =  `${percentage}%`;
        this.progressText.textContent = `${percentage}%`;
    }

    saveToLocalStorage(){
        const data = {
            tasks: this.tasks,
            tags: this.tags
        };
        localStorage.setItem('todoAppData', JSON.stringify(data));
    }

    loadFromLocalStorage(){
        const data = JSON.parse(localStorage.getItem('todoAppData'));
        if(data){
            this.tags = data.tags.map(t => new tag(t.name, t.color));
            this.tasks = data.tasks.map(tsk =>{
                const tskTags = tsk.tags.map(t => new tag(t.name, t.color));
                const tsks = new task(tsk.title, tsk.description, tskTags);
                tsks.isDone = tsk.isDone;
                return tsks; 
            });
        }
    }
    clear(){
        if(confirm("Want you clear all app data?")){
            this.tasks = [];
            this.tags = [];
            this.saveToLocalStorage();
            this.renderTasks();
            this.renderTagFilters();
        }
    }
    resetTaskForm(){
        this.taskForm.reset();
        const submitBtn = this.taskForm.querySelector('input[type="submit"]');
        submitBtn.value = 'Add';
        this.selectedTagNames = [];
    }

    
}

// Instantiate app
let todo = new todoApp();
