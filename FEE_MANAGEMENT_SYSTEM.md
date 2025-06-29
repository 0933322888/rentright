# Unified Fee Management System

## Overview

The Unified Fee Management System consolidates all commission and fee-related functionality into a single, comprehensive system. This replaces the scattered approach with a dedicated model that provides better organization, scalability, and maintainability.

## Commission Settings Management

### Overview
The system now includes a centralized settings management system that allows administrators to configure fee percentages and amounts globally. This ensures consistency across all properties and provides easy adjustment of fee structures.

### Key Features
- **Global Configuration**: Single settings apply to all properties
- **Percentage-Based Monthly Fees**: Monthly fees calculated as percentage of rent
- **Standardized Fixed Fees**: Configurable listing and processing fees
- **Settings History**: Complete audit trail of setting changes
- **Real-time Application**: Settings applied immediately to new fee calculations

### Settings Model
```javascript
{
  key: String,                  // Setting key (e.g., 'monthly_fee_percentage')
  value: Mixed,                 // Setting value
  description: String,          // Setting description
  category: String,             // 'commission', 'fees', 'system', 'notifications', 'other'
  dataType: String,             // 'number', 'string', 'boolean', 'object', 'array'
  isActive: Boolean,            // Whether setting is active
  updatedBy: ObjectId,          // User who last updated the setting
  history: [{                   // Setting change history
    oldValue: Mixed,
    newValue: Mixed,
    updatedBy: ObjectId,
    updatedAt: Date,
    reason: String
  }]
}
```

### Default Commission Settings
- **Monthly Fee Percentage**: 5% (of monthly rent)
- **Listing Fee Amount**: $100 (per property)
- **Processing Fee Amount**: $50 (per application)
- **Late Fee Percentage**: 10% (of overdue amount)

### Settings API Endpoints
- `GET /api/settings/commission` - Get commission settings
- `POST /api/settings/commission` - Update commission settings
- `GET /api/settings` - Get all settings
- `GET /api/settings/category/:category` - Get settings by category
- `POST /api/settings/initialize` - Initialize default settings

## Why a Dedicated Fee Model?

### Problems with Current Approach:
1. **Scattered Data**: Commission and fee information is spread across multiple models
2. **Complex Logic**: Fee management logic is duplicated across controllers
3. **Limited Scalability**: Adding new fee types requires changes to multiple files
4. **Inconsistent Tracking**: Different fee types have different tracking mechanisms
5. **Poor Audit Trail**: Limited history tracking for fee changes

### Benefits of Unified System:
1. **Single Source of Truth**: All fee data in one model
2. **Consistent API**: Unified endpoints for all fee operations
3. **Better Audit Trail**: Complete history of all fee changes
4. **Scalable Architecture**: Easy to add new fee types and features
5. **Advanced Features**: Recurring fees, automatic generation, comprehensive reporting
6. **Centralized Settings**: Global configuration for all fee types

## Fee Model Architecture

### Core Structure
```javascript
{
  // Basic Information
  property: ObjectId,        // Reference to Property
  landlord: ObjectId,        // Reference to User (landlord)
  
  // Fee Classification
  category: String,          // commission, monthly_fee, listing_fee, etc.
  feeType: String,           // one_time, recurring
  
  // Amount Information
  baseAmount: Number,        // Base fee amount (calculated from settings)
  additionalFees: Number,    // Late fees, processing fees, etc.
  totalAmount: Number,       // Calculated total
  
  // Status and Lifecycle
  status: String,            // pending, paid, overdue, cancelled, etc.
  dueDate: Date,            // When payment is due
  paidDate: Date,           // When payment was received
  
  // Recurring Configuration
  recurring: {
    isRecurring: Boolean,
    interval: String,        // monthly, quarterly, yearly
    nextDueDate: Date,
    cycleNumber: Number,
    parentFeeId: ObjectId
  },
  
  // Payment Information
  payment: {
    method: String,
    transactionId: String,
    stripePaymentIntentId: String,
    failureReason: String,
    retryCount: Number
  },
  
  // Related Data
  relatedApplication: ObjectId,
  relatedLease: ObjectId,
  
  // Audit Trail
  history: [{
    action: String,
    timestamp: Date,
    userId: ObjectId,
    details: String,
    previousStatus: String,
    newStatus: String
  }]
}
```

## Fee Categories

### 1. Commission
- **Type**: One-time
- **Description**: Standard commission for property listing/rental
- **Amount Range**: $200-$1200
- **Trigger**: Property approval or successful rental

