import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Property from '../models/propertyModel.js';
import { geocodeExistingProperties } from '../utils/geocoding.js';

dotenv.config();

const geocodeProperties = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);

    
    const result = await geocodeExistingProperties(Property);
    
    if (result.errors.length > 0) {
      result.errors.forEach(error => console.log(error));
    }

  } catch (error) {
    console.error('Error during geocoding process:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  geocodeProperties();
}

export default geocodeProperties; 