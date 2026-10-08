# NovaCart

NovaCart is a full-stack MERN e-commerce web application with a modern customer storefront and a separate administration dashboard.

The project provides a complete online shopping workflow including product browsing, cart management, wishlist management, checkout, order tracking, customer profile management, product administration, inventory control, order processing, customer management, and sales analytics.

---

# 1. Project Overview

NovaCart is designed as a professional college-level e-commerce project using the MERN stack.

The application contains two primary modules:

1. Customer Module
2. Admin Module

Customers can browse products, create accounts, manage carts and wishlists, place orders, track orders, manage addresses, and view their order history.

Administrators can manage products, images, inventory, customers, orders, payments, cancellations, and business reports.

---

# 2. Main Features

## Customer Features

- Customer registration
- Customer login/logout
- JWT authentication
- HTTP-only authentication cookie support
- Bearer token authentication support
- Customer profile management
- Password change
- Multiple saved delivery addresses
- Default delivery address
- Product browsing
- Product search
- Category filtering
- Brand filtering
- Price filtering
- Product sorting
- Featured products
- New arrivals
- Best sellers
- Product details
- Related products
- Shopping cart
- Cart quantity management
- Wishlist
- Move wishlist product to cart
- Checkout
- Cash on Delivery
- Demo UPI payment
- Demo Card payment
- Order placement
- Order history
- Order details
- Order tracking
- Customer order cancellation
- Automatic stock restoration after cancellation

## Admin Features

- Secure admin authentication
- Admin dashboard
- Product management
- Add product
- Edit product
- Activate/deactivate product
- Delete product
- Cloudinary image uploads
- Multiple product images
- Product image deletion
- Inventory management
- Low-stock monitoring
- Customer management
- Activate/deactivate customers
- View customer spending
- View customer recent orders
- Order management
- Order status management
- Payment status management
- Admin order cancellation
- Automatic inventory restoration
- Revenue reports
- Order-status reports
- Daily sales reports
- Top-product reports
- Low-stock reports
- Top-customer reports

---

# 3. Technology Stack

## Frontend

- React.js
- Vite
- React Router DOM
- Axios
- React Icons
- HTML5
- CSS3
- JavaScript

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose

## Authentication

- JSON Web Token
- bcryptjs
- HTTP-only cookies
- Bearer token support

## Image Management

- Cloudinary
- Multer
- multer-storage-cloudinary

## Database

- MongoDB Atlas

## Deployment

Planned production deployment:

- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas
- Product Images: Cloudinary

---

# 4. Project Structure

```text
NovaCart/
│
├── client/
│   │
│   ├── public/
│   │   ├── favicon.svg
│   │   └── images/
│   │
│   ├── src/
│   │   │
│   │   ├── assets/
│   │   │   └── images/
│   │   │
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Hero.jsx
│   │   │   ├── ProductCard.jsx
│   │   │   ├── Loader.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── AdminRoute.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── ProductDetails.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── Checkout.jsx
│   │   │   ├── Wishlist.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── MyOrders.jsx
│   │   │   ├── OrderDetails.jsx
│   │   │   ├── About.jsx
│   │   │   ├── Contact.jsx
│   │   │   └── NotFound.jsx
│   │   │
│   │   ├── admin/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminProducts.jsx
│   │   │   ├── AdminProductForm.jsx
│   │   │   ├── AdminOrders.jsx
│   │   │   ├── AdminUsers.jsx
│   │   │   └── AdminReports.jsx
│   │   │
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   ├── CartContext.jsx
│   │   │   └── WishlistContext.jsx
│   │   │
│   │   ├── api/
│   │   │   └── api.js
│   │   │
│   │   ├── styles/
│   │   │   ├── global.css
│   │   │   ├── components.css
│   │   │   ├── pages.css
│   │   │   └── admin.css
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json
│
├── server/
│   │
│   ├── config/
│   │   ├── db.js
│   │   └── cloudinary.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Cart.js
│   │   ├── Wishlist.js
│   │   └── Order.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── productController.js
│   │   ├── cartController.js
│   │   ├── wishlistController.js
│   │   ├── orderController.js
│   │   └── adminController.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── productRoutes.js
│   │   ├── cartRoutes.js
│   │   ├── wishlistRoutes.js
│   │   ├── orderRoutes.js
│   │   └── adminRoutes.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── adminMiddleware.js
│   │   └── uploadMiddleware.js
│   │
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── server.js
│
├── .gitignore
└── README.md
```

