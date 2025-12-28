# Backend Architecture

## Overview

This is a multi-tenant e-commerce SaaS platform backend designed for scalability, security, and maintainability.

## Key Design Principles

### 1. Multi-Tenant Architecture
- **Shared Database, Shared Schema** - All stores share the same MongoDB database
- **Tenant Isolation** - Every store-scoped collection includes `storeId` for data isolation
- **Subdomain Routing** - Stores accessed via subdomain (e.g., `mystore.yourdomain.com`)
- **Custom Domain Support** - Stores can connect custom domains

### 2. Financial Integrity
- **Integer Storage** - All monetary values stored as integers (smallest currency unit)
  - USD: cents (e.g., $10.50 = 1050)
  - INR: paise (e.g., ₹100.50 = 10050)
- **Ledger System** - Complete audit trail of all financial transactions
- **Commission Tracking** - Automatic commission calculation per order
- **Payout Management** - T+1 or T+2 settlement with tracking

### 3. Security
- **JWT Authentication** - Short-lived access tokens + refresh tokens
- **Role-Based Access Control** - Admin, Seller, Staff roles
- **Password Hashing** - bcrypt with 12 salt rounds
- **Input Validation** - Joi schemas for all inputs
- **Rate Limiting** - Protection against brute force
- **Audit Logging** - Complete trail of sensitive operations

### 4. Scalability
- **Indexed Queries** - All tenant-scoped queries use compound indexes
- **Soft Deletes** - Data preservation with `isDeleted` flag
- **Modular Architecture** - Controller → Service → Model separation
- **Future-Proof Design** - Extensible for themes, plugins, subscriptions

## Database Models

### Core Models

1. **User** - Authentication and authorization
   - Roles: Admin, Seller, Staff
   - Email verification
   - Password reset tokens

2. **Store** - Store profiles
   - Domain configuration (subdomain + custom domain)
   - Commission rates
   - Payout settings
   - Store settings

3. **Product** - Store products
   - Variants support
   - Inventory tracking
   - SEO fields
   - Multi-image support

4. **Order** - Customer orders
   - Financial breakdown (subtotal, tax, shipping, commission)
   - Payment status tracking
   - Shipping information

5. **OrderItem** - Order line items
   - Product snapshots at time of order
   - Quantity and pricing

6. **Payment** - Payment transactions
   - Gateway integration ready
   - Refund tracking
   - Transaction IDs

7. **Payout** - Seller settlements
   - Settlement dates (T+1/T+2)
   - Account details
   - Order references

8. **LedgerEntry** - Financial audit trail
   - Balance tracking
   - Entry types (payment, commission, payout, refund)
   - Complete transaction history

9. **Session** - JWT refresh tokens
   - Device tracking
   - Revocation support
   - Auto-expiry

10. **AuditLog** - Security audit trail
    - Action logging
    - Change tracking
    - IP and user agent

11. **Category** - Product categories
    - Hierarchical support
    - Store-scoped

## Middleware Stack

1. **Authentication** (`authenticate`)
   - Validates JWT tokens
   - Attaches user to request

2. **Authorization** (`authorize`)
   - Role-based access control
   - Protects routes by role

3. **Tenant Isolation** (`tenantIsolation`)
   - Identifies store from subdomain/custom domain
   - Attaches storeId to request

4. **Store Ownership** (`validateStoreOwnership`)
   - Validates seller owns the store
   - Protects store-scoped operations

5. **Validation** (`validate`)
   - Joi schema validation
   - Input sanitization

6. **Error Handling** (`errorHandler`)
   - Centralized error handling
   - Proper error responses

## Services Layer

1. **CommissionService**
   - Calculate commission per order
   - Calculate settlement dates

2. **LedgerService**
   - Track store balances
   - Record financial transactions
   - Maintain audit trail

3. **AuditService**
   - Log sensitive operations
   - Track changes

## API Structure

```
/api
  /auth
    POST /register - User registration
    POST /login - User login
    POST /refresh - Refresh access token
    POST /logout - Logout and revoke token
  /health
    GET /health - Health check
```

## Query Patterns

### Tenant-Scoped Queries

Always include `storeId` and `isDeleted`:

```typescript
// ✅ Correct
Product.find({ storeId, isDeleted: false })

// ❌ Wrong - Missing tenant isolation
Product.find({ isDeleted: false })
```

### Compound Indexes

All tenant queries use compound indexes:
- `{ storeId: 1, status: 1, isDeleted: 1 }`
- `{ storeId: 1, createdAt: -1, isDeleted: 1 }`

## Financial Flow

1. **Order Creation**
   - Calculate subtotal, tax, shipping
   - Calculate commission
   - Calculate seller amount

2. **Payment Processing**
   - Record payment in Payment collection
   - Update order payment status
   - Create ledger entry for payment (credit)
   - Create ledger entry for commission (debit)

3. **Payout Processing** (T+1/T+2)
   - Find orders ready for settlement
   - Create payout record
   - Process payout via gateway
   - Create ledger entry (debit)
   - Update payout status

## Security Considerations

1. **Password Security**
   - bcrypt with 12 salt rounds
   - Minimum 8 characters
   - Never returned in API responses

2. **Token Security**
   - Short-lived access tokens (15 min)
   - Long-lived refresh tokens (7 days)
   - Token revocation support
   - Device tracking

3. **Input Security**
   - Joi validation on all inputs
   - SQL injection protection (MongoDB)
   - XSS protection via sanitization

4. **Rate Limiting**
   - 100 requests per 15 minutes per IP
   - Applied to all API routes

5. **CORS**
   - Configured for frontend origin
   - Credentials enabled

## Future Enhancements

1. **Themes** - Store theme customization
2. **Custom Domains** - SSL automation
3. **Subscriptions** - SaaS plan management
4. **Analytics** - Store performance metrics
5. **Marketing** - Discounts, coupons, campaigns
6. **Shipping** - Integration with shipping providers
7. **Multi-Currency** - Support for multiple currencies
8. **Staff Roles** - Granular permissions per store
9. **Plugin System** - App marketplace
10. **Webhooks** - Event notifications

## Development Guidelines

1. **Never write business logic in controllers** - Use services
2. **Always validate inputs** - Use Joi schemas
3. **Always include storeId** - For tenant isolation
4. **Use soft deletes** - Never hard delete
5. **Log sensitive operations** - Use AuditService
6. **Handle errors properly** - Use CustomError
7. **Test tenant isolation** - Verify storeId in all queries

