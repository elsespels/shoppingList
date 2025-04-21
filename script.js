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
const instructionsModal = document.getElementById('instructions-modal');
const detailForm = document.getElementById('detail-form');
const addForm = document.getElementById('add-form');
const featureRequestForm = document.getElementById('feature-request-form');
const exportListBtn = document.getElementById('export-list-btn');
const quantityToPurchaseElement = document.getElementById('quantity-to-purchase');
const featureRequestBtn = document.getElementById('feature-request-btn');
const instructionsBtn = document.getElementById('instructions-btn');

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

// IndexedDB configuration
const DB_NAME = 'shoppingListDB';
const DB_VERSION = 1;
const ITEMS_STORE = 'items';
const LOCATIONS_STORE = 'locations';
let db = null;
let isIndexedDBSupported = true;

// Generate a UUID for items
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Initialize and open IndexedDB
function initDatabase() {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            console.warn('IndexedDB is not supported by this browser. Falling back to localStorage.');
            isIndexedDBSupported = false;
            resolve(false);
            return;
        }

        // Request persistent storage (will be silently ignored on iOS if not supported)
        if (navigator.storage && navigator.storage.persist) {
            navigator.storage.persist().then(isPersisted => {
                console.log(`Persistent storage status: ${isPersisted ? 'granted' : 'denied'}`);
            }).catch(err => {
                console.warn('Error requesting persistent storage:', err);
            });
        }

        // Log storage usage information
        if (navigator.storage && navigator.storage.estimate) {
            navigator.storage.estimate().then(estimate => {
                console.log(`Storage usage: ${(estimate.usage / 1024 / 1024).toFixed(2)}MB out of ${(estimate.quota / 1024 / 1024).toFixed(2)}MB`);
            });
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('IndexedDB error:', event.target.error);
            isIndexedDBSupported = false;
            resolve(false);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;
            
            // Create items object store with UUID as key
            if (!database.objectStoreNames.contains(ITEMS_STORE)) {
                const itemsStore = database.createObjectStore(ITEMS_STORE, { keyPath: 'id' });
                itemsStore.createIndex('name', 'name', { unique: false });
            }
            
            // Create locations object store with UUID as key
            if (!database.objectStoreNames.contains(LOCATIONS_STORE)) {
                const locationsStore = database.createObjectStore(LOCATIONS_STORE, { keyPath: 'id' });
                locationsStore.createIndex('name', 'name', { unique: false });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('IndexedDB connected successfully');
            resolve(true);
        };
    });
}

// Get all items from IndexedDB
function getItemsFromDB() {
    return new Promise((resolve, reject) => {
        if (!isIndexedDBSupported || !db) {
            resolve(null);
            return;
        }

        const transaction = db.transaction(ITEMS_STORE, 'readonly');
        const store = transaction.objectStore(ITEMS_STORE);
        const request = store.getAll();

        request.onsuccess = () => {
            console.log(`Retrieved ${request.result.length} items from IndexedDB`);
            resolve(request.result);
        };

        request.onerror = (event) => {
            console.error('Error getting items from IndexedDB:', event.target.error);
            reject(event.target.error);
        };
    });
}

// Get all storage locations from IndexedDB
function getLocationsFromDB() {
    return new Promise((resolve, reject) => {
        if (!isIndexedDBSupported || !db) {
            resolve(null);
            return;
        }

        const transaction = db.transaction(LOCATIONS_STORE, 'readonly');
        const store = transaction.objectStore(LOCATIONS_STORE);
        const request = store.getAll();

        request.onsuccess = () => {
            console.log(`Retrieved ${request.result.length} locations from IndexedDB`);
            resolve(request.result);
        };

        request.onerror = (event) => {
            console.error('Error getting locations from IndexedDB:', event.target.error);
            reject(event.target.error);
        };
    });
}

// Save an item to IndexedDB
function saveItemToDB(item) {
    return new Promise((resolve, reject) => {
        if (!isIndexedDBSupported || !db) {
            resolve(false);
            return;
        }

        // Ensure the item has an ID
        if (!item.id) {
            item.id = generateUUID();
        }

        const transaction = db.transaction(ITEMS_STORE, 'readwrite');
        const store = transaction.objectStore(ITEMS_STORE);
        const request = store.put(item);

        request.onsuccess = () => {
            console.log(`Item "${item.name}" saved to IndexedDB with ID: ${item.id}`);
            resolve(true);
        };

        request.onerror = (event) => {
            console.error('Error saving item to IndexedDB:', event.target.error);
            reject(event.target.error);
        };
    });
}