---

# 5. Requirements

Install the following software before running NovaCart:

- Node.js 20 or newer
- npm
- Git
- MongoDB Atlas account
- Cloudinary account

Recommended development tools:

- Visual Studio Code
- MongoDB Compass
- Postman
- Chrome

---

# 6. Environment Configuration

NovaCart uses separate environment files for frontend and backend.

Do not commit real `.env` files to GitHub.

---

## Client Environment

Create:

```text
client/.env
```

Example:

```env
VITE_API_URL=http://localhost:5000/api
```

Production example:

```env
VITE_API_URL=https://your-render-backend.onrender.com/api
```

A safe template is already available at:

```text
client/.env.example
```

---

## Server Environment

Create:

```text
server/.env
```

Example:

```env
NODE_ENV=development
PORT=5000

MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/novacart?retryWrites=true&w=majority

JWT_SECRET=replace_with_a_long_random_secure_secret
JWT_EXPIRES_IN=7d

CLIENT_URL=http://localhost:5173
VERCEL_CLIENT_URL=https://your-novacart-frontend.vercel.app

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

ADMIN_NAME=NovaCart Admin
ADMIN_EMAIL=admin@novacart.com
ADMIN_PASSWORD=replace_with_a_strong_admin_password
```

A template is available at:

```text
server/.env.example
```

---

# 7. Installation

Clone or download the NovaCart project.

Open a terminal inside the project.

---

## Install Backend Dependencies

```bash
cd server
npm install
```

---

## Install Frontend Dependencies

Open another terminal:

```bash
cd client
npm install
```

---

# 8. Run NovaCart Locally

## Start Backend

Inside:

```text
NovaCart/server
```

run:

```bash
npm run dev
```

Backend URL:

```text
http://localhost:5000
```

API base URL:

```text
http://localhost:5000/api
```

Health endpoint:

```text
http://localhost:5000/api/health
```

---

## Start Frontend

Inside:

```text
NovaCart/client
```

run:

