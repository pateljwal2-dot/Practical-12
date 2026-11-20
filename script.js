
// API URL
const API = "/api";

// Store products
let products = [];

// Get HTML elements
const productForm = document.getElementById("productForm");
const productTable = document.getElementById("productTable");
const saleForm = document.getElementById("saleForm");
const salesTable = document.getElementById("salesTable");

// Show error or success message
function showMessage(message) {
    alert(message);
}

// API request function
async function apiRequest(url, options = {}) {

    try {

        const response = await fetch(url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...options.headers
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Request failed");
        }

        return data;

    } catch (error) {

        showMessage(error.message);
        throw error;

    }
}

// Load all products
async function loadProducts() {

    try {

        products = await apiRequest(`${API}/products`);

        displayProducts(products);

        updateDashboard();

        updateSaleOptions();

    } catch (error) {

        console.error(error);

    }
}

// Display products in table
function displayProducts(data) {

    productTable.innerHTML = "";

    if (data.length === 0) {

        productTable.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    No products available
                </td>
            </tr>
        `;

        return;
    }

    data.forEach(product => {

        const row = document.createElement("tr");

        const values = [
            product.name,
            product.category,
            "₹" + product.price,
            product.quantity
        ];

        values.forEach(value => {

            const cell = document.createElement("td");

            cell.textContent = value;

            row.appendChild(cell);

        });

        const statusCell = document.createElement("td");

        statusCell.textContent =
            product.quantity <= 5 ? "Low Stock" : "Available";

        statusCell.className =
            product.quantity <= 5 ? "text-danger fw-bold" :
            "text-success fw-bold";

        row.appendChild(statusCell);

        const actionCell = document.createElement("td");

        const editButton = document.createElement("button");

        editButton.textContent = "Edit";
        editButton.className = "btn btn-warning btn-sm me-2";

        editButton.addEventListener("click", () => {
            editProduct(product._id);
        });

        const deleteButton = document.createElement("button");

        deleteButton.textContent = "Delete";
        deleteButton.className = "btn btn-danger btn-sm";

        deleteButton.addEventListener("click", () => {
            deleteProduct(product._id);
        });

        actionCell.append(editButton, deleteButton);

        row.appendChild(actionCell);

        productTable.appendChild(row);

    });

}

// Update dashboard statistics
function updateDashboard() {

    const totalProducts = products.length;

    const totalStock = products.reduce(
        (sum, product) => sum + product.quantity, 0
    );

    const lowStock = products.filter(
        product => product.quantity <= 5
    ).length;

    document.getElementById("totalProducts").textContent =
        totalProducts;

    document.getElementById("totalStock").textContent =
        totalStock;

    document.getElementById("lowStock").textContent =
        lowStock;

}

// Add or update product
productForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    const id = document.getElementById("productId").value;

    const product = {

        name: document.getElementById("name").value.trim(),

        category: document.getElementById("category").value.trim(),

        price: Number(document.getElementById("price").value),

        quantity: Number(document.getElementById("quantity").value),

        description: document.getElementById("description").value.trim()

    };

    if (
        !product.name ||
        !product.category ||
        !Number.isFinite(product.price) ||
        product.price < 0 ||
        !Number.isInteger(product.quantity) ||
        product.quantity < 0
    ) {

        showMessage("Please enter valid product details");

        return;
    }

    try {

        if (id) {

            await apiRequest(`${API}/products/${id}`, {

                method: "PUT",

                body: JSON.stringify(product)

            });

            showMessage("Product updated successfully");

        } else {

            await apiRequest(`${API}/products`, {

                method: "POST",

                body: JSON.stringify(product)

            });

            showMessage("Product added successfully");

        }

        resetForm();

        await loadProducts();

    } catch (error) {

        console.error(error);

    }

});

// Edit product
function editProduct(id) {

    const product = products.find(item => item._id === id);

    if (!product) return;

    document.getElementById("productId").value = product._id;

    document.getElementById("name").value = product.name;

    document.getElementById("category").value = product.category;

    document.getElementById("price").value = product.price;

    document.getElementById("quantity").value = product.quantity;

    document.getElementById("description").value =
        product.description || "";

    document.getElementById("formTitle").textContent =
        "Update Product";

    document.getElementById("submitButton").textContent =
        "Update Product";

    document.getElementById("cancelButton").hidden = false;

    window.scrollTo({ top: 0, behavior: "smooth" });

}

// Delete product
async function deleteProduct(id) {

    if (!confirm("Are you sure you want to delete this product?")) {
        return;
    }

    try {

        await apiRequest(`${API}/products/${id}`, {
            method: "DELETE"
        });

        showMessage("Product deleted successfully");

        await loadProducts();

    } catch (error) {

        console.error(error);

    }

}

// Reset product form
function resetForm() {

    productForm.reset();

    document.getElementById("productId").value = "";

    document.getElementById("formTitle").textContent =
        "Add New Product";

    document.getElementById("submitButton").textContent =
        "Add Product";

    document.getElementById("cancelButton").hidden = true;

}

// Cancel edit
document.getElementById("cancelButton").addEventListener(
    "click", resetForm
);

// Search products
document.getElementById("searchInput").addEventListener(
    "input", function() {

        const search = this.value.toLowerCase();

        const filtered = products.filter(product =>

            product.name.toLowerCase().includes(search) ||

            product.category.toLowerCase().includes(search)

        );

        displayProducts(filtered);

    }
);

// Update sale product dropdown
function updateSaleOptions() {

    const select = document.getElementById("saleProduct");

    select.innerHTML = "";

    const defaultOption = document.createElement("option");

    defaultOption.value = "";
    defaultOption.textContent = "Select a product";

    select.appendChild(defaultOption);

    products.forEach(product => {

        if (product.quantity > 0) {

            const option = document.createElement("option");

            option.value = product._id;

            option.textContent =
                product.name + " (Stock: " + product.quantity + ")";

            select.appendChild(option);

        }

    });

}

// Record a sale
saleForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    const productId =
        document.getElementById("saleProduct").value;

    const quantity =
        Number(document.getElementById("saleQuantity").value);

    if (!productId || !Number.isInteger(quantity) || quantity < 1) {

        showMessage("Please enter valid sale details");

        return;

    }

    try {

        const result = await apiRequest(`${API}/sales`, {

            method: "POST",

            body: JSON.stringify({
                productId,
                quantity
            })

        });

        showMessage(result.message);

        saleForm.reset();

        await loadProducts();

        await loadSales();

    } catch (error) {

        console.error(error);

    }

});

// Load sales history
async function loadSales() {

    try {

        const sales = await apiRequest(`${API}/sales`);

        salesTable.innerHTML = "";

        if (sales.length === 0) {

            salesTable.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">
                        No sales recorded
                    </td>
                </tr>
            `;

            return;

        }

        sales.forEach(sale => {

            const row = document.createElement("tr");

            const values = [

                sale.productName,

                sale.quantity,

                "₹" + sale.totalPrice,

                new Date(sale.saleDate).toLocaleDateString()

            ];

            values.forEach(value => {

                const cell = document.createElement("td");

                cell.textContent = value;

                row.appendChild(cell);

            });

            salesTable.appendChild(row);

        });

    } catch (error) {

        console.error(error);

    }

}

// Start application
loadProducts();
loadSales();
