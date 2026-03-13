# Isomorphic_Shop API Server

A Node.js/Express.js REST API with MongoDB for the Isomorphic_Shop e-commerce application. Features user authentication with JWT, email verification via SendGrid, image uploads with Cloudinary, and role-based access control.


## Table of Contents
1. [Authentication Flow](#authentication-flow)
2. [Project Structure](#project-structure)
3. [Environment Variables](#environment-variables)
4. [Routes & API Endpoints](#api-endpoints)
5. [Database Models](#database-models)
6. [Contributing](#contributing)
7. [License](#license)
8. [Contact](#contact)


## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js v5
- **Database:** MongoDB (Mongoose ODM)
- **Authentication:** JWT (Access + Refresh tokens)
- **Email:** Nodemailer + SendGrid
- **File Storage:** Cloudinary
- **Security:** Helmet, bcrypt, CORS

## Prerequisites

- Node.js (v18+)
- MongoDB instance (local or Atlas)
- SendGrid API key
- Cloudinary account

## Getting Started

### Clone the Repository

```bash
git clone https://github.com/SatyamKumar-code/Isomorphic_Shop.git
cd Isomorphic_Shop
```

### Install Dependencies

```bash
cd Server
npm install
```

## Environment Variables

Create a `.env` file in the `Server` directory:

```env
PORT=8000

# MongoDB
MONGODB_URI=your_mongodb_connection_string

# JWT Secrets
SECRET_KEY_ACCESS_TOKEN=your_access_token_secret
SECRET_KEY_REFRESH_TOKEN=your_refresh_token_secret

# SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key

# Cloudinary
cloudinary_Config_Cloud_Name=your_cloud_name
cloudinary_Config_api_key=your_api_key
cloudinary_Config_api_secret=your_api_secret

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Frontend
FRONTEND_URL=http://localhost:3000
```

## Running the Server

```bash
npm start
```

## Authentication Flow

1. **Register** — User signs up with name, email, and password. A 6-digit OTP is sent via email.
2. **Verify Email** — User submits the OTP (valid for 10 minutes) to verify their email.
3. **Login** — Returns access token (5h) and refresh token (7d) as httpOnly cookies.
4. **Auto Refresh** — The user middleware automatically refreshes expired access tokens using the refresh token.

## Project Structure

```
Server/
├── server.js                # Entry point - Express app 
├── config/
│   ├── connectDB.js         # MongoDB connection
│   ├── emailService.js      # SendGrid email transport with retry logic
│   ├── razorpay.js          # Razorpay payment config
│   └── sendEmail.js         # Email sender utility
├── controller/
│   ├── address.controller.js    # Address route handlers
│   ├── cart.controller.js       # Cart route handlers
│   ├── category.controller.js   # Category & subcategory route handlers
│   ├── order.controller.js      # Order route handlers
│   ├── product.controller.js    # Product route handlers
│   └── user.controller.js       # User route handlers
├── middlewares/
│   ├── adminMiddleware.js       # Admin role authentication
│   ├── multer.js                # File upload configuration
│   └── userMiddleware.js        # User role authentication (auto token refresh)
├── models/
│   ├── address.model.js         # Address schema
│   ├── cart.model.js            # Cart schema
│   ├── category.model.js        # Category schema
│   ├── order.model.js           # Order schema
│   ├── product.model.js         # Product schema
│   ├── review.model.js          # Review schema
│   ├── subCategory.model.js     # SubCategory schema
│   └── user.model.js            # User schema
├── router/
│   ├── address.route.js         # Address API routes
│   ├── cart.route.js            # Cart API routes
│   ├── category.route.js        # Category API routes
│   ├── order.route.js           # Order API routes
│   ├── product.route.js         # Product API routes
│   └── user.route.js            # User API routes
├── uploads/                     # Temporary file storage (before Cloudinary upload)
│   ├── [images...]              # Uploaded images
├── utils/
│   ├── generateAccessToken.js   # JWT access token (5h expiry)
│   ├── generateRefreshToken.js  # JWT refresh token (7d expiry)
│   ├── verifyEmailTemplate.js   # HTML email template for OTP
├── .env                         # Environment variables
├── package.json
├── package-lock.json
├── .gitignore
```

## API Endpoints

### Authentication

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/user/register` | — | Register a new user & send verification email |
| POST | `/api/user/verify-email` | — | Verify email with OTP |
| POST | `/api/user/login` | — | Login & receive tokens |
| GET | `/api/user/logout` | User | Logout & clear tokens |
| POST | `/api/user/refresh-token` | — | Refresh access token |

### Password Management

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/user/forgot-password` | — | Send password reset OTP |
| POST | `/api/user/verify-forgot-password-otp` | — | Verify password reset OTP |
| POST | `/api/user/reset-password-withOtp` | — | Reset password using OTP |
| POST | `/api/user/reset-password` | User | Reset password (authenticated) |

### User Profile

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| PUT | `/api/user/` | User | Update user details (name, password, mobile) |
| PUT | `/api/user/user-avatar` | User | Upload user avatar |
| DELETE | `/api/user/deleteImage` | User | Remove avatar from Cloudinary |

### Admin

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| PUT | `/api/user/updateUserStatus/:id` | Admin | Activate/deactivate a user account |

### Category Management

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/category/upload-images` | Admin | Upload category images to Cloudinary |
| DELETE | `/api/category/deleteImage` | Admin | Remove image from Cloudinary |
| POST | `/api/category/` | Admin | Create a new category |
| GET | `/api/category/` | — | Get all categories (sorted by name) |
| GET | `/api/category/:id` | — | Get category by ID |
| GET | `/api/category/subcategories/:id` | — | Get subcategories for a category |
| DELETE | `/api/category/:id` | Admin | Delete category & its subcategories |
| DELETE | `/api/category/subcategory/:id` | Admin | Delete a specific subcategory |

### Product Management

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST   | `/api/product/upload-images` | Admin | Upload product images to Cloudinary. Returns URLs.
| DELETE | `/api/product/deleteImage`   | Admin | Remove a product image from Cloudinary by setting query param `img` to the image URL.
| POST   | `/api/product/`              | Admin | Create a new product – send `productName` (required) along with other fields.
| GET    | `/api/product/`              | —     | Get all products (random sample or sorted via `?sortBy=`).
| GET    | `/api/product/:id`           | —     | Get product by ID.
| PUT    | `/api/product/:id`           | Admin | Update product details/images.
| DELETE | `/api/product/:id`           | Admin | Delete product and its images (also removes associated reviews).
| GET    | `/api/product/category/:categoryId` | — | Get products by category (random or sorted).
| GET    | `/api/product/subcategory/:subCategoryId` | — | Get products by subcategory (random or sorted).
| GET    | `/api/product/search`        | —     | Search products (text search plus optional category/subcategory match and sorting).
| GET    | `/api/product/filter`        | —     | Filter products (category, price range, min rating, sorted).
| GET    | `/api/product/top-rated`     | —     | Get top‑rated products (limit 10).
| GET    | `/api/product/latest`        | —     | Get latest products (limit 10).
| GET    | `/api/product/related/:id`   | —     | Get related products sharing category or subcategory.
| POST   | `/api/product/:id/review`    | User  | Add a review to a product (requires `rating` and `comment`).
| GET    | `/api/product/:id/reviews`   | —     | Get all reviews for a product (sorted newest first).

### Address Management

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST   | `/api/address/add`      | User  | Add a new address for the logged-in user |
| GET    | `/api/address/`         | User  | Get all addresses for the logged-in user |
| GET    | `/api/address/:id`      | User  | Get a single address by ID (must belong to user) |
| PATCH  | `/api/address/:id`      | User  | Edit/update an address by ID (must belong to user) |
| DELETE | `/api/address/:id`      | User  | Delete an address by ID (must belong to user) |


### Cart Management

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST   | `/api/cart/add`           | User  | Add a product to cart |
| GET    | `/api/cart/details`       | User  | Get cart details (products, quantities, prices) |
| DELETE | `/api/cart/remove/:productId` | User  | Remove a product from cart |
| DELETE | `/api/cart/clear`         | User  | Clear all products from cart |
| PUT    | `/api/cart/update`        | User  | Update product quantity in cart |
| GET    | `/api/cart/item-count`    | User  | Get total item count in cart |
| GET    | `/api/cart/total-amount`  | User  | Get total cart amount |


### Order Management

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST   | `/api/order/cod`         | User  | Create order with Cash on Delivery |
| POST   | `/api/order/razorpay`    | User  | Create order with Razorpay payment |
| GET    | `/api/order/my-orders`   | User  | Get logged-in user's orders |
| GET    | `/api/order/`            | Admin | Get all orders (paginated) |
| PATCH  | `/api/order/status/:orderId` | Admin | Update order status (pending/shipped/delivered/cancelled) |


## Database Models

### User

| Field | Type | Details |
|-------|------|---------|
| name | String | Required |
| email | String | Required, unique |
| password | String | Bcrypt hashed |
| avatar | String | Cloudinary URL |
| role | String | `user` or `admin` |
| mobile | Number | Optional |
| emailVerified | Boolean | Default: false |
| status | String | `Active` or `Inactive` |
| otp | String | 6-digit OTP for email verification |
| otp_expiry | Date | Expiry time for OTP 10 minutes |

### Reviews

| Field | Type | Details |
|-------|------|---------|
| userName | String | Reviewer name |
| review | String | Review text |
| rating | Number | Numeric rating |
| userId | ObjectId | Reference to User |
| productId | ObjectId | Reference to Product |
| image | String | Reviewer avatar |

### Category

| Field | Type | Details |
|-------|------|---------|
| catName | String | Required, category name |
| image | String | Cloudinary URL |
| timestamps | Auto | createdAt, updatedAt |

### SubCategory

| Field | Type | Details |
|-------|------|---------|
| subCatName | String | Required |
| categoryId | ObjectId | Reference to Category |
| timestamps | Auto | createdAt, updatedAt |

### Product

| Field        | Type     | Details |
|--------------|----------|---------|
| productName  | String   | Required, text-indexed. **API expects `productName` in request bodies**.  
| price        | Number   | Required |
| description  | String   | Optional |
| category     | ObjectId | Reference to Category |
| subCategory  | ObjectId | Reference to SubCategory |
| images       | [String] | Array of Cloudinary URLs |
| size         | String   | Optional |
| weight       | String   | Optional |
| RAM          | String   | Optional |
| ROM          | String   | Optional |
| color        | String   | Optional |
| stock        | Number   | Default: 0 |
| sales        | Number   | Default: 0, min: 0 |
| timestamps   | Auto     | createdAt, updatedAt |


### Address

| Field         | Type     | Details |
|-------------- |----------|---------|
| address_line1 | String   | Street address line 1 |
| city          | String   | City name |
| state         | String   | State name |
| pincode       | String   | Postal code |
| country       | String   | Country name |
| mobile        | String   | Mobile number |
| selected      | Boolean  | Default: false (for selection) |
| landmark      | String   | Nearby landmark |
| addressType   | String   | "Home" or "Office" |
| userId        | ObjectId | Reference to User (required) |
| timestamps    | Auto     | createdAt, updatedAt |


### Cart

| Field        | Type     | Details |
|------------- |----------|---------|
| userId       | ObjectId | Reference to User (required) |
| products     | Array    | List of products in cart |
| products.productId | ObjectId | Reference to Product (required) |
| products.quantity  | Number   | Quantity of product (min 1, integer) |
| totalAmount  | Number   | Total cart amount (default 0, min 0) |
| timestamps   | Auto     | createdAt, updatedAt |


### Order

| Field           | Type     | Details |
|---------------- |----------|---------|
| userId          | ObjectId | Reference to User (required) |
| products        | Array    | List of products in order |
| products.productId | ObjectId | Reference to Product (required) |
| products.quantity  | Number   | Quantity of product (min 1) |
| status          | String   | Order status: pending/shipped/delivered/cancelled (default: pending) |
| paymentMethod   | String   | "Razorpay" or "COD" (default: COD) |
| paymentStatus   | String   | Payment status: pending/completed/failed (default: pending) |
| paymentId       | String   | Razorpay payment ID (nullable) |
| delivery_address| ObjectId | Reference to Address (required) |
| totalAmount     | Number   | Total order amount (min 0) |
| timestamps      | Auto     | createdAt, updatedAt |


## Contributing

We welcome contributions from the community! To contribute, please follow these guidelines:

1. **Fork the Repository**
	- Click the "Fork" button at the top right of the GitHub page to create your own copy.

2. **Clone Your Fork**
	- Clone your forked repository to your local machine:
	  ```bash
	  git clone https://github.com/<your-username>/Isomorphic_Shop.git
	  ```

3. **Create a Branch**
	- Create a new branch for your feature or bugfix:
	  ```bash
	  git checkout -b feature/your-feature-name
	  ```

4. **Make Changes**
	- Add your code, tests, or documentation improvements.
	- Follow the existing code style and structure.

5. **Commit Your Changes**
	- Write clear, descriptive commit messages.
	- Example:
	  ```bash
	  git commit -m "Add new cart API endpoint"
	  ```

6. **Push to GitHub**
	- Push your branch to your forked repository:
	  ```bash
	  git push origin feature/your-feature-name
	  ```

7. **Open a Pull Request**
	- Go to the original repository and click "Compare & pull request".
	- Describe your changes and reference any related issues.

8. **Review Process**
	- The maintainers will review your PR and may request changes.
	- Please respond to feedback and update your PR as needed.

9. **Major Changes**
	- For large features or breaking changes, open an issue first to discuss your proposal.

10. **Code of Conduct**
	 - Be respectful and constructive in all interactions.
	 - Help keep the project welcoming for everyone.

Thank you for helping improve Isomorphic_Shop!

## License

This project is licensed under the MIT License.

```
MIT License

Copyright (c) 2026 Satyam Kumar

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Contact

For questions, suggestions, or contributions, please contact:
- **Satyam Kumar** - [GitHub](https://github.com/SatyamKumar-code)
- **Email** - satyamkumarsing59@gmail.com