```bash
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

---

# 9. Backend Scripts

Inside the `server` directory:

```bash
npm run dev
```

Starts backend using Nodemon.

```bash
npm start
```

Starts backend using Node.js.

```bash
npm run check
```

Runs a basic Node syntax check on `server.js`.

---

# 10. Frontend Scripts

Inside the `client` directory:

```bash
npm run dev
```

Starts the Vite development server.

```bash
npm run build
```

Creates the production build:

```text
client/dist/
```

```bash
npm run preview
```

Runs the production build locally.

---

# 11. Authentication API

Base path:

```text
/api/auth
```

## Register

```http
POST /api/auth/register
```

## Login

```http
POST /api/auth/login
```

## Logout

```http
POST /api/auth/logout
```

## Current User

```http
GET /api/auth/me
```

Authentication required.

---

# 12. User API

Base path:

```text
/api/users
```

All user routes require authentication.

## Profile

```http
GET /api/users/profile
```

```http
PUT /api/users/profile
```

## Change Password

```http
PUT /api/users/change-password
```

## Saved Addresses

```http
GET /api/users/addresses
```

```http
POST /api/users/addresses
```

```http
PUT /api/users/addresses/:addressId
```

```http
DELETE /api/users/addresses/:addressId
```

```http
PATCH /api/users/addresses/:addressId/default
```

---

# 13. Product API

Base path:

```text
/api/products
```

Product browsing routes are public.

## Product Listing

```http
GET /api/products
```

Supported query parameters include:

```text
page
limit
search
category
subCategory
brand
minPrice
maxPrice
featured
inStock
sort
```

Example:

```text
/api/products?category=Electronics&brand=Samsung&inStock=true
```

## Featured Products

```http
GET /api/products/featured
```

## New Arrivals

```http
GET /api/products/new-arrivals
```

## Best Sellers

```http
GET /api/products/best-sellers
```

## Categories

```http
GET /api/products/categories
```

## Brands

```http
GET /api/products/brands
```

## Products by Category

```http
GET /api/products/category/:category
```

## Related Products

```http
GET /api/products/:identifier/related
```

## Product Details

```http
GET /api/products/:identifier
```

`identifier` can be:

- MongoDB product ID
- Product slug

---

# 14. Cart API

Base path:

```text
/api/cart
```

All cart routes require authentication.

## Get Cart

```http
GET /api/cart
```

## Cart Summary

```http
GET /api/cart/summary
```

## Add Product

```http
POST /api/cart
```

Example body:

```json
{
  "productId": "PRODUCT_ID",
  "quantity": 1
}
```

## Set Exact Quantity

```http
PUT /api/cart/:productId
```

Example:

```json
{
  "quantity": 3
}
```

## Increment Quantity

```http
PATCH /api/cart/:productId/increment
```

## Decrement Quantity

```http
PATCH /api/cart/:productId/decrement
```

## Remove Product

```http
DELETE /api/cart/:productId
```

## Clear Cart

```http
DELETE /api/cart
```

The backend automatically synchronizes cart products with:

- Current stock
- Current product price
- Current product status
- Deleted products

---

# 15. Wishlist API

Base path:

```text
/api/wishlist
```

All wishlist routes require authentication.

## Get Wishlist

```http
GET /api/wishlist
```

## Check Wishlist Product

```http
GET /api/wishlist/check/:productId
```

## Add Product

```http
POST /api/wishlist
```

Body:

```json
{
  "productId": "PRODUCT_ID"
}
```

## Toggle Wishlist Product

```http
PATCH /api/wishlist/:productId/toggle
```

## Move Product to Cart

```http
POST /api/wishlist/:productId/move-to-cart
```

Optional body:

```json
{
  "quantity": 1
}
```

## Remove Product

```http
DELETE /api/wishlist/:productId
```

## Clear Wishlist

```http
DELETE /api/wishlist
```

---

# 16. Customer Order API

Base path:

```text
/api/orders
```

All customer order routes require authentication.

## Place Order

```http
POST /api/orders
```

Checkout can use either a saved address or a manual shipping address.

### Saved Address Example

```json
{
  "savedAddressId": "ADDRESS_ID",
  "paymentMethod": "cod",
  "customerNote": "Call before delivery."
}
```

### Manual Address Example

```json
{
  "shippingAddress": {
    "fullName": "Customer Name",
    "phone": "9876543210",
    "addressLine1": "House No. 10",
    "addressLine2": "Near Main Road",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postalCode": "400001",
    "country": "India"
  },
  "paymentMethod": "upi",
  "customerNote": ""
}
```

Supported payment methods:

```text
cod
upi
card
```

UPI and Card payments are demo payment methods for this project.

---

## My Orders

```http
GET /api/orders
```

Supported query parameters:

```text
page
limit
status
```

Example:

```text
/api/orders?status=delivered&page=1&limit=10
```

---

## Order Tracking

```http
GET /api/orders/:identifier/tracking
```

---

## Cancel Order

```http
PATCH /api/orders/:identifier/cancel
```

Example:

```json
{
  "reason": "Changed my mind."
}
```

Customers can cancel orders only while their status is:

```text
placed
confirmed
processing
```

Once an order reaches shipping, customer cancellation is disabled.

---

## Order Details

```http
GET /api/orders/:identifier
```

Customer order `identifier` can be:

- MongoDB Order ID
- NovaCart Order Number

Example:

```text
/api/orders/NOVA-20261008-123456
```

---

# 17. Admin API

Base path:

```text
/api/admin
```

All admin APIs require:

1. Valid authentication
2. Admin role

---

# 18. Admin Dashboard

```http
GET /api/admin/dashboard
```

Returns information including:

- Total customers
- Active customers
- Inactive customers
- Total products
- Active products
- Inactive products
- Low-stock products
- Total orders
- Pending orders
- Revenue
- Recent orders
- Recent customers

---

# 19. Admin Product Management

## Product Listing

```http
GET /api/admin/products
```

Supported filters include:

```text
page
limit
search
category
status
featured
stock
sort
```

Status:

```text
active
inactive
```

Stock:

```text
low
out
```

Supported sorting includes:

```text
newest
oldest
price_high
price_low
stock_high
stock_low
sold_high
```

---

## Create Product

```http
POST /api/admin/products
```

Request format:

```text
multipart/form-data
```

Image field:

```text
images
```

Maximum images:

```text
6
```

---

## Get Product

```http
GET /api/admin/products/:productId
```

## Update Product

```http
PUT /api/admin/products/:productId
```

Optional:

```text
replaceImages=true
```

with newly uploaded images.

---

## Change Product Status

```http
PATCH /api/admin/products/:productId/status
```

Example:

```json
{
  "isActive": false
}
```

---

## Update Product Stock

```http
PATCH /api/admin/products/:productId/stock
```

Example:

```json
{
  "stock": 25,
  "lowStockThreshold": 5
}
```

---

## Delete Product Image

```http
DELETE /api/admin/products/:productId/images/:publicId
```

Cloudinary `publicId` must be URL encoded.

---

## Delete Product

```http
DELETE /api/admin/products/:productId
```

Old order history remains safe because NovaCart stores product information inside each order as an order-item snapshot.

---

# 20. Admin Customer Management

## Get Customers

```http
GET /api/admin/users
```

Supported:

```text
page
limit
search
status
sort
```

Status:

```text
active
inactive
```

Sorting supported by the backend:

```text
newest
oldest
name_asc
name_desc
```

Only customer accounts with:

```text
role = user
```

are returned.

---

## Customer Details

```http
GET /api/admin/users/:userId
```

Returns:

- Customer information
- Recent orders
- Total completed/non-cancelled orders
- Total spending

---

## Activate/Deactivate Customer

```http
PATCH /api/admin/users/:userId/status
```

Example:

```json
{
  "isActive": false
}
```

---

# 21. Admin Order Management

## Get Orders

```http
GET /api/admin/orders
```

Supported query parameters:

```text
page
limit
status
paymentStatus
paymentMethod
search
sort
```

Example:

```text
/api/admin/orders?status=processing&paymentMethod=upi&sort=amount_high
```

Supported payment methods:

```text
cod
upi
card
```

Supported payment statuses:

```text
pending
paid
failed
refunded
```

Supported order sorting:

```text
newest
oldest
amount_high
amount_low
```

Admin search can match:

- Order number
- Customer name
- Customer email
- Customer phone
- Shipping name
- Shipping phone
- Product name
- Product SKU

---

## Admin Order Details

```http
GET /api/admin/orders/:orderId
```

Important:

Admin order endpoints use the MongoDB order `_id`.

---

## Update Order Status

```http
PATCH /api/admin/orders/:orderId/status
```

Example:

```json
{
  "status": "shipped",
  "message": "Order shipped successfully."
}
```

Valid statuses:

```text
placed
confirmed
processing
shipped
out_for_delivery
delivered
cancelled
```

However, cancellation must use the dedicated admin cancellation endpoint.

---

## Update Payment Status

```http
PATCH /api/admin/orders/:orderId/payment
```

Example:

```json
{
  "status": "paid",
  "transactionId": "TXN123456"
}
```

---

## Cancel Order as Admin

```http
POST /api/admin/orders/:orderId/cancel
```

Example:

```json
{
  "reason": "Product unavailable."
}
```

Admin cancellation automatically restores inventory.

If an online demo payment was already marked paid, it can be marked refunded.

---

# 22. Admin Reports

## Sales Overview

```http
GET /api/admin/reports/overview
```

Example:

```text
/api/admin/reports/overview?days=30
```

The backend accepts report periods up to:

```text
365 days
```

The overview contains:

- Total revenue
- Total orders
- Average order value
- Order-status counts
- Daily revenue
- Daily order counts
- Top products
- Product revenue
- Product quantity sold
- Average sold unit price
- Current low-stock products

Cancelled orders are excluded from revenue calculations.

Order-status reporting still includes cancelled orders so the admin can see complete operational status distribution.

---

## Customer Report

```http
GET /api/admin/reports/customers
```

Returns the top customers based on all-time non-cancelled order spending.

The report includes:

- Customer ID
- Name
- Email
- Phone
- Total orders
- Total spending
- Last order date

---

# 23. Order Status Flow

Typical order flow:

```text
placed
   ↓
