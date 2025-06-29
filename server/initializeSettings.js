import Settings from './models/settingsModel.js';

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

export const initializeDefaultSettings = async () => {
  try {
    console.log('Checking for existing commission settings...');
    
    for (const setting of defaultSettings) {
      const existingSetting = await Settings.findOne({ key: setting.key });
      
      if (!existingSetting) {
        console.log(`Creating new setting: ${setting.key} = ${setting.value}`);
        
        // Create the setting directly without using setValue to avoid null user ID
        const newSetting = new Settings({
          key: setting.key,
          value: setting.value,
          description: setting.description,
          category: setting.category,
          dataType: setting.dataType,
          isActive: true,
          history: [{
            newValue: setting.value,
            updatedBy: null, // System initialization
            updatedAt: new Date()
          }]
        });
        await newSetting.save();
        console.log(`✓ Created setting: ${setting.key}`);
      } else {
        console.log(`✓ Setting already exists: ${setting.key} = ${existingSetting.value} (not overwriting)`);
      }
    }
    
    console.log('Commission settings check completed.');
  } catch (error) {
    console.error('Error checking commission settings:', error);
  }
};

// Run initialization if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  import('./config/db.js').then(async ({ default: connectDB }) => {
    await connectDB();
    await initializeDefaultSettings();
    process.exit(0);
  }).catch(error => {
    console.error('Error connecting to database:', error);
    process.exit(1);
  });
} 