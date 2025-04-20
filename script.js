// Shopping List App

// DOM Elements
const itemCard = document.getElementById('item-card');
const itemNameElement = document.getElementById('item-name');
const addButton = document.getElementById('add-button');
const detailModal = document.getElementById('detail-modal');
const addModal = document.getElementById('add-modal');
const detailForm = document.getElementById('detail-form');
const addForm = document.getElementById('add-form');
const exportButton = document.getElementById('export-button');
const quantityToPurchaseElement = document.getElementById('quantity-to-purchase');

// Close buttons for modals
const closeButtons = document.querySelectorAll('.close-button');

// Form elements for detail modal
const editNameInput = document.getElementById('edit-name');
const editQuantityInput = document.getElementById('edit-quantity');
const editMinRequiredInput = document.getElementById('edit-min-required');
const editBarcodeInput = document.getElementById('edit-barcode');
const editShopInput = document.getElementById('edit-shop');
const editCategoryInput = document.getElementById('edit-category');
const deleteButton = document.querySelector('.delete-button');

// Form elements for add modal
const newNameInput = document.getElementById('new-name');
const newQuantityInput = document.getElementById('new-quantity');
const newMinRequiredInput = document.getElementById('new-min-required');
const newBarcodeInput = document.getElementById('new-barcode');
const newShopInput = document.getElementById('new-shop');
const newCategoryInput = document.getElementById('new-category');

// State
let shoppingItems = [];
let currentItemIndex = 0;
let startX, startY, moveX, moveY;
let isDragging = false;

// Load data from localStorage
function loadItems() {
    const storedItems = localStorage.getItem('shoppingItems');
    if (storedItems) {
        shoppingItems = JSON.parse(storedItems);
    } else {
        // Add sample items for first-time users
        shoppingItems = [
            {
                name: "Milk",
                quantity: 1,
                minRequired: 2,
                barcode: "",
                shop: "Grocery Store",
                category: "perishable"
            },
            {
                name: "Bread",
                quantity: 0,
                minRequired: 1,
                barcode: "",
                shop: "Bakery",
                category: "perishable"
            },
            {
                name: "Rice",
                quantity: 3,
                minRequired: 1,
                barcode: "",
                shop: "Supermarket",
                category: "non-perishable"
            },
            {
                name: "Toilet Paper",
                quantity: 2,
                minRequired: 4,
                barcode: "",
                shop: "Convenience Store",
                category: "non-perishable"
            }
        ];
        saveItems();
    }
    updateCardDisplay();
}

// Save data to localStorage
function saveItems() {
    localStorage.setItem('shoppingItems', JSON.stringify(shoppingItems));
}

// Update the card to display the current item
function updateCardDisplay() {
    if (shoppingItems.length === 0) {
        itemNameElement.textContent = 'Add your first item';
        return;
    }

    const currentItem = shoppingItems[currentItemIndex];
    
    // Enhanced card display with more information
    itemCard.querySelector('.card-content').innerHTML = `
        <h2 id="item-name">${currentItem.name}</h2>
        <p class="item-details">In stock: <span class="quantity">${currentItem.quantity}</span></p>
        <p class="item-details">Need to buy: <span class="to-buy">${Math.max(0, currentItem.minRequired - currentItem.quantity)}</span></p>
        <p class="item-category ${currentItem.category}">${currentItem.category}</p>
        ${currentItem.shop ? `<p class="item-shop">Shop: ${currentItem.shop}</p>` : ''}
    `;
}

// Navigate to the previous item
function prevItem() {
    if (shoppingItems.length === 0) return;
    
    // Add the swipe right animation class
    itemCard.classList.add('swipe-right');
    
    // After animation completes, update the item
    setTimeout(() => {
        currentItemIndex = (currentItemIndex - 1 + shoppingItems.length) % shoppingItems.length;
        updateCardDisplay();
        itemCard.classList.remove('swipe-right');
        resetCardPosition();
    }, 300);
}

// Navigate to the next item
function nextItem() {
    if (shoppingItems.length === 0) return;
    
    // Add the swipe left animation class
    itemCard.classList.add('swipe-left');
    
    // After animation completes, update the item
    setTimeout(() => {
        currentItemIndex = (currentItemIndex + 1) % shoppingItems.length;
        updateCardDisplay();
        itemCard.classList.remove('swipe-left');
        resetCardPosition();
    }, 300);
}

