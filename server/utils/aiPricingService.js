// AI Pricing Service for Property Rental Price Suggestions
// This service analyzes property features and location to suggest appropriate rental prices

const calculateBasePrice = (propertyType, bedrooms, bathrooms, squareFootage) => {
  // Base prices per bedroom by property type (in USD)
  const basePrices = {
    apartment: 800,
    house: 1000,
    condo: 900,
    townhouse: 950,
    commercial: 1200
  };

  const basePrice = basePrices[propertyType] || 800;
  
  // Calculate price based on bedrooms and bathrooms
  let price = basePrice * bedrooms;
  
  // Add value for additional bathrooms
  if (bathrooms > bedrooms) {
    price += (bathrooms - bedrooms) * 200;
  }
  
  // Adjust for square footage
  if (squareFootage) {
    const pricePerSqFt = 0.8; // $0.80 per square foot
    const sqFtAdjustment = squareFootage * pricePerSqFt;
    price = Math.max(price, sqFtAdjustment * 0.7); // Use the higher of the two, but weight square footage less
  }
  
  return Math.round(price);
};

const calculateLocationMultiplier = (city, state) => {
  // Location-based price multipliers
  const locationMultipliers = {
    // Major cities with higher cost of living
    'New York': 1.8,
    'Los Angeles': 1.6,
    'San Francisco': 1.7,
    'Chicago': 1.3,
    'Boston': 1.4,
    'Seattle': 1.5,
    'Denver': 1.2,
    'Austin': 1.1,
    'Miami': 1.3,
    'Las Vegas': 1.0,
    'Phoenix': 0.9,
    'Dallas': 1.0,
    'Houston': 0.9,
    'Atlanta': 1.0,
    'Philadelphia': 1.2,
    'Washington': 1.4,
    'Portland': 1.3,
    'Nashville': 1.0,
    'Charlotte': 0.9,
    'Orlando': 0.9,
    'Tampa': 0.9,
    'San Diego': 1.5,
    'Minneapolis': 1.1,
    'Detroit': 0.7,
    'Cleveland': 0.8,
    'Pittsburgh': 0.9,
    'Cincinnati': 0.8,
    'Kansas City': 0.8,
    'St. Louis': 0.8,
    'Indianapolis': 0.8,
    'Columbus': 0.8,
    'Milwaukee': 0.8,
    'Baltimore': 1.1,
    'Memphis': 0.7,
    'Louisville': 0.8,
    'Richmond': 0.9,
    'New Orleans': 0.9,
    'Salt Lake City': 1.0,
    'Raleigh': 0.9,
    'Buffalo': 0.8,
    'Hartford': 1.0,
    'Birmingham': 0.7,
    'Tucson': 0.8,
    'Fresno': 0.9,
    'Sacramento': 1.1,
    'Albuquerque': 0.8,
    'Omaha': 0.8,
    'Tulsa': 0.7,
    'Wichita': 0.7,
    'Arlington': 1.0,
    'Aurora': 1.0,
    'Bakersfield': 0.8,
    'Toledo': 0.7,
    'Anaheim': 1.3,
    'Stockton': 0.9,
    'Riverside': 1.0,
    'Corpus Christi': 0.8,
    'Lexington': 0.8,
    'Henderson': 1.0,
    'Greensboro': 0.8,
    'Plano': 1.0,
    'Newark': 1.2,
    'Lincoln': 0.8,
    'Orlando': 0.9,
    'Irvine': 1.4,
    'Durham': 0.9,
    'Chula Vista': 1.2,
    'Jersey City': 1.3,
    'Chandler': 0.9,
    'Fort Wayne': 0.7,
    'Lubbock': 0.7,
    'Buffalo': 0.8,
    'Madison': 1.0,
    'Laredo': 0.7,
    'Lubbock': 0.7,
    'Scottsdale': 1.1,
    'Reno': 1.0,
    'Glendale': 1.0,
    'Hialeah': 0.9,
    'Garland': 0.9,
    'Fremont': 1.4,
    'Norfolk': 0.9,
    'Chesapeake': 0.9,
    'Richmond': 0.9,
    'Baton Rouge': 0.8,
    'Providence': 1.0,
    'Winston-Salem': 0.8,
    'Jackson': 0.7,
    'Anchorage': 1.1,
    'Fort Lauderdale': 1.1,
    'Rochester': 0.8,
    'Joliet': 0.9,
    'Modesto': 0.9,
    'Montgomery': 0.7,
    'Des Moines': 0.8,
    'Fayetteville': 0.7,
    'Shreveport': 0.7,
    'Akron': 0.7,
    'Tacoma': 1.2,
    'Oxnard': 1.2,
    'Fontana': 1.0,
    'Columbus': 0.8,
    'Montgomery': 0.7,
    'Moreno Valley': 1.0,
    'Huntington Beach': 1.3,
    'Yonkers': 1.2,
    'Glendale': 1.0,
    'Aurora': 1.0,
    'Ontario': 1.0,
    'Rancho Cucamonga': 1.1,
    'Santa Clarita': 1.2,
    'Overland Park': 0.9,
    'Temecula': 1.1,
    'Springfield': 0.8,
    'Eugene': 1.0,
    'Pembroke Pines': 0.9,
    'Salem': 0.9,
    'Cape Coral': 0.9,
    'Peoria': 0.8,
    'Sioux Falls': 0.8,
    'Springfield': 0.8,
    'Elk Grove': 1.1,
    'Corona': 1.1,
    'Palmdale': 1.0,
    'Salinas': 1.1,
    'Pomona': 1.1,
    'Hayward': 1.4,
    'Escondido': 1.2,
    'Killeen': 0.7,
    'Naperville': 1.1,
    'McAllen': 0.7,
    'Sunnyvale': 1.5,
    'Concord': 1.3,
    'Lancaster': 1.0,
    'Palmdale': 1.0,
    'Fort Collins': 1.0,
    'Sterling Heights': 0.9,
    'Elizabeth': 1.1,
    'Hartford': 1.0,
    'Cedar Rapids': 0.8,
    'New Haven': 1.0,
    'Macon': 0.7,
    'Topeka': 0.7,
    'Thousand Oaks': 1.2,
    'McKinney': 1.0,
    'West Valley City': 0.9,
    'Columbia': 0.8,
    'Kansas City': 0.8,
    'Waterbury': 0.9,
    'Olathe': 0.9,
    'Simi Valley': 1.2,
    'Clarksville': 0.7,
    'Warren': 0.9,
    'Hampton': 0.9,
    'Torrance': 1.3,
    'Cary': 0.9,
    'Midland': 0.8,
    'Rockford': 0.7,
    'Paterson': 1.0,
    'Newport News': 0.9,
    'High Point': 0.8,
    'Downey': 1.2,
    'West Covina': 1.1,
    'Antioch': 1.2,
    'Lakeland': 0.8,
    'Evansville': 0.7,
    'Tempe': 0.9,
    'Pasadena': 1.2,
    'Pasadena': 1.1,
    'Arvada': 1.0,
    'Inglewood': 1.1,
    'Norman': 0.8,
    'Rochester': 0.8,
    'Berkeley': 1.5,
    'Provo': 0.9,
    'El Monte': 1.1,
    'Columbia': 0.8,
    'Lansing': 0.8,
    'Pomona': 1.1,
    'Abilene': 0.7,
    'Murfreesboro': 0.8,
    'Visalia': 0.8,
    'Thousand Oaks': 1.2,
    'Fullerton': 1.2,
    'Roseville': 1.1,
    'Surprise': 0.9
  };

  // Check for exact city match first
  if (locationMultipliers[city]) {
    return locationMultipliers[city];
  }

  // Check for state-level multipliers as fallback
  const stateMultipliers = {
    'CA': 1.3, // California
    'NY': 1.4, // New York
    'TX': 0.9, // Texas
    'FL': 0.9, // Florida
    'IL': 1.1, // Illinois
    'PA': 0.9, // Pennsylvania
    'OH': 0.8, // Ohio
    'GA': 0.9, // Georgia
    'NC': 0.8, // North Carolina
    'MI': 0.8, // Michigan
    'NJ': 1.2, // New Jersey
    'VA': 1.0, // Virginia
    'WA': 1.2, // Washington
    'AZ': 0.9, // Arizona
    'MA': 1.3, // Massachusetts
    'TN': 0.8, // Tennessee
    'IN': 0.8, // Indiana
    'MO': 0.8, // Missouri
    'MD': 1.1, // Maryland
    'CO': 1.1, // Colorado
    'WI': 0.8, // Wisconsin
    'MN': 0.9, // Minnesota
    'SC': 0.8, // South Carolina
    'AL': 0.7, // Alabama
    'LA': 0.8, // Louisiana
    'KY': 0.7, // Kentucky
    'OR': 1.1, // Oregon
    'OK': 0.7, // Oklahoma
    'CT': 1.1, // Connecticut
    'UT': 0.9, // Utah
    'IA': 0.8, // Iowa
    'NV': 1.0, // Nevada
    'AR': 0.7, // Arkansas
    'MS': 0.6, // Mississippi
    'KS': 0.7, // Kansas
    'NE': 0.8, // Nebraska
    'ID': 0.8, // Idaho
    'NH': 1.0, // New Hampshire
    'HI': 1.4, // Hawaii
    'ME': 0.9, // Maine
    'RI': 1.0, // Rhode Island
    'MT': 0.8, // Montana
    'DE': 0.9, // Delaware
    'SD': 0.7, // South Dakota
    'ND': 0.7, // North Dakota
    'AK': 1.1, // Alaska
    'VT': 0.9, // Vermont
    'WY': 0.8, // Wyoming
    'WV': 0.6, // West Virginia
    'NM': 0.8, // New Mexico
    'DC': 1.5, // District of Columbia
    
    // Canadian Provinces and Territories
    'AB': 1.0, // Alberta
    'BC': 1.2, // British Columbia
    'MB': 0.8, // Manitoba
    'NB': 0.8, // New Brunswick
    'NL': 0.8, // Newfoundland and Labrador
    'NS': 0.8, // Nova Scotia
    'NT': 1.1, // Northwest Territories
    'NU': 1.2, // Nunavut
    'ON': 1.1, // Ontario
    'PE': 0.8, // Prince Edward Island
    'QC': 0.9, // Quebec
    'SK': 0.8, // Saskatchewan
    'YT': 1.0  // Yukon
  };

  return stateMultipliers[state] || 1.0; // Default to 1.0 if no match found
};

