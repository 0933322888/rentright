# Commission Management System

## Overview

The Commission Management System allows administrators to track and manage commissions and fees that landlords pay for using the RentRight service. This comprehensive system provides full CRUD operations, filtering, reporting, and payment tracking.

## Features

### 1. Commission Types
- **Commission**: Standard commission fees (typically $200-$1200)
- **Listing Fee**: One-time fee for listing a property ($50-$250)
- **Service Fee**: Ongoing service charges ($25-$175)
- **Processing Fee**: Administrative processing fees ($10-$110)
- **Monthly Fee**: Recurring monthly fees ($50-$200)

### 2. Status Management
- **Pending**: Commission is due but not yet paid
- **Paid**: Commission has been successfully paid
- **Overdue**: Commission is past due date
- **Cancelled**: Commission has been cancelled
- **Refunded**: Commission has been refunded

### 3. Key Features
- **Dashboard Statistics**: Real-time overview of revenue, pending amounts, and overdue fees
- **Advanced Filtering**: Filter by status, type, landlord, property, and date ranges
- **Pagination**: Efficient handling of large datasets
- **Payment Tracking**: Track payment methods, transaction IDs, and payment dates
- **Late Fee Management**: Automatic calculation and tracking of late fees
- **Recurring Commissions**: Support for recurring commission schedules
- **Monthly Fee Generation**: Automatic generation of monthly fees for properties
- **Admin Notes**: Internal notes for administrative purposes

## Database Schema

### Commission Model
```javascript
{
  landlord: ObjectId,           // Reference to User (landlord)
  property: ObjectId,           // Reference to Property
  type: String,                 // commission, listing_fee, service_fee, processing_fee, monthly_fee
  amount: Number,               // Base amount
  description: String,          // Commission description
  status: String,               // pending, paid, overdue, cancelled, refunded
  dueDate: Date,               // When payment is due
  paidDate: Date,              // When payment was received
  paymentMethod: String,        // stripe, bank_transfer, cash, check, other
  transactionId: String,        // Payment transaction ID
  stripePaymentIntentId: String, // Stripe payment intent ID
  notes: String,               // General notes
  adminNotes: String,          // Admin-only notes
  isRecurring: Boolean,        // Whether this is a recurring commission
  recurringInterval: String,   // monthly, quarterly, yearly
  nextDueDate: Date,           // Next due date for recurring commissions
  lateFees: Number,            // Late fee amount
  totalAmount: Number          // Total amount including late fees
}
```

### Property Model Updates
```javascript
{
  // ... existing fields ...
  commissionStatus: String,     // pending, received, not_applicable
  monthlyFeeStatus: String,     // pending, paid, overdue, not_applicable
  monthlyFeeAmount: Number,     // Monthly fee amount
  monthlyFeeDueDate: Date,      // When monthly fee is due
  lastMonthlyFeePaid: Date      // Last time monthly fee was paid
}
```

## API Endpoints

### Commission Management
- `GET /api/commissions` - Get all commissions with filtering and pagination
- `GET /api/commissions/stats` - Get commission statistics
- `GET /api/commissions/overdue` - Get overdue commissions
- `GET /api/commissions/:id` - Get specific commission details
- `POST /api/commissions` - Create new commission
- `PATCH /api/commissions/:id` - Update commission
- `DELETE /api/commissions/:id` - Delete commission
- `PATCH /api/commissions/:id/mark-paid` - Mark commission as paid

### Monthly Fee Management
- `POST /api/commissions/generate-monthly-fees` - Generate monthly fees for all properties

### Landlord & Property Specific
- `GET /api/commissions/landlord/:landlordId` - Get commissions by landlord
- `GET /api/commissions/property/:propertyId` - Get commissions by property

## Frontend Components

### Admin Commission Page (`/admin/commissions`)
- **Statistics Dashboard**: Overview cards showing total revenue, pending amounts, overdue amounts, and total commissions
- **Generate Monthly Fees Button**: Automatically create monthly fee commissions for all properties
- **Advanced Filters**: Filter by status, type, landlord, and date ranges
- **Commission Table**: Sortable table with all commission details including property monthly fee information
- **Action Buttons**: View details, edit, mark as paid, and delete
- **Pagination**: Navigate through large datasets
- **Modals**: Create, edit, and view commission details

