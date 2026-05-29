// Global variables for data
let categories = [];
let products = [];

// Other global variables
let cart = [];
let orders = [];
let currentUser = {
    name: '',
    email: '',
    phone: '',
    address: ''
};
let recentlyViewed = [];
let currentOrderStep = 1;
let filteredProducts = [];

// Load data from JSON file
async function loadData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error('Failed to load data');
        }
        const data = await response.json();
        categories = data.categories;
        products = data.products;
        
        // Initialize the app after data is loaded
        initializeApp();
    } catch (error) {
        console.error('Error loading data:', error);
        // You might want to show an error message to the user
        document.body.innerHTML = '<div style="text-align: center; margin-top: 50px;"><h2>Error loading data. Please refresh the page.</h2></div>';
    }
}

// Initialize the app
function initializeApp() {
    loadUserData();
    loadCartData();
    loadOrdersData();
    loadRecentlyViewed();
    renderCategories();
    showPage('home');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadData();
});

// Page navigation
function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.add('hidden'));
    
    const targetPage = document.getElementById(pageId + 'Page');
    if (targetPage) {
        targetPage.classList.remove('hidden');
    }

    // Load page-specific content
    switch(pageId) {
        case 'home':
            renderCategories();
            break;
        case 'cart':
            renderCart();
            break;
        case 'orders':
            renderOrders();
            break;
        case 'account':
            loadUserAccountPage();
            break;
    }
}

// Sidebar toggle
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

// Render categories
function renderCategories() {
    const categoryGrid = document.getElementById('categoryGrid');
    categoryGrid.innerHTML = '';

    categories.forEach(category => {
        const categoryCard = document.createElement('div');
        categoryCard.className = 'category-card';
        categoryCard.onclick = () => showCategory(category.id);
        
        let cardContent = `
            <img src="${category.image}" alt="${category.name}">
            <div class="category-card-content">
                <h3>${category.name}</h3>
                <p>${category.description}</p>
        `;

        if (category.isRecentlyViewed) {
            if (recentlyViewed.length === 0) {
                cardContent += '<p><em>No recently viewed products</em></p>';
            } else {
                cardContent += `<p>You have ${recentlyViewed.length} recently viewed items</p>`;
            }
        }

        cardContent += `
                <a href="#" class="category-btn">View Products</a>
            </div>
        `;

        categoryCard.innerHTML = cardContent;
        categoryGrid.appendChild(categoryCard);
    });
}

// Show category products
function showCategory(categoryId) {
    if (categoryId === 'recently-viewed') {
        filteredProducts = products.filter(product => 
            recentlyViewed.includes(product.id)
        );
        document.getElementById('categoryTitle').textContent = 'Recently Viewed Products';
    } else {
        filteredProducts = products.filter(product => 
            product.category === categoryId
        );
        const category = categories.find(cat => cat.id === categoryId);
        document.getElementById('categoryTitle').textContent = category.name;
    }
    
    populateFilters();
    renderProducts();
    showPage('category');
}

// Search products
function searchProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    if (searchTerm.trim() === '') return;

    filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.brand.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm)
    );
    
    document.getElementById('categoryTitle').textContent = `Search results for "${searchTerm}"`;
    populateFilters();
    renderProducts();
    showPage('category');
}

// Populate filters
function populateFilters() {
    const brandFilter = document.getElementById('brandFilter');
    const brands = [...new Set(filteredProducts.map(product => product.brand))];
    
    brandFilter.innerHTML = '<option value="">All Brands</option>';
    brands.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand;
        option.textContent = brand;
        brandFilter.appendChild(option);
    });
}