confirmed
   ↓
processing
   ↓
shipped
   ↓
out_for_delivery
   ↓
delivered
```

Cancellation is a separate terminal state:

```text
cancelled
```

Customer cancellation is allowed only before shipping.

Admin cancellation is also prevented after delivery.

---

# 24. Payment Status

NovaCart uses:

```text
pending
paid
failed
refunded
```

Payment methods:

```text
cod
upi
card
```

For this college project:

- COD begins as pending
- UPI is simulated
- Card is simulated
- No real banking credentials are collected

---

# 25. Inventory Handling

NovaCart maintains product stock automatically.

When an order is placed:

```text
Product stock decreases
soldCount increases
```

When an eligible order is cancelled:

```text
Product stock increases
soldCount decreases
```

Cart data is also synchronized with current product stock and price.

---

# 26. Product Images

Product images are uploaded to Cloudinary.

Supported workflow:

```text
React Admin Product Form
        ↓
multipart/form-data
        ↓
Multer
        ↓
multer-storage-cloudinary
        ↓
Cloudinary
        ↓
Image URL saved in MongoDB
```

Maximum images per upload:

```text
6
```

The frontend accepts:

```text
JPG
JPEG
PNG
WEBP
```

---

# 27. Security

NovaCart contains basic security measures including:

- Password hashing with bcryptjs
- JWT authentication
- HTTP-only cookie support
- Admin route protection
- Customer route protection
- Role-based authorization
- CORS restrictions
- Basic security response headers
- Server-side product/stock validation
- Server-side order ownership validation
- MongoDB transactions for important order operations
- Environment-variable based secrets

Never commit:

```text
.env
```

files to GitHub.

---

# 28. CORS

Local frontend:

```text
http://localhost:5173
```

Production frontend is configured using:

```env
VERCEL_CLIENT_URL=https://your-frontend.vercel.app
```

The backend supports credentials for authentication cookies.

---

# 29. API Health Check

Root:

```http
GET /
```

Example response:

```json
{
  "success": true,
  "message": "NovaCart API is running.",
  "environment": "development"
}
```

Database health:

```http
GET /api/health
```

Successful response indicates:

```text
database = connected
```

---

# 30. Vercel Frontend Deployment

Frontend deployment directory:

```text
client
```

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```

