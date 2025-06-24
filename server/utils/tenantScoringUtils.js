/**
 * Calculate tenant score based on manual data and AI-parsed document information
 * @param {Object} tenantDoc - Tenant document with profile data and uploaded documents
 * @returns {number} - Score from 0-100
 */
export function calculateTenantScore(tenantDoc) {
  let score = 0;
  console.log('[tenantScore] --- Calculation Start ---');
  
  // Employment (manual or AI-verified)
  if (tenantDoc.isCurrentlyEmployed === 'yes') {
    score += 15;
    console.log('[tenantScore] +15: Currently employed');
  }
  
  // Income verification (manual + AI cross-reference)
  let income = tenantDoc.monthlyNetIncome;
  let aiIncomeVerified = false;
  
  // Check AI-parsed income from various document types
  const documentTypes = ['proofOfIncome', 'creditHistory', 'additionalDocuments'];
  for (const docType of documentTypes) {
    if (tenantDoc[docType]?.length > 0) {
      for (const doc of tenantDoc[docType]) {
        if (doc.aiParsedData?.income && !isNaN(Number(doc.aiParsedData.income))) {
          const aiIncome = Number(doc.aiParsedData.income);
          // If AI income is close to manual income (within 10%), give bonus points
          if (income && Math.abs(aiIncome - income) / income < 0.1) {
            score += 5; // Bonus for income verification
            aiIncomeVerified = true;
            console.log(`[tenantScore] +5: AI income (${aiIncome}) matches manual income (${income})`);
          }
          // Use AI income if manual income not provided
          if (!income) {
            income = aiIncome;
            console.log(`[tenantScore] Using AI income: ${aiIncome}`);
          }
          break;
        }
      }
    }
  }
  
  // Income scoring
  if (income > 5000) {
    score += 25;
    console.log('[tenantScore] +25: Income > $5000');
  } else if (income > 3000) {
    score += 20;
    console.log('[tenantScore] +20: Income > $3000');
  } else if (income > 2000) {
    score += 15;
    console.log('[tenantScore] +15: Income > $2000');
  } else if (income > 1000) {
    score += 10;
    console.log('[tenantScore] +10: Income > $1000');
  }
  
  // No evictions (manual + AI verification from rental history)
  if (tenantDoc.hasBeenEvicted === 'no') {
    score += 15;
    console.log('[tenantScore] +15: No eviction history');
  }
  
  // Check rental history documents for eviction records
  if (tenantDoc.rentalHistory?.length > 0) {
    let hasEvictionRecord = false;
    for (const doc of tenantDoc.rentalHistory) {
      if (doc.aiParsedData?.documentType?.toLowerCase().includes('eviction') ||
          doc.aiParsedData?.raw?.toLowerCase().includes('eviction')) {
        hasEvictionRecord = true;
        break;
      }
    }
    if (!hasEvictionRecord) {
      score += 5; // Bonus for clean rental history
      console.log('[tenantScore] +5: Clean rental history (AI verified)');
    }
  }
  
  // Credit score (manual + AI verification)
  if (tenantDoc.creditScore >= 750) {
    score += 20;
    console.log('[tenantScore] +20: Credit score >= 750');
  } else if (tenantDoc.creditScore >= 650) {
    score += 15;
    console.log('[tenantScore] +15: Credit score >= 650');
  } else if (tenantDoc.creditScore >= 550) {
    score += 10;
    console.log('[tenantScore] +10: Credit score >= 550');
  }
  
  // Check AI-parsed credit information from credit history documents
  if (tenantDoc.creditHistory?.length > 0) {
    for (const doc of tenantDoc.creditHistory) {
      if (doc.aiParsedData?.documentType?.toLowerCase().includes('credit')) {
        score += 5; // Bonus for credit report
        console.log('[tenantScore] +5: Credit report provided (AI verified)');
        break;
      }
    }
  }
  
  // Identity verification (AI cross-reference)
  let identityVerified = false;
  if (tenantDoc.proofOfIdentity?.length > 0) {
    for (const doc of tenantDoc.proofOfIdentity) {
      if (doc.aiParsedData?.name && doc.aiParsedData?.documentType) {
        // Check if AI-parsed name matches tenant name (basic verification)
        const aiName = doc.aiParsedData.name.toLowerCase();
        const tenantName = tenantDoc.tenant?.name?.toLowerCase() || '';
        if (aiName.includes(tenantName.split(' ')[0]) || tenantName.includes(aiName.split(' ')[0])) {
          score += 5; // Bonus for name verification
          identityVerified = true;
          console.log(`[tenantScore] +5: Name verified by AI (${aiName} vs ${tenantName})`);
        }
        score += 5; // Bonus for valid government ID
        console.log('[tenantScore] +5: Valid government ID (AI verified)');
        break;
      }
    }
  }
  
  // Document completeness and quality
  let documentScore = 0;
  if (tenantDoc.proofOfIdentity?.length > 0) { documentScore += 10; console.log('[tenantScore] +10: Proof of identity uploaded'); }
  if (tenantDoc.proofOfIncome?.length > 0) { documentScore += 10; console.log('[tenantScore] +10: Proof of income uploaded'); }
  if (tenantDoc.creditHistory?.length > 0) { documentScore += 10; console.log('[tenantScore] +10: Credit history uploaded'); }
  if (tenantDoc.rentalHistory?.length > 0) { documentScore += 10; console.log('[tenantScore] +10: Rental history uploaded'); }
  if (tenantDoc.additionalDocuments?.length > 0) { documentScore += 5; console.log('[tenantScore] +5: Additional documents uploaded'); }
  
  // Bonus for multiple documents of same type (shows thoroughness)
  if (tenantDoc.proofOfIncome?.length > 1) { documentScore += 5; console.log('[tenantScore] +5: Multiple proof of income docs'); }
  if (tenantDoc.creditHistory?.length > 1) { documentScore += 5; console.log('[tenantScore] +5: Multiple credit history docs'); }
  
  score += documentScore;
  
  // AI parsing success bonus (indicates document quality)
  let aiParsingSuccess = 0;
  const allDocs = [
    ...(tenantDoc.proofOfIdentity || []),
    ...(tenantDoc.proofOfIncome || []),
    ...(tenantDoc.creditHistory || []),
    ...(tenantDoc.rentalHistory || []),
    ...(tenantDoc.additionalDocuments || [])
  ];
  
  for (const doc of allDocs) {
    if (doc.aiParsedData && !doc.aiParsedData.error) {
      aiParsingSuccess += 2;
    }
  }
  if (aiParsingSuccess > 0) {
    console.log(`[tenantScore] +${Math.min(aiParsingSuccess, 10)}: AI parsing success bonus`);
  }
  score += Math.min(aiParsingSuccess, 10); // Cap at 10 points
  
  // Additional factors
  if (tenantDoc.hasTwoMonthsRentSavings === 'yes') { score += 5; console.log('[tenantScore] +5: Has 2+ months rent savings'); }
  if (tenantDoc.canPayMoreThanOneMonth === 'yes') { score += 5; console.log('[tenantScore] +5: Can pay multiple months ahead'); }
  
  // Pet and smoking factors (risk assessment)
  if (tenantDoc.hasPets === 'no') { score += 3; console.log('[tenantScore] +3: No pets'); }
  if (tenantDoc.smokes === 'no') { score += 3; console.log('[tenantScore] +3: Non-smoker'); }
  
  // Occupancy factors
  if (tenantDoc.adultOccupants <= 2) { score += 2; console.log('[tenantScore] +2: ≤2 adult occupants'); }
  if (tenantDoc.childOccupants === 0) { score += 2; console.log('[tenantScore] +2: No children'); }
  
  console.log('[tenantScore] --- Calculation End. Final Score:', Math.min(score, 100), '---');
  return Math.min(score, 100);
}

