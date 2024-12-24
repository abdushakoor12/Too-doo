/**
 * @typedef {Object} Todo
 * @property {string} id - Unique identifier for the todo
 * @property {string} title - The title of the todo
 * @property {boolean} completed - Whether the todo is completed
 * @property {string} createdAt - ISO string of when the todo was created
 * @property {string} [completedAt] - ISO string of when the todo was completed
 * @property {number} [indentLevel] - Indentation level (0-5)
 */

/** @type {Todo[]} */
let todos = [];
let selectedIndex = -1;
let isEditing = false;

/**
 * @returns {Todo[]}
 */
function getTodos() {
    const storedTodos = localStorage.getItem('todos');
    todos = storedTodos ? JSON.parse(storedTodos) : [];
    return todos;
}

/**
 * @param {Todo[]} todos
 */
function saveTodos(todos) {
    localStorage.setItem('todos', JSON.stringify(todos));
}

/**
 * Creates a new todo and adds it to the list
 */
function createNewTodo() {
    const todo = {
        id: crypto.randomUUID(),
        title: '',
        completed: false,
        createdAt: new Date().toISOString(),
        indentLevel: 0
    };
    todos.push(todo);
    selectedIndex = todos.length - 1;
    isEditing = true;
    saveTodos(todos);
    renderTodos();
    focusSelectedTodo();
}

/**
 * Changes the indent level of the current todo
 * @param {boolean} increase - Whether to increase or decrease the indent level
 */
function changeIndentLevel(increase) {
    if (selectedIndex >= 0) {
        const todo = todos[selectedIndex];
        const currentLevel = todo.indentLevel || 0;
        
        if (increase && currentLevel < 5) {
            todo.indentLevel = currentLevel + 1;
            saveTodos(todos);
            renderTodos();
        } else if (!increase && currentLevel > 0) {
            todo.indentLevel = currentLevel - 1;
            saveTodos(todos);
            renderTodos();
        }
    }
}

/**
 * Focuses the selected todo
 */
function focusSelectedTodo() {
    if (selectedIndex >= 0) {
        const content = document.querySelector(`#todo-${todos[selectedIndex].id} .todo-content`);
        if (content) {
            content.focus();
            // Place cursor at the end of the content
            const range = document.createRange();
            const selection = window.getSelection();
            range.selectNodeContents(content);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }
}

/**
 * Exits edit mode and saves the current todo
 */
function exitEditMode() {
    if (selectedIndex >= 0) {
        const content = document.querySelector(`#todo-${todos[selectedIndex].id} .todo-content`);
        if (content) {
            todos[selectedIndex].title = content.textContent.trim();
            saveTodos(todos);
        }
    }
    isEditing = false;
    renderTodos();
}

/**
 * Removes the currently selected todo
 */
function removeTodo() {
    if (selectedIndex >= 0) {
        todos.splice(selectedIndex, 1);
        if (selectedIndex >= todos.length) {
            selectedIndex = todos.length - 1;
        }
        saveTodos(todos);
        renderTodos();
    }
}

/**
 * Handles todo selection
 * @param {number} index
 */
function selectTodo(index) {
    if (isEditing) {
        exitEditMode();
    }
    selectedIndex = index;
    renderTodos();
}

/**
 * Renders a single todo item
 * @param {Todo} todo 
 * @param {number} index
 */
function renderTodoItem(todo, index) {
    const isSelected = index === selectedIndex;
    const editing = isSelected && isEditing;
    
    return `
        <div id="todo-${todo.id}" 
             class="todo-item ${isSelected ? 'selected' : ''} ${editing ? 'editing' : ''}"
             data-index="${index}"
             data-indent="${todo.indentLevel || 0}"
             onclick="selectTodo(${index})">
            <div class="todo-content"
                 contenteditable="${editing}"
                 ${editing ? '' : 'tabindex="-1"'}>
                ${todo.title || ''}
            </div>
        </div>
    `;
}

/**
 * Renders all todos or empty state
 */
function renderTodos() {
    const container = document.getElementById('todos-container');

    if (todos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h2>No todos yet!</h2>
                <p>Press <span class="keyboard-shortcut">N</span> to create a new todo</p>
            </div>
        `;
    } else {
        container.innerHTML = todos.map((todo, index) => renderTodoItem(todo, index)).join('');
    }
}

/**
 * Toggles the shortcuts dialog
 */
function toggleShortcutsDialog() {
    const dialog = document.getElementById('shortcuts-dialog');
    dialog.classList.toggle('open');
}

/**
 * Handles keyboard navigation
 * @param {KeyboardEvent} e
 */
function handleKeyboard(e) {
    // Handle Tab for indentation
    if (e.key === 'Tab') {
        e.preventDefault(); // Prevent focus change
        changeIndentLevel(!e.shiftKey);
        return;
    }

    // Create new todo with 'n'
    if (!isEditing && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        createNewTodo();
        return;
    }

    // Handle Enter or Escape in edit mode
    if (isEditing && (e.key === 'Enter' || e.key === 'Escape')) {
        e.preventDefault();
        exitEditMode();
        return;
    }

    // Handle delete in normal mode
    if (!isEditing && (e.key === 'Backspace' || e.key === 'Delete')) {
        e.preventDefault();
        removeTodo();
        return;
    }

    // Navigation with arrow keys when not editing
    if (!isEditing) {
        if (e.key === 'ArrowUp' && selectedIndex > 0) {
            e.preventDefault();
            selectedIndex--;
            renderTodos();
        } else if (e.key === 'ArrowDown' && selectedIndex < todos.length - 1) {
            e.preventDefault();
            selectedIndex++;
            renderTodos();
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            isEditing = true;
            renderTodos();
            focusSelectedTodo();
        }
    }
}

/**
 * Handles input events for editing todos
 * @param {Event} e
 */
function handleInput(e) {
    if (e.target.matches('.todo-content') && isEditing) {
        const index = parseInt(e.target.closest('.todo-item').dataset.index);
        todos[index].title = e.target.textContent.trim();
        saveTodos(todos);
    }
}

/**
 * Handles when editing is complete
 * @param {FocusEvent} e
 */
function handleBlur(e) {
    if (e.target.matches('.todo-content') && isEditing) {
        exitEditMode();
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    getTodos();
    if (todos.length > 0 && selectedIndex === -1) {
        selectedIndex = 0;
    }
    renderTodos();
});

// Event listeners
document.addEventListener('keydown', handleKeyboard);
document.addEventListener('input', handleInput);
document.addEventListener('blur', handleBlur, true);

// Close dialog when clicking outside
document.addEventListener('click', (e) => {
    const dialog = document.getElementById('shortcuts-dialog');
    const isClickInside = dialog.contains(e.target);
    const isClickOnButton = e.target.closest('.info-button');
    
    if (dialog.classList.contains('open') && !isClickInside && !isClickOnButton) {
        dialog.classList.remove('open');
    }
});

// Prevent todo selection when editing content
document.addEventListener('click', (e) => {
    if (e.target.matches('.todo-content[contenteditable="true"]')) {
        e.stopPropagation();
    }
});