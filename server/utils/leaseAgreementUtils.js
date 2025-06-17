import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base directory for standard lease agreements
const LEASE_AGREEMENTS_DIR = path.join(__dirname, '..', 'lease-agreements');

// Valid locations
export const VALID_LOCATIONS = {
  CA: ['ON', 'BC', 'AB', 'QC', 'NS', 'NB', 'MB', 'SK', 'PE', 'NL', 'NT', 'NU', 'YT'],
  US: ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC']
};

// Ensure base directory exists
if (!fs.existsSync(LEASE_AGREEMENTS_DIR)) {
  fs.mkdirSync(LEASE_AGREEMENTS_DIR, { recursive: true });
}

// Create country and region directories
Object.entries(VALID_LOCATIONS).forEach(([country, regions]) => {
  const countryDir = path.join(LEASE_AGREEMENTS_DIR, country);
  if (!fs.existsSync(countryDir)) {
    fs.mkdirSync(countryDir, { recursive: true });
  }
  regions.forEach(region => {
    const regionDir = path.join(countryDir, region);
    if (!fs.existsSync(regionDir)) {
      fs.mkdirSync(regionDir, { recursive: true });
    }
  });
});

/**
 * Get the path to a standard lease agreement file
 * @param {string} countryCode - Two-letter country code (e.g., 'CA', 'US')
 * @param {string} region - Two-letter region code (e.g., 'ON', 'BC')
 * @returns {string} Path to the lease agreement file
 */
export const getLeaseAgreementPath = (countryCode, region) => {
  if (!VALID_LOCATIONS[countryCode]?.includes(region)) {
    throw new Error('Invalid location');
  }
  return path.join(LEASE_AGREEMENTS_DIR, countryCode, region, 'standard-lease.pdf');
};

/**
 * Get the URL for a standard lease agreement file
 * @param {string} countryCode - Two-letter country code
 * @param {string} region - Two-letter region code
 * @returns {string} URL to access the lease agreement
 */
export const getLeaseAgreementUrl = (countryCode, region) => {
  if (!VALID_LOCATIONS[countryCode]?.includes(region)) {
    throw new Error('Invalid location');
  }
  return `/api/admin/lease-agreements/${countryCode}/${region}`;
};

/**
 * Check if a lease agreement exists for a given location
 * @param {string} countryCode - Two-letter country code
 * @param {string} region - Two-letter region code
 * @returns {boolean} Whether the lease agreement exists
 */
export const leaseAgreementExists = (countryCode, region) => {
  try {
    const filePath = getLeaseAgreementPath(countryCode, region);
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
};

/**
 * Get available lease agreements
 * @returns {Object} Object containing available country/region combinations
 */
export const getAvailableLeaseAgreements = () => {
  const agreements = [];
  
  Object.entries(VALID_LOCATIONS).forEach(([country, regions]) => {
    regions.forEach(region => {
      const filePath = getLeaseAgreementPath(country, region);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        agreements.push({
          countryCode: country,
          region,
          exists: true,
          lastModified: stats.mtime,
          size: stats.size
        });
      } else {
        agreements.push({
          countryCode: country,
          region,
          exists: false
        });
      }
    });
  });
  
  return agreements;
};

export const uploadLeaseAgreement = async (countryCode, region, file) => {
  if (!VALID_LOCATIONS[countryCode]?.includes(region)) {
    throw new Error('Invalid location');
  }

  const filePath = getLeaseAgreementPath(countryCode, region);
  
  // Ensure the directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Move the file
  await file.mv(filePath);

  return {
    countryCode,
    region,
    path: filePath,
    size: file.size,
    lastModified: new Date()
  };
};

export const deleteLeaseAgreement = (countryCode, region) => {
  if (!VALID_LOCATIONS[countryCode]?.includes(region)) {
    throw new Error('Invalid location');
  }

  const filePath = getLeaseAgreementPath(countryCode, region);
  
  if (!fs.existsSync(filePath)) {
    throw new Error('Lease agreement not found');
  }

  fs.unlinkSync(filePath);
  return true;
};

export const getValidLocations = () => VALID_LOCATIONS; 