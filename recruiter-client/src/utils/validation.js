/**
 * Validates whether a job role is a technical IT or software-related role.
 * Allows roles like Software Engineer, Frontend Developer, Data Scientist, SRE, etc.
 * Rejects non-technical professions such as trades, healthcare, business, arts, hospitality, government, sports, etc.
 *
 * This mirrors the logic in server/utils/validation.js — keep them in sync.
 *
 * @param {string} role - The job role to validate.
 * @returns {boolean} True if the role is a valid IT/software technical role, false otherwise.
 */
export function isTechnicalRole(role) {
  if (!role || typeof role !== 'string') return false;

  const normalized = role.toLowerCase().replace(/\s+/g, ' ').trim();

  // 1. Explicitly rejected non-technical keywords (matched as full words)
  const rejectedKeywords = [
    // Trades & Service Industry
    'plumber', 'electrician', 'carpenter', 'welder', 'mason', 'painter', 'builder', 'contractor',
    'driver', 'pilot', 'mechanic', 'machinist', 'chef', 'cook', 'waiter', 'waitress', 'bartender',
    'barista', 'cashier', 'receptionist', 'janitor', 'cleaner', 'housekeeper', 'maid', 'laundry',
    'barber', 'stylist', 'hairdresser', 'butcher', 'baker', 'tailor', 'locksmith', 'plumbing',
    'hotel', 'restaurant', 'valet', 'housekeeping',
    // Healthcare & Medical
    'doctor', 'physician', 'nurse', 'dentist', 'pharmacist', 'surgeon', 'therapist', 'veterinarian',
    'paramedic', 'psychiatrist', 'psychologist', 'pediatrician', 'clinician', 'cardiologist',
    'dermatologist', 'optometrist', 'gynecologist', 'obstetrician', 'radiologist', 'pathologist',
    // Legal, Government, Public Safety
    'lawyer', 'attorney', 'judge', 'paralegal', 'police', 'cop', 'firefighter', 'soldier', 'military',
    'guard', 'officer', 'politician', 'civil servant', 'lobbyist', 'diplomat', 'sheriff',
    // Sports & Fitness
    'athlete', 'player', 'coach', 'trainer', 'referee', 'gym', 'instructor',
    // Arts, Writing, Music, Entertainment (non-digital/non-software)
    'musician', 'singer', 'actor', 'actress', 'writer', 'author', 'journalist',
    'photographer', 'videographer', 'dancer', 'choreographer', 'sculptor',
    // Business, Finance, HR, Sales (non-technical)
    'accountant', 'auditor', 'banker', 'teller', 'recruiter', 'hr', 'human resources',
    'marketing', 'sales', 'retail', 'stocker', 'merchandiser', 'realtor', 'real estate',
    // Non-IT engineering disciplines
    'civil', 'mechanical', 'chemical', 'aerospace', 'environmental', 'industrial', 'agricultural',
    'biomedical', 'structural', 'geotechnical', 'petroleum', 'nuclear', 'materials', 'mining',
    'metallurgical', 'marine', 'sanitation', 'genetic', 'locomotive', 'flight', 'electrical',
    // Non-IT developers
    'business developer', 'business development', 'real estate developer', 'property developer',
    'land developer', 'housing developer',
    // Other non-tech
    'teacher', 'farmer', 'librarian', 'social worker', 'counselor',
  ];

  for (const keyword of rejectedKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`);
    if (regex.test(normalized)) return false;
  }

  // 2. Special handling for "designer"
  if (/\bdesigner\b/.test(normalized)) {
    const allowedDesignContexts = [
      'ui', 'ux', 'web', 'product', 'interaction', 'digital',
      'interface', 'graphic', 'graphics', 'software', 'app', 'application', 'game',
    ];
    const hasAllowedContext = allowedDesignContexts.some((ctx) => {
      return new RegExp(`\\b${ctx}\\b`).test(normalized);
    });
    if (!hasAllowedContext) return false;
  }

  // 3. Special handling for "manager"
  if (/\bmanager\b/.test(normalized)) {
    const allowedManagerContexts = [
      'software', 'engineering', 'technical', 'it', 'tech', 'devops',
      'qa', 'test', 'systems', 'database', 'network', 'product', 'cloud', 'project', 'scrum', 'agile',
    ];
    const hasAllowedContext = allowedManagerContexts.some((ctx) => {
      return new RegExp(`\\b${ctx}\\b`).test(normalized);
    });
    if (!hasAllowedContext) return false;
  }

  // 4. Accepted technical IT/software keywords
  const acceptedKeywords = [
    'developer', 'engineer', 'programmer', 'coder', 'sre', 'devops', 'sysadmin', 'dba',
    'scrum master', 'product owner', 'architect', 'data scientist', 'data analyst',
    'data engineer', 'data architect', 'systems analyst', 'system analyst', 'security analyst',
    'cybersecurity analyst', 'qa analyst', 'quality assurance analyst', 'ui/ux', 'ux/ui',
    'ui designer', 'ux designer', 'product designer', 'technical lead', 'tech lead',
    'engineering manager', 'cto', 'technical support', 'it support', 'helpdesk', 'help desk',
  ];

  for (const keyword of acceptedKeywords) {
    const escapedKeyword = keyword.replace('/', '\\/');
    const regex = new RegExp(`\\b${escapedKeyword}\\b`);
    if (regex.test(normalized)) return true;
  }

  // 5. Broad IT/software terms
  const techIndicators = [
    'software', 'frontend', 'backend', 'fullstack', 'full stack', 'cloud',
    'cybersecurity', 'database', 'network', 'information technology', 'it',
  ];
  for (const indicator of techIndicators) {
    const regex = new RegExp(`\\b${indicator}\\b`);
    if (regex.test(normalized)) return true;
  }

  return false;
}
