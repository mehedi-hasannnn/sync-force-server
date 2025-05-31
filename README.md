# Employee Management System - Server

Backend API for the Employee Management System with secure endpoints for authentication, employee data management, and payroll processing.

## 🔗 API Base URL
`https://sync-force-server.vercel.app/`


## 🚀 Key Features

- **JWT Authentication** with role-based access control
- **Protected API endpoints** with middleware verification
- **MongoDB integration** for data persistence
- **Firebase Authentication** integration
- **Payment processing** endpoints
- **Image upload handling** via ImgBB
- **Data validation** with Joi
- **Error handling** middleware
- **Rate limiting** for security
- **CORS configuration** for frontend access

## 📋 Technical Specifications

### Core Technologies
- Node.js with Express
- MongoDB with Mongoose ODM
- JSON Web Tokens (JWT)
- Firebase Admin SDK
- Payment gateway SDK

### Key Packages
- `express` - Web framework
- `mongoose` - MongoDB object modeling
- `jsonwebtoken` - JWT implementation
- `firebase-admin` - Firebase integration
- `joi` - Data validation
- `dotenv` - Environment variables
- `cors` - Cross-origin resource sharing
- `helmet` - Security middleware
- `morgan` - Request logging

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/employee-management-server.git
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your credentials:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
PAYMENT_GATEWAY_API_KEY=your_payment_api_key
IMG_BB_API_KEY=your_imgbb_api_key
PORT=5000
```

4. Start the development server:
```bash
npm run dev
```

## 🏗️ Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middleware/     # Custom middleware
├── models/         # MongoDB models
├── routes/         # API routes
├── services/       # Business logic
├── utils/          # Utility functions
├── validations/    # Validation schemas
├── app.js          # Express app setup
└── server.js       # Server entry point
```

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Employee Routes
- `POST /api/employees/work-log` - Add work log
- `GET /api/employees/work-log` - Get work logs
- `GET /api/employees/payment-history` - Get payment history

### HR Routes
- `GET /api/hr/employees` - Get all employees
- `PATCH /api/hr/verify/:id` - Verify employee
- `POST /api/hr/initiate-payment` - Initiate payment

### Admin Routes
- `GET /api/admin/employees` - Get all employees (including HR)
- `PATCH /api/admin/update-role/:id` - Update employee role
- `PATCH /api/admin/update-salary/:id` - Update salary
- `GET /api/admin/payroll` - Get payroll requests
- `POST /api/admin/process-payment` - Process payment

## 🔒 Security Features

- Role-based access control
- JWT token verification
- Password hashing
- Rate limiting
- CORS restrictions
- Input validation
- Secure HTTP headers
- Error handling

## 🚨 Error Handling

The API returns appropriate HTTP status codes:

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

Errors include a JSON response with:
```json
{
  "success": false,
  "message": "Error message",
  "error": "Error details" // Only in development
}
```

## 📈 Database Models

### User
- `name` (String)
- `email` (String, unique)
- `password` (String, hashed)
- `role` (String: 'employee', 'hr', 'admin')
- `designation` (String)
- `salary` (Number)
- `bankAccount` (String)
- `isVerified` (Boolean)
- `photoURL` (String)
- `isActive` (Boolean)

### WorkLog
- `employeeId` (ObjectId, ref: User)
- `taskType` (String)
- `hoursWorked` (Number)
- `date` (Date)
- `createdAt` (Date)

### Payment
- `employeeId` (ObjectId, ref: User)
- `amount` (Number)
- `month` (Number)
- `year` (Number)
- `transactionId` (String)
- `paymentDate` (Date)
- `status` (String: 'pending', 'completed')

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
