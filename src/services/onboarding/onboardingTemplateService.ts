import type { OrganisationTemplate } from '../../types';

export const ORGANISATION_TEMPLATES: OrganisationTemplate[] = [
  {
    id: 'tmpl_school_music',
    code: 'school_music',
    name: 'School Music Department',
    description: 'Configured for school instrumental music, choirs, bands, and orchestra.',
    programmeTypes: ['music'],
    defaultAttendanceThreshold: 75,
    consecutiveAbsenceThreshold: 3,
    defaultGroupCapacity: 20,
    recommendedGroups: [
      { name: 'Symphonic Winds', type: 'ensemble', category: 'music' },
      { name: 'String Orchestra', type: 'ensemble', category: 'music' },
      { name: 'Senior Choir', type: 'choir', category: 'music' },
      { name: 'Beginner Brass', type: 'class', category: 'music' }
    ]
  },
  {
    id: 'tmpl_music_academy',
    code: 'music_academy',
    name: 'Private Music Academy',
    description: 'Individual and ensemble lessons with tuition fee tracking.',
    programmeTypes: ['music'],
    defaultAttendanceThreshold: 80,
    consecutiveAbsenceThreshold: 2,
    defaultGroupCapacity: 10,
    recommendedGroups: [
      { name: 'Individual Piano', type: 'individual', category: 'music' },
      { name: 'Individual Violin', type: 'individual', category: 'music' },
      { name: 'Musicianship & Theory', type: 'class', category: 'music' },
      { name: 'Jazz Ensemble', type: 'ensemble', category: 'music' }
    ]
  },
  {
    id: 'tmpl_dance_school',
    code: 'dance_school',
    name: 'Dance Academy & Studio',
    description: 'Ballet, contemporary, and hip-hop technique and performance.',
    programmeTypes: ['dance'],
    defaultAttendanceThreshold: 75,
    consecutiveAbsenceThreshold: 3,
    defaultGroupCapacity: 16,
    recommendedGroups: [
      { name: 'Senior Ballet Company', type: 'company', category: 'dance' },
      { name: 'Intermediate Contemporary', type: 'class', category: 'dance' },
      { name: 'Youth Hip-Hop Crew', type: 'crew', category: 'dance' },
      { name: 'Foundation Movement', type: 'class', category: 'dance' }
    ]
  },
  {
    id: 'tmpl_community_arts',
    code: 'community_arts',
    name: 'Community Arts & Cultural Project',
    description: 'Multi-disciplinary arts outreach for community centres and youth.',
    programmeTypes: ['music', 'dance', 'drama', 'visual_arts'],
    defaultAttendanceThreshold: 70,
    consecutiveAbsenceThreshold: 3,
    defaultGroupCapacity: 25,
    recommendedGroups: [
      { name: 'Community Marimba Band', type: 'ensemble', category: 'music' },
      { name: 'Traditional Dance Troupe', type: 'troupe', category: 'dance' },
      { name: 'Youth Choir', type: 'choir', category: 'music' }
    ]
  },
  {
    id: 'tmpl_combined_arts',
    code: 'combined_arts',
    name: 'Comprehensive Performing Arts Academy',
    description: 'Dual-discipline school with integrated music and dance curricula.',
    programmeTypes: ['music', 'dance'],
    defaultAttendanceThreshold: 75,
    consecutiveAbsenceThreshold: 3,
    defaultGroupCapacity: 18,
    recommendedGroups: [
      { name: 'Concert Band', type: 'ensemble', category: 'music' },
      { name: 'Ballet Studio Ensemble', type: 'class', category: 'dance' },
      { name: 'Musical Theatre Troupe', type: 'ensemble', category: 'performance' }
    ]
  }
];

export class OnboardingTemplateService {
  listTemplates(): OrganisationTemplate[] {
    return ORGANISATION_TEMPLATES;
  }

  getTemplateByCode(code: string): OrganisationTemplate | null {
    return ORGANISATION_TEMPLATES.find((t) => t.code === code) || null;
  }
}

export const onboardingTemplateService = new OnboardingTemplateService();
