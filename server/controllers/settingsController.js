import Settings from '../models/settingsModel.js';

// Get all settings
export const getAllSettings = async (req, res) => {
  try {
    const { category } = req.query;
    const query = { isActive: true };
    
    if (category) {
      query.category = category;
    }

    const settings = await Settings.find(query)
      .populate('updatedBy', 'name email')
      .populate('history.updatedBy', 'name')
      .sort('category key');

    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Error fetching settings', error: error.message });
  }
};

// Get settings by category
export const getSettingsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    const settings = await Settings.find({ category, isActive: true })
      .populate('updatedBy', 'name email')
      .sort('key');

    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings by category:', error);
    res.status(500).json({ message: 'Error fetching settings', error: error.message });
  }
};

// Get specific setting
export const getSetting = async (req, res) => {
  try {
    const { key } = req.params;
    
    const setting = await Settings.findOne({ key, isActive: true })
      .populate('updatedBy', 'name email')
      .populate('history.updatedBy', 'name');

    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }

    res.json(setting);
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ message: 'Error fetching setting', error: error.message });
  }
};

// Create or update setting
export const createOrUpdateSetting = async (req, res) => {
  try {
    const {
      key,
      value,
      description,
      category,
      dataType,
      reason
    } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({ message: 'Key and value are required' });
    }

    const setting = await Settings.setValue(
      key,
      value,
      description || '',
      category || 'system',
      dataType || 'string',
      req.user._id
    );

    // Add reason to history if provided
    if (reason && setting.history.length > 0) {
      setting.history[setting.history.length - 1].reason = reason;
      await setting.save();
    }

    const populatedSetting = await Settings.findById(setting._id)
      .populate('updatedBy', 'name email')
      .populate('history.updatedBy', 'name');

    res.json({
      message: 'Setting updated successfully',
      setting: populatedSetting
    });
  } catch (error) {
    console.error('Error creating/updating setting:', error);
    res.status(500).json({ message: 'Error creating/updating setting', error: error.message });
  }
};

// Delete setting (soft delete)
export const deleteSetting = async (req, res) => {
  try {
    const { key } = req.params;
    
    const setting = await Settings.findOneAndUpdate(
      { key },
      { isActive: false },
      { new: true }
    );

    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }

    res.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    console.error('Error deleting setting:', error);
    res.status(500).json({ message: 'Error deleting setting', error: error.message });
  }
};

// Get commission settings specifically
export const getCommissionSettings = async (req, res) => {
  try {
    const settings = await Settings.find({ 
      category: 'commission', 
      isActive: true 
    }).sort('key');

    // Create a default structure for commission settings
    const commissionSettings = {
      monthlyFeePercentage: settings.find(s => s.key === 'monthly_fee_percentage')?.value ?? 1.5,
      listingFeeAmount: settings.find(s => s.key === 'listing_fee_amount')?.value ?? 0,
      processingFeeAmount: settings.find(s => s.key === 'processing_fee_amount')?.value ?? 0,
      lateFeePercentage: settings.find(s => s.key === 'late_fee_percentage')?.value ?? 0,
      settings: settings
    };

    res.json(commissionSettings);
  } catch (error) {
    console.error('Error fetching commission settings:', error);
    res.status(500).json({ message: 'Error fetching commission settings', error: error.message });
  }
};

// Update commission settings
export const updateCommissionSettings = async (req, res) => {
  try {
    const {
      monthlyFeePercentage,
      listingFeeAmount,
      processingFeeAmount,
      lateFeePercentage,
      reason
    } = req.body;

    const updates = [];

    // Update monthly fee percentage
    if (monthlyFeePercentage !== null && monthlyFeePercentage !== undefined && !isNaN(monthlyFeePercentage)) {
      const setting = await Settings.setValue(
        'monthly_fee_percentage',
        parseFloat(monthlyFeePercentage),
        'Monthly fee percentage applied to all properties',
        'commission',
        'number',
        req.user._id
      );
      updates.push(setting);
    }

    // Update listing fee amount
    if (listingFeeAmount !== null && listingFeeAmount !== undefined && !isNaN(listingFeeAmount)) {
      const setting = await Settings.setValue(
        'listing_fee_amount',
        parseFloat(listingFeeAmount),
        'Standard listing fee amount',
        'commission',
        'number',
        req.user._id
      );
      updates.push(setting);
    }

    // Update processing fee amount
    if (processingFeeAmount !== null && processingFeeAmount !== undefined && !isNaN(processingFeeAmount)) {
      const setting = await Settings.setValue(
        'processing_fee_amount',
        parseFloat(processingFeeAmount),
        'Standard processing fee amount',
        'commission',
        'number',
        req.user._id
      );
      updates.push(setting);
    }

    // Update late fee percentage
    if (lateFeePercentage !== null && lateFeePercentage !== undefined && !isNaN(lateFeePercentage)) {
      const setting = await Settings.setValue(
        'late_fee_percentage',
        parseFloat(lateFeePercentage),
        'Late fee percentage applied to overdue payments',
        'commission',
        'number',
        req.user._id
      );
      updates.push(setting);
    }

    // Add reason to history if provided
    if (reason) {
      for (const setting of updates) {
        if (setting.history.length > 0) {
          setting.history[setting.history.length - 1].reason = reason;
          await setting.save();
        }
      }
    }

    // Create the same structure as getCommissionSettings using the updated settings
    const commissionSettings = {
      monthlyFeePercentage: updates.find(s => s.key === 'monthly_fee_percentage')?.value ?? 1.5,
      listingFeeAmount: updates.find(s => s.key === 'listing_fee_amount')?.value ?? 0,
      processingFeeAmount: updates.find(s => s.key === 'processing_fee_amount')?.value ?? 0,
      lateFeePercentage: updates.find(s => s.key === 'late_fee_percentage')?.value ?? 0,
      settings: updates
    };

    res.json({
      message: 'Commission settings updated successfully',
      ...commissionSettings
    });
  } catch (error) {
    console.error('Error updating commission settings:', error);
    res.status(500).json({ message: 'Error updating commission settings', error: error.message });
  }
};

// Initialize default settings
export const initializeDefaultSettings = async (req, res) => {
  try {
    const defaultSettings = [
      {
        key: 'monthly_fee_percentage',
        value: 1.5,
        description: 'Monthly fee percentage applied to all properties',
        category: 'commission',
        dataType: 'number'
      },
      {
        key: 'listing_fee_amount',
        value: 0,
        description: 'Standard listing fee amount',
        category: 'commission',
        dataType: 'number'
      },
      {
        key: 'processing_fee_amount',
        value: 0,
        description: 'Standard processing fee amount',
        category: 'commission',
        dataType: 'number'
      },
      {
        key: 'late_fee_percentage',
        value: 0,
        description: 'Late fee percentage applied to overdue payments',
        category: 'commission',
        dataType: 'number'
      }
    ];

    const results = [];
    for (const setting of defaultSettings) {
      // Check if setting already exists
      const existingSetting = await Settings.findOne({ key: setting.key });
      
      if (!existingSetting) {
        // Only create if it doesn't exist
        const result = await Settings.setValue(
          setting.key,
          setting.value,
          setting.description,
          setting.category,
          setting.dataType,
          req.user._id
        );
        results.push(result);
      } else {
        // Add existing setting to results without modifying it
        results.push(existingSetting);
      }
    }

    res.json({
      message: 'Default settings initialized successfully',
      settings: results
    });
  } catch (error) {
    console.error('Error initializing default settings:', error);
    res.status(500).json({ message: 'Error initializing default settings', error: error.message });
  }
}; 