// Data structure
let checklistData = {
    items: []
};

let currentPath = []; // Track navigation path

// DOM elements
const newItemInput = document.getElementById('newItemInput');
const addItemBtn = document.getElementById('addItemBtn');
const checklistContainer = document.getElementById('checklistContainer');
const breadcrumb = document.getElementById('breadcrumb');
const homeBtn = document.getElementById('homeBtn');
const installPrompt = document.getElementById('installPrompt');
const installBtn = document.getElementById('installBtn');
const dismissBtn = document.getElementById('dismissBtn');

// Initialize
loadData();
render();
setupInstallPrompt();

// Event listeners
addItemBtn.addEventListener('click', addItem);
newItemInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addItem();
});
homeBtn.addEventListener('click', navigateHome);

// Add new item
function addItem() {
    const text = newItemInput.value.trim();
    if (!text) return;

    const item = {
        id: Date.now().toString(),
        text: text,
        completed: false,
        children: []
    };

    const currentItems = getCurrentItems();
    currentItems.push(item);
    
    newItemInput.value = '';
    saveData();
    render();
}

// Add child item to a specific parent
function addChildItem(parentId) {
    const inputId = `child-input-${parentId}`;
    const input = document.getElementById(inputId);
    const text = input.value.trim();
    
    if (!text) return;

    const parent = findItemById(checklistData.items, parentId);
    if (!parent) return;

    const child = {
        id: Date.now().toString(),
        text: text,
        completed: false,
        children: []
    };

    parent.children.push(child);
    input.value = '';
    saveData();
    render();
}

// Toggle showing add child input
function toggleAddChild(parentId) {
    const container = document.getElementById(`add-child-${parentId}`);
    const isVisible = container.style.display === 'flex';
    
    // Hide all other add-child inputs first
    document.querySelectorAll('.add-child-container').forEach(el => {
        el.style.display = 'none';
    });
    
    container.style.display = isVisible ? 'none' : 'flex';
    
    if (!isVisible) {
        const input = document.getElementById(`child-input-${parentId}`);
        setTimeout(() => input.focus(), 100);
    }
}

// Get current items based on navigation path
function getCurrentItems() {
    let items = checklistData.items;
    for (const id of currentPath) {
        const parent = findItemById(items, id);
        if (parent) items = parent.children;
    }
    return items;
}

// Find item by ID recursively
function findItemById(items, id) {
    for (const item of items) {
        if (item.id === id) return item;
        const found = findItemById(item.children, id);
        if (found) return found;
    }
    return null;
}

// Toggle item completion
function toggleItem(id) {
    const item = findItemById(checklistData.items, id);
    if (!item) return;

    item.completed = !item.completed;
    
    // Always set all children to match parent's state
    setChildrenCompleted(item, item.completed);
    
    // Update parent completion status
    updateParentCompletion();
    
    saveData();
    render();
}

// Set all children's completion status
function setChildrenCompleted(item, completed) {
    item.children.forEach(child => {
        child.completed = completed;
        setChildrenCompleted(child, completed);
    });
}

// Update parent completion based on children
function updateParentCompletion() {
    function updateItem(items) {
        items.forEach(item => {
            if (item.children.length > 0) {
                updateItem(item.children);
                // Check if all children are completed
                const allChildrenCompleted = item.children.every(child => child.completed);
                if (allChildrenCompleted && item.children.length > 0) {
                    item.completed = true;
                }
            }
        });
    }
    updateItem(checklistData.items);
}

// Delete item
function deleteItem(id) {
    function removeFromArray(items) {
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
            items.splice(index, 1);
            return true;
        }
        for (const item of items) {
            if (removeFromArray(item.children)) return true;
        }
        return false;
    }
    
    removeFromArray(checklistData.items);
    saveData();
    render();
}

// Navigate to item's children
function navigateToChildren(id) {
    currentPath.push(id);
    render();
}

// Navigate home
function navigateHome() {
    currentPath = [];
    render();
}

