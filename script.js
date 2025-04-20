// Shopping List App

// DOM Elements
const itemCard = document.getElementById('item-card');
const itemNameElement = document.getElementById('item-name');
const addButton = document.getElementById('add-button');
const menuButton = document.getElementById('menu-button');
const detailModal = document.getElementById('detail-modal');
const addModal = document.getElementById('add-modal');
const menuModal = document.getElementById('menu-modal');
const featureRequestModal = document.getElementById('feature-request-modal');
const storageLocationModal = document.getElementById('storage-location-modal');
const detailForm = document.getElementById('detail-form');
const addForm = document.getElementById('add-form');
const featureRequestForm = document.getElementById('feature-request-form');
const storageLocationForm = document.getElementById('storage-location-form');
const exportListBtn = document.getElementById('export-list-btn');
const quantityToPurchaseElement = document.getElementById('quantity-to-purchase');
const featureRequestBtn = document.getElementById('feature-request-btn');
const storageLocationBtn = document.getElementById('storage-location-btn');
const storageLocationsContainer = document.getElementById('storage-locations-container');

// Close buttons for modals
const closeButtons = document.querySelectorAll('.close-button');

// Form elements for detail modal
const editNameInput = document.getElementById('edit-name');
const editQuantityInput = document.getElementById('edit-quantity');
const editMinRequiredInput = document.getElementById('edit-min-required');
const editBarcodeInput = document.getElementById('edit-barcode');
const editScanBarcodeBtn = document.getElementById('edit-scan-barcode');
const editProductImage = document.getElementById('edit-product-image');
const editImageUpload = document.getElementById('edit-image-upload');
const editCameraButton = document.getElementById('edit-camera-button');
const editShopInput = document.getElementById('edit-shop');
const editCategoryInput = document.getElementById('edit-category');
const deleteButton = document.querySelector('.delete-button');

// Form elements for add modal
const newNameInput = document.getElementById('new-name');
const newQuantityInput = document.getElementById('new-quantity');
const newMinRequiredInput = document.getElementById('new-min-required');
const newBarcodeInput = document.getElementById('new-barcode');
const newScanBarcodeBtn = document.getElementById('new-scan-barcode');
const newProductImage = document.getElementById('new-product-image');
const newImageUpload = document.getElementById('new-image-upload');
const newCameraButton = document.getElementById('new-camera-button');
const newShopInput = document.getElementById('new-shop');
const newCategoryInput = document.getElementById('new-category');

// State
let shoppingItems = [];
let storageLocations = [];
let currentItemIndex = 0;
let startX, startY, moveX, moveY;
let isDragging = false;
let isBarcodeScanning = false;
let selectedDirectory = null; // For file system access API

// Load data from localStorage
function loadItems() {
    // Load shopping items
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
                category: "perishable",
                image: null,
                storageLocation: null
            },
            {
                name: "Bread",
                quantity: 0,
                minRequired: 1,
                barcode: "",
                shop: "Bakery",
                category: "perishable",
                image: null,
                storageLocation: null
            },
            {
                name: "Rice",
                quantity: 3,
                minRequired: 1,
                barcode: "",
                shop: "Supermarket",
                category: "non-perishable",
                image: null,
                storageLocation: null
            },
            {
                name: "Toilet Paper",
                quantity: 2,
                minRequired: 4,
                barcode: "",
                shop: "Convenience Store",
                category: "non-perishable",
                image: null,
                storageLocation: null
            }
        ];
        saveItems();
    }
    
    // Load storage locations
    const storedLocations = localStorage.getItem('storageLocations');
    if (storedLocations) {
        storageLocations = JSON.parse(storedLocations);
    }
    
    updateCardDisplay();
    updateStorageLocationsList();
}

// Save data to localStorage
function saveItems() {
    localStorage.setItem('shoppingItems', JSON.stringify(shoppingItems));
}

// Save storage locations to localStorage
function saveStorageLocations() {
    localStorage.setItem('storageLocations', JSON.stringify(storageLocations));
}

