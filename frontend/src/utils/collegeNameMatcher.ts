import Fuse from 'fuse.js';

// College database - loaded once
let collegeDatabase: string[] = [];
let fuzzyMatcher: Fuse<string> | null = null;

// Initialize college database
export function initializeCollegeDatabase(colleges: string[]) {
  collegeDatabase = colleges;
  
  // Configure Fuse.js for fuzzy matching (STRICT settings)
  fuzzyMatcher = new Fuse(collegeDatabase, {
    threshold: 0.2, // More strict: 0 = exact match, 1 = match anything (0.2 = ~80% similarity required)
    distance: 80,   // Reduced distance for stricter matching
    includeScore: true,
    ignoreLocation: true, // Match anywhere in string
    minMatchCharLength: 5, // Minimum characters that must match
  });
  
  console.log(`✓ College database initialized with ${colleges.length} colleges`);
}

// Match college name from text using database-first approach
// CRITICAL: Prioritize sender over content to avoid matching forwarded emails
export function matchCollegeName(sender: string, content: string): string | null {
  if (!collegeDatabase.length || !fuzzyMatcher) {
    return null; // Database not loaded
  }
  
  // Helper function to normalize text
  const normalize = (text: string) => text.toLowerCase()
    .replace(/\bgovt\b\.?/g, 'government')
    .replace(/\bdr\b\.?/g, 'doctor')
    .replace(/\bst\b\.?/g, 'saint')
    .replace(/\bprof\b\.?/g, 'professor')
    .replace(/\bb\.ed\.?/g, 'bed')
    .replace(/\bb\.\s*ed\.?/g, 'bed')
    .replace(/\br\.s\.?/g, 'rabindra satabarsiki')
    .replace(/\br\s+s\b/g, 'rabindra satabarsiki');
  
  // Helper function to find longest college match in text
  const findLongestMatch = (text: string): string | null => {
    const lowerText = text.toLowerCase();
    const normalizedText = normalize(text);
    
    let longestMatch: string | null = null;
    let longestMatchLength = 0;
    
    for (const collegeName of collegeDatabase) {
      const lowerCollege = collegeName.toLowerCase();
      const normalizedCollege = normalize(collegeName);
      
      // EXACT substring match - check if college name appears in text
      if (lowerText.includes(lowerCollege) || normalizedText.includes(normalizedCollege) ||
          lowerText.includes(normalizedCollege) || normalizedText.includes(lowerCollege)) {
        if (lowerCollege.length > longestMatchLength) {
          longestMatch = collegeName;
          longestMatchLength = lowerCollege.length;
        }
      }
      
      // PARTIAL match - handle truncated names like "Bhupendra Nath Dutta Smriti Maha" -> "Bhupendra Nath Dutta Smriti Mahavidyalaya"
      // Extract first N words from both college name and text to compare
      const collegeWords = lowerCollege.split(/\s+/);
      const textWords = lowerText.split(/\s+/);
      
      // For each position in text, try to match college name
      for (let i = 0; i <= textWords.length - 3; i++) {
        let matchingWords = 0;
        let j = 0;
        
        // Try to match consecutive words
        while (j < collegeWords.length && i + j < textWords.length) {
          const textWord = textWords[i + j];
          const collegeWord = collegeWords[j];
          
          // Words match if they start the same OR text word is truncated version of college word
          if (textWord === collegeWord || collegeWord.startsWith(textWord) || textWord.startsWith(collegeWord)) {
            matchingWords++;
            j++;
          } else {
            break; // Stop on first mismatch
          }
        }
        
        // If we matched at least 4 consecutive words (or all words if college name is short)
        // This handles "Dr. Bhupendra Nath Dutta Smriti Maha" matching "Dr. Bhupendra Nath Dutta Smriti Mahavidyalaya"
        const minWordsForMatch = Math.min(4, collegeWords.length - 1);
        if (matchingWords >= minWordsForMatch && matchingWords >= collegeWords.length * 0.7) {
          // Calculate effective length for this partial match
          const effectiveLength = matchingWords * 10; // Weight by number of matching words
          if (effectiveLength > longestMatchLength) {
            longestMatch = collegeName;
            longestMatchLength = effectiveLength;
          }
        }
      }
    }
    
    return longestMatch;
  };
  
  // PRIORITY 1: Check sender name first (HIGHEST PRIORITY)
  const senderMatch = findLongestMatch(sender);
  if (senderMatch) {
    return senderMatch;
  }
  
  // PRIORITY 2: Check email domain for college name keywords or acronyms
  if (sender.includes('@')) {
    const emailMatch = sender.match(/<[^@]+@([^>]+)>/);
    const domain = emailMatch ? emailMatch[1] : sender.split('@')[1];
    
    if (domain) {
      const domainName = domain.split('.')[0].toLowerCase();
      
      // First try: Check if domain name is an acronym match
      for (const collegeName of collegeDatabase) {
        const lowerCollege = collegeName.toLowerCase();
        
        // Create acronym from college name (e.g., "Government College of Engineering" -> "gcoe")
        const words = lowerCollege.replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => 
          // Include significant words only
          w.length > 2 && !['and', 'the', 'for', 'of'].includes(w)
        );
        
        if (words.length >= 2) {
          // Create acronym from first letters
          const acronym = words.map(w => w[0]).join('');
          
          // Check if domain matches the acronym (e.g., "gcettb" matches "gcettb")
          if (domainName === acronym || domainName.includes(acronym) || acronym.includes(domainName)) {
            return collegeName;
          }
        }
      }
      
      // Second try: Check if domain contains college name words
      for (const collegeName of collegeDatabase) {
        const lowerCollege = collegeName.toLowerCase();
        const collegeWords = lowerCollege.replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 3);
        
        // If domain contains at least 2 significant college name words
        if (collegeWords.length >= 2) {
          const matchCount = collegeWords.filter(word => domainName.includes(word)).length;
          if (matchCount >= 2) {
            return collegeName;
          }
        }
      }
    }
  }
  
  // PRIORITY 3: Only check content if sender has no match (LOWEST PRIORITY)
  // Limit content search to avoid matching forwarded emails
  const contentPreview = content.substring(0, 1000); // Limit to first 1000 chars only
  const contentMatch = findLongestMatch(contentPreview);
  if (contentMatch) {
    return contentMatch;
  }
  
  // PRIORITY 4: Fuzzy match on extracted patterns (STRICT - only very close matches)
  const patterns = extractCollegePatterns(sender, content);
  
  for (const pattern of patterns) {
    if (pattern.length > 10) {
      const results = fuzzyMatcher.search(pattern);
      
      // Return first result if score is VERY good (< 0.15 = >85% match)
      if (results.length > 0 && results[0].score && results[0].score < 0.15) {
        return results[0].item;
      }
    }
  }
  
  return null; // No match found in database
}

