/**
 * @typedef {Object} Todo
 * @property {number} id
 * @property {string} title
 * @property {boolean} completed
 * @property {number} [indentLevel] - Indentation level (0-5)
 */

/**
 * Debounce function to limit the rate at which a function is called
 * @param {Function} func 
 * @param {number} wait 
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/** @type {Todo[]} */
let todos = [];
let selectedIndex = -1;
let isEditing = false;

// Debounced save function
const debouncedSave = debounce(() => {
    if (selectedIndex >= 0) {
        saveTodos();
    }
}, 300);

/**
 * Saves todos to localStorage
 */
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

/**
 * Gets todos from localStorage
 */
function getTodos() {
    const saved = localStorage.getItem('todos');
    todos = saved ? JSON.parse(saved) : [];
}

/**
 * Creates a new todo
 */
function createNewTodo() {
    const newTodo = {
        id: Date.now(),
        title: '',
        completed: false,
        indentLevel: 0
    };

    // If there are existing todos, insert after current selection and inherit indent
    if (todos.length > 0) {
        const currentIndentLevel = todos[selectedIndex]?.indentLevel || 0;
        newTodo.indentLevel = currentIndentLevel;
        
        // Insert after current selection
        const insertIndex = selectedIndex >= 0 ? selectedIndex + 1 : todos.length;
        todos.splice(insertIndex, 0, newTodo);
        selectedIndex = insertIndex;
    } else {
        // First todo
        todos.push(newTodo);
        selectedIndex = 0;
    }

    isEditing = true;
    saveTodos();
    renderTodos();
    focusSelectedTodo();
}

/**
 * Removes the selected todo
 */
function removeTodo() {
    if (selectedIndex >= 0) {
        todos.splice(selectedIndex, 1);
        if (selectedIndex >= todos.length) {
            selectedIndex = todos.length - 1;
        }
        saveTodos();
        renderTodos();
    }
}

/**
 * Exits edit mode and saves changes
 */
function exitEditMode() {
    isEditing = false;
    saveTodos();
    renderTodos();
}

/**
 * Focuses the selected todo for editing
 */
function focusSelectedTodo() {
    const todo = document.querySelector('.todo-content[contenteditable="true"]');
    if (todo) {
        todo.focus();
        // Place cursor at the end
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(todo);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

/**
 * Changes the indent level of the selected todo
 * @param {boolean} increase - Whether to increase or decrease the indent level
 */
function changeIndentLevel(increase) {
    if (selectedIndex === -1) return;

    const todo = todos[selectedIndex];
    if (increase && todo.indentLevel < 5) {
        todo.indentLevel++;
    } else if (!increase && todo.indentLevel > 0) {
        todo.indentLevel--;
    }
    saveTodos();
    renderTodos();
    if (isEditing) {
        focusSelectedTodo();
    }
}

/**
 * Toggles the completion status of the selected todo
 */
function toggleTodo() {
    if (selectedIndex >= 0) {
        todos[selectedIndex].completed = !todos[selectedIndex].completed;
        saveTodos();
        renderTodos();
    }
}

/**
 * Handles input events for editing todos
 * @param {InputEvent} e
 */
function handleInput(e) {
    if (e.target.matches('.todo-content[contenteditable="true"]') && selectedIndex >= 0) {
        todos[selectedIndex].title = e.target.textContent;
        debouncedSave();
    }
}

/**
 * Handles blur events for editing todos
 * @param {FocusEvent} e
 */
function handleBlur(e) {
    // Only handle blur for todo content
    if (e.target.matches('.todo-content[contenteditable="true"]')) {
        exitEditMode();
    }
}

/**
 * Handles todo selection
 * @param {number} index
 * @param {Event} e
 */
function selectTodo(index, e) {
    // Prevent handling if clicking inside editable content
    if (e && e.target.matches('.todo-content[contenteditable="true"]')) {
        return;
    }

    const wasEditing = isEditing;
    if (isEditing) {
        exitEditMode();
    }
    
    // If clicking already selected todo, enter edit mode
    if (selectedIndex === index && !wasEditing) {
        isEditing = true;
        renderTodos();
        focusSelectedTodo();
        return;
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
             onclick="selectTodo(${index}, event)">
            <div class="todo-content ${todo.completed ? 'completed' : ''}"
                 contenteditable="${editing}"
                 ${editing ? '' : 'tabindex="-1"'}>
                ${todo.title || ''}
            </div>
        </div>
    `;
}

/**
 * Updates the todo count in the header
 */
function updateTodoCount() {
    const totalTodos = todos.length;
    const completedTodos = todos.filter(todo => todo.completed).length;
    const counter = document.getElementById('todo-count');
    if (counter) {
        counter.textContent = `${completedTodos}/${totalTodos}`;
    }
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
    updateTodoCount();
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
    // Only handle tab when editing or a todo is selected
    if (e.key === 'Tab' && (isEditing || selectedIndex >= 0)) {
        e.preventDefault(); // Prevent focus change
        e.stopPropagation(); // Stop event bubbling
        const wasEditing = isEditing;
        changeIndentLevel(!e.shiftKey);
        if (wasEditing) {
            // Small delay to ensure DOM is updated
            setTimeout(() => {
                focusSelectedTodo();
            }, 0);
        }
        return;
    }

    // Create new todo with 'n'
    if (!isEditing && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        createNewTodo();
        return;
    }

    // Toggle todo completion with space
    if (!isEditing && e.key === ' ' && selectedIndex >= 0) {
        e.preventDefault();
        toggleTodo();
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