// Update the card to display the current item
function updateCardDisplay() {
    if (shoppingItems.length === 0) {
        itemNameElement.textContent = 'Add your first item';
        itemCard.style.backgroundImage = '';
        return;
    }

    const currentItem = shoppingItems[currentItemIndex];
    
    // Set background image if available
    if (currentItem.image) {
        itemCard.style.backgroundImage = `url('${currentItem.image}')`;
    } else {
        itemCard.style.backgroundImage = '';
    }
    
    // Get storage location info if available
    let locationHtml = '';
    if (currentItem.storageLocation) {
        const location = storageLocations.find(loc => loc.id === currentItem.storageLocation);
        if (location) {
            locationHtml = `<p class="item-location">📍 ${location.name}</p>`;
        }
    }
    
    itemCard.querySelector('.card-content').innerHTML = `
        <h2 id="item-name">${currentItem.name}</h2>
        <p class="item-details">In stock: <span class="quantity">${currentItem.quantity}</span></p>
        <p class="item-details">Need to buy: <span class="to-buy">${Math.max(0, currentItem.minRequired - currentItem.quantity)}</span></p>
        <p class="item-category ${currentItem.category}">${currentItem.category}</p>
        ${currentItem.shop ? `<p class="item-shop">Shop: ${currentItem.shop}</p>` : ''}
        ${locationHtml}
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
    
    // Add storage location dropdown if not already present
    const storageLocationGroup = document.querySelector('#edit-storage-location-group');
    if (!storageLocationGroup) {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        formGroup.id = 'edit-storage-location-group';
        formGroup.innerHTML = `
            <label for="edit-storage-location">Storage Location:</label>
            <select id="edit-storage-location">
                <option value="">-- Select Location --</option>
                ${storageLocations.map(loc => 
                    `<option value="${loc.id}" ${currentItem.storageLocation === loc.id ? 'selected' : ''}>${loc.name}</option>`
                ).join('')}
            </select>
        `;
        
        // Insert before the category dropdown
        const categoryGroup = document.querySelector('#edit-category').closest('.form-group');
        categoryGroup.parentNode.insertBefore(formGroup, categoryGroup);
    } else {
        // Update existing dropdown
        const dropdown = document.querySelector('#edit-storage-location');
        dropdown.innerHTML = `
            <option value="">-- Select Location --</option>
            ${storageLocations.map(loc => 
                `<option value="${loc.id}" ${currentItem.storageLocation === loc.id ? 'selected' : ''}>${loc.name}</option>`
            ).join('')}
        `;
    }
    
    // Set product image if available
    if (currentItem.image) {
        editProductImage.src = currentItem.image;
    } else {
        editProductImage.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 24 24' fill='none' stroke='%23cccccc' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
    }
    
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
    
    // Reset product image
    newProductImage.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 24 24' fill='none' stroke='%23cccccc' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
    
    // Add storage location dropdown if not already present
    const storageLocationGroup = document.querySelector('#new-storage-location-group');
    if (!storageLocationGroup) {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        formGroup.id = 'new-storage-location-group';
        formGroup.innerHTML = `
            <label for="new-storage-location">Storage Location:</label>
            <select id="new-storage-location">
                <option value="">-- Select Location --</option>
                ${storageLocations.map(loc => 
                    `<option value="${loc.id}">${loc.name}</option>`
                ).join('')}
            </select>
        `;
        
        // Insert before the category dropdown
        const categoryGroup = document.querySelector('#new-category').closest('.form-group');
        categoryGroup.parentNode.insertBefore(formGroup, categoryGroup);
    } else {
        // Update existing dropdown
        const dropdown = document.querySelector('#new-storage-location');
        dropdown.innerHTML = `
            <option value="">-- Select Location --</option>
            ${storageLocations.map(loc => 
                `<option value="${loc.id}">${loc.name}</option>`
            ).join('')}
        `;
    }
    
    // Show the modal
    addModal.style.display = 'block';
}

// Close all modals
function closeModals() {
    detailModal.style.display = 'none';
    addModal.style.display = 'none';
    menuModal.style.display = 'none';
    featureRequestModal.style.display = 'none';
    storageLocationModal.style.display = 'none';
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
    
    // Save storage location if available
    const storageLocationSelect = document.getElementById('edit-storage-location');
    if (storageLocationSelect) {
        currentItem.storageLocation = storageLocationSelect.value || null;
    }
    
    // Save image if it has been changed from the placeholder
    if (editProductImage.src && !editProductImage.src.includes('svg')) {
        currentItem.image = editProductImage.src;
    }
    
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
        category: newCategoryInput.value,
        image: null,
        storageLocation: null
    };
    
    // Save storage location if available
    const storageLocationSelect = document.getElementById('new-storage-location');
    if (storageLocationSelect) {
        newItem.storageLocation = storageLocationSelect.value || null;
    }
    
    // Save image if one was added
    if (newProductImage.src && !newProductImage.src.includes('svg')) {
        newItem.image = newProductImage.src;
    }
    
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

// Camera and Barcode Functions

// Handle file selection for images
function handleImageUpload(fileInput, imgElement) {
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imgElement.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// Trigger file input when camera button is clicked
function triggerImageUpload(fileInput) {
    fileInput.click();
}

// Scan barcode (in a real app, this would use a barcode scanning library)
function scanBarcode(inputElement) {
    // Alert for now since we can't use actual barcode scanning in this demo
    alert('This would launch a barcode scanner in a real app. For now, please enter the barcode manually.');
    
    // In a real implementation, this would use a library like QuaggaJS or the Web Barcode Detection API
    // Here's a placeholder for demonstration purposes
    setTimeout(() => {
        inputElement.value = 'DEMO-' + Math.floor(Math.random() * 1000000);
    }, 1000);
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

// Export list option in menu
exportListBtn.addEventListener('click', () => {
    exportList();
    closeModals();
});

// Update quantity to purchase on input change
editQuantityInput.addEventListener('input', updateQuantityToPurchase);
editMinRequiredInput.addEventListener('input', updateQuantityToPurchase);

// Camera and image upload for edit form
editCameraButton.addEventListener('click', () => triggerImageUpload(editImageUpload));
editImageUpload.addEventListener('change', () => handleImageUpload(editImageUpload, editProductImage));

// Camera and image upload for add form
newCameraButton.addEventListener('click', () => triggerImageUpload(newImageUpload));
newImageUpload.addEventListener('change', () => handleImageUpload(newImageUpload, newProductImage));

// Barcode scanning
editScanBarcodeBtn.addEventListener('click', () => scanBarcode(editBarcodeInput));
newScanBarcodeBtn.addEventListener('click', () => scanBarcode(newBarcodeInput));

// Menu button
menuButton.addEventListener('click', openMenuModal);

// Menu options
featureRequestBtn.addEventListener('click', openFeatureRequestModal);
storageLocationBtn.addEventListener('click', openStorageLocationModal);

// Feature request form submission
featureRequestForm.addEventListener('submit', handleFeatureRequest);

// Storage location form submission
storageLocationForm.addEventListener('submit', addStorageLocation);

// File system access buttons
document.getElementById('select-folder-button').addEventListener('click', selectFolder);
document.getElementById('export-to-folder-button').addEventListener('click', exportToFolder);

// Menu Functions

// Open menu modal
function openMenuModal() {
    menuModal.style.display = 'block';
}

// Handle feature request submission
function handleFeatureRequest(e) {
    e.preventDefault();
    const description = document.getElementById('feature-description').value;
    const email = document.getElementById('feature-email').value;
    
    // In a real app, this would send the data to a server
    alert(`Thank you for your feature request! We'll review it soon.\n\nYour request: ${description}\nContact: ${email}`);
    
    // Close modal and reset form
    document.getElementById('feature-description').value = '';
    closeModals();
}

