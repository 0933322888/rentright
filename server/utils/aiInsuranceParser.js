import OpenAI from 'openai';
import pdfParse from 'pdf-parse';
import { getFileFromS3 } from './s3.js';

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
});

/**
 * Parse insurance documents and generate a comprehensive summary
 * @param {Array} documents - Array of insurance document objects
 * @returns {Promise<string>} - Generated summary
 */
export async function parseInsuranceDocument(documents) {
  try {
    if (!documents || documents.length === 0) {
      throw new Error('No documents provided for parsing');
    }

    const OPENAI_API_KEY = process.env.OPEN_AI_KEY;
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    // Only use the first document (one PDF per year)
    const doc = documents[0];
    if (!doc.s3Key) {
      throw new Error('Document is missing s3Key');
    }

    // Download PDF from S3
    const pdfBuffer = await getFileFromS3(doc.s3Key);
    if (!pdfBuffer) {
      throw new Error('Failed to download PDF from S3');
    }

    // Extract text from PDF
    const pdfData = await pdfParse(pdfBuffer);
    const extractedText = pdfData.text;
    if (!extractedText || extractedText.length < 100) {
      throw new Error('Extracted text from PDF is too short or empty');
    }

    // Prepare the prompt for insurance document analysis
    const systemPrompt = `You are a professional insurance document analyst. Your task is to analyze insurance policy documents and provide a comprehensive, easy-to-understand summary for landlords.\n\nPlease extract and summarize the following key information from the insurance documents:\n\n1. Policy Holder Information\n2. Coverage Details\n3. Property Coverage\n4. Important Terms and Conditions\n5. Contact Information\n6. Risk Assessment\n\nPlease format your response in a clear, structured manner that a landlord can easily understand. Focus on information that would be relevant for property management and risk assessment.`;

    const userPrompt = `Here is the extracted text from an insurance PDF document. Please analyze and summarize the key points as described above.\n\n---\n${extractedText}\n---`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    console.log('Sending extracted insurance PDF text to OpenAI for summarization...');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 2000,
      temperature: 0.3,
    });

    const summary = response.choices[0].message.content;
    console.log('Insurance document analysis completed successfully');

    return summary;
  } catch (error) {
    console.error('Error parsing insurance documents:', error);
    return `Error analyzing insurance documents: ${error.message}\n\nPlease review the insurance documents manually to ensure all coverage requirements are met. If you continue to experience issues, please contact support.`;
  }
}

/**
 * Extract specific fields from insurance documents
 * @param {Array} documents - Array of insurance document objects
 * @param {string} fieldType - Type of field to extract (e.g., 'coverage', 'policyholder', 'dates')
 * @returns {Promise<Object>} - Extracted fields
 */
export async function extractInsuranceFields(documents, fieldType = 'all') {
  try {
    if (!documents || documents.length === 0) {
      throw new Error('No documents provided for extraction');
    }

    const OPENAI_API_KEY = process.env.OPEN_AI_KEY;
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    let extractionPrompt = '';
    
    switch (fieldType) {
      case 'policyholder':
        extractionPrompt = `Extract the following policyholder information from the insurance documents:
- Policyholder Name
- Policy Number
- Insurance Company
- Agent Name (if available)
- Agent Contact Information (if available)
Return as JSON: {"policyholderName": "", "policyNumber": "", "insuranceCompany": "", "agentName": "", "agentContact": ""}`;
        break;
        
      case 'coverage':
        extractionPrompt = `Extract the following coverage information from the insurance documents:
- Personal Property Coverage Amount
- Liability Coverage Amount
- Medical Payments Coverage Amount
- Additional Living Expenses Coverage Amount
- Deductible Amount
- Policy Type (Renters, Homeowners, etc.)
Return as JSON: {"personalProperty": "", "liability": "", "medicalPayments": "", "additionalLivingExpenses": "", "deductible": "", "policyType": ""}`;
        break;
        
      case 'dates':
        extractionPrompt = `Extract the following date information from the insurance documents:
- Policy Start Date
- Policy End Date
- Effective Date
Return as JSON: {"startDate": "", "endDate": "", "effectiveDate": ""}`;
        break;
        
      default:
        extractionPrompt = `Extract comprehensive insurance information from the documents:
- Policyholder Name
- Policy Number
- Insurance Company
- Policy Start Date
- Policy End Date
- Personal Property Coverage
- Liability Coverage
- Deductible
- Policy Type
Return as JSON with all available fields.`;
    }

    const messages = [
      {
        role: 'system',
        content: 'You are a professional insurance document parser. Extract accurate information from insurance documents. If a field is not present or unclear, use null or empty string. Always return valid JSON.'
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: extractionPrompt },
          ...documents.map(doc => ({
            type: 'image_url',
            image_url: { url: doc.url }
          }))
        ]
      }
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 1000,
      temperature: 0.1, // Very low temperature for consistent extraction
    });

    const text = response.choices[0].message.content;
    
    // Try to extract JSON from the response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (e) {
      console.error('Error parsing AI response:', e);
      return {
        error: 'Could not parse AI response',
        raw: text,
        fieldType: fieldType
      };
    }
  } catch (error) {
    console.error('Error extracting insurance fields:', error);
    return {
      error: 'Field extraction failed',
      message: error.message,
      fieldType: fieldType
    };
  }
}

/**
 * Validate insurance coverage adequacy
 * @param {Object} coverageData - Extracted coverage information
 * @param {Object} propertyInfo - Property information
 * @returns {Object} - Validation results and recommendations
 */
export function validateInsuranceCoverage(coverageData, propertyInfo = {}) {
  const validation = {
    isAdequate: true,
    issues: [],
    recommendations: [],
    score: 100
  };

  // Check if basic coverage exists
  if (!coverageData.personalProperty || coverageData.personalProperty < 10000) {
    validation.issues.push('Personal property coverage may be insufficient (recommended: $10,000+)');
    validation.score -= 20;
  }

  if (!coverageData.liability || coverageData.liability < 100000) {
    validation.issues.push('Liability coverage may be insufficient (recommended: $100,000+)');
    validation.score -= 25;
  }

  if (!coverageData.medicalPayments || coverageData.medicalPayments < 1000) {
    validation.issues.push('Medical payments coverage may be insufficient (recommended: $1,000+)');
    validation.score -= 10;
  }

  // Check policy type
  if (coverageData.policyType && !coverageData.policyType.toLowerCase().includes('renters')) {
    validation.issues.push('Policy type may not be appropriate for rental property');
    validation.score -= 15;
  }

  // Generate recommendations
  if (validation.score < 80) {
    validation.isAdequate = false;
    validation.recommendations.push('Consider requesting tenant to increase coverage limits');
    validation.recommendations.push('Verify policy type is appropriate for rental property');
  }

  if (validation.score >= 90) {
    validation.recommendations.push('Insurance coverage appears adequate for rental property');
  }

  return validation;
} 