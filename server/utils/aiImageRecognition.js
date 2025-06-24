// aiImageRecognition.js
import OpenAI from "openai";
import { convertBufferToBase64, isValidBase64Image } from './imageToBase64.js';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
});

/**
 * Generates listing content based on property info and images
 * @param {Object} propertyInfo - Property details
 * @param {Array} imageBuffers - Array of image buffers
 * @returns {Promise<Object>} - Generated title and description
 */
async function generateListingContent(propertyInfo, imageBuffers = []) {
  const OPENAI_API_KEY = process.env.OPEN_AI_KEY;

  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  console.log(propertyInfo);
  
  const messages = [
    {
      "role": "system",
      "content": "You are a professional real estate copywriter. Create compelling, accurate, and attractive listing content based on property details and images."
    }
  ];

  const content = [
    {
      "type": "text",
      "text": `Create an attractive rental listing for this property:
      ${JSON.stringify(propertyInfo)}
      
      Generate:
      1. A compelling title (max 60 characters)
      2. A detailed description highlighting key features
      
      Return in this format, dont add any other text:
      {
        "title": "Compelling title here",
        "description": "Detailed description here",
      }`
    }
  ];

  // Add images if provided
  if (imageBuffers && imageBuffers.length > 0) {
    for (let i = 0; i < Math.min(imageBuffers.length, 4); i++) {
      const buffer = imageBuffers[i];
      if (Buffer.isBuffer(buffer)) {
        const base64String = convertBufferToBase64(buffer);
        if (isValidBase64Image(base64String)) {
          content.push({
            "type": "image_url",
            "image_url": {
              "url": `data:image/jpeg;base64,${base64String}`
            }
          });
        }
      }
    }
  }

  messages.push({
    "role": "user",
    "content": content
  });

  console.log(messages);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      temperature: Math.random() < 0.5 ? 0.7 : 1,
      max_tokens: 1000
    });

    const result = response.choices[0].message.content;
    try {
      // Handle responses that might be wrapped in markdown code blocks
      let cleanResult = result.trim();
      
      // Remove markdown code block wrappers if present
      if (cleanResult.startsWith('```json')) {
        cleanResult = cleanResult.replace(/^```json\s*/, '');
      }
      if (cleanResult.startsWith('```')) {
        cleanResult = cleanResult.replace(/^```\s*/, '');
      }
      if (cleanResult.endsWith('```')) {
        cleanResult = cleanResult.replace(/\s*```$/, '');
      }
      
      return JSON.parse(cleanResult);
    } catch (e) {
      return { error: "Could not parse GPT response", raw: result };
    }
  } catch (error) {
    console.error("OpenAI API error:", error);
    return { error: "OpenAI API request failed", message: error.message };
  }
}

/**
 * Parse a document image using OpenAI Vision, extracting comprehensive fields for tenant scoring
 * @param {string} imageUrl - Public S3 URL of the image
 * @param {string} docType - Type of document (e.g., 'identity', 'income', 'credit', 'rental')
 * @returns {Promise<Object>} - Extracted fields
 */
export async function parseDocumentWithOpenAI(imageUrl, docType = 'identity or income document') {
  console.log('parseDocumentWithOpenAI called with:', { imageUrl, docType });
  const OPENAI_API_KEY = process.env.OPEN_AI_KEY;
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not set');

  let prompt = '';
  
  // Customize prompt based on document type
  switch (docType) {
    case 'proofOfIdentity':
      prompt = `Extract the following fields from this identity document (passport, driver's license, etc.):
- Full Name
- Date of Birth
- Document Type (e.g., Passport, Driver's License, State ID)
- Document Number
- Expiry Date
- Issuing Authority
- Address (if visible)
Return as JSON: {"name": "", "dob": "", "documentType": "", "documentNumber": "", "expiryDate": "", "issuingAuthority": "", "address": ""}`;
      break;
      
    case 'proofOfIncome':
      prompt = `Extract the following fields from this income document (paystub, tax return, etc.):
- Employee/Recipient Name
- Employer/Company Name
- Income Amount (gross and net)
- Pay Period (weekly, bi-weekly, monthly, annual)
- Date of Document
- Document Type (e.g., Paystub, W2, Tax Return, Bank Statement)
- Job Title/Position (if visible)
Return as JSON: {"name": "", "employer": "", "income": "", "netIncome": "", "payPeriod": "", "documentDate": "", "documentType": "", "jobTitle": ""}`;
      break;
      
    case 'creditHistory':
      prompt = `Extract the following fields from this credit document (credit report, credit score, etc.):
- Person Name
- Credit Score
- Credit Report Date
- Document Type (e.g., Credit Report, Credit Score, Credit Statement)
- Credit Limit (if applicable)
- Outstanding Balance (if applicable)
- Payment History (if visible)
Return as JSON: {"name": "", "creditScore": "", "reportDate": "", "documentType": "", "creditLimit": "", "outstandingBalance": "", "paymentHistory": ""}`;
      break;
      
    case 'rentalHistory':
      prompt = `Extract the following fields from this rental document (lease agreement, rental reference, etc.):
- Tenant Name
- Landlord/Property Manager Name
- Property Address
- Lease Start Date
- Lease End Date
- Monthly Rent Amount
- Document Type (e.g., Lease Agreement, Rental Reference, Eviction Notice)
- Payment History (if visible)
- Any negative remarks or eviction records
Return as JSON: {"tenantName": "", "landlordName": "", "propertyAddress": "", "leaseStart": "", "leaseEnd": "", "monthlyRent": "", "documentType": "", "paymentHistory": "", "negativeRemarks": ""}`;
      break;
      
    default:
      prompt = `Extract the following fields from this document:
- Full Name
- Date of Birth
- Document Type
- Income (if applicable)
- Document Number
- Date of Document
- Any other relevant information
Return as JSON: {"name": "", "dob": "", "documentType": "", "income": "", "documentNumber": "", "documentDate": "", "otherInfo": ""}`;
  }

  const messages = [
    { 
      role: 'system', 
      content: 'You are a professional document parser. Extract accurate information from documents. If a field is not present or unclear, use null or empty string. Always return valid JSON.' 
    },
    { 
      role: 'user', 
      content: [
        { type: 'text', text: prompt },
        { 
          type: 'image_url', 
          image_url: { url: imageUrl }
        }
      ]
    }
  ];

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 1500,
      temperature: 0.1, // Lower temperature for more consistent parsing
    });

    const text = response.choices[0].message.content;
    console.log("AI parsed text: ", text);

    // Try to extract JSON from the response
    let parsed;
    try {
      // Look for JSON in the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (e) {
      console.log("AI parsing failed: ", e);
      // If JSON parsing fails, return structured error
      parsed = { 
        error: 'Could not parse AI response', 
        raw: text,
        documentType: docType 
      };
    }
    
    // Add metadata
    parsed.parsedAt = new Date().toISOString();
    parsed.documentType = docType;
    
    return parsed;
  } catch (error) {
    console.log("AI parsing failed 2: ", error);
    return { 
      error: 'AI parsing failed', 
      message: error.message,
      documentType: docType,
      parsedAt: new Date().toISOString()
    };
  }
}

export { generateListingContent };