// Save a storage location to IndexedDB
function saveLocationToDB(location) {
    return new Promise((resolve, reject) => {
        if (!isIndexedDBSupported || !db) {
            resolve(false);
            return;
        }

        // Ensure the location has an ID
        if (!location.id) {
            location.id = generateUUID();
        }

        const transaction = db.transaction(LOCATIONS_STORE, 'readwrite');
        const store = transaction.objectStore(LOCATIONS_STORE);
        const request = store.put(location);

        request.onsuccess = () => {
            console.log(`Location "${location.name}" saved to IndexedDB with ID: ${location.id}`);
            resolve(true);
        };

        request.onerror = (event) => {
            console.error('Error saving location to IndexedDB:', event.target.error);
            reject(event.target.error);
        };
    });
}

// Delete an item from IndexedDB
function deleteItemFromDB(itemId) {
    return new Promise((resolve, reject) => {
        if (!isIndexedDBSupported || !db) {
            resolve(false);
            return;
        }

        const transaction = db.transaction(ITEMS_STORE, 'readwrite');
        const store = transaction.objectStore(ITEMS_STORE);
        const request = store.delete(itemId);

        request.onsuccess = () => {
            console.log(`Item with ID ${itemId} deleted from IndexedDB`);
            resolve(true);
        };

        request.onerror = (event) => {
            console.error('Error deleting item from IndexedDB:', event.target.error);
            reject(event.target.error);
        };
    });
}

// Delete a location from IndexedDB
function deleteLocationFromDB(locationId) {
    return new Promise((resolve, reject) => {
        if (!isIndexedDBSupported || !db) {
            resolve(false);
            return;
        }

        const transaction = db.transaction(LOCATIONS_STORE, 'readwrite');
        const store = transaction.objectStore(LOCATIONS_STORE);
        const request = store.delete(locationId);

        request.onsuccess = () => {
            console.log(`Location with ID ${locationId} deleted from IndexedDB`);
            resolve(true);
        };

        request.onerror = (event) => {
            console.error('Error deleting location from IndexedDB:', event.target.error);
            reject(event.target.error);
        };
    });
}

// Load data (now uses IndexedDB with localStorage fallback)
async function loadItems() {
    try {
        // Initialize IndexedDB
        await initDatabase();
        
        // Try to load items from IndexedDB first
        if (isIndexedDBSupported && db) {
            const dbItems = await getItemsFromDB();
            const dbLocations = await getLocationsFromDB();
            
            if (dbItems && dbItems.length > 0) {
                shoppingItems = dbItems;
            } else {
                // No items in IndexedDB, try localStorage
                await loadFromLocalStorage();
                
                // If we got items from localStorage, save them to IndexedDB for next time
                if (shoppingItems.length > 0 && isIndexedDBSupported) {
                    for (const item of shoppingItems) {
                        if (!item.id) item.id = generateUUID();
                        await saveItemToDB(item);
                    }
                }
            }
            
            if (dbLocations && dbLocations.length > 0) {
                storageLocations = dbLocations;
            } else {
                // No locations in IndexedDB, try localStorage
                const storedLocations = localStorage.getItem('storageLocations');
                if (storedLocations) {
                    storageLocations = JSON.parse(storedLocations);
                    
                    // Save to IndexedDB for next time
                    if (isIndexedDBSupported) {
                        for (const location of storageLocations) {
                            if (!location.id) location.id = generateUUID();
                            await saveLocationToDB(location);
                        }
                    }
                }
            }
        } else {
            // IndexedDB not supported, use localStorage
            await loadFromLocalStorage();
        }
    } catch (error) {
        console.error('Error loading items:', error);
        // Fallback to localStorage on any error
        await loadFromLocalStorage();
    }
    
    updateCardDisplay();
    updateStorageLocationsList();
}

