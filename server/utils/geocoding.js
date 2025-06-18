import axios from 'axios';

/**
 * Geocodes an address to get coordinates using OpenStreetMap's Nominatim API
 * @param {Object} location - Location object with street, city, state, zipCode
 * @returns {Promise<Array>} - Promise that resolves to [longitude, latitude] or null
 */
export const geocodeAddress = async (location) => {
  try {
    // Build the address string
    const addressParts = [
      location.street,
      location.city,
      location.state,
      location.zipCode
    ].filter(Boolean); // Remove empty/undefined values

    if (addressParts.length === 0) {
      console.log('No address parts provided for geocoding');
      return null;
    }

    const address = addressParts.join(', ');
    
    // Use Nominatim API (OpenStreetMap's geocoding service)
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: address,
        format: 'json',
        limit: 1,
        addressdetails: 1
      },
      headers: {
        'User-Agent': 'RentRight/1.0' // Required by Nominatim terms of service
      }
    });

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      const coordinates = [parseFloat(result.lon), parseFloat(result.lat)];
      
      console.log(`Geocoded address: ${address} -> [${coordinates[0]}, ${coordinates[1]}]`);
      return coordinates;
    } else {
      console.log(`No coordinates found for address: ${address}`);
      return null;
    }
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return null;
  }
};

/**
 * Geocodes an address with retry logic
 * @param {Object} location - Location object
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<Array>} - Promise that resolves to coordinates or null
 */
export const geocodeAddressWithRetry = async (location, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const coordinates = await geocodeAddress(location);
      if (coordinates) {
        return coordinates;
      }
      
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Geocoding attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      console.error(`Geocoding attempt ${attempt} failed:`, error.message);
      if (attempt === maxRetries) {
        throw error;
      }
    }
  }
  
  return null;
};

/**
 * Geocodes all properties that don't have coordinates
 * @param {Object} Property - Mongoose Property model
 * @returns {Promise<Object>} - Promise that resolves to summary of geocoding results
 */
export const geocodeExistingProperties = async (Property) => {
  try {
    // Find properties without coordinates
    const propertiesWithoutCoordinates = await Property.find({
      $or: [
        { 'location.coordinates': { $exists: false } },
        { 'location.coordinates': null },
        { 'location.coordinates': { $size: 0 } }
      ]
    });

    console.log(`Found ${propertiesWithoutCoordinates.length} properties without coordinates`);

    let successCount = 0;
    let failureCount = 0;
    const errors = [];

    for (const property of propertiesWithoutCoordinates) {
      try {
        if (property.location && (property.location.street || property.location.city)) {
          console.log(`Geocoding property: ${property.title} (${property._id})`);
          
          const coordinates = await geocodeAddressWithRetry(property.location);
          
          if (coordinates) {
            await Property.findByIdAndUpdate(property._id, {
              'location.coordinates': coordinates
            });
            successCount++;
            console.log(`Successfully geocoded property: ${property.title}`);
          } else {
            failureCount++;
            errors.push(`Could not geocode: ${property.title} (${property._id})`);
          }
        } else {
          failureCount++;
          errors.push(`Missing address information: ${property.title} (${property._id})`);
        }

        // Add a small delay between requests to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        failureCount++;
        errors.push(`Error geocoding ${property.title} (${property._id}): ${error.message}`);
      }
    }

    return {
      total: propertiesWithoutCoordinates.length,
      success: successCount,
      failure: failureCount,
      errors
    };
  } catch (error) {
    console.error('Error in geocodeExistingProperties:', error);
    throw error;
  }
}; 