// Move current item up in the list
function moveItemUp() {
    if (shoppingItems.length <= 1 || currentItemIndex === 0) return;
    
    // Add the swipe up animation class
    itemCard.classList.add('swipe-up');
    
    // After animation completes, move the item
    setTimeout(() => {
        const temp = shoppingItems[currentItemIndex];
        shoppingItems[currentItemIndex] = shoppingItems[currentItemIndex - 1];
        shoppingItems[currentItemIndex - 1] = temp;
        currentItemIndex--;
        saveItems();
        updateCardDisplay();
        itemCard.classList.remove('swipe-up');
        resetCardPosition();
    }, 300);
}

// Move current item down in the list
function moveItemDown() {
    if (shoppingItems.length <= 1 || currentItemIndex === shoppingItems.length - 1) return;
    
    // Add the swipe down animation class
    itemCard.classList.add('swipe-down');
    
    // After animation completes, move the item
    setTimeout(() => {
        const temp = shoppingItems[currentItemIndex];
        shoppingItems[currentItemIndex] = shoppingItems[currentItemIndex + 1];
        shoppingItems[currentItemIndex + 1] = temp;
        currentItemIndex++;
        saveItems();
        updateCardDisplay();
        itemCard.classList.remove('swipe-down');
        resetCardPosition();
    }, 300);
}

// Reset the card position
function resetCardPosition() {
    itemCard.style.transform = 'translateX(0) translateY(0) rotate(0)';
}

// Open the detail modal for the current item
function openDetailModal() {
    if (shoppingItems.length === 0) {
        openAddModal();
        return;
    }

    const currentItem = shoppingItems[currentItemIndex];
    
    // Fill in the form with current item data
    editNameInput.value = currentItem.name;
    editQuantityInput.value = currentItem.quantity;
    editMinRequiredInput.value = currentItem.minRequired;
    editBarcodeInput.value = currentItem.barcode || '';
    editShopInput.value = currentItem.shop || '';
    editCategoryInput.value = currentItem.category;
    
    // Calculate and display quantity to purchase
    updateQuantityToPurchase();
    
    // Show the modal
    detailModal.style.display = 'block';
}

// Open the add modal
function openAddModal() {
    // Clear the form
    addForm.reset();
    
    // Set default category
    newCategoryInput.value = 'non-perishable';
    
    // Show the modal
    addModal.style.display = 'block';
}

// Close all modals
function closeModals() {
    detailModal.style.display = 'none';
    addModal.style.display = 'none';
}

// Update the quantity to purchase display
function updateQuantityToPurchase() {
    const quantity = parseInt(editQuantityInput.value) || 0;
    const minRequired = parseInt(editMinRequiredInput.value) || 0;
    const toPurchase = Math.max(0, minRequired - quantity);
    quantityToPurchaseElement.textContent = toPurchase;
}

// Save the edited item
function saveEditedItem(e) {
    e.preventDefault();
    
    if (shoppingItems.length === 0) return;
    
    const currentItem = shoppingItems[currentItemIndex];
    currentItem.name = editNameInput.value;
    currentItem.quantity = parseInt(editQuantityInput.value) || 0;
    currentItem.minRequired = parseInt(editMinRequiredInput.value) || 0;
    currentItem.barcode = editBarcodeInput.value;
    currentItem.shop = editShopInput.value;
    currentItem.category = editCategoryInput.value;
    
    saveItems();
    updateCardDisplay();
    closeModals();
}

// Delete the current item
function deleteItem() {
    if (shoppingItems.length === 0) return;
    
    shoppingItems.splice(currentItemIndex, 1);
    if (currentItemIndex >= shoppingItems.length) {
        currentItemIndex = Math.max(0, shoppingItems.length - 1);
    }
    
    saveItems();
    updateCardDisplay();
    closeModals();
}

// Add a new item
function addNewItem(e) {
    e.preventDefault();
    
    const newItem = {
        name: newNameInput.value,
        quantity: parseInt(newQuantityInput.value) || 0,
        minRequired: parseInt(newMinRequiredInput.value) || 0,
        barcode: newBarcodeInput.value,
        shop: newShopInput.value,
        category: newCategoryInput.value
    };
    
    // Insert at current position or at the end if list is empty
    if (shoppingItems.length === 0) {
        shoppingItems.push(newItem);
        currentItemIndex = 0;
    } else {
        shoppingItems.splice(currentItemIndex + 1, 0, newItem);
        currentItemIndex++;
    }
    
    saveItems();
    updateCardDisplay();
    closeModals();
}