// Extract potential college name patterns from text
function extractCollegePatterns(sender: string, content: string): string[] {
  const patterns: string[] = [];
  
  // Pattern 1: From sender name field (with or without angle brackets)
  let senderName = '';
  const senderNameMatch = sender.match(/^([^<]+)</);
  if (senderNameMatch) {
    senderName = senderNameMatch[1].trim().replace(/^["']|["']$/g, '');
  } else {
    // If no angle brackets, check if entire sender looks like a college name
    const emailMatch = sender.match(/^(.+?)@/);
    if (emailMatch) {
      senderName = sender; // Use full sender as-is
    } else {
      senderName = sender.trim();
    }
  }
  
  if (senderName) {
    // Check if it contains college keywords
    if (/\b(mahavidyalaya|college|university|institute|vidyalaya|vidyabhaban|mahavidyamandir|mahila|mahavidyapith)\b/i.test(senderName)) {
      // Clean up
      let cleaned = senderName
        .replace(/^(principal|assistant|professor|dr|teacher|librarian|superintendent|office|director|officer|tic)\s*[,/]\s*/gi, '')
        .replace(/^(principal|from|teacher|assistant|your|kind|attention|dr\.?|prof\.?)\s+/gi, '')
        .replace(/<[^>]+>/g, '') // Remove email addresses
        .trim();
      
      if (cleaned.length > 5) {
        patterns.push(cleaned);
      }
    }
    
    // Also try the raw sender name if it's not an email
    if (!/@/.test(senderName) && senderName.length > 5) {
      patterns.push(senderName.trim());
    }
  }
  
  // Pattern 2: Capitalized words before college keywords in content
  const keywords = ['mahavidyalaya', 'college', 'university', 'institute', 'vidyalaya', 'vidyabhaban', 'mahavidyamandir', 'mahavidyapith'];
  
  for (const keyword of keywords) {
    const regex = new RegExp(`\\b([A-Z][a-zA-Z.']+(?:\\s+[A-Z][a-zA-Z.']+){1,8})\\s+${keyword}\\b`, 'gi');
    const matches = content.matchAll(regex);
    
    for (const match of matches) {
      if (match[0]) {
        const extracted = match[0]
          .replace(/^(The|From|For|At|By|Your|Kind|Attention)\s+/i, '')
          .trim();
        
        if (extracted.length > 8) {
          patterns.push(extracted);
        }
      }
    }
  }
  
  return patterns;
}