// Navigate to breadcrumb item
function navigateTo(index) {
    currentPath = currentPath.slice(0, index);
    render();
}

// Render the checklist
function render() {
    const items = getCurrentItems();
    checklistContainer.innerHTML = '';
    
    // Update breadcrumb
    updateBreadcrumb();
    
    // Show/hide home button
    homeBtn.style.display = currentPath.length > 0 ? 'flex' : 'none';
    
    if (items.length === 0) {
        checklistContainer.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 11l3 3L22 4"></path>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                <p>No items yet. Add one above!</p>
            </div>
        `;
        return;
    }
    
    items.forEach(item => {
        const itemEl = createItemElement(item);
        checklistContainer.appendChild(itemEl);
    });
}

// Create item element
function createItemElement(item) {
    const div = document.createElement('div');
    div.className = `checklist-item ${item.completed ? 'completed' : ''}`;
    
    const childCount = item.children.length;
    const completedChildren = item.children.filter(c => c.completed).length;
    
    div.innerHTML = `
        <div class="item-header">
            <div class="checkbox ${item.completed ? 'checked' : ''}" onclick="toggleItem('${item.id}')"></div>
            <div class="item-text ${item.completed ? 'completed' : ''}">${escapeHtml(item.text)}</div>
            <div class="item-actions">
                <button class="action-btn" onclick="toggleAddChild('${item.id}')" title="Add child item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </button>
                <button class="action-btn" onclick="deleteItem('${item.id}')" title="Delete">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        </div>
        
        <div id="add-child-${item.id}" class="add-child-container" style="display: none;">
            <input type="text" id="child-input-${item.id}" placeholder="Add child item..." class="child-item-input">
            <button onclick="addChildItem('${item.id}')" class="add-child-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 11 12 14 22 4"></polyline>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
            </button>
        </div>
        
        ${childCount > 0 ? `
            <button class="children-link" onclick="navigateToChildren('${item.id}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
                View ${childCount} child item${childCount > 1 ? 's' : ''}
                <span class="child-count">${completedChildren}/${childCount} ✓</span>
            </button>
        ` : ''}
    `;
    
    // Add enter key support for child input
    const childInput = div.querySelector(`#child-input-${item.id}`);
    if (childInput) {
        childInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addChildItem(item.id);
            }
        });
    }
    
    return div;
}

// Update breadcrumb navigation
function updateBreadcrumb() {
    if (currentPath.length === 0) {
        breadcrumb.innerHTML = '';
        return;
    }
    
    const parts = ['<span onclick="navigateHome()">Home</span>'];
    
    for (let i = 0; i < currentPath.length; i++) {
        const item = findItemById(checklistData.items, currentPath[i]);
        if (item) {
            parts.push(`<span onclick="navigateTo(${i + 1})">${escapeHtml(item.text)}</span>`);
        }
    }
    
    breadcrumb.innerHTML = parts.join(' → ');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('checklistData', JSON.stringify(checklistData));
}

// Load data from localStorage
function loadData() {
    const saved = localStorage.getItem('checklistData');
    if (saved) {
        checklistData = JSON.parse(saved);
    }
}

// PWA Install prompt
function setupInstallPrompt() {
    let deferredPrompt;
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Show custom install prompt
        const dismissed = localStorage.getItem('installDismissed');
        if (!dismissed) {
            installPrompt.style.display = 'flex';
        }
    });
    
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        deferredPrompt = null;
        installPrompt.style.display = 'none';
    });
    
    dismissBtn.addEventListener('click', () => {
        installPrompt.style.display = 'none';
        localStorage.setItem('installDismissed', 'true');
    });
}

// Make functions globally accessible
window.toggleItem = toggleItem;
window.deleteItem = deleteItem;
window.navigateToChildren = navigateToChildren;
window.navigateHome = navigateHome;
window.navigateTo = navigateTo;
window.toggleAddChild = toggleAddChild;
window.addChildItem = addChildItem;