// Export the shopping list to clipboard
function exportList() {
    if (shoppingItems.length === 0) {
        alert('Nothing to export');
        return;
    }
    
    const jsonString = JSON.stringify(shoppingItems, null, 2);
    navigator.clipboard.writeText(jsonString)
        .then(() => {
            alert('Shopping list copied to clipboard');
        })
        .catch(err => {
            console.error('Failed to copy: ', err);
            alert('Failed to copy list to clipboard');
        });
}

// TOUCH AND SWIPE HANDLING

// Start tracking touch/mouse position
function handleDragStart(e) {
    // For mouse events
    if (e.type === 'mousedown') {
        startX = e.clientX;
        startY = e.clientY;
    } 
    // For touch events
    else if (e.type === 'touchstart') {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }
    
    moveX = 0;
    moveY = 0;
    isDragging = true;
    itemCard.classList.add('swiping');
    
    // Add event listeners for move and end events
    if (e.type === 'mousedown') {
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
    } else {
        document.addEventListener('touchmove', handleDragMove, { passive: false });
        document.addEventListener('touchend', handleDragEnd);
    }
}

// Track movement during drag
function handleDragMove(e) {
    if (!isDragging) return;
    
    // Prevent scrolling while dragging
    e.preventDefault();
    
    // For mouse events
    if (e.type === 'mousemove') {
        moveX = e.clientX - startX;
        moveY = e.clientY - startY;
    } 
    // For touch events
    else if (e.type === 'touchmove') {
        moveX = e.touches[0].clientX - startX;
        moveY = e.touches[0].clientY - startY;
    }
    
    // Apply movement to the card with some rotation based on movement
    const rotateZ = moveX * 0.1; // Subtle rotation effect
    itemCard.style.transform = `translateX(${moveX}px) translateY(${moveY}px) rotate(${rotateZ}deg)`;
}

// Handle end of drag and determine action
function handleDragEnd(e) {
    if (!isDragging) return;
    
    isDragging = false;
    itemCard.classList.remove('swiping');
    
    // Determine the primary direction of the swipe
    const absX = Math.abs(moveX);
    const absY = Math.abs(moveY);
    const threshold = 100; // Minimum distance to trigger an action
    
    if (Math.max(absX, absY) < threshold) {
        // If the movement is smaller than the threshold, reset the card
        resetCardPosition();
    } else if (absX > absY) {
        // Horizontal swipe
        if (moveX > 0) {
            prevItem(); // Swipe right -> previous item
        } else {
            nextItem(); // Swipe left -> next item
        }
    } else {
        // Vertical swipe
        if (moveY < 0) {
            moveItemUp(); // Swipe up -> move item up
        } else {
            moveItemDown(); // Swipe down -> move item down
        }
    }
    
    // Remove event listeners
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchmove', handleDragMove);
    document.removeEventListener('touchend', handleDragEnd);
}

// EVENT LISTENERS

// Card interaction
itemCard.addEventListener('mousedown', handleDragStart);
itemCard.addEventListener('touchstart', handleDragStart, { passive: true });

// Long press detection for opening detail view
let longPressTimer;
itemCard.addEventListener('mousedown', () => {
    longPressTimer = setTimeout(openDetailModal, 800);
});
itemCard.addEventListener('touchstart', () => {
    longPressTimer = setTimeout(openDetailModal, 800);
}, { passive: true });

itemCard.addEventListener('mouseup', () => {
    clearTimeout(longPressTimer);
});
itemCard.addEventListener('touchend', () => {
    clearTimeout(longPressTimer);
});

// Add button
addButton.addEventListener('click', openAddModal);

// Close buttons for modals
closeButtons.forEach(button => {
    button.addEventListener('click', closeModals);
});

// Form submissions
detailForm.addEventListener('submit', saveEditedItem);
addForm.addEventListener('submit', addNewItem);

// Delete button
deleteButton.addEventListener('click', deleteItem);

// Export button
exportButton.addEventListener('click', exportList);

// Update quantity to purchase on input change
editQuantityInput.addEventListener('input', updateQuantityToPurchase);
editMinRequiredInput.addEventListener('input', updateQuantityToPurchase);

// Close modal when clicking outside of it
window.addEventListener('click', (e) => {
    if (e.target === detailModal) {
        closeModals();
    }
    if (e.target === addModal) {
        closeModals();
    }
});

// Initialize the app
loadItems();