// Apply filters
function applyFilters() {
    const sortBy = document.getElementById('sortBy').value;
    const maxPrice = parseInt(document.getElementById('priceRange').value);
    const selectedBrand = document.getElementById('brandFilter').value;
    
    document.getElementById('priceValue').textContent = '₹' + maxPrice;
    
    let filtered = filteredProducts.filter(product => {
        if (product.price > maxPrice) return false;
        if (selectedBrand && product.brand !== selectedBrand) return false;
        return true;
    });
    
    // Sort products
    switch(sortBy) {
        case 'price-low':
            filtered.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filtered.sort((a, b) => b.price - a.price);
            break;
        case 'rating':
            filtered.sort((a, b) => b.rating - a.rating);
            break;
        default:
            // Keep original order for relevance
            break;
    }
    
    renderProducts(filtered);
}

// Render products
function renderProducts(products = filteredProducts) {
    const productGrid = document.getElementById('productGrid');
    productGrid.innerHTML = '';

    if (products.length === 0) {
        productGrid.innerHTML = '<p>No products found matching your criteria.</p>';
        return;
    }

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.onclick = () => showProduct(product.id);
        
        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <div class="product-card-content">
                <div class="product-brand">${product.brand}</div>
                <h3>${product.name}</h3>
                <div class="product-rating">
                    ${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5-Math.floor(product.rating))} 
                    ${product.rating}
                </div>
                <div class="product-price">
                    <span class="current-price">₹${product.price}</span>
                    <span class="original-price">₹${product.originalPrice}</span>
                    <span class="discount">${product.discount}% OFF</span>
                </div>
            </div>
        `;
        
        productGrid.appendChild(productCard);
    });
}

// Show product details
function showProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Add to recently viewed
    if (!recentlyViewed.includes(productId)) {
        recentlyViewed.unshift(productId);
        if (recentlyViewed.length > 10) {
            recentlyViewed.pop();
        }
        saveRecentlyViewed();
    }

    const productDetail = document.getElementById('productDetail');
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 7);
    
    productDetail.innerHTML = `
        <div>
            <img src="${product.image}" alt="${product.name}" class="product-image">
        </div>
        <div class="product-info">
            <h1>${product.name}</h1>
            <div class="brand">${product.brand}</div>
            <div class="product-rating">
                ${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5-Math.floor(product.rating))} 
                ${product.rating}/5
            </div>
            <div class="product-price">
                <span class="current-price">₹${product.price}</span>
                <span class="original-price">₹${product.originalPrice}</span>
                <span class="discount">${product.discount}% OFF</span>
            </div>
            <div class="description">${product.description}</div>
            
            <div class="product-options">
                ${product.colors.length > 0 ? `
                    <div class="option-group">
                        <label>Color:</label>
                        <select id="selectedColor">
                            ${product.colors.map(color => `<option value="${color}">${color}</option>`).join('')}
                        </select>
                    </div>
                ` : ''}
                
                ${product.sizes.length > 0 ? `
                    <div class="option-group">
                        <label>Size:</label>
                        <select id="selectedSize">
                            ${product.sizes.map(size => `<option value="${size}">${size}</option>`).join('')}
                        </select>
                    </div>
                ` : ''}
            </div>
            
            <div class="address-section">
                <h3>Delivery Address</h3>
                ${currentUser.address ? `
                    <p>${currentUser.address}</p>
                    <button class="btn-secondary" onclick="showPage('account')">Change Address</button>
                ` : `
                    <p>No address added</p>
                    <button class="btn-secondary" onclick="showPage('account')">Add Address</button>
                `}
            </div>
            
            <div class="delivery-info">
                <h4>Delivery Information</h4>
                <p>📅 Delivery by ${deliveryDate.toLocaleDateString()}</p>
                <p>↩️ 10 days return policy</p>
                <p>💰 Cash on delivery available</p>
            </div>
            
            <div class="product-actions">
                <button class="btn-primary" onclick="addToCart(${product.id})">Add to Cart</button>
                <button class="btn-secondary" onclick="buyNow(${product.id})">Buy Now</button>
            </div>
        </div>
    `;
    
    showPage('product');
}

// Add to cart
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const selectedColor = document.getElementById('selectedColor')?.value || '';
    const selectedSize = document.getElementById('selectedSize')?.value || '';
    
    const existingItem = cart.find(item => 
        item.id === productId && 
        item.color === selectedColor && 
        item.size === selectedSize
    );

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: product.name,
            brand: product.brand,
            price: product.price,
            originalPrice: product.originalPrice,
            discount: product.discount,
            image: product.image,
            color: selectedColor,
            size: selectedSize,
            quantity: 1
        });
    }
    
    updateCartCount();
    saveCartData();
    alert('Product added to cart!');
}

// Buy now
function buyNow(productId) {
    addToCart(productId);
    showPage('cart');
}

// Update cart count
function updateCartCount() {
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    document.getElementById('cartCount').textContent = cartCount;
}

// Render cart
function renderCart() {
    const cartItems = document.getElementById('cartItems');
    const cartSummary = document.getElementById('cartSummary');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p>Your cart is empty. <a href="#" onclick="showPage(\'home\')">Continue shopping</a></p>';
        cartSummary.innerHTML = '';
        return;
    }

    cartItems.innerHTML = '';
    let totalOriginal = 0;
    let totalDiscounted = 0;
    
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        const itemOriginalTotal = item.originalPrice * item.quantity;
        totalOriginal += itemOriginalTotal;
        totalDiscounted += itemTotal;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-details">
                <h3>${item.name}</h3>
                <div class="product-brand">${item.brand}</div>
                ${item.color ? `<p>Color: ${item.color}</p>` : ''}
                ${item.size ? `<p>Size: ${item.size}</p>` : ''}
                <div class="product-price">
                    <span class="current-price">₹${item.price}</span>
                    <span class="original-price">₹${item.originalPrice}</span>
                    <span class="discount">${item.discount}% OFF</span>
                </div>
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="updateQuantity(${index}, -1)">-</button>
                    <input type="number" class="quantity-input" value="${item.quantity}" min="1" 
                           onchange="updateQuantity(${index}, 0, this.value)">
                    <button class="quantity-btn" onclick="updateQuantity(${index}, 1)">+</button>
                </div>
                <p>Total: ₹${itemTotal}</p>
            </div>
            <button class="btn-secondary" onclick="removeFromCart(${index})">Remove</button>
        `;
        cartItems.appendChild(cartItem);
    });

    const deliveryCharges = totalDiscounted > 500 ? 0 : 50;
    const finalTotal = totalDiscounted + deliveryCharges;
    
    cartSummary.innerHTML = `
        <h3>Price Details</h3>
        <div class="summary-row">
            <span>Total MRP:</span>
            <span>₹${totalOriginal}</span>
        </div>
        <div class="summary-row">
            <span>Discount:</span>
            <span>-₹${totalOriginal - totalDiscounted}</span>
        </div>
        <div class="summary-row">
            <span>Delivery Charges:</span>
            <span>${deliveryCharges === 0 ? 'FREE' : '₹' + deliveryCharges}</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-row summary-total">
            <span>Total Amount:</span>
            <span>₹${finalTotal}</span>
        </div>
        <button class="btn-primary" onclick="proceedToCheckout()" style="width: 100%; margin-top: 20px;">
            Place Order
        </button>
    `;
}

