/**
 * Calculate tenant score based on manual data and AI-parsed document information
 * @param {Object} tenantDoc - Tenant document with profile data and uploaded documents
 * @returns {number} - Score as percent of max possible points
 */
export function calculateTenantScore(tenantDoc) {
  let totalPoints = 0;
  let maxPoints = 0;
  console.log('[tenantScore] --- Calculation Start ---');
  
  // Employment (manual or AI-verified)
  if (tenantDoc.isCurrentlyEmployed === 'yes') {
    totalPoints += 15;
  }
  maxPoints += 15;
  
  // Income verification (manual + AI cross-reference)
  let income = tenantDoc.monthlyNetIncome;
  let aiIncomeVerified = false;
  let hasIncomeDoc = false;
  let aiIncomeMatched = false;
  
  // Check AI-parsed income from various document types
  const documentTypes = ['proofOfIncome', 'creditHistory', 'additionalDocuments'];
  for (const docType of documentTypes) {
    if (tenantDoc[docType]?.length > 0) {
      hasIncomeDoc = true;
      for (const doc of tenantDoc[docType]) {
        if (doc.aiParsedData?.income && !isNaN(Number(doc.aiParsedData.income))) {
          const aiIncome = Number(doc.aiParsedData.income);
          if (income && Math.abs(aiIncome - income) / income < 0.1) {
            aiIncomeMatched = true;
          }
          if (!income) {
            income = aiIncome;
          }
          break;
        }
      }
    }
  }
  
  // Income points only if doc exists and AI matches manual
  if (hasIncomeDoc && aiIncomeMatched) {
    if (income > 5000) totalPoints += 30;
    else if (income > 3000) totalPoints += 25;
    else if (income > 2000) totalPoints += 20;
    else if (income > 1000) totalPoints += 15;
    else totalPoints += 10;
    // Bonus for AI verification
    totalPoints += 5;
  }
  maxPoints += 30; // Max for income section
  
  // No evictions (manual + AI verification from rental history)
  if (tenantDoc.hasBeenEvicted === 'no') {
    totalPoints += 15;
  }
  maxPoints += 15;
  
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
      totalPoints += 5;
    }
    maxPoints += 5;
  } else {
    maxPoints += 5;
  }
  
  // Credit score (manual + AI verification)
  if (tenantDoc.creditScore >= 750) {
    totalPoints += 20;
  } else if (tenantDoc.creditScore >= 650) {
    totalPoints += 15;
  } else if (tenantDoc.creditScore >= 550) {
    totalPoints += 10;
  }
  maxPoints += 20;
  
  // Check AI-parsed credit information from credit history documents
  if (tenantDoc.creditHistory?.length > 0) {
    totalPoints += 5;
    maxPoints += 5;
  }
  
  // Identity verification (AI cross-reference)
  let identityVerified = false;
  if (tenantDoc.proofOfIdentity?.length > 0) {
    totalPoints += 5;
    maxPoints += 5;
    for (const doc of tenantDoc.proofOfIdentity) {
      if (doc.aiParsedData?.name && doc.aiParsedData?.documentType) {
        const aiName = doc.aiParsedData.name.toLowerCase();
        const tenantName = tenantDoc.tenant?.name?.toLowerCase() || '';
        if (aiName.includes(tenantName.split(' ')[0]) || tenantName.includes(aiName.split(' ')[0])) {
          totalPoints += 5;
          identityVerified = true;
        }
        break;
      }
    }
    maxPoints += 5;
  } else {
    maxPoints += 10;
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
  
  totalPoints += documentScore;
  maxPoints += 50;
  
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
  totalPoints += Math.min(aiParsingSuccess, 10);
  maxPoints += 10;
  
  // Additional factors
  if (tenantDoc.hasTwoMonthsRentSavings === 'yes') { totalPoints += 5; console.log('[tenantScore] +5: Has 2+ months rent savings'); }
  if (tenantDoc.canPayMoreThanOneMonth === 'yes') { totalPoints += 5; console.log('[tenantScore] +5: Can pay multiple months ahead'); }
  
  // Pet and smoking factors (risk assessment)
  if (tenantDoc.hasPets === 'no') { totalPoints += 3; console.log('[tenantScore] +3: No pets'); }
  if (tenantDoc.smokes === 'no') { totalPoints += 3; console.log('[tenantScore] +3: Non-smoker'); }
  
  // Occupancy factors
  if (tenantDoc.adultOccupants <= 2) { totalPoints += 2; console.log('[tenantScore] +2: ≤2 adult occupants'); }
  if (tenantDoc.childOccupants === 0) { totalPoints += 2; console.log('[tenantScore] +2: No children'); }
  
  maxPoints += 20;
  
  const percent = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
  console.log('[tenantScore] --- Calculation End. Points:', totalPoints, '/', maxPoints, 'Percent:', percent, '---');
  return percent;
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

  // Income
  let income = tenantDoc.monthlyNetIncome;
  let aiIncomeMatched = false;
  let hasIncomeDoc = false;
  const documentTypes = ['proofOfIncome', 'creditHistory', 'additionalDocuments'];
  for (const docType of documentTypes) {
    if (tenantDoc[docType]?.length > 0) {
      hasIncomeDoc = true;
      for (const doc of tenantDoc[docType]) {
        if (doc.aiParsedData?.income && !isNaN(Number(doc.aiParsedData.income))) {
          const aiIncome = Number(doc.aiParsedData.income);
          if (income && Math.abs(aiIncome - income) / income < 0.1) {
            aiIncomeMatched = true;
          }
          if (!income) income = aiIncome;
          break;
        }
      }
    }
  }
  if (hasIncomeDoc && aiIncomeMatched) {
    if (income > 5000) breakdown.income.score += 30;
    else if (income > 3000) breakdown.income.score += 25;
    else if (income > 2000) breakdown.income.score += 20;
    else if (income > 1000) breakdown.income.score += 15;
    else breakdown.income.score += 10;
    breakdown.income.score += 5; // Bonus for AI verification
    breakdown.income.details.push('Income verified by AI');
  } else if (!hasIncomeDoc) {
    breakdown.income.details.push('No income document uploaded');
  } else if (!aiIncomeMatched) {
    breakdown.income.details.push('AI could not verify income');
  }
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