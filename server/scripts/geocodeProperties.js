import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Property from '../models/propertyModel.js';
import { geocodeExistingProperties } from '../utils/geocoding.js';

dotenv.config();

const geocodeProperties = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('Starting geocoding process for existing properties...');
    
    const result = await geocodeExistingProperties(Property);
    
    console.log('\n=== Geocoding Summary ===');
    console.log(`Total properties processed: ${result.total}`);
    console.log(`Successfully geocoded: ${result.success}`);
    console.log(`Failed to geocode: ${result.failure}`);
    
    if (result.errors.length > 0) {
      console.log('\n=== Errors ===');
      result.errors.forEach(error => console.log(error));
    }

    console.log('\nGeocoding process completed!');
  } catch (error) {
    console.error('Error during geocoding process:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  geocodeProperties();
}

export default geocodeProperties; 