### Key UI Features
- **Status Indicators**: Color-coded status badges
- **Type Indicators**: Color-coded commission type badges (including monthly fee)
- **Property Fee Display**: Shows monthly fee amount and status for each property
- **Currency Formatting**: Proper USD formatting for all amounts
- **Date Formatting**: User-friendly date display
- **Responsive Design**: Works on desktop and mobile devices

## Usage Instructions

### For Administrators

1. **Access Commission Management**
   - Navigate to Admin Dashboard
   - Click on "Commissions" in the navigation menu

2. **Generate Monthly Fees**
   - Click "Generate Monthly Fees" button to create monthly fee commissions for all properties
   - System will automatically create monthly fees for properties with configured monthly fee amounts
   - Duplicate monthly fees for the same month will be skipped

3. **View Commission Statistics**
   - Dashboard shows key metrics at the top
   - Total revenue, pending amounts, overdue amounts, and commission count

4. **Filter Commissions**
   - Use the filter panel to narrow down results
   - Filter by status, type (including monthly_fee), landlord, or date range
   - Multiple filters can be applied simultaneously

5. **Create New Commission**
   - Click "Add Commission" button
   - Fill in required fields: landlord, property, type, amount, description, due date
   - Select "Monthly Fee" type for recurring monthly fees
   - Optional: Add notes and set recurring options
   - Click "Create" to save

6. **Manage Existing Commissions**
   - **View Details**: Click the eye icon to see full commission details
   - **Edit**: Click the pencil icon to modify commission details
   - **Mark as Paid**: Click the checkmark icon for pending commissions
   - **Delete**: Click the trash icon to remove commissions

7. **Track Payments**
   - Monitor payment status and due dates
   - View payment history and transaction details
   - Handle overdue commissions and late fees
   - Property monthly fee status updates automatically when monthly fee commissions are paid

### For Developers

1. **Setup**
   ```bash
   # Install dependencies
   npm install

   # Start the server
   npm run dev

   # Update properties with monthly fee information (optional)
   npm run update-monthly-fees

   # Seed sample commission data (optional)
   npm run seed-commissions
   ```

2. **Database Migration**
   - The commission model will be automatically created when the server starts
   - Property model has been updated with monthly fee fields
   - No manual migration required

3. **API Testing**
   - Use the provided endpoints for testing
   - All endpoints require admin authentication
   - Use Postman or similar tools for API testing

## Integration with Existing System

### Property Integration
- Commissions are linked to specific properties
- Property approval process can trigger commission creation
- Property status changes can affect commission status
- Monthly fee status is tracked at the property level
- Property monthly fee information is displayed in commission table

### Payment Integration
- Integrates with existing Stripe payment system
- Supports multiple payment methods
- Tracks payment transactions and status
- Monthly fee payments update property status automatically

### User Integration
- Links commissions to landlord accounts
- Provides landlord-specific commission views
- Integrates with user authentication and authorization

## Security Features

- **Admin-Only Access**: All commission management requires admin privileges
- **Authentication Required**: All API endpoints require valid JWT tokens
- **Input Validation**: Server-side validation for all commission data
- **Audit Trail**: Timestamps for creation and modification
- **Data Integrity**: Database constraints and validation

## Future Enhancements

1. **Automated Billing**: Automatic commission generation based on property events
2. **Payment Reminders**: Automated email notifications for due payments
3. **Reporting**: Advanced reporting and analytics
4. **Export Features**: Export commission data to CSV/PDF
5. **Bulk Operations**: Bulk update and management features
6. **Integration**: Enhanced integration with accounting systems
7. **Scheduled Monthly Fee Generation**: Automatic monthly fee generation via cron jobs

## Troubleshooting

### Common Issues

1. **Commission Not Appearing**
   - Check if landlord and property exist
   - Verify admin permissions
   - Check database connection

2. **Payment Status Not Updating**
   - Verify Stripe integration
   - Check transaction ID format
   - Ensure proper API calls

3. **Filter Not Working**
   - Check date format (YYYY-MM-DD)
   - Verify landlord/property IDs
   - Clear browser cache

4. **Monthly Fees Not Generating**
   - Ensure properties have monthlyFeeAmount > 0
   - Check property status is 'active'
   - Verify no duplicate monthly fees exist for the same month

### Support

For technical support or feature requests, please contact the development team or create an issue in the project repository. 