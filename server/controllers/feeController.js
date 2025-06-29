import Fee from '../models/feeModel.js';
import Property from '../models/propertyModel.js';
import User from '../models/userModel.js';
import Application from '../models/applicationModel.js';
import Settings from '../models/settingsModel.js';

// Get all fees with advanced filtering and pagination
export const getAllFees = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      category,
      feeType,
      landlordId,
      propertyId,
      startDate,
      endDate,
      sortBy = 'dueDate',
      sortOrder = 'desc',
      includeHistory = false
    } = req.query;

    const query = {};

    // Apply filters
    if (status) query.status = status;
    if (category) query.category = category;
    if (feeType) query.feeType = feeType;
    if (landlordId) query.landlord = landlordId;
    if (propertyId) query.property = propertyId;
    if (startDate || endDate) {
      query.dueDate = {};
      if (startDate) query.dueDate.$gte = new Date(startDate);
      if (endDate) query.dueDate.$lte = new Date(endDate);
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    // Build populate options
    const populateOptions = [
      { path: 'landlord', select: 'name email' },
      { path: 'property', select: 'title location price status' }
    ];

    if (includeHistory === 'true') {
      populateOptions.push({ path: 'history.userId', select: 'name' });
    }

    const [fees, total] = await Promise.all([
      Fee.find(query)
        .populate(populateOptions)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Fee.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      fees,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching fees:', error);
    res.status(500).json({ message: 'Error fetching fees', error: error.message });
  }
};

// Get comprehensive fee statistics
export const getFeeStats = async (req, res) => {
  try {
    const { startDate, endDate, category, feeType } = req.query;
    const dateFilter = {};
    
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    if (category) dateFilter.category = category;
    if (feeType) dateFilter.feeType = feeType;

    const [
      totalFees,
      pendingFees,
      paidFees,
      overdueFees,
      totalAmount,
      paidAmount,
      pendingAmount,
      overdueAmount,
      feesByCategory,
      feesByStatus,
      feesByType,
      recurringFees
    ] = await Promise.all([
      Fee.countDocuments(dateFilter),
      Fee.countDocuments({ ...dateFilter, status: 'pending' }),
      Fee.countDocuments({ ...dateFilter, status: 'paid' }),
      Fee.countDocuments({ ...dateFilter, status: 'overdue' }),
      Fee.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Fee.aggregate([
        { $match: { ...dateFilter, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Fee.aggregate([
        { $match: { ...dateFilter, status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Fee.aggregate([
        { $match: { ...dateFilter, status: 'overdue' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Fee.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$category', count: { $sum: 1 }, total: { $sum: '$totalAmount' } } }
      ]),
      Fee.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$totalAmount' } } }
      ]),
      Fee.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$feeType', count: { $sum: 1 }, total: { $sum: '$totalAmount' } } }
      ]),
      Fee.aggregate([
        { $match: { ...dateFilter, 'recurring.isRecurring': true } },
        { $group: { _id: '$category', count: { $sum: 1 }, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    res.json({
      totalFees,
      pendingFees,
      paidFees,
      overdueFees,
      totalAmount: totalAmount[0]?.total || 0,
      paidAmount: paidAmount[0]?.total || 0,
      pendingAmount: pendingAmount[0]?.total || 0,
      overdueAmount: overdueAmount[0]?.total || 0,
      feesByCategory,
      feesByStatus,
      feesByType,
      recurringFees
    });
  } catch (error) {
    console.error('Error fetching fee stats:', error);
    res.status(500).json({ message: 'Error fetching fee statistics', error: error.message });
  }
};

// Create new fee
export const createFee = async (req, res) => {
  try {
    const {
      propertyId,
      landlordId,
      category,
      feeType,
      baseAmount,
      additionalFees,
      dueDate,
      description,
      notes,
      adminNotes,
      isRecurring,
      recurringInterval,
      relatedApplicationId,
      relatedLeaseId
    } = req.body;

    // Validate required fields
    if (!propertyId || !landlordId || !category || !feeType || !description || !dueDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if property and landlord exist
    const [property, landlord] = await Promise.all([
      Property.findById(propertyId),
      User.findById(landlordId)
    ]);

    if (!property) {
      return res.status(400).json({ message: 'Property not found' });
    }

    if (!landlord || landlord.role !== 'landlord') {
      return res.status(400).json({ message: 'Invalid landlord' });
    }

    // Calculate base amount based on category and settings
    let calculatedBaseAmount = baseAmount;
    if (category === 'monthly_fee' && !baseAmount) {
      const monthlyFeePercentage = await Settings.getValue('monthly_fee_percentage', 5);
      calculatedBaseAmount = (property.price * monthlyFeePercentage) / 100;
    } else if (category === 'listing_fee' && !baseAmount) {
      calculatedBaseAmount = await Settings.getValue('listing_fee_amount', 100);
    } else if (category === 'processing_fee' && !baseAmount) {
      calculatedBaseAmount = await Settings.getValue('processing_fee_amount', 50);
    }

    // Create fee object
    const feeData = {
      property: propertyId,
      landlord: landlordId,
      category,
      feeType,
      baseAmount: parseFloat(calculatedBaseAmount),
      additionalFees: parseFloat(additionalFees || 0),
      dueDate: new Date(dueDate),
      description,
      notes,
      adminNotes,
      totalAmount: parseFloat(calculatedBaseAmount) + parseFloat(additionalFees || 0)
    };

    // Add recurring configuration if applicable
    if (isRecurring) {
      feeData.recurring = {
        isRecurring: true,
        interval: recurringInterval || 'monthly',
        cycleNumber: 1
      };
    }

    // Add related data if provided
    if (relatedApplicationId) feeData.relatedApplication = relatedApplicationId;
    if (relatedLeaseId) feeData.relatedLease = relatedLeaseId;

    // Add creation to history
    feeData.history = [{
      action: 'created',
      details: 'Fee created by admin',
      newStatus: 'pending'
    }];

    const fee = new Fee(feeData);
    await fee.save();

    const populatedFee = await Fee.findById(fee._id)
      .populate('landlord', 'name email')
      .populate('property', 'title location price');

    res.status(201).json({
      message: 'Fee created successfully',
      fee: populatedFee
    });
  } catch (error) {
    console.error('Error creating fee:', error);
    res.status(500).json({ message: 'Error creating fee', error: error.message });
  }
};

// Get single fee with full details
export const getFeeById = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id)
      .populate('landlord', 'name email phone')
      .populate('property', 'title location price status')
      .populate('relatedApplication', 'status createdAt')
      .populate('relatedLease', 'startDate endDate')
      .populate('history.userId', 'name');

    if (!fee) {
      return res.status(404).json({ message: 'Fee not found' });
    }

    res.json(fee);
  } catch (error) {
    console.error('Error fetching fee:', error);
    res.status(500).json({ message: 'Error fetching fee', error: error.message });
  }
};

// Update fee
export const updateFee = async (req, res) => {
  try {
    const {
      category,
      baseAmount,
      additionalFees,
      status,
      dueDate,
      description,
      notes,
      adminNotes
    } = req.body;

    const fee = await Fee.findById(req.params.id);
    if (!fee) {
      return res.status(404).json({ message: 'Fee not found' });
    }

    // Update fields
    if (category) fee.category = category;
    if (baseAmount !== undefined) fee.baseAmount = parseFloat(baseAmount);
    if (additionalFees !== undefined) fee.additionalFees = parseFloat(additionalFees);
    if (status) fee.status = status;
    if (dueDate) fee.dueDate = new Date(dueDate);
    if (description) fee.description = description;
    if (notes !== undefined) fee.notes = notes;
    if (adminNotes !== undefined) fee.adminNotes = adminNotes;

    // Add update to history
    fee.history.push({
      action: 'updated',
      details: 'Fee updated by admin',
      newStatus: fee.status
    });

    await fee.save();

    const updatedFee = await Fee.findById(fee._id)
      .populate('landlord', 'name email')
      .populate('property', 'title location price');

    res.json({
      message: 'Fee updated successfully',
      fee: updatedFee
    });
  } catch (error) {
    console.error('Error updating fee:', error);
    res.status(500).json({ message: 'Error updating fee', error: error.message });
  }
};

// Mark fee as paid
export const markFeeAsPaid = async (req, res) => {
  try {
    const { paymentMethod, transactionId } = req.body;

    const fee = await Fee.findById(req.params.id);
    if (!fee) {
      return res.status(404).json({ message: 'Fee not found' });
    }

    await fee.markAsPaid(paymentMethod, transactionId, req.user._id);

    const updatedFee = await Fee.findById(fee._id)
      .populate('landlord', 'name email')
      .populate('property', 'title location price');

    res.json({
      message: 'Fee marked as paid successfully',
      fee: updatedFee
    });
  } catch (error) {
    console.error('Error marking fee as paid:', error);
    res.status(500).json({ message: 'Error marking fee as paid', error: error.message });
  }
};

// Generate recurring fees
export const generateRecurringFees = async (req, res) => {
  try {
    const { category } = req.query;
    const query = { 'recurring.isRecurring': true, status: 'paid' };
    if (category) query.category = category;

    const paidRecurringFees = await Fee.find(query)
      .populate('property', 'title status')
      .populate('landlord', 'name');

    const results = [];
    let createdCount = 0;
    let skippedCount = 0;

    for (const fee of paidRecurringFees) {
      try {
        // Check if next fee already exists
        const nextDueDate = fee.calculateNextDueDate();
        if (!nextDueDate) continue;

        const existingFee = await Fee.findOne({
          property: fee.property._id,
          category: fee.category,
          'recurring.parentFeeId': fee._id,
          dueDate: {
            $gte: new Date(nextDueDate.getFullYear(), nextDueDate.getMonth(), 1),
            $lt: new Date(nextDueDate.getFullYear(), nextDueDate.getMonth() + 1, 1)
          }
        });

        if (existingFee) {
          results.push({
            property: fee.property.title,
            landlord: fee.landlord.name,
            category: fee.category,
            status: 'skipped',
            reason: 'Next recurring fee already exists'
          });
          skippedCount++;
          continue;
        }

        // Create next recurring fee
        const nextFee = await Fee.createRecurringFee(fee, nextDueDate);
        
        results.push({
          property: fee.property.title,
          landlord: fee.landlord.name,
          category: fee.category,
          status: 'created',
          feeId: nextFee._id,
          dueDate: nextDueDate
        });
        createdCount++;

      } catch (error) {
        results.push({
          property: fee.property?.title || 'Unknown',
          landlord: fee.landlord?.name || 'Unknown',
          category: fee.category,
          status: 'error',
          error: error.message
        });
      }
    }

    res.json({
      message: 'Recurring fees generation completed',
      summary: {
        total: paidRecurringFees.length,
        created: createdCount,
        skipped: skippedCount,
        errors: results.filter(r => r.status === 'error').length
      },
      results
    });
  } catch (error) {
    console.error('Error generating recurring fees:', error);
    res.status(500).json({ message: 'Error generating recurring fees', error: error.message });
  }
};

// Get overdue fees
export const getOverdueFees = async (req, res) => {
  try {
    const overdueFees = await Fee.find({
      status: { $in: ['pending'] },
      dueDate: { $lt: new Date() }
    })
      .populate('landlord', 'name email')
      .populate('property', 'title location price')
      .sort('dueDate');

    res.json(overdueFees);
  } catch (error) {
    console.error('Error fetching overdue fees:', error);
    res.status(500).json({ message: 'Error fetching overdue fees', error: error.message });
  }
};

// Get fees by landlord
export const getFeesByLandlord = async (req, res) => {
  try {
    const { landlordId } = req.params;
    const { status, category, feeType } = req.query;

    const query = { landlord: landlordId };
    if (status) query.status = status;
    if (category) query.category = category;
    if (feeType) query.feeType = feeType;

    const fees = await Fee.find(query)
      .populate('property', 'title location price')
      .sort('-createdAt');

    res.json(fees);
  } catch (error) {
    console.error('Error fetching landlord fees:', error);
    res.status(500).json({ message: 'Error fetching landlord fees', error: error.message });
  }
};

// Get fees by property
export const getFeesByProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { status, category, feeType } = req.query;

    const query = { property: propertyId };
    if (status) query.status = status;
    if (category) query.category = category;
    if (feeType) query.feeType = feeType;

    const fees = await Fee.find(query)
      .populate('landlord', 'name email')
      .sort('-createdAt');

    res.json(fees);
  } catch (error) {
    console.error('Error fetching property fees:', error);
    res.status(500).json({ message: 'Error fetching property fees', error: error.message });
  }
};

// Delete fee
export const deleteFee = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee) {
      return res.status(404).json({ message: 'Fee not found' });
    }

    await Fee.findByIdAndDelete(req.params.id);

    res.json({ message: 'Fee deleted successfully' });
  } catch (error) {
    console.error('Error deleting fee:', error);
    res.status(500).json({ message: 'Error deleting fee', error: error.message });
  }
};

// Generate monthly fees for all properties
export const generateMonthlyFeesForAllProperties = async (req, res) => {
  try {
    const { reason } = req.body;
    
    // Get monthly fee percentage from settings
    const monthlyFeePercentage = await Settings.getValue('monthly_fee_percentage', 5);
    
    // Get all active properties
    const properties = await Property.find({ 
      status: { $in: ['active', 'rented'] },
      available: true 
    }).populate('landlord');

    if (properties.length === 0) {
      return res.json({
        message: 'No active properties found for monthly fee generation',
        summary: {
          total: 0,
          created: 0,
          skipped: 0,
          errors: 0
        },
        results: []
      });
    }

    const results = [];
    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const property of properties) {
      try {
        // Check if monthly fee already exists for this month
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const existingFee = await Fee.findOne({
          property: property._id,
          category: 'monthly_fee',
          dueDate: {
            $gte: startOfMonth,
            $lte: endOfMonth
          }
        });

        if (existingFee) {
          results.push({
            property: property.title,
            landlord: property.landlord.name,
            status: 'skipped',
            reason: 'Monthly fee already exists for this month'
          });
          skippedCount++;
          continue;
        }

        // Calculate monthly fee amount
        const monthlyFeeAmount = (property.price * monthlyFeePercentage) / 100;

        // Create monthly fee
        const monthlyFee = new Fee({
          property: property._id,
          landlord: property.landlord._id,
          category: 'monthly_fee',
          feeType: 'recurring',
          baseAmount: monthlyFeeAmount,
          totalAmount: monthlyFeeAmount,
          status: 'pending',
          dueDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15), // Due on 15th of each month
          description: `Monthly service fee for ${property.title}`,
          notes: `Generated automatically - ${monthlyFeePercentage}% of monthly rent`,
          recurring: {
            isRecurring: true,
            interval: 'monthly',
            cycleNumber: 1
          },
          history: [{
            action: 'created',
            details: `Monthly fee generated automatically (${monthlyFeePercentage}% of rent)`,
            newStatus: 'pending'
          }]
        });

        await monthlyFee.save();
        
        results.push({
          property: property.title,
          landlord: property.landlord.name,
          status: 'created',
          feeId: monthlyFee._id,
          amount: monthlyFeeAmount,
          dueDate: monthlyFee.dueDate
        });
        createdCount++;

      } catch (error) {
        results.push({
          property: property.title,
          landlord: property.landlord?.name || 'Unknown',
          status: 'error',
          error: error.message
        });
        errorCount++;
      }
    }

    res.json({
      message: 'Monthly fees generation completed',
      summary: {
        total: properties.length,
        created: createdCount,
        skipped: skippedCount,
        errors: errorCount
      },
      results,
      settings: {
        monthlyFeePercentage
      }
    });
  } catch (error) {
    console.error('Error generating monthly fees:', error);
    res.status(500).json({ message: 'Error generating monthly fees', error: error.message });
  }
}; 