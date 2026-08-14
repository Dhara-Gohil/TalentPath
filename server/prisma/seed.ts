import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with 10 Jobs and 10 Candidates...');

  // Hash passwords
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const recruiterPassword = await bcrypt.hash('Recruiter@123', 10);
  const defaultCandidatePassword = await bcrypt.hash('Candidate@123', 10);

  // 1. Create Core Users (Admin & Recruiter)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@talentpath.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@talentpath.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const recruiter = await prisma.user.upsert({
    where: { email: 'recruiter@talentpath.com' },
    update: {},
    create: {
      name: 'Sarah Recruiter',
      email: 'recruiter@talentpath.com',
      password: recruiterPassword,
      role: 'RECRUITER',
    },
  });

  // 2. Define 10 Jobs
  const jobsData = [
    {
      title: 'Senior React Frontend Developer',
      department: 'Engineering',
      location: 'San Francisco, CA (Hybrid)',
      employmentType: 'FULL_TIME',
      experienceRequired: '5+ years',
      requiredSkills: 'React, TypeScript, Redux, MUI, Webpack, TailwindCSS',
      description: 'We are seeking an experienced Frontend Developer to lead our UI engineering team building high-performance recruiter dashboards.',
      status: 'OPEN',
    },
    {
      title: 'Backend Node.js Engineer',
      department: 'Engineering',
      location: 'Remote',
      employmentType: 'FULL_TIME',
      experienceRequired: '3+ years',
      requiredSkills: 'Node.js, Express.js, PostgreSQL, Prisma, Redis, Docker',
      description: 'Join our core platform team building scale-ready REST APIs, webhooks, and microservices.',
      status: 'OPEN',
    },
    {
      title: 'Full Stack Software Engineer',
      department: 'Product',
      location: 'New York, NY (Hybrid)',
      employmentType: 'FULL_TIME',
      experienceRequired: '4+ years',
      requiredSkills: 'React, Node.js, TypeScript, PostgreSQL, REST APIs, GraphQL',
      description: 'Looking for a product-minded Full Stack Engineer to build candidate evaluation tools end-to-end.',
      status: 'OPEN',
    },
    {
      title: 'DevOps & Infrastructure Engineer',
      department: 'Infrastructure',
      location: 'Remote',
      employmentType: 'CONTRACT',
      experienceRequired: '4+ years',
      requiredSkills: 'AWS, Kubernetes, Terraform, Docker, CI/CD, GitHub Actions',
      description: 'Maintain high availability and automate deployment pipelines for our multi-region web services.',
      status: 'OPEN',
    },
    {
      title: 'AI/ML Prompt & Pipeline Engineer',
      department: 'AI & Data Science',
      location: 'Austin, TX',
      employmentType: 'FULL_TIME',
      experienceRequired: '3+ years',
      requiredSkills: 'Python, OpenAI API, LangChain, Node.js, Vector DBs, PyTorch',
      description: 'Design and optimize LLM-powered resume parsing and candidate assessment summarization engines.',
      status: 'OPEN',
    },
    {
      title: 'Mobile App Developer (React Native)',
      department: 'Engineering',
      location: 'Remote',
      employmentType: 'FULL_TIME',
      experienceRequired: '3+ years',
      requiredSkills: 'React Native, TypeScript, iOS, Android, REST APIs',
      description: 'Develop iOS and Android mobile applications for interviewers conducting candidate assessments on the go.',
      status: 'OPEN',
    },
    {
      title: 'QA Automation Engineer',
      department: 'Quality Assurance',
      location: 'Chicago, IL (Hybrid)',
      employmentType: 'FULL_TIME',
      experienceRequired: '2+ years',
      requiredSkills: 'Cypress, Playwright, Jest, JavaScript, CI/CD Integration',
      description: 'Build robust automated end-to-end test suites for web applications and backend API contracts.',
      status: 'OPEN',
    },
    {
      title: 'UI/UX Product Designer',
      department: 'Design',
      location: 'Remote',
      employmentType: 'PART_TIME',
      experienceRequired: '3+ years',
      requiredSkills: 'Figma, Design Systems, Wireframing, User Research, Prototyping',
      description: 'Craft intuitive interfaces, visual design systems, and seamless workflows for interviewers and candidates.',
      status: 'OPEN',
    },
    {
      title: 'Data Scientist & Analytics Engineer',
      department: 'Data & Analytics',
      location: 'Boston, MA',
      employmentType: 'FULL_TIME',
      experienceRequired: '4+ years',
      requiredSkills: 'Python, SQL, Pandas, Scikit-learn, Metabase, PostgreSQL',
      description: 'Analyze recruitment funnel performance and build predictive analytics models for hiring metrics.',
      status: 'OPEN',
    },
    {
      title: 'Technical Product Manager',
      department: 'Product',
      location: 'Remote',
      employmentType: 'FULL_TIME',
      experienceRequired: '5+ years',
      requiredSkills: 'Product Strategy, Agile, User Stories, REST APIs, Analytics',
      description: 'Drive the product roadmap for candidate experience and enterprise recruiting workflows.',
      status: 'OPEN',
    },
  ];

  const createdJobs = [];
  for (const j of jobsData) {
    // Upsert jobs based on title
    const existingJob = await prisma.job.findFirst({ where: { title: j.title } });
    if (existingJob) {
      createdJobs.push(existingJob);
    } else {
      const job = await prisma.job.create({
        data: {
          ...j,
          createdBy: recruiter.id,
        },
      });
      createdJobs.push(job);
    }
  }

  // 3. Define 10 Candidates with linked User accounts
  const candidatesData = [
    {
      name: 'Alex Rivera',
      email: 'alex.rivera@example.com',
      phone: '+1 555-0101',
      experienceYears: 6,
      skills: 'React, TypeScript, Redux Toolkit, Webpack, Material UI',
      resumeText: 'Experienced Senior Frontend Developer with 6 years building enterprise SaaS user interfaces.',
      status: 'SHORTLISTED',
      jobIndex: 0,
    },
    {
      name: 'Beatriz Chen',
      email: 'beatriz.chen@example.com',
      phone: '+1 555-0102',
      experienceYears: 4,
      skills: 'Node.js, Express, PostgreSQL, Prisma, Docker, Redis',
      resumeText: 'Backend Developer specializing in microservices architecture and database optimization.',
      status: 'INTERVIEW',
      jobIndex: 1,
    },
    {
      name: 'Charlie Davis',
      email: 'charlie.davis@example.com',
      phone: '+1 555-0103',
      experienceYears: 5,
      skills: 'React, Node.js, TypeScript, PostgreSQL, GraphQL',
      resumeText: 'Full Stack Engineer passionate about building scalable full-stack web applications.',
      status: 'HIRED',
      jobIndex: 2,
    },
    {
      name: 'Diana Evans',
      email: 'diana.evans@example.com',
      phone: '+1 555-0104',
      experienceYears: 4,
      skills: 'AWS, Kubernetes, Terraform, Docker, GitHub Actions',
      resumeText: 'DevOps Engineer with expertise in container orchestration and cloud automation.',
      status: 'SCREENING',
      jobIndex: 3,
    },
    {
      name: 'Ethan Foster',
      email: 'ethan.foster@example.com',
      phone: '+1 555-0105',
      experienceYears: 3,
      skills: 'Python, OpenAI API, LangChain, PyTorch, Vector Databases',
      resumeText: 'AI Engineer dedicated to integrating generative AI models into production products.',
      status: 'APPLIED',
      jobIndex: 4,
    },
    {
      name: 'Fiona Garcia',
      email: 'fiona.garcia@example.com',
      phone: '+1 555-0106',
      experienceYears: 4,
      skills: 'React Native, TypeScript, Redux, iOS Swift, Android Kotlin',
      resumeText: 'Mobile Developer with proven track record of publishing high-rating iOS & Android apps.',
      status: 'INTERVIEW',
      jobIndex: 5,
    },
    {
      name: 'George Harris',
      email: 'george.harris@example.com',
      phone: '+1 555-0107',
      experienceYears: 3,
      skills: 'Cypress, Playwright, Jest, JavaScript, Postman API Testing',
      resumeText: 'QA Automation Specialist focused on robust E2E test suites and continuous testing.',
      status: 'SHORTLISTED',
      jobIndex: 6,
    },
    {
      name: 'Hannah Ishii',
      email: 'hannah.ishii@example.com',
      phone: '+1 555-0108',
      experienceYears: 4,
      skills: 'Figma, Design Systems, User Research, Prototyping, Wireframing',
      resumeText: 'Product Designer skilled in crafting accessible UI component libraries and design tokens.',
      status: 'APPLIED',
      jobIndex: 7,
    },
    {
      name: 'Ian Jenkins',
      email: 'ian.jenkins@example.com',
      phone: '+1 555-0109',
      experienceYears: 5,
      skills: 'Python, SQL, Pandas, Scikit-Learn, PostgreSQL, Metabase',
      resumeText: 'Data Scientist adept at statistical modeling, data visualization, and predictive analytics.',
      status: 'SCREENING',
      jobIndex: 8,
    },
    {
      name: 'Julia Kapoor',
      email: 'julia.kapoor@example.com',
      phone: '+1 555-0110',
      experienceYears: 6,
      skills: 'Agile/Scrum, Product Strategy, User Research, Technical Specs, API Design',
      resumeText: 'Technical Product Manager with background in software engineering and enterprise SaaS.',
      status: 'REJECTED',
      jobIndex: 9,
    },
  ];

  const createdCandidates = [];

  for (const c of candidatesData) {
    const job = createdJobs[c.jobIndex];

    // Create User for Candidate Portal Login
    const candidateUser = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        name: c.name,
        email: c.email,
        password: defaultCandidatePassword,
        role: 'CANDIDATE',
      },
    });

    // Create Candidate Profile linked to User
    await prisma.candidateProfile.upsert({
      where: { userId: candidateUser.id },
      update: {},
      create: {
        userId: candidateUser.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        experienceYears: c.experienceYears,
        skills: c.skills,
        resumeText: c.resumeText,
      },
    });

    // Create Candidate Job Application record
    const candidateRecord = await prisma.candidate.create({
      data: {
        name: c.name,
        email: c.email,
        phone: c.phone,
        experienceYears: c.experienceYears,
        skills: c.skills,
        resumeText: c.resumeText,
        status: c.status,
        jobId: job.id,
        userId: candidateUser.id,
        aiEvaluation: JSON.stringify({
          overallScore: 85 + (c.experienceYears % 10),
          summary: `Strong candidate with ${c.experienceYears} years of experience in ${c.skills.split(',')[0]}.`,
          recommendation: 'STRONG_YES',
          strengths: [`${c.experienceYears}+ years hands-on experience`, `Proficient in ${c.skills.split(',')[0]}`],
          weaknesses: ['Requires onboarding with team internal tools'],
          reasoning: `Demonstrates solid experience and alignment with role requirements.`
        }),
      },
    });

    createdCandidates.push({
      id: candidateRecord.id,
      name: c.name,
      email: c.email,
      password: 'Candidate@123',
      jobTitle: job.title,
      status: c.status,
    });
  }

  console.log('✅ Successfully seeded 10 Jobs and 10 Candidates into Supabase PostgreSQL!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