### 2. Monthly Fee
- **Type**: Recurring
- **Description**: Ongoing monthly service fee (percentage of rent)
- **Calculation**: `Monthly Fee = Property Rent × Monthly Fee Percentage`
- **Default Percentage**: 5%
- **Trigger**: Monthly automatic generation

### 3. Listing Fee
- **Type**: One-time
- **Description**: Fee for listing a property
- **Default Amount**: $100 (configurable)
- **Trigger**: Property submission

### 4. Service Fee
- **Type**: One-time/Recurring
- **Description**: Additional service charges
- **Amount Range**: $25-$175
- **Trigger**: Service usage

### 5. Processing Fee
- **Type**: One-time
- **Description**: Administrative processing charges
- **Default Amount**: $50 (configurable)
- **Trigger**: Application processing

### 6. Late Fee
- **Type**: One-time
- **Description**: Penalty for late payments
- **Calculation**: `Late Fee = Overdue Amount × Late Fee Percentage`
- **Default Percentage**: 10%
- **Trigger**: Payment past due date

## API Endpoints

### Fee Management
- `GET /api/fees` - Get all fees with advanced filtering
- `GET /api/fees/stats` - Get comprehensive fee statistics
- `GET /api/fees/:id` - Get specific fee details
- `POST /api/fees` - Create new fee
- `PATCH /api/fees/:id` - Update fee
- `DELETE /api/fees/:id` - Delete fee
- `PATCH /api/fees/:id/mark-paid` - Mark fee as paid
- `POST /api/fees/generate-monthly-fees` - Generate monthly fees for all properties

### Recurring Fee Management
- `POST /api/fees/generate-recurring` - Generate next recurring fees

### Specialized Queries
- `GET /api/fees/overdue` - Get overdue fees
- `GET /api/fees/landlord/:landlordId` - Get fees by landlord
- `GET /api/fees/property/:propertyId` - Get fees by property

## Monthly Fee Generation

### Automatic Calculation Process
1. **Settings Retrieval**: Get monthly fee percentage from settings
2. **Property Selection**: All active and rented properties included
3. **Amount Calculation**: `Monthly Fee = Property Rent × Monthly Fee Percentage`
4. **Due Date Setting**: 15th of the following month
5. **Deduplication Check**: Verify no existing monthly fee for same month
6. **Fee Creation**: Create new monthly fee with proper configuration

### Bulk Generation Features
- **Smart Processing**: Skips properties with existing monthly fees
- **Detailed Reporting**: Returns summary of created, skipped, and error counts
- **Settings Integration**: Uses current settings for calculations
- **Error Handling**: Graceful handling of individual property errors

### Example Response
```javascript
{
  message: "Monthly fees generation completed",
  summary: {
    total: 25,
    created: 20,
    skipped: 3,
    errors: 2
  },
  results: [
    {
      property: "Sunset Apartments",
      landlord: "John Smith",
      status: "created",
      feeId: "...",
      amount: 150.00,
      dueDate: "2024-02-15"
    }
  ],
  settings: {
    monthlyFeePercentage: 5
  }
}
```

## Advanced Features

### 1. Recurring Fee Management
```javascript
// Automatic generation of next recurring fee
const nextFee = await Fee.createRecurringFee(parentFee, nextDueDate);

// Calculate next due date
const nextDueDate = fee.calculateNextDueDate();
```

### 2. Comprehensive Audit Trail
```javascript
// Every action is logged with full details
history: [{
  action: 'payment_received',
  timestamp: new Date(),
  userId: adminId,
  details: 'Payment received via Stripe',
  newStatus: 'paid'
}]
```

### 3. Advanced Filtering
```javascript
// Filter by multiple criteria
{
  status: 'pending',
  category: 'monthly_fee',
  feeType: 'recurring',
  landlordId: '...',
  startDate: '2024-01-01',
  endDate: '2024-12-31'
}
```

### 4. Automatic Calculations with Settings
```javascript
// Monthly fee calculation using settings
const monthlyFeePercentage = await Settings.getValue('monthly_fee_percentage', 5);
const monthlyFeeAmount = (property.price * monthlyFeePercentage) / 100;

// Total amount automatically calculated
totalAmount: baseAmount + additionalFees

// Late fees automatically added using settings
const lateFeePercentage = await Settings.getValue('late_fee_percentage', 10);
if (isOverdue) {
  additionalFees += (baseAmount * lateFeePercentage) / 100;
}
```

## Property Model Updates