// Update quantity
function updateQuantity(index, change, newValue = null) {
    if (newValue !== null) {
        cart[index].quantity = Math.max(1, parseInt(newValue) || 1);
    } else {
        cart[index].quantity = Math.max(1, cart[index].quantity + change);
    }
    
    updateCartCount();
    saveCartData();
    renderCart();
}

// Remove from cart
function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartCount();
    saveCartData();
    renderCart();
}

// Proceed to checkout
function proceedToCheckout() {
    currentOrderStep = 1;
    showPage('order');
    renderOrderSteps();
}

// Render order steps
function renderOrderSteps() {
    const orderSteps = document.getElementById('orderSteps');
    
    if (currentOrderStep === 1) {
        // Check if user details are complete
        if (!currentUser.name || !currentUser.phone || !currentUser.address) {
            orderSteps.innerHTML = `
                <div class="order-form">
                    <h2>Step 1: Enter Your Details</h2>
                    <div class="form-group">
                        <label for="orderName">Name:</label>
                        <input type="text" id="orderName" value="${currentUser.name}" placeholder="Enter your name">
                    </div>
                    <div class="form-group">
                        <label for="orderPhone">Phone Number:</label>
                        <input type="tel" id="orderPhone" value="${currentUser.phone}" placeholder="Enter your phone number">
                    </div>
                    <div class="form-group">
                        <label for="orderAddress">Address:</label>
                        <textarea id="orderAddress" placeholder="Enter your complete address">${currentUser.address}</textarea>
                    </div>
                    <button class="btn-primary" onclick="saveOrderDetails()">Continue to Summary</button>
                </div>
            `;
        } else {
            currentOrderStep = 2;
            renderOrderSteps();
        }
    } else if (currentOrderStep === 2) {
        // Order summary
        const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        const deliveryCharges = cartTotal > 500 ? 0 : 50;
        const finalTotal = cartTotal + deliveryCharges;
        
        let cartItemsHtml = '';
        cart.forEach(item => {
            cartItemsHtml += `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}">
                    <div class="cart-item-details">
                        <h3>${item.name}</h3>
                        <div class="product-brand">${item.brand}</div>
                        ${item.color ? `<p>Color: ${item.color}</p>` : ''}
                        ${item.size ? `<p>Size: ${item.size}</p>` : ''}
                        <p>Quantity: ${item.quantity}</p>
                        <p>Price: ₹${item.price * item.quantity}</p>
                    </div>
                </div>
            `;
        });
        
        orderSteps.innerHTML = `
            <div class="order-form">
                <h2>Step 2: Order Summary</h2>
                <div class="address-section">
                    <h3>Delivery Address</h3>
                    <p><strong>${currentUser.name}</strong></p>
                    <p>${currentUser.phone}</p>
                    <p>${currentUser.address}</p>
                </div>
                
                <h3>Order Items</h3>
                ${cartItemsHtml}
                
                <div class="cart-summary">
                    <div class="summary-row">
                        <span>Items Total:</span>
                        <span>₹${cartTotal}</span>
                    </div>
                    <div class="summary-row">
                        <span>Delivery Charges:</span>
                        <span>${deliveryCharges === 0 ? 'FREE' : '₹' + deliveryCharges}</span>
                    </div>
                    <div class="summary-divider"></div>
                    <div class="summary-row summary-total">
                        <span>Total Amount:</span>
                        <span>₹${finalTotal}</span>
                    </div>
                </div>
                
                <button class="btn-primary" onclick="proceedToPayment()">Proceed to Payment</button>
            </div>
        `;
    } else if (currentOrderStep === 3) {
        // Payment options
        orderSteps.innerHTML = `
            <div class="order-form">
                <h2>Step 3: Payment</h2>
                <div class="payment-options">
                    <div class="payment-option">
                        <input type="radio" id="upi" name="payment" value="upi">
                        <label for="upi">UPI Payment</label>
                    </div>
                    <div class="payment-option">
                        <input type="radio" id="card" name="payment" value="card">
                        <label for="card">Credit/Debit Card</label>
                    </div>
                    <div class="payment-option">
                        <input type="radio" id="cod" name="payment" value="cod" checked>
                        <label for="cod">Cash on Delivery</label>
                    </div>
                </div>
                <button class="btn-primary" onclick="placeOrder()">Place Order</button>
            </div>
        `;
    }
}