// Open feature request modal
function openFeatureRequestModal() {
    closeModals();
    featureRequestModal.style.display = 'block';
}

// Open storage location modal
function openStorageLocationModal() {
    closeModals();
    updateStorageLocationsList();
    storageLocationModal.style.display = 'block';
    
    // Check if File System Access API is supported
    if ('showDirectoryPicker' in window) {
        document.getElementById('file-system-access-container').style.display = 'block';
        document.getElementById('file-system-not-supported').style.display = 'none';
        
        // Update export button state
        const exportButton = document.getElementById('export-to-folder-button');
        exportButton.disabled = !selectedDirectory;
        
        // Show selected folder info if available
        const folderInfo = document.getElementById('selected-folder-info');
        const folderPath = document.getElementById('folder-path');
        
        if (selectedDirectory) {
            folderInfo.style.display = 'block';
            folderPath.textContent = selectedDirectory.name;
        } else {
            folderInfo.style.display = 'none';
        }
    } else {
        document.getElementById('file-system-access-container').style.display = 'none';
        document.getElementById('file-system-not-supported').style.display = 'block';
    }
}

// Add new storage location
function addStorageLocation(e) {
    e.preventDefault();
    
    const name = document.getElementById('storage-name').value;
    const address = document.getElementById('storage-address').value;
    const notes = document.getElementById('storage-notes').value;
    
    const newLocation = {
        id: Date.now().toString(),
        name,
        address,
        notes
    };
    
    storageLocations.push(newLocation);
    saveStorageLocations();
    updateStorageLocationsList();
    
    // Reset form
    storageLocationForm.reset();
}

// Delete a storage location
function deleteStorageLocation(id) {
    // Remove the location from the list
    storageLocations = storageLocations.filter(location => location.id !== id);
    
    // Update items that use this location
    shoppingItems.forEach(item => {
        if (item.storageLocation === id) {
            item.storageLocation = null;
        }
    });
    
    saveStorageLocations();
    saveItems();
    updateStorageLocationsList();
    updateCardDisplay();
}

// Update the storage locations list in the UI
function updateStorageLocationsList() {
    storageLocationsContainer.innerHTML = '';
    
    if (storageLocations.length === 0) {
        storageLocationsContainer.innerHTML = '<p>No storage locations added yet.</p>';
        return;
    }
    
    storageLocations.forEach(location => {
        const locationElement = document.createElement('div');
        locationElement.className = 'storage-location-item';
        locationElement.innerHTML = `
            <div class="storage-location-name">${location.name}</div>
            ${location.address ? `<div class="storage-location-address">${location.address}</div>` : ''}
            ${location.notes ? `<div class="storage-location-notes">${location.notes}</div>` : ''}
            <button class="delete-location" data-id="${location.id}">×</button>
        `;
        
        storageLocationsContainer.appendChild(locationElement);
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-location').forEach(button => {
        button.addEventListener('click', () => {
            const id = button.getAttribute('data-id');
            deleteStorageLocation(id);
        });
    });
}