// Fallback to load from localStorage
async function loadFromLocalStorage() {
    // Load shopping items
    const storedItems = localStorage.getItem('shoppingItems');
    if (storedItems) {
        shoppingItems = JSON.parse(storedItems);
        // Ensure all items have IDs
        shoppingItems.forEach(item => {
            if (!item.id) item.id = generateUUID();
        });
    } else {
        // Add sample items for first-time users
        shoppingItems = [
            {
                id: generateUUID(),
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
                id: generateUUID(),
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
                id: generateUUID(),
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
                id: generateUUID(),
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
        // Ensure all locations have IDs
        storageLocations.forEach(location => {
            if (!location.id) location.id = generateUUID();
        });
    }
}

// Save data (now uses IndexedDB with localStorage fallback)
async function saveItems() {
    try {
        // Always update localStorage as a backup
        localStorage.setItem('shoppingItems', JSON.stringify(shoppingItems));
        
        // If IndexedDB is supported, save there too
        if (isIndexedDBSupported && db) {
            for (const item of shoppingItems) {
                if (!item.id) item.id = generateUUID();
                await saveItemToDB(item);
            }
        }
    } catch (error) {
        console.error('Error saving items:', error);
        // At least ensure localStorage is updated
        localStorage.setItem('shoppingItems', JSON.stringify(shoppingItems));
    }
}

// Save storage locations (now uses IndexedDB with localStorage fallback)
async function saveStorageLocations() {
    try {
        // Always update localStorage as a backup
        localStorage.setItem('storageLocations', JSON.stringify(storageLocations));
        
        // If IndexedDB is supported, save there too
        if (isIndexedDBSupported && db) {
            for (const location of storageLocations) {
                if (!location.id) location.id = generateUUID();
                await saveLocationToDB(location);
            }
        }
    } catch (error) {
        console.error('Error saving storage locations:', error);
        // At least ensure localStorage is updated
        localStorage.setItem('storageLocations', JSON.stringify(storageLocations));
    }
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
        // Clear any existing background and set new one
        itemCard.style.backgroundImage = `url('${currentItem.image}')`;
        itemCard.style.backgroundSize = 'cover';
        itemCard.style.backgroundPosition = 'center';
        itemCard.style.backgroundRepeat = 'no-repeat';
        
        // Make the card content area more transparent to let image show through
        const cardContent = itemCard.querySelector('.card-content');
        cardContent.style.background = 'rgba(255, 255, 255, 0.5)'; // More transparent
        cardContent.style.backdropFilter = 'blur(3px)';
        cardContent.style.color = '#000'; // Ensure text is dark for readability
        
        // Add a subtle text shadow for better readability against varied backgrounds
        const headings = cardContent.querySelectorAll('h2, p');
        headings.forEach(heading => {
            heading.style.textShadow = '0 0 5px rgba(255, 255, 255, 0.7)';
        });
    } else {
        // Reset styles if no image
        itemCard.style.backgroundImage = '';
        const cardContent = itemCard.querySelector('.card-content');
        cardContent.style.background = 'rgba(255, 255, 255, 0.85)';
        
        // Remove text shadows when no background image
        const headings = cardContent.querySelectorAll('h2, p');
        headings.forEach(heading => {
            heading.style.textShadow = 'none';
        });
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
        <div class="item-details quantity-control">
            <span>In stock:</span>
            <div class="quantity-buttons">
                <button class="quantity-btn minus-btn" data-action="decrease">-</button>
                <span class="quantity">${currentItem.quantity}</span>
                <button class="quantity-btn plus-btn" data-action="increase">+</button>
            </div>
        </div>
        <p class="item-details">Need to buy: <span class="to-buy">${Math.max(0, currentItem.minRequired - currentItem.quantity)}</span></p>
        <p class="item-category ${currentItem.category}">${currentItem.category}</p>
        ${currentItem.shop ? `<p class="item-shop">Shop: ${currentItem.shop}</p>` : ''}
        ${locationHtml}
    `;
    
    // Add event listeners to the quantity buttons
    const minusBtn = itemCard.querySelector('.minus-btn');
    const plusBtn = itemCard.querySelector('.plus-btn');
    
    minusBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering card swipe
        updateQuantityFromCard('decrease');
    });
    
    plusBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering card swipe
        updateQuantityFromCard('increase');
    });
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
    instructionsModal.style.display = 'none';
}

// Update the quantity to purchase display
function updateQuantityToPurchase() {
    const quantity = parseInt(editQuantityInput.value) || 0;
    const minRequired = parseInt(editMinRequiredInput.value) || 0;
    const toPurchase = Math.max(0, minRequired - quantity);
    quantityToPurchaseElement.textContent = toPurchase;
}

// Update item quantity directly from the card
async function updateQuantityFromCard(action) {
    if (shoppingItems.length === 0) return;
    
    const currentItem = shoppingItems[currentItemIndex];
    
    // Update quantity based on button clicked
    if (action === 'decrease') {
        // Don't allow negative quantities
        if (currentItem.quantity > 0) {
            currentItem.quantity--;
        }
    } else if (action === 'increase') {
        currentItem.quantity++;
    }
    
    // Save changes to IndexedDB
    if (isIndexedDBSupported && db) {
        try {
            await saveItemToDB(currentItem);
        } catch (error) {
            console.error('Error saving quantity change to IndexedDB:', error);
        }
    }
    
    // Update localStorage as backup
    await saveItems();
    
    // Update the display
    updateCardDisplay();
}

// Save the edited item
async function saveEditedItem(e) {
    // If called from a form submit event, prevent default
    if (e && e.preventDefault) {
        e.preventDefault();
    }
    
    if (shoppingItems.length === 0) return;
    
    const currentItem = shoppingItems[currentItemIndex];
    
    // Ensure the item has an ID
    if (!currentItem.id) {
        currentItem.id = generateUUID();
    }
    
    // Update item properties
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
    
    // Save to IndexedDB if supported
    if (isIndexedDBSupported && db) {
        try {
            await saveItemToDB(currentItem);
        } catch (error) {
            console.error('Error saving edited item to IndexedDB:', error);
        }
    }
    
    // Update localStorage as backup
    await saveItems();
    updateCardDisplay();
    
    // Only close modals if this wasn't an autosave during image upload
    if (e) {
        closeModals();
    }
}

// Delete the current item
async function deleteItem() {
    if (shoppingItems.length === 0) return;
    
    const itemToDelete = shoppingItems[currentItemIndex];
    const itemId = itemToDelete.id;
    
    // Remove from array
    shoppingItems.splice(currentItemIndex, 1);
    if (currentItemIndex >= shoppingItems.length) {
        currentItemIndex = Math.max(0, shoppingItems.length - 1);
    }
    
    // Delete from IndexedDB if supported
    if (isIndexedDBSupported && db && itemId) {
        try {
            await deleteItemFromDB(itemId);
        } catch (error) {
            console.error('Error deleting item from IndexedDB:', error);
        }
    }
    
    // Update localStorage as backup
    await saveItems();
    updateCardDisplay();
    closeModals();
}

// Add a new item
async function addNewItem(e) {
    e.preventDefault();
    
    const newItem = {
        id: generateUUID(),
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
    
    // Save to IndexedDB if supported
    if (isIndexedDBSupported && db) {
        try {
            await saveItemToDB(newItem);
        } catch (error) {
            console.error('Error saving new item to IndexedDB:', error);
        }
    }
    
    // Update localStorage as backup
    await saveItems();
    updateCardDisplay();
    closeModals();
}

// Export the shopping list to clipboard as a formatted text file
function exportList() {
    if (shoppingItems.length === 0) {
        alert('Nothing to export');
        return;
    }
    
    // First, group items by shop
    const itemsByShop = {};
    
    // Add "Unknown Shop" category for items without a shop
    itemsByShop['Unknown Shop'] = [];
    
    // Group all items by shop
    shoppingItems.forEach(item => {
        // Calculate quantity to buy
        const quantityToBuy = Math.max(0, item.minRequired - item.quantity);
        
        // Skip items that don't need to be purchased
        if (quantityToBuy <= 0) return;
        
        const shopName = item.shop || 'Unknown Shop';
        
        if (!itemsByShop[shopName]) {
            itemsByShop[shopName] = [];
        }
        
        itemsByShop[shopName].push({
            name: item.name,
            quantity: quantityToBuy
        });
    });
    
    // Create formatted text
    let formattedText = 'SHOPPING LIST\n\n';
    
    // Add each shop's items
    for (const shop in itemsByShop) {
        // Skip shops with no items
        if (itemsByShop[shop].length === 0) continue;
        
        formattedText += `== ${shop} ==\n`;
        
        // Add each item
        itemsByShop[shop].forEach(item => {
            formattedText += `${item.name}: ${item.quantity}\n`;
        });
        
        formattedText += '\n';
    }
    
    // Copy to clipboard
    navigator.clipboard.writeText(formattedText)
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
    // Check if we're clicking on a quantity button - ignore drag if so
    if (e.target.closest && e.target.closest('.quantity-btn')) {
        return;
    }
    
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
        reader.onload = async function(e) {
            // Set the image source
            imgElement.src = e.target.result;
            
            // If we're in the edit form, immediately update the current item
            if (imgElement === editProductImage && shoppingItems.length > 0) {
                const currentItem = shoppingItems[currentItemIndex];
                
                // Update the image in the item object
                currentItem.image = e.target.result;
                
                // Autosave the item to IndexedDB
                if (isIndexedDBSupported && db) {
                    try {
                        await saveItemToDB(currentItem);
                        console.log('Image autosaved to IndexedDB');
                    } catch (error) {
                        console.error('Error autosaving image to IndexedDB:', error);
                    }
                }
                
                // Update localStorage as backup
                await saveItems();
                
                // Refresh the card display to show the new background
                updateCardDisplay();
            }
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
itemCard.addEventListener('mousedown', (e) => {
    // Ignore long press for quantity buttons
    if (e.target.closest && e.target.closest('.quantity-btn')) {
        return;
    }
    longPressTimer = setTimeout(openDetailModal, 800);
});
itemCard.addEventListener('touchstart', (e) => {
    // Ignore long press for quantity buttons
    if (e.target.closest && e.target.closest('.quantity-btn')) {
        return;
    }
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
// Note: We've changed the detail form to use a button instead of form submission
detailForm.addEventListener('submit', function(e) {
    // Prevent default form submission
    e.preventDefault();
    // Still save the data, even though we now have autosave
    saveEditedItem();
});
addForm.addEventListener('submit', addNewItem);

// Exit button
document.querySelector('.exit-button').addEventListener('click', function() {
    // Autosave current changes
    saveEditedItem();
    // Close the modal
    closeModals();
});

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
newImageUpload.addEventListener('change', () => {
    handleImageUpload(newImageUpload, newProductImage);
    // Don't update card here - wait until the item is actually added
});

// Barcode scanning
editScanBarcodeBtn.addEventListener('click', () => scanBarcode(editBarcodeInput));
newScanBarcodeBtn.addEventListener('click', () => scanBarcode(newBarcodeInput));

// Menu button
menuButton.addEventListener('click', openMenuModal);

// Menu options
featureRequestBtn.addEventListener('click', openFeatureRequestModal);
instructionsBtn.addEventListener('click', openInstructionsModal);

// Feature request form submission
featureRequestForm.addEventListener('submit', handleFeatureRequest);

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

// Open instructions modal
function openInstructionsModal() {
    closeModals();
    instructionsModal.style.display = 'block';
}

// Add new storage location
async function addStorageLocation(e) {
    e.preventDefault();
    
    const name = document.getElementById('storage-name').value;
    const address = document.getElementById('storage-address').value;
    const notes = document.getElementById('storage-notes').value;
    
    const newLocation = {
        id: generateUUID(),
        name,
        address,
        notes
    };
    
    // Add to array
    storageLocations.push(newLocation);
    
    // Save to IndexedDB if supported
    if (isIndexedDBSupported && db) {
        try {
            await saveLocationToDB(newLocation);
        } catch (error) {
            console.error('Error saving location to IndexedDB:', error);
        }
    }
    
    // Update localStorage as backup
    await saveStorageLocations();
    updateStorageLocationsList();
    
    // No form to reset now
}

// Delete a storage location
async function deleteStorageLocation(id) {
    // Remove the location from the list
    storageLocations = storageLocations.filter(location => location.id !== id);
    
    // Update items that use this location
    let itemsToUpdate = [];
    shoppingItems.forEach(item => {
        if (item.storageLocation === id) {
            item.storageLocation = null;
            itemsToUpdate.push(item);
        }
    });
    
    // Delete from IndexedDB if supported
    if (isIndexedDBSupported && db) {
        try {
            await deleteLocationFromDB(id);
            
            // Update all affected items in IndexedDB
            for (const item of itemsToUpdate) {
                await saveItemToDB(item);
            }
        } catch (error) {
            console.error('Error deleting location from IndexedDB:', error);
        }
    }
    
    // Update localStorage as backup
    await saveStorageLocations();
    await saveItems();
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

// File System Access API and Alternative Functions

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

// Download data as a JSON file (alternative for Safari)
function downloadAsJson() {
    // Prepare data to download
    const exportData = {
        items: shoppingItems.map(item => {
            // Create a clean copy without the full image data for smaller file size
            const cleanItem = { ...item };
            if (cleanItem.image) {
                // Store that an image exists but don't include image data in JSON
                cleanItem.hasImage = true;
                cleanItem.image = null;
            }
            return cleanItem;
        }),
        locations: storageLocations,
        exportDate: new Date().toISOString()
    };
    
    // Convert to JSON string
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // Create blob from JSON
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shopping_list_data.json';
    
    // Trigger download
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
}

// Download all images as a ZIP file (alternative for Safari)
async function downloadImages() {
    // Check if there are any images to download
    const itemsWithImages = shoppingItems.filter(item => item.image && !item.image.includes('svg'));
    
    if (itemsWithImages.length === 0) {
        alert('No images to download.');
        return;
    }
    
    try {
        // Load JSZip library dynamically
        if (typeof JSZip === 'undefined') {
            await loadJSZip();
        }
        
        // Create a new ZIP file
        const zip = new JSZip();
        const imgFolder = zip.folder("images");
        
        // Add each image to the ZIP
        for (const item of itemsWithImages) {
            // Extract base64 data from data URL
            const base64Data = item.image.split(',')[1];
            
            // Create a safe filename
            const fileName = `${item.name.replace(/\s+/g, '_').toLowerCase()}.jpg`;
            
            // Add file to ZIP
            imgFolder.file(fileName, base64Data, {base64: true});
        }
        
        // Generate ZIP file
        const content = await zip.generateAsync({type: 'blob'});
        
        // Create download link
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'shopping_list_images.zip';
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
        
    } catch (error) {
        console.error('Error creating ZIP file:', error);
        alert('Failed to download images: ' + error.message);
    }
}

// Load JSZip library dynamically
function loadJSZip() {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (typeof JSZip !== 'undefined') {
            resolve();
            return;
        }
        
        // Create script element
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.integrity = 'sha512-XMVd28F1oH/O71fzwBnV7HucLxVwtxf26XV8P4wPk26EDxuGZ91N8bsOttmnomcCD3CS5ZMRL50H0GgOHvegtg==';
        script.crossOrigin = 'anonymous';
        
        // Handle load and error events
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load JSZip library'));
        
        // Add to document
        document.head.appendChild(script);
    });
}

// Import data from JSON file
function importFromJson(file) {
    const reader = new FileReader();
    
    reader.onload = function(event) {
        try {
            // Parse the JSON data
            const importedData = JSON.parse(event.target.result);
            
            // Validate the data structure
            if (!importedData.items || !Array.isArray(importedData.items)) {
                throw new Error('Invalid JSON structure: missing items array');
            }
            
            // If locations are included, import them
            if (importedData.locations && Array.isArray(importedData.locations)) {
                // Merge with existing locations, avoiding duplicates by ID
                const existingIds = new Set(storageLocations.map(loc => loc.id));
                const newLocations = importedData.locations.filter(loc => !existingIds.has(loc.id));
                
                if (newLocations.length > 0) {
                    storageLocations = [...storageLocations, ...newLocations];
                    saveStorageLocations();
                }
            }
            
            // Import items (without overwriting existing items with same name)
            const existingNames = new Set(shoppingItems.map(item => item.name.toLowerCase()));
            const newItems = importedData.items.filter(item => !existingNames.has(item.name.toLowerCase()));
            
            if (newItems.length > 0) {
                shoppingItems = [...shoppingItems, ...newItems];
                saveItems();
                updateCardDisplay();
            }
            
            alert(`Import successful!\nAdded ${newItems.length} new items.`);
            
        } catch (error) {
            console.error('Error importing JSON:', error);
            alert('Failed to import: ' + error.message);
        }
    };
    
    reader.readAsText(file);
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
        e.target === instructionsModal) {
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

// Sync all data to ensure it's properly saved
async function syncData() {
    console.log('Syncing data...');
    try {
        // Save to IndexedDB and localStorage
        await saveItems();
        await saveStorageLocations();
        
        // Notify service worker about the sync (useful for background syncing)
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'SYNC_DATA'
            });
        }
        console.log('Data sync complete');
    } catch (error) {
        console.error('Error syncing data:', error);
    }
}

// Add event listeners to save data when app is closing or being backgrounded
window.addEventListener('beforeunload', async function() {
    // Save all data before the app closes
    await syncData();
});

// Also save when the page is hidden (user switches apps or tabs)
document.addEventListener('visibilitychange', async function() {
    if (document.visibilityState === 'hidden') {
        // When app is sent to background, save all data
        await syncData();
    }
});

// Auto-save data every 30 seconds to prevent data loss
setInterval(syncData, 30000);

// Initialize the app
loadItems();

// Hide address bar when page loads and when orientation changes
window.addEventListener('load', hideAddressBar);
window.addEventListener('orientationchange', hideAddressBar);
window.addEventListener('resize', hideAddressBar);

// Additional event to ensure address bar is hidden after a short delay
setTimeout(hideAddressBar, 100);