export interface RatingCategory {
  key: 'technicalRating' | 'communicationRating' | 'problemSolvingRating' | 'cultureFitRating';
  label: string;
  shortLabel: string;
}

export interface RoundConfig {
  title: string;
  subtitle: string;
  badgeColor: string;
  ratings: RatingCategory[];
  questions: string[];
}

export const ROUND_SCORECARD_CONFIG: Record<string, RoundConfig> = {
  TECHNICAL: {
    title: 'Technical Evaluation Scorecard',
    subtitle: 'System architecture, coding execution, and technical depth',
    badgeColor: '#6366f1',
    ratings: [
      { key: 'technicalRating', label: 'System Architecture & Design', shortLabel: 'Architecture' },
      { key: 'communicationRating', label: 'Code Quality & Cleanliness', shortLabel: 'Code Quality' },
      { key: 'problemSolvingRating', label: 'Algorithmic Problem Solving', shortLabel: 'Algorithms' },
      { key: 'cultureFitRating', label: 'Debugging & Technical Depth', shortLabel: 'Debugging' },
    ],
    questions: [
      'Did the candidate demonstrate strong software engineering & system design fundamentals?',
      'How clean, maintainable, and efficient was their code implementation?',
    ]
  },
  HR: {
    title: 'HR & Screening Scorecard',
    subtitle: 'Communication clarity, career trajectory, and role alignment',
    badgeColor: '#06b6d4',
    ratings: [
      { key: 'technicalRating', label: 'Communication & Articulation', shortLabel: 'Communication' },
      { key: 'communicationRating', label: 'Career Alignment & Motivation', shortLabel: 'Career Fit' },
      { key: 'problemSolvingRating', label: 'Professional Integrity & Background', shortLabel: 'Integrity' },
      { key: 'cultureFitRating', label: 'Logistics & Compensation Fit', shortLabel: 'Logistics' },
    ],
    questions: [
      'Is the candidate clear about their career aspirations and role expectations?',
      'How effectively did they communicate past achievements and transitions?',
    ]
  },
  MANAGERIAL: {
    title: 'Managerial & Leadership Scorecard',
    subtitle: 'Ownership, stakeholder management, and project execution',
    badgeColor: '#818cf8',
    ratings: [
      { key: 'technicalRating', label: 'Project Leadership & Ownership', shortLabel: 'Ownership' },
      { key: 'communicationRating', label: 'Stakeholder & Cross-Team Management', shortLabel: 'Stakeholders' },
      { key: 'problemSolvingRating', label: 'Decision Making Under Pressure', shortLabel: 'Decisions' },
      { key: 'cultureFitRating', label: 'Team Mentorship & Growth', shortLabel: 'Mentorship' },
    ],
    questions: [
      'Has the candidate managed complex project deliverables and timelines successfully?',
      'How effectively do they navigate team conflicts and cross-functional friction?',
    ]
  },
  CULTURAL: {
    title: 'Cultural Fit Scorecard',
    subtitle: 'Company values alignment, growth mindset, and team synergy',
    badgeColor: '#10b981',
    ratings: [
      { key: 'technicalRating', label: 'Company Values Alignment', shortLabel: 'Values' },
      { key: 'communicationRating', label: 'Adaptability & Growth Mindset', shortLabel: 'Growth Mindset' },
      { key: 'problemSolvingRating', label: 'Collaboration & Team Synergy', shortLabel: 'Teamwork' },
      { key: 'cultureFitRating', label: 'Constructive Feedback Receptivity', shortLabel: 'Feedback Fit' },
    ],
    questions: [
      'Does the candidate embody core company ethics, transparency, and team spirit?',
      'Are they open to receiving and acting upon constructive feedback?',
    ]
  }
};
