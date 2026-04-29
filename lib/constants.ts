export const CAT: Record<string, string> = {
  food: 'Food Relief',
  housing: 'Housing',
  health: 'Health',
  mental_health: 'Mental Health',
  legal: 'Legal',
  employment: 'Employment',
  education: 'Education',
  disability: 'Disability',
  family: 'Family',
  community: 'Community',
  financial: 'Financial',
  alcohol_drugs: 'Alcohol & Drugs',
  information: 'Information',
  transport: 'Transport',
  personal_care: 'Personal Care',
  technology: 'Technology',
  other: 'Other',
};

export const CAT_COLOR: Record<string, string> = {
  food: '#16a34a',
  housing: '#d97706',
  health: '#2563eb',
  mental_health: '#7c3aed',
  legal: '#ea580c',
  employment: '#059669',
  education: '#0891b2',
  disability: '#c026d3',
  family: '#dc2626',
  community: '#15803d',
  financial: '#ca8a04',
  alcohol_drugs: '#e11d48',
  information: '#1d4ed8',
  transport: '#64748b',
  personal_care: '#7c3aed',
  technology: '#4f46e5',
  other: '#6b7280',
};

export const SOURCE_VINTAGE: Record<string, { label: string; year: number }> = {
  fed_emergency_relief: { label: 'Oct 2016', year: 2016 },
  fed_employment_services: { label: 'May 2016', year: 2016 },
  sa_community_directory: { label: '2021', year: 2021 },
  qld_breastscreen: { label: 'Jul 2023', year: 2023 },
  sa_child_family_health: { label: '2015', year: 2015 },
  vic_neighbourhood_houses: { label: 'May 2013', year: 2013 },
};

export const catColor = (cat: string): string => CAT_COLOR[cat] || '#64748b';
export const catLabel = (cat: string): string => CAT[cat] || 'Other';