// Save order details
function saveOrderDetails() {
    const name = document.getElementById('orderName').value.trim();
    const phone = document.getElementById('orderPhone').value.trim();
    const address = document.getElementById('orderAddress').value.trim();
    
    if (!name || !phone || !address) {
        alert('Please fill all required fields.');
        return;
    }
    
    if (!validateName(name)) {
        alert('Please enter a valid name (2-50 characters, letters only).');
        return;
    }
    
    if (!validatePhone(phone)) {
        alert('Please enter a valid 10-digit phone number.');
        return;
    }
    
    currentUser.name = name;
    currentUser.phone = phone;
    currentUser.address = address;
    saveUserData();
    
    currentOrderStep = 2;
    renderOrderSteps();
}

// Proceed to payment
function proceedToPayment() {
    currentOrderStep = 3;
    renderOrderSteps();
}

// Place order
function placeOrder() {
    const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value;
    
    if (!paymentMethod) {
        alert('Please select a payment method.');
        return;
    }
    
    const orderId = 'ORD' + Date.now();
    const orderDate = new Date();
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 7);
    
    const order = {
        id: orderId,
        items: [...cart],
        total: cart.reduce((total, item) => total + (item.price * item.quantity), 0),
        deliveryCharges: cart.reduce((total, item) => total + (item.price * item.quantity), 0) > 500 ? 0 : 50,
        paymentMethod: paymentMethod,
        orderDate: orderDate,
        deliveryDate: deliveryDate,
        status: 'confirmed',
        address: currentUser.address,
        phone: currentUser.phone,
        name: currentUser.name
    };
    
    orders.push(order);
    saveOrdersData();
    
    // Clear cart
    cart = [];
    updateCartCount();
    saveCartData();
    
    // Show success message
    document.getElementById('orderSteps').innerHTML = `
        <div class="order-success">
            <h1>🎉 Order Placed Successfully!</h1>
            <p>Your order ID is: <strong>${orderId}</strong></p>
            <p>Expected delivery: ${deliveryDate.toLocaleDateString()}</p>
            <button class="btn-primary" onclick="showPage('orders')">View My Orders</button>
            <button class="btn-secondary" onclick="showPage('home')">Continue Shopping</button>
        </div>
    `;
}