// File System Access API Functions

// Select a folder for storage
async function selectFolder() {
    try {
        // Open directory picker
        const directoryHandle = await window.showDirectoryPicker({
            id: 'shoppingListStorage',
            mode: 'readwrite',
            startIn: 'documents'
        });
        
        // Save the selected directory
        selectedDirectory = directoryHandle;
        
        // Update UI
        const folderInfo = document.getElementById('selected-folder-info');
        const folderPath = document.getElementById('folder-path');
        folderInfo.style.display = 'block';
        folderPath.textContent = directoryHandle.name;
        
        // Enable export button
        document.getElementById('export-to-folder-button').disabled = false;
        
    } catch (error) {
        // User canceled or error occurred
        console.error('Error selecting folder:', error);
    }
}

// Export shopping list to the selected folder
async function exportToFolder() {
    if (!selectedDirectory) {
        alert('Please select a folder first');
        return;
    }
    
    try {
        // Create metadata file with item list
        const metadataFile = await createMetadataFile();
        
        // Export images for each item that has an image
        const imagesExported = await exportItemImages();
        
        alert(`Shopping list successfully exported!\n${metadataFile ? 'Metadata file created.' : ''}\n${imagesExported} images exported.`);
        
    } catch (error) {
        console.error('Error exporting to folder:', error);
        alert('Failed to export shopping list: ' + error.message);
    }
}

// Create a metadata JSON file with all shopping items
async function createMetadataFile() {
    if (!selectedDirectory) return false;
    
    try {
        // Create a file handle
        const fileHandle = await selectedDirectory.getFileHandle('shopping_list_data.json', { create: true });
        
        // Create a writable stream
        const writable = await fileHandle.createWritable();
        
        // Prepare data to write - clean image data for storage efficiency
        const exportData = {
            items: shoppingItems.map(item => {
                // Create a clean copy without the full image data
                const cleanItem = { ...item };
                if (cleanItem.image) {
                    // Just note that image exists but don't include the full data
                    cleanItem.image = `${cleanItem.name.replace(/\s+/g, '_').toLowerCase()}.jpg`;
                }
                return cleanItem;
            }),
            locations: storageLocations,
            exportDate: new Date().toISOString()
        };
        
        // Write the data
        await writable.write(JSON.stringify(exportData, null, 2));
        await writable.close();
        
        return true;
    } catch (error) {
        console.error('Error creating metadata file:', error);
        return false;
    }
}

// Export images for all items that have images
async function exportItemImages() {
    if (!selectedDirectory) return 0;
    
    let exportCount = 0;
    
    // Create images subfolder
    let imagesFolder;
    try {
        imagesFolder = await selectedDirectory.getDirectoryHandle('images', { create: true });
    } catch (error) {
        console.error('Error creating images folder:', error);
        return 0;
    }
    
    // Process each item with an image
    for (const item of shoppingItems) {
        if (!item.image || item.image.includes('svg')) continue;
        
        try {
            // Convert base64 image to blob
            const response = await fetch(item.image);
            const blob = await response.blob();
            
            // Create a file name based on the item name
            const fileName = `${item.name.replace(/\s+/g, '_').toLowerCase()}.jpg`;
            
            // Create a file in the images folder
            const fileHandle = await imagesFolder.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            
            // Write the image data
            await writable.write(blob);
            await writable.close();
            
            exportCount++;
        } catch (error) {
            console.error(`Error exporting image for ${item.name}:`, error);
        }
    }
    
    return exportCount;
}

// Close modal when clicking outside of it
window.addEventListener('click', (e) => {
    if (e.target === detailModal || 
        e.target === addModal || 
        e.target === menuModal ||
        e.target === featureRequestModal ||
        e.target === storageLocationModal) {
        closeModals();
    }
});

// Hide address bar on mobile devices
function hideAddressBar() {
    if (document.documentElement.scrollHeight > window.outerHeight) {
        setTimeout(function() {
            window.scrollTo(0, 1);
        }, 0);
    }
}

// Initialize the app
loadItems();

// Hide address bar when page loads and when orientation changes
window.addEventListener('load', hideAddressBar);
window.addEventListener('orientationchange', hideAddressBar);
window.addEventListener('resize', hideAddressBar);

// Additional event to ensure address bar is hidden after a short delay
setTimeout(hideAddressBar, 100);