Production environment variable:

```env
VITE_API_URL=https://your-render-backend.onrender.com/api
```

The included:

```text
client/vercel.json
```

rewrites frontend routes to `index.html`, allowing React Router routes such as:

```text
/admin/orders
/my-orders
/orders/:identifier
/products/:identifier
```

to work correctly when opened directly.

---

# 31. Render Backend Deployment

Backend root directory:

```text
server
```

Build command:

```bash
npm install
```

Start command:

```bash
npm start
```

Required Render environment variables:

```text
NODE_ENV
MONGODB_URI
JWT_SECRET
JWT_EXPIRES_IN
CLIENT_URL
VERCEL_CLIENT_URL
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
ADMIN_NAME
ADMIN_EMAIL
ADMIN_PASSWORD
```

Render automatically provides:

```text
PORT
```

---

# 32. MongoDB Atlas Setup

MongoDB Atlas is used for production data.

Recommended database name:

```text
novacart
```

Example connection format:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/novacart?retryWrites=true&w=majority
```

Replace:

```text
USERNAME
PASSWORD
CLUSTER
```

with real MongoDB Atlas credentials.

---

# 33. Cloudinary Setup

Create a Cloudinary account and obtain:

```text
Cloud Name
API Key
API Secret
```

Add them to:

```text
server/.env
```

Example:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Never expose the API secret in the React frontend.

---

# 34. Initial Administrator

The backend can automatically create the initial administrator account using:

```env
ADMIN_NAME=NovaCart Admin
ADMIN_EMAIL=admin@novacart.com
ADMIN_PASSWORD=your_secure_password
```

The administrator account should use:

```text
role = admin
```

Use a strong password in production.

---

# 35. Local Development URLs

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:5000
```

