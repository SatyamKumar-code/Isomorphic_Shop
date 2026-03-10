# Isomorphic_Shop API Server

A Node.js/Express.js REST API with MongoDB for the Isomorphic_Shop e-commerce application. Features user authentication with JWT, email verification via SendGrid, image uploads with Cloudinary, and role-based access control.

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
cd Isomorphic
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

# Frontend
FRONTEND_URL=http://localhost:3000
```

## Running the Server

```bash
npm start
```

## Project Structure

```
Server/
├── server.js                # Entry point - Express app setup
├── package.json
├── config/
│   ├── connectDB.js         # MongoDB connection
│   ├── emailService.js      # SendGrid email transport with retry logic
│   └── sendEmail.js         # Email sender utility
├── controller/
│   └── user.controller.js   # User route handlers
├── middlewares/
│   ├── adminMiddleware.js   # Admin role authentication
│   ├── multer.js            # File upload configuration
│   └── userMiddleware.js    # User role authentication (auto token refresh)
├── models/
│   ├── user.model.js        # User schema
│   └── reviews.model.js     # Reviews schema
├── router/
│   └── user.route.js        # User API routes
├── uploads/                 # Temporary file storage (before Cloudinary upload)
└── utils/
    ├── generateAccessToken.js    # JWT access token (5h expiry)
    ├── generateRefreshToken.js   # JWT refresh token (7d expiry)
    └── verifyEmailTemplate.js    # HTML email template for OTP
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

## Authentication Flow

1. **Register** — User signs up with name, email, and password. A 6-digit OTP is sent via email.
2. **Verify Email** — User submits the OTP (valid for 10 minutes) to verify their email.
3. **Login** — Returns access token (5h) and refresh token (7d) as httpOnly cookies.
4. **Auto Refresh** — The user middleware automatically refreshes expired access tokens using the refresh token.

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
| otp / otp_expiry | String / Date | For email verification & password reset |

### Reviews

| Field | Type | Details |
|-------|------|---------|
| userName | String | Reviewer name |
| review | String | Review text |
| rating | Number | Numeric rating |
| userId | ObjectId | Reference to User |
| productId | ObjectId | Reference to Product |
| image | String | Reviewer avatar |
