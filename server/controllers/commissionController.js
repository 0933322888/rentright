import Commission from '../models/commissionModel.js';
import Property from '../models/propertyModel.js';
import User from '../models/userModel.js';
import Payment from '../models/paymentModel.js';
import Settings from '../models/settingsModel.js';

// Get all commissions with filtering and pagination
export const getAllCommissions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      type,
      landlordId,
      propertyId,
      startDate,
      endDate,
      sortBy = 'dueDate',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    // Apply filters
    if (status) query.status = status;
    if (type) query.type = type;
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

    const [commissions, total] = await Promise.all([
      Commission.find(query)
        .populate('landlord', 'name email')
        .populate('property', 'title location price commissionStatus monthlyFeeStatus monthlyFeeAmount monthlyFeeDueDate')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Commission.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      commissions,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching commissions:', error);
    res.status(500).json({ message: 'Error fetching commissions', error: error.message });
  }
};

// Get commission statistics
export const getCommissionStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const [
      totalCommissions,
      pendingCommissions,
      paidCommissions,
      overdueCommissions,
      totalAmount,
      paidAmount,
      pendingAmount,
      overdueAmount,
      commissionsByType,
      commissionsByStatus
    ] = await Promise.all([
      Commission.countDocuments(dateFilter),
      Commission.countDocuments({ ...dateFilter, status: 'pending' }),
      Commission.countDocuments({ ...dateFilter, status: 'paid' }),
      Commission.countDocuments({ ...dateFilter, status: 'overdue' }),
      Commission.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Commission.aggregate([
        { $match: { ...dateFilter, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Commission.aggregate([
        { $match: { ...dateFilter, status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Commission.aggregate([
        { $match: { ...dateFilter, status: 'overdue' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Commission.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$type', count: { $sum: 1 }, total: { $sum: '$amount' } } }
      ]),
      Commission.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$amount' } } }
      ])
    ]);

    res.json({
      totalCommissions,
      pendingCommissions,
      paidCommissions,
      overdueCommissions,
      totalAmount: totalAmount[0]?.total || 0,
      paidAmount: paidAmount[0]?.total || 0,
      pendingAmount: pendingAmount[0]?.total || 0,
      overdueAmount: overdueAmount[0]?.total || 0,
      commissionsByType,
      commissionsByStatus
    });
  } catch (error) {
    console.error('Error fetching commission stats:', error);
    res.status(500).json({ message: 'Error fetching commission statistics', error: error.message });
  }
};

// Get single commission
export const getCommissionById = async (req, res) => {
  try {
    const commission = await Commission.findById(req.params.id)
      .populate('landlord', 'name email phone')
      .populate('property', 'title location price status');

    if (!commission) {
      return res.status(404).json({ message: 'Commission not found' });
    }

    res.json(commission);
  } catch (error) {
    console.error('Error fetching commission:', error);
    res.status(500).json({ message: 'Error fetching commission', error: error.message });
  }
};

// Create new commission
export const createCommission = async (req, res) => {
  try {
    const {
      landlordId,
      propertyId,
      type,
      amount,
      description,
      dueDate,
      isRecurring,
      recurringInterval,
      notes
    } = req.body;

    // Validate required fields
    if (!landlordId || !propertyId || !type || !amount || !description || !dueDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if landlord and property exist
    const [landlord, property] = await Promise.all([
      User.findById(landlordId),
      Property.findById(propertyId)
    ]);

    if (!landlord || landlord.role !== 'landlord') {
      return res.status(400).json({ message: 'Invalid landlord' });
    }

    if (!property) {
      return res.status(400).json({ message: 'Property not found' });
    }

    const commission = new Commission({
      landlord: landlordId,
      property: propertyId,
      type,
      amount: parseFloat(amount),
      description,
      dueDate: new Date(dueDate),
      isRecurring: isRecurring || false,
      recurringInterval: recurringInterval || 'monthly',
      notes,
      totalAmount: parseFloat(amount)
    });

    await commission.save();

    const populatedCommission = await Commission.findById(commission._id)
      .populate('landlord', 'name email')
      .populate('property', 'title location price');

    res.status(201).json({
      message: 'Commission created successfully',
      commission: populatedCommission
    });
  } catch (error) {
    console.error('Error creating commission:', error);
    res.status(500).json({ message: 'Error creating commission', error: error.message });
  }
};

// Update commission
export const updateCommission = async (req, res) => {
  try {
    const {
      type,
      amount,
      description,
      status,
      dueDate,
      paidDate,
      paymentMethod,
      transactionId,
      notes,
      adminNotes,
      lateFees
    } = req.body;

    const commission = await Commission.findById(req.params.id);
    if (!commission) {
      return res.status(404).json({ message: 'Commission not found' });
    }

    // Update fields
    if (type) commission.type = type;
    if (amount !== undefined) commission.amount = parseFloat(amount);
    if (description) commission.description = description;
    if (status) commission.status = status;
    if (dueDate) commission.dueDate = new Date(dueDate);
    if (paidDate) commission.paidDate = new Date(paidDate);
    if (paymentMethod) commission.paymentMethod = paymentMethod;
    if (transactionId) commission.transactionId = transactionId;
    if (notes !== undefined) commission.notes = notes;
    if (adminNotes !== undefined) commission.adminNotes = adminNotes;
    if (lateFees !== undefined) commission.lateFees = parseFloat(lateFees);

    await commission.save();

    const updatedCommission = await Commission.findById(commission._id)
      .populate('landlord', 'name email')
      .populate('property', 'title location price');

    res.json({
      message: 'Commission updated successfully',
      commission: updatedCommission
    });
  } catch (error) {
    console.error('Error updating commission:', error);
    res.status(500).json({ message: 'Error updating commission', error: error.message });
  }
};

// Delete commission
export const deleteCommission = async (req, res) => {
  try {
    const commission = await Commission.findById(req.params.id);
    if (!commission) {
      return res.status(404).json({ message: 'Commission not found' });
    }

    await Commission.findByIdAndDelete(req.params.id);

    res.json({ message: 'Commission deleted successfully' });
  } catch (error) {
    console.error('Error deleting commission:', error);
    res.status(500).json({ message: 'Error deleting commission', error: error.message });
  }
};

// Mark commission as paid
export const markCommissionAsPaid = async (req, res) => {
  try {
    const { paymentMethod, transactionId, paidDate } = req.body;

    const commission = await Commission.findById(req.params.id);
    if (!commission) {
      return res.status(404).json({ message: 'Commission not found' });
    }

    commission.status = 'paid';
    commission.paidDate = paidDate ? new Date(paidDate) : new Date();
    commission.paymentMethod = paymentMethod || commission.paymentMethod;
    if (transactionId) commission.transactionId = transactionId;

    await commission.save();

    // Update property monthly fee status if this is a monthly fee commission
    if (commission.type === 'monthly_fee') {
      await updatePropertyMonthlyFeeStatus(commission.property, 'paid');
    }

    const updatedCommission = await Commission.findById(commission._id)
      .populate('landlord', 'name email')
      .populate('property', 'title location price status');

    res.json({
      message: 'Commission marked as paid successfully',
      commission: updatedCommission
    });
  } catch (error) {
    console.error('Error marking commission as paid:', error);
    res.status(500).json({ message: 'Error marking commission as paid', error: error.message });
  }
};

// Get overdue commissions
export const getOverdueCommissions = async (req, res) => {
  try {
    const overdueCommissions = await Commission.find({
      status: { $in: ['pending'] },
      dueDate: { $lt: new Date() }
    })
      .populate('landlord', 'name email')
      .populate('property', 'title location price')
      .sort('dueDate');

    res.json(overdueCommissions);
  } catch (error) {
    console.error('Error fetching overdue commissions:', error);
    res.status(500).json({ message: 'Error fetching overdue commissions', error: error.message });
  }
};

// Get commissions by landlord
export const getCommissionsByLandlord = async (req, res) => {
  try {
    const { landlordId } = req.params;
    const { status, type } = req.query;

    const query = { landlord: landlordId };
    if (status) query.status = status;
    if (type) query.type = type;

    const commissions = await Commission.find(query)
      .populate('property', 'title location price')
      .sort('-createdAt');

    res.json(commissions);
  } catch (error) {
    console.error('Error fetching landlord commissions:', error);
    res.status(500).json({ message: 'Error fetching landlord commissions', error: error.message });
  }
};

// Get commissions by property
export const getCommissionsByProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { status, type } = req.query;

    const query = { property: propertyId };
    if (status) query.status = status;
    if (type) query.type = type;

    const commissions = await Commission.find(query)
      .populate('landlord', 'name email')
      .sort('-createdAt');

    res.json(commissions);
  } catch (error) {
    console.error('Error fetching property commissions:', error);
    res.status(500).json({ message: 'Error fetching property commissions', error: error.message });
  }
};

// Create monthly fee commission for a property
export const createMonthlyFeeCommission = async (propertyId) => {
  try {
    const property = await Property.findById(propertyId).populate('landlord', 'name email');
    if (!property) {
      throw new Error('Property not found');
    }

    // Get monthly fee percentage from settings
    const monthlyFeePercentage = await Settings.getValue('monthly_fee_percentage', 5);
    const monthlyFeeAmount = (property.price * monthlyFeePercentage) / 100;

    if (monthlyFeeAmount <= 0) {
      return null; // No monthly fee to generate
    }

    // Check if a monthly fee commission already exists for this month
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const existingCommission = await Commission.findOne({
      property: propertyId,
      type: 'monthly_fee',
      dueDate: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    });

    if (existingCommission) {
      return existingCommission; // Already exists for this month
    }

    // Create new monthly fee commission
    const monthlyFeeCommission = new Commission({
      landlord: property.landlord._id,
      property: propertyId,
      type: 'monthly_fee',
      amount: monthlyFeeAmount,
      description: `Monthly fee for ${property.title} (${monthlyFeePercentage}% of rent)`,
      status: 'pending',
      dueDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 15), // Due on 15th of next month
      isRecurring: true,
      recurringInterval: 'monthly',
      notes: `Automatically generated monthly fee - ${monthlyFeePercentage}% of monthly rent`,
      totalAmount: monthlyFeeAmount
    });

    await monthlyFeeCommission.save();

    return monthlyFeeCommission;
  } catch (error) {
    console.error('Error creating monthly fee commission:', error);
    throw error;
  }
};

// Generate monthly fees for all properties
export const generateMonthlyFees = async (req, res) => {
  try {
    // Get monthly fee percentage from settings
    const monthlyFeePercentage = await Settings.getValue('monthly_fee_percentage', 5);
    
    // Get all active properties
    const properties = await Property.find({
      status: { $in: ['active', 'rented'] },
      available: true
    }).populate('landlord', 'name email');

    const results = [];
    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const property of properties) {
      try {
        const commission = await createMonthlyFeeCommission(property._id);
        if (commission) {
          results.push({
            property: property.title,
            landlord: property.landlord.name,
            amount: commission.amount,
            status: 'created',
            commissionId: commission._id
          });
          createdCount++;
        } else {
          results.push({
            property: property.title,
            landlord: property.landlord.name,
            amount: 0,
            status: 'skipped',
            reason: 'Already exists for this month or no fee to generate'
          });
          skippedCount++;
        }
      } catch (error) {
        results.push({
          property: property.title,
          landlord: property.landlord?.name || 'Unknown',
          amount: 0,
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

// Update property monthly fee status when commission is paid
export const updatePropertyMonthlyFeeStatus = async (propertyId, status) => {
  try {
    const property = await Property.findById(propertyId);
    if (!property) {
      throw new Error('Property not found');
    }

    property.monthlyFeeStatus = status;
    if (status === 'paid') {
      property.lastMonthlyFeePaid = new Date();
    }
    await property.save();
  } catch (error) {
    console.error('Error updating property monthly fee status:', error);
    throw error;
  }
}; 