API:

```text
http://localhost:5000/api
```

Health:

```text
http://localhost:5000/api/health
```

---

# 36. Recommended Testing Flow

After environment setup, test the project in this order:

```text
1. MongoDB connection
2. Cloudinary connection
3. Backend startup
4. Frontend startup
5. Customer registration
6. Customer login
7. Product browsing
8. Cart
9. Wishlist
10. Checkout
11. Order placement
12. Order history
13. Order tracking
14. Customer cancellation
15. Admin login
16. Admin dashboard
17. Add product
18. Edit product
19. Upload product images
20. Product status
21. Inventory update
22. Customer management
23. Order management
24. Payment update
25. Admin cancellation
26. Reports
27. Full integration testing
```

---

# 37. Important Route Differences

## Customer Order Identifier

Customer order routes support:

```text
MongoDB _id
OR
NovaCart orderNumber
```

Example:

```http
GET /api/orders/NOVA-20261008-123456
```

---

## Admin Order Identifier

Admin order routes use:

```text
MongoDB _id
```

Example:

```http
GET /api/admin/orders/68e7xxxxxxxxxxxx
```

---

## Customer Cancellation

```http
PATCH /api/orders/:identifier/cancel
```

---

## Admin Cancellation

```http
POST /api/admin/orders/:orderId/cancel
```

These routes intentionally use different HTTP methods and identifiers.

---

# 38. Development Status

Source-code compatibility work completed:

```text
Admin Orders                    Complete
Admin Dashboard                 Complete
Admin Reports                   Complete
Admin Customers                 Complete
Admin Products                  Complete
Admin Product Form              Complete
Authentication Context          Complete
Cart Context                    Complete
Wishlist Context                Complete
Checkout                        Complete
My Orders                       Complete
Order Details                   Complete
Vite Configuration              Complete
Vercel Configuration            Complete
Git Ignore Files                Complete
Environment Templates           Complete
Server Package Configuration    Complete
Client Package Configuration    Complete
Admin Filters                   Complete
Backend Report Improvements     Complete
README                          Complete
```

External setup and complete runtime testing should be performed after the final compatibility pass.

---

# 39. Planned Final Setup

After the source-code compatibility pass:

```text
MongoDB Atlas Setup
        ↓
Cloudinary Setup
        ↓
Create Real .env Files
        ↓
npm install
        ↓
Backend Test
        ↓
Frontend Test
        ↓
Customer Module Test
        ↓
Admin Module Test
        ↓
Full Integration Test
        ↓
GitHub
        ↓
Render
        ↓
Vercel
        ↓
Production Testing
```

---

# 40. Project Name

```text
NovaCart
```

Full description:

```text
NovaCart - MERN E-Commerce Management and Online Shopping System
```