// Render orders
function renderOrders() {
    const ordersList = document.getElementById('ordersList');
    
    if (orders.length === 0) {
        ordersList.innerHTML = '<p>No orders found. <a href="#" onclick="showPage(\'home\')">Start shopping</a></p>';
        return;
    }
    
    ordersList.innerHTML = '';
    
    // Sort orders by order date (latest first)
    const sortedOrders = [...orders].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    
    sortedOrders.forEach(order => {
        const currentDate = new Date();
        const isDelivered = currentDate > order.deliveryDate;
        
        const orderDiv = document.createElement('div');
        orderDiv.className = 'order-card';
        
        let orderItemsHtml = '';
        order.items.forEach(item => {
            orderItemsHtml += `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}">
                    <div class="cart-item-details">
                        <h3>${item.name}</h3>
                        <div class="product-brand">${item.brand}</div>
                        ${item.color ? `<p>Color: ${item.color}</p>` : ''}
                        ${item.size ? `<p>Size: ${item.size}</p>` : ''}
                        <p>Quantity: ${item.quantity}</p>
                        <p>Price: ₹${item.price * item.quantity}</p>
                    </div>
                </div>
            `;
        });
        
        orderDiv.innerHTML = `
            <div class="order-header" onclick="toggleOrderDetails('${order.id}')">
                <div class="order-summary">
                    <h3>Order ID: ${order.id}</h3>
                    <span class="status-badge ${isDelivered ? 'delivered' : 'on-way'}">
                        ${isDelivered ? 'Delivered' : 'On the way'}
                    </span>
                </div>
                <div class="order-meta">
                    <p><strong>Order Date:</strong> ${order.orderDate.toLocaleDateString()}</p>
                    <p><strong>Total:</strong> ₹${order.total + order.deliveryCharges}</p>
                    <p><strong>Items:</strong> ${order.items.length} item${order.items.length > 1 ? 's' : ''}</p>
                </div>
                <div class="dropdown-arrow">
                    <span class="arrow-icon">▼</span>
                </div>
            </div>
            
            <div class="order-details" id="details-${order.id}" style="display: none;">
                <div class="order-info">
                    <p><strong>Delivery Date:</strong> ${order.deliveryDate.toLocaleDateString()}</p>
                    <p><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}</p>
                    
                    <div class="address-section">
                        <h4>Delivery Address:</h4>
                        <p>${order.name}</p>
                        <p>${order.phone}</p>
                        <p>${order.address}</p>
                    </div>
                    
                    <h4>Order Items:</h4>
                    ${orderItemsHtml}
                    
                    <div class="cart-summary">
                        <div class="summary-row">
                            <span>Items Total:</span>
                            <span>₹${order.total}</span>
                        </div>
                        <div class="summary-row">
                            <span>Delivery Charges:</span>
                            <span>${order.deliveryCharges === 0 ? 'FREE' : '₹' + order.deliveryCharges}</span>
                        </div>
                        <div class="summary-divider"></div>
                        <div class="summary-row summary-total">
                            <span>Total Paid:</span>
                            <span>₹${order.total + order.deliveryCharges}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        ordersList.appendChild(orderDiv);
    });
}

function validateName(name) {
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    return nameRegex.test(name.trim());
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

function validatePhone(phone) {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.trim());
}

function toggleOrderDetails(orderId) {
    const detailsDiv = document.getElementById(`details-${orderId}`);
    const arrowIcon = detailsDiv.previousElementSibling.querySelector('.arrow-icon');
    
    if (detailsDiv.style.display === 'none') {
        detailsDiv.style.display = 'block';
        arrowIcon.style.transform = 'rotate(180deg)';
    } else {
        detailsDiv.style.display = 'none';
        arrowIcon.style.transform = 'rotate(0deg)';
    }
}

// Load user account page
function loadUserAccountPage() {
    document.getElementById('userName').value = currentUser.name || '';
    document.getElementById('userEmail').value = currentUser.email || '';
    document.getElementById('userPhone').value = currentUser.phone || '';
    document.getElementById('userAddress').value = currentUser.address || '';
}

// Save user info
function saveUserInfo() {
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const phone = document.getElementById('userPhone').value.trim();
    const address = document.getElementById('userAddress').value.trim();
    
    if (name && !validateName(name)) {
        alert('Please enter a valid name (2-50 characters, letters only).');
        return;
    }
    
    if (email && !validateEmail(email)) {
        alert('Please enter a valid email address.');
        return;
    }
    
    if (phone && !validatePhone(phone)) {
        alert('Please enter a valid 10-digit phone number.');
        return;
    }
    
    currentUser.name = name;
    currentUser.email = email;
    currentUser.phone = phone;
    currentUser.address = address;
    
    saveUserData();
    alert('Information saved successfully!');
}

// Local storage functions (using in-memory storage for Claude environment)
// Local storage functions
function saveUserData() {
    localStorage.setItem('userData', JSON.stringify(currentUser));
}

function loadUserData() {
    const userData = localStorage.getItem('userData');
    if (userData) {
        currentUser = JSON.parse(userData);
    }
}

function saveCartData() {
    localStorage.setItem('cartData', JSON.stringify(cart));
}

function loadCartData() {
    const cartData = localStorage.getItem('cartData');
    if (cartData) {
        cart = JSON.parse(cartData);
        updateCartCount();
    }
}

function saveOrdersData() {
    localStorage.setItem('ordersData', JSON.stringify(orders));
}

function loadOrdersData() {
    const ordersData = localStorage.getItem('ordersData');
    if (ordersData) {
        orders = JSON.parse(ordersData);
    }
}

function saveRecentlyViewed() {
    localStorage.setItem('recentlyViewedData', JSON.stringify(recentlyViewed));
}

function loadRecentlyViewed() {
    const recentlyViewedData = localStorage.getItem('recentlyViewedData');
    if (recentlyViewedData) {
        recentlyViewed = JSON.parse(recentlyViewedData);
    }
}