const calculateFeatureAdjustments = (features) => {
  let adjustment = 0;
  
  // Furnished properties typically cost 15-25% more
  if (features.furnished) {
    adjustment += 0.2; // 20% increase
  }
  
  // Parking adds value
  if (features.parking) {
    adjustment += 0.1; // 10% increase
  }
  
  // Pets allowed can add a small premium
  if (features.petsAllowed) {
    adjustment += 0.05; // 5% increase
  }
  
  return adjustment;
};

const generatePriceSuggestion = (propertyData) => {
  try {
    const {
      type,
      location,
      features
    } = propertyData;

    // Validate required fields
    if (!type || !location || !features) {
      throw new Error('Missing required property information');
    }

    if (!features.bedrooms || !features.bathrooms) {
      throw new Error('Bedrooms and bathrooms are required for price calculation');
    }

    // Calculate base price
    const basePrice = calculateBasePrice(
      type,
      features.bedrooms,
      features.bathrooms,
      features.squareFootage
    );

    // Apply location multiplier
    const locationMultiplier = calculateLocationMultiplier(location.city, location.state);
    let suggestedPrice = basePrice * locationMultiplier;

    // Apply feature adjustments
    const featureAdjustment = calculateFeatureAdjustments(features);
    suggestedPrice = suggestedPrice * (1 + featureAdjustment);

    // Round to nearest $50
    suggestedPrice = Math.round(suggestedPrice / 50) * 50;

    // Ensure minimum price
    suggestedPrice = Math.max(suggestedPrice, 500);

    // Generate price range (suggested price ± 10%)
    const minPrice = Math.round(suggestedPrice * 0.9 / 50) * 50;
    const maxPrice = Math.round(suggestedPrice * 1.1 / 50) * 50;

    return {
      suggestedPrice,
      priceRange: {
        min: minPrice,
        max: maxPrice
      },
      breakdown: {
        basePrice,
        locationMultiplier,
        featureAdjustment: featureAdjustment * 100, // Convert to percentage
        location: `${location.city}, ${location.state}`,
        propertyType: type,
        bedrooms: features.bedrooms,
        bathrooms: features.bathrooms,
        squareFootage: features.squareFootage,
        features: {
          furnished: features.furnished,
          parking: features.parking,
          petsAllowed: features.petsAllowed
        }
      }
    };
  } catch (error) {
    throw new Error(`Price calculation failed: ${error.message}`);
  }
};

export { generatePriceSuggestion }; 