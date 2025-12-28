# Moonlit Backend

Multi-tenant e-commerce SaaS platform backend built with Node.js, Express, TypeScript, and MongoDB.

## 🚀 Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Joi** - Validation

## 📁 Project Structure

```
moonlit-backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   ├── validators/      # Validation schemas
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── .env.example         # Environment variables template
└── package.json
```

## 🛠️ Setup

1. **Install dependencies:**
   ```bash
   yarn install
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Update `.env` with your configuration:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/moonlit
   JWT_SECRET=your-secret-key
   PORT=3000
   ```

4. **Start MongoDB:**
   ```bash
   # Make sure MongoDB is running locally or update MONGODB_URI
   ```

5. **Run development server:**
   ```bash
   yarn dev
   ```

6. **Build for production:**
   ```bash
   yarn build
   yarn start
   ```

## 📝 Available Scripts

- `yarn dev` - Start development server with hot reload
- `yarn build` - Build TypeScript to JavaScript
- `yarn start` - Start production server
- `yarn lint` - Run ESLint
- `yarn format` - Format code with Prettier
- `yarn type-check` - Type check without building

## 🏗️ Architecture

### Multi-Tenant Design

- **Shared Database, Shared Schema** - All stores share the same database
- **Tenant Isolation** - Every store-scoped collection includes `storeId`
- **Subdomain Routing** - Stores accessed via subdomain (e.g., `mystore.yourdomain.com`)
- **Custom Domains** - Support for custom domains per store

### Core Models

- **User** - Admin, sellers, and staff
- **Store** - Store profiles with domain configuration
- **Product** - Store-scoped products
- **Order** - Store-scoped orders
- **Payment** - Payment transactions
- **Payout** - Seller settlement ledger
- **LedgerEntry** - Financial audit trail
- **Session** - JWT refresh tokens
- **AuditLog** - Security audit trail

### Key Features

- ✅ JWT-based authentication with refresh tokens
- ✅ Role-based access control (Admin, Seller, Staff)
- ✅ Multi-tenant isolation via `storeId`
- ✅ Commission calculation and payout tracking
- ✅ Financial ledger for audit
- ✅ Soft delete support
- ✅ Input validation with Joi
- ✅ Error handling middleware
- ✅ Rate limiting
- ✅ Security headers (Helmet)
- ✅ CORS configuration

## 🔐 Security

- Password hashing with bcrypt (12 salt rounds)
- JWT tokens (short-lived access + refresh tokens)
- Rate limiting on API endpoints
- Input validation and sanitization
- Security headers via Helmet
- CORS protection
- Audit logging for sensitive operations

## 📊 Database Design

### Tenant Isolation

All store-scoped queries must include `storeId`:

```typescript
// ✅ Correct
Product.find({ storeId, isDeleted: false })

// ❌ Wrong - Missing tenant isolation
Product.find({ isDeleted: false })
```

### Monetary Values

All monetary values stored as **integers** (smallest currency unit):
- USD: cents (e.g., $10.50 = 1050)
- INR: paise (e.g., ₹100.50 = 10050)

### Indexes

Critical indexes:
- `{ storeId: 1, ...otherFields: 1 }` - Tenant-scoped queries
- `{ isDeleted: 1, ...otherFields: 1 }` - Soft delete queries
- `{ email: 1, isDeleted: 1 }` - Unique user lookup

## 🔄 API Structure

```
/api
  /auth
    POST /register
    POST /login
    POST /refresh
    POST /logout
  /health
    GET /health
```

## 🚧 Next Steps

1. Implement store management endpoints
2. Add product CRUD operations
3. Implement order processing
4. Add payment gateway integration
5. Create payout processing jobs
6. Add analytics endpoints
7. Implement file upload for images
8. Add email service integration

## 📄 License

MIT

