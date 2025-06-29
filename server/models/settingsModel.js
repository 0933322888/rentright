import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['commission', 'fees', 'system', 'notifications', 'other'],
    default: 'system'
  },
  dataType: {
    type: String,
    enum: ['number', 'string', 'boolean', 'object', 'array'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  history: [{
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    reason: String
  }]
}, {
  timestamps: true
});

// Index for efficient queries
settingsSchema.index({ key: 1 });
settingsSchema.index({ category: 1 });
settingsSchema.index({ isActive: 1 });

// Pre-save middleware to add to history
settingsSchema.pre('save', function(next) {
  if (this.isModified('value') && this.history.length > 0) {
    const previousValue = this.history[this.history.length - 1].newValue;
    if (JSON.stringify(previousValue) !== JSON.stringify(this.value)) {
      this.history.push({
        oldValue: previousValue,
        newValue: this.value,
        updatedAt: new Date()
      });
    }
  }
  next();
});

// Static method to get setting value
settingsSchema.statics.getValue = async function(key, defaultValue = null) {
  try {
    const setting = await this.findOne({ key, isActive: true });
    return setting ? setting.value : defaultValue;
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return defaultValue;
  }
};

// Static method to set setting value
settingsSchema.statics.setValue = async function(key, value, description = '', category = 'system', dataType = 'string', userId = null) {
  try {
    const setting = await this.findOneAndUpdate(
      { key },
      {
        value,
        description,
        category,
        dataType,
        updatedBy: userId,
        $push: {
          history: {
            newValue: value,
            updatedBy: userId,
            updatedAt: new Date()
          }
        }
      },
      { upsert: true, new: true }
    );
    
    return setting;
  } catch (error) {
    console.error(`Error setting ${key}:`, error);
    throw error;
  }
};

// Static method to get all settings by category
settingsSchema.statics.getByCategory = async function(category) {
  try {
    return await this.find({ category, isActive: true }).sort('key');
  } catch (error) {
    console.error(`Error getting settings for category ${category}:`, error);
    return [];
  }
};

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings; 