/**
 * Get detailed breakdown of tenant score calculation
 * @param {Object} tenantDoc - Tenant document with profile data and uploaded documents
 * @returns {Object} - Detailed score breakdown
 */
export function getScoreBreakdown(tenantDoc) {
  const breakdown = {
    employment: { score: 0, max: 15, details: [] },
    income: { score: 0, max: 30, details: [] },
    eviction: { score: 0, max: 20, details: [] },
    credit: { score: 0, max: 25, details: [] },
    identity: { score: 0, max: 10, details: [] },
    documents: { score: 0, max: 50, details: [] },
    aiParsing: { score: 0, max: 10, details: [] },
    additional: { score: 0, max: 20, details: [] }
  };

  // Employment
  if (tenantDoc.isCurrentlyEmployed === 'yes') {
    breakdown.employment.score = 15;
    breakdown.employment.details.push('Currently employed');
  }

  // Income calculation
  let income = tenantDoc.monthlyNetIncome;
  let aiIncomeFound = false;
  
  const documentTypes = ['proofOfIncome', 'creditHistory', 'additionalDocuments'];
  for (const docType of documentTypes) {
    if (tenantDoc[docType]?.length > 0) {
      for (const doc of tenantDoc[docType]) {
        if (doc.aiParsedData?.income && !isNaN(Number(doc.aiParsedData.income))) {
          const aiIncome = Number(doc.aiParsedData.income);
          if (income && Math.abs(aiIncome - income) / income < 0.1) {
            breakdown.income.score += 5;
            breakdown.income.details.push('Income verified by AI');
          }
          if (!income) income = aiIncome;
          aiIncomeFound = true;
          break;
        }
      }
    }
  }

  if (income > 5000) breakdown.income.score += 25;
  else if (income > 3000) breakdown.income.score += 20;
  else if (income > 2000) breakdown.income.score += 15;
  else if (income > 1000) breakdown.income.score += 10;

  if (income) {
    breakdown.income.details.push(`Income: $${income.toLocaleString()}`);
  }

  // Eviction history
  if (tenantDoc.hasBeenEvicted === 'no') {
    breakdown.eviction.score += 15;
    breakdown.eviction.details.push('No eviction history');
  }

  if (tenantDoc.rentalHistory?.length > 0) {
    let hasEvictionRecord = false;
    for (const doc of tenantDoc.rentalHistory) {
      if (doc.aiParsedData?.documentType?.toLowerCase().includes('eviction')) {
        hasEvictionRecord = true;
        break;
      }
    }
    if (!hasEvictionRecord) {
      breakdown.eviction.score += 5;
      breakdown.eviction.details.push('Clean rental history verified');
    }
  }

  // Credit score
  if (tenantDoc.creditScore >= 750) breakdown.credit.score += 20;
  else if (tenantDoc.creditScore >= 650) breakdown.credit.score += 15;
  else if (tenantDoc.creditScore >= 550) breakdown.credit.score += 10;

  if (tenantDoc.creditScore) {
    breakdown.credit.details.push(`Credit score: ${tenantDoc.creditScore}`);
  }

  if (tenantDoc.creditHistory?.length > 0) {
    breakdown.credit.score += 5;
    breakdown.credit.details.push('Credit report provided');
  }

  // Identity verification
  if (tenantDoc.proofOfIdentity?.length > 0) {
    breakdown.identity.score += 5;
    breakdown.identity.details.push('Government ID provided');
    
    for (const doc of tenantDoc.proofOfIdentity) {
      if (doc.aiParsedData?.name && doc.aiParsedData?.documentType) {
        const aiName = doc.aiParsedData.name.toLowerCase();
        const tenantName = tenantDoc.tenant?.name?.toLowerCase() || '';
        if (aiName.includes(tenantName.split(' ')[0]) || tenantName.includes(aiName.split(' ')[0])) {
          breakdown.identity.score += 5;
          breakdown.identity.details.push('Name verified by AI');
        }
        break;
      }
    }
  }

  // Document completeness
  if (tenantDoc.proofOfIdentity?.length > 0) breakdown.documents.score += 10;
  if (tenantDoc.proofOfIncome?.length > 0) breakdown.documents.score += 10;
  if (tenantDoc.creditHistory?.length > 0) breakdown.documents.score += 10;
  if (tenantDoc.rentalHistory?.length > 0) breakdown.documents.score += 10;
  if (tenantDoc.additionalDocuments?.length > 0) breakdown.documents.score += 5;

  if (tenantDoc.proofOfIncome?.length > 1) breakdown.documents.score += 5;
  if (tenantDoc.creditHistory?.length > 1) breakdown.documents.score += 5;

  breakdown.documents.details.push(`${Object.values(breakdown.documents).filter(v => typeof v === 'number').reduce((a, b) => a + b, 0)}/50 document points`);

  // AI parsing success
  const allDocs = [
    ...(tenantDoc.proofOfIdentity || []),
    ...(tenantDoc.proofOfIncome || []),
    ...(tenantDoc.creditHistory || []),
    ...(tenantDoc.rentalHistory || []),
    ...(tenantDoc.additionalDocuments || [])
  ];

  let aiParsingSuccess = 0;
  for (const doc of allDocs) {
    if (doc.aiParsedData && !doc.aiParsedData.error) {
      aiParsingSuccess += 2;
    }
  }
  breakdown.aiParsing.score = Math.min(aiParsingSuccess, 10);
  breakdown.aiParsing.details.push(`${breakdown.aiParsing.score}/10 AI parsing points`);

  // Additional factors
  if (tenantDoc.hasTwoMonthsRentSavings === 'yes') {
    breakdown.additional.score += 5;
    breakdown.additional.details.push('Has 2+ months rent savings');
  }
  if (tenantDoc.canPayMoreThanOneMonth === 'yes') {
    breakdown.additional.score += 5;
    breakdown.additional.details.push('Can pay multiple months ahead');
  }
  if (tenantDoc.hasPets === 'no') {
    breakdown.additional.score += 3;
    breakdown.additional.details.push('No pets');
  }
  if (tenantDoc.smokes === 'no') {
    breakdown.additional.score += 3;
    breakdown.additional.details.push('Non-smoker');
  }
  if (tenantDoc.adultOccupants <= 2) {
    breakdown.additional.score += 2;
    breakdown.additional.details.push('≤2 adult occupants');
  }
  if (tenantDoc.childOccupants === 0) {
    breakdown.additional.score += 2;
    breakdown.additional.details.push('No children');
  }

  return breakdown;
} 