### Removed Fields
The following fields have been removed from the Property model as they are now managed by the Fee model:

```javascript
// OLD (removed)
commissionStatus: String,
monthlyFeeStatus: String,
monthlyFeeAmount: Number,
monthlyFeeDueDate: Date,
lastMonthlyFeePaid: Date
```

### Added Virtuals
The Property model now includes virtual fields for easy fee access:

```javascript
// NEW (virtuals)
fees: [Fee],                    // All fees for this property
commissionFees: [Fee],          // Commission fees only
monthlyFees: [Fee],             // Monthly fees only
pendingFees: [Fee],             // Pending fees
overdueFees: [Fee]              // Overdue fees
```

## Frontend Integration

### Commission Settings Page
- **Settings Display**: Shows current commission settings with descriptions
- **Edit Modal**: Form to update all commission settings
- **Real-time Updates**: Settings changes applied immediately
- **Validation**: Input validation for percentages and amounts

### Fee Management Interface
- **Comprehensive Dashboard**: Statistics, filters, and fee listing
- **Settings Integration**: Uses configured settings for fee calculations
- **Bulk Operations**: Generate monthly fees for all properties
- **Detailed Views**: Individual fee details with payment tracking

## Migration Strategy

### From Property-Based to Settings-Based
1. **Settings Initialization**: Default settings created on server startup
2. **Fee Generation**: New monthly fees use percentage from settings
3. **Backward Compatibility**: Existing property-based fees remain functional
4. **Gradual Migration**: Properties can be updated to use new system

### Data Migration Commands
```bash
# Initialize default settings
node server/initializeSettings.js

# Generate sample fees using new system
node server/seedFees.js

# Generate fee statistics
node server/generateFeeStats.js
```

## Benefits

### For Administrators
- **Centralized Control**: Single place to manage all fee settings
- **Consistent Pricing**: Uniform fee structure across all properties
- **Flexible Configuration**: Easy adjustment of fee percentages and amounts
- **Comprehensive Tracking**: Full audit trail of all fee changes
- **Automated Processing**: Bulk generation of monthly fees

### For Landlords
- **Transparent Pricing**: Clear understanding of fee structure
- **Consistent Billing**: Predictable monthly fees based on rent
- **Payment Tracking**: Complete visibility into payment status
- **Automated Reminders**: System handles recurring fee generation

### For System Management
- **Scalable Architecture**: Handles large numbers of properties efficiently
- **Data Integrity**: Comprehensive validation and error handling
- **Performance Optimized**: Efficient queries and indexing
- **Extensible Design**: Easy to add new fee types and categories

## Future Enhancements

### Planned Features
- **Fee Templates**: Predefined fee structures for different property types
- **Seasonal Adjustments**: Dynamic fee percentages based on market conditions
- **Tiered Pricing**: Different fee structures for different property value ranges
- **Automated Notifications**: Email/SMS reminders for upcoming fees
- **Payment Integration**: Direct integration with payment gateways
- **Advanced Reporting**: Custom reports and analytics dashboard

### Integration Opportunities
- **Accounting Systems**: Export fee data to accounting software
- **Tax Reporting**: Automated tax calculation and reporting
- **Legal Compliance**: Built-in compliance with local regulations
- **Market Analysis**: Fee optimization based on market data

## Comparison: Old vs New System

| Feature | Old System | New System |
|---------|------------|------------|
| **Data Storage** | Scattered across models | Single unified model |
| **Fee Types** | Limited categories | Comprehensive categorization |
| **Recurring Fees** | Basic support | Advanced recurring system |
| **Audit Trail** | Limited history | Complete audit trail |
| **API Endpoints** | Multiple inconsistent APIs | Unified RESTful API |
| **Filtering** | Basic filters | Advanced multi-criteria filtering |
| **Reporting** | Basic statistics | Comprehensive analytics |
| **Scalability** | Difficult to extend | Easy to add new features |
| **Maintenance** | Complex, scattered logic | Clean, centralized logic |
| **Property Integration** | Embedded fields | Virtual relationships |

## Conclusion

The Unified Fee Management System provides a comprehensive, scalable, and maintainable solution for managing all commission and fee-related operations. It consolidates scattered functionality into a single, well-organized system that provides better user experience, easier maintenance, and enhanced business capabilities.

This system is designed to grow with the business and can easily accommodate new fee types, payment methods, and business requirements while maintaining data integrity and providing comprehensive audit trails.

The migration process ensures a smooth transition from the old scattered approach to this new, more robust system with minimal disruption to existing operations.
