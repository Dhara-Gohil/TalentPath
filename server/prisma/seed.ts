import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with rich Jobs and Candidate profiles...');

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

  // 2. Define 10 Jobs with Rich Markdown Descriptions
  const jobsData = [
    {
      title: 'Senior React Frontend Developer',
      department: 'Engineering',
      location: 'San Francisco, CA (Hybrid)',
      employmentType: 'FULL_TIME',
      experienceRequired: '5+ years',
      requiredSkills: 'React, TypeScript, Redux, Material UI, Webpack, TailwindCSS',
      description: `## Job Summary
We are seeking an experienced Senior React Frontend Developer to lead our UI engineering team in architecting high-performance recruiter dashboards, candidate tracking systems, and real-time interview evaluation interfaces.

### Key Responsibilities
* Architect, build, and maintain production-grade React components using modern TypeScript standards.
* Establish frontend performance benchmarks, code-splitting strategies, and MUI theme design tokens.
* Collaborate closely with UI/UX product designers and backend engineers to integrate REST & WebSocket endpoints.
* Conduct comprehensive code reviews, enforce unit testing standards, and mentor junior frontend engineers.

### Required Competencies & Qualifications
* **5+ years** of hands-on experience building complex, large-scale React single-page applications.
* Mastery of TypeScript, React Hooks, Context API, Redux Toolkit, and Material-UI (MUI).
* Strong understanding of web performance optimization (Lighthouse, Core Web Vitals, tree-shaking).
* Familiarity with CI/CD deployment workflows on Vercel, AWS, or Netlify.

### What We Offer
* Competitive base salary ($140k - $175k) + equity options.
* Comprehensive health, vision, dental, and remote equipment stipends.`,
      status: 'OPEN',
    },
    {
      title: 'Backend Node.js Engineer',
      department: 'Engineering',
      location: 'Remote',
      employmentType: 'FULL_TIME',
      experienceRequired: '3+ years',
      requiredSkills: 'Node.js, Express.js, PostgreSQL, Prisma, Redis, Docker',
      description: `## Job Summary
Join our core platform team building scale-ready backend microservices, real-time webhooks, authentication systems, and database access layers powering our global talent platform.

### Key Responsibilities
* Design and implement secure RESTful API contracts using Node.js, Express, and Prisma ORM.
* Optimize PostgreSQL queries, database index strategies, and Redis caching layers for high-throughput traffic.
* Maintain JWT authentication, RBAC authorization, and API rate limiting security controls.
* Package applications with Docker containers and streamline deployment pipelines.

### Required Competencies & Qualifications
* **3+ years** of experience in Node.js backend development in production SaaS environments.
* Deep knowledge of relational database modeling (PostgreSQL / SQLite) and ORMs (Prisma / TypeORM).
* Proficiency in async event-driven architecture, caching strategies, and REST API design patterns.
* Experience writing unit tests with Jest / Supertest.

### What We Offer
* 100% remote flexibility across US/Canada time zones.
* Generous learning & development budget for cloud certifications.`,
      status: 'OPEN',
    },
    {
      title: 'Full Stack Software Engineer',
      department: 'Product',
      location: 'New York, NY (Hybrid)',
      employmentType: 'FULL_TIME',
      experienceRequired: '4+ years',
      requiredSkills: 'React, Node.js, TypeScript, PostgreSQL, REST APIs, GraphQL',
      description: `## Job Summary
Looking for a product-minded Full Stack Software Engineer to build end-to-end recruiter collaboration tools, live interview feedback streams, and AI candidate summary modules.

### Key Responsibilities
* Deliver features end-to-end across React user interfaces, Express API controllers, and database schema migrations.
* Translate product specifications into modular, reusable, and maintainable full-stack software.
* Ensure application security, input validation (Zod/Yup), and exception handling across client and server.
* Participate in agile sprint planning, technical estimations, and weekly product releases.

### Required Competencies & Qualifications
* **4+ years** of full-stack development experience using React, Node.js, and TypeScript.
* Solid experience with relational databases (PostgreSQL) and API integrations.
* Strong problem-solving mindset and ability to communicate technical trade-offs to business stakeholders.

### What We Offer
* Hybrid office in Midtown Manhattan with catered lunches.
* Health, dental, 401(k) matching, and annual team retreats.`,
      status: 'OPEN',
    },
    {
      title: 'DevOps & Infrastructure Engineer',
      department: 'Infrastructure',
      location: 'Remote',
      employmentType: 'CONTRACT',
      experienceRequired: '4+ years',
      requiredSkills: 'AWS, Kubernetes, Terraform, Docker, CI/CD, GitHub Actions',
      description: `## Job Summary
Maintain high availability, operational resilience, and automated infrastructure deployment pipelines for our multi-region web platform.

### Key Responsibilities
* Provision cloud infrastructure on AWS using Infrastructure as Code (Terraform / CloudFormation).
* Manage Kubernetes clusters (EKS), container registries, and microservice deployments.
* Automate continuous integration and continuous delivery (CI/CD) pipelines using GitHub Actions.
* Monitor system health, latency, and uptime using CloudWatch, Prometheus, and Datadog.

### Required Competencies & Qualifications
* **4+ years** of DevOps or Site Reliability Engineering (SRE) experience.
* Expertise in AWS cloud services (EC2, S3, RDS, IAM, CloudFront, EKS).
* Solid scripting skills in Bash, Python, or Go.

### What We Offer
* High-rate hourly contract with option to transition to full-time permanent role.`,
      status: 'OPEN',
    },
    {
      title: 'AI/ML Prompt & Pipeline Engineer',
      department: 'AI & Data Science',
      location: 'Austin, TX',
      employmentType: 'FULL_TIME',
      experienceRequired: '3+ years',
      requiredSkills: 'Python, OpenAI API, LangChain, Node.js, Vector DBs, PyTorch',
      description: `## Job Summary
Design, benchmark, and optimize LLM-powered candidate resume parsing, real-time interview copilot intelligence, and automated assessment summarization engines.

### Key Responsibilities
* Architect prompt engineering chains and RAG (Retrieval-Augmented Generation) workflows using OpenAI & Python.
* Implement fallback mechanisms, structured JSON output validation, and latency optimization for live AI features.
* Fine-tune embedding search, vector indexing (Pinecone / Pgvector), and semantic similarity matching algorithms.
* Collaborate with software teams to integrate AI models cleanly into Express backend services.

### Required Competencies & Qualifications
* **3+ years** experience working with Machine Learning models and Generative AI frameworks.
* Hands-on proficiency with OpenAI API, LangChain, Python, and Node.js integration.
* Experience handling LLM rate limits, error fallbacks, and token budgeting.

### What We Offer
* Access to top-tier GPU infrastructure and AI research budgets.
* Comprehensive benefits and competitive equity grants.`,
      status: 'OPEN',
    },
    {
      title: 'Mobile App Developer (React Native)',
      department: 'Engineering',
      location: 'Remote',
      employmentType: 'FULL_TIME',
      experienceRequired: '3+ years',
      requiredSkills: 'React Native, TypeScript, iOS, Android, REST APIs',
      description: `## Job Summary
Develop cross-platform iOS and Android mobile applications allowing interviewers and hiring managers to conduct candidate evaluations, record audio notes, and view live feedback on the go.

### Key Responsibilities
* Build fluid, responsive mobile interfaces using React Native, TypeScript, and native mobile modules.
* Integrate voice recording APIs, real-time push notifications, and offline data synchronization.
* Publish app releases to the Apple App Store and Google Play Store following platform guidelines.

### Required Competencies & Qualifications
* **3+ years** of React Native commercial app development experience.
* Solid grasp of state management, mobile UI design guidelines, and app performance profiling.

### What We Offer
* Remote-first environment with home office stipend.`,
      status: 'OPEN',
    },
    {
      title: 'QA Automation Engineer',
      department: 'Quality Assurance',
      location: 'Chicago, IL (Hybrid)',
      employmentType: 'FULL_TIME',
      experienceRequired: '2+ years',
      requiredSkills: 'Cypress, Playwright, Jest, JavaScript, CI/CD Integration',
      description: `## Job Summary
Build robust automated end-to-end (E2E) test suites for web applications, candidate portals, and backend API contracts to guarantee zero-regression product deployments.

### Key Responsibilities
* Design, write, and execute automated Cypress & Playwright test scripts for full web applications.
* Integrate E2E test suites into CI/CD pipelines to validate pull requests automatically.
* Collaborate with developers to reproduce bug reports and verify patch deployments.

### Required Competencies & Qualifications
* **2+ years** experience in test automation using JavaScript / TypeScript frameworks (Playwright, Cypress, Jest).
* Knowledge of HTTP status codes, REST API testing, and web DOM automation selectors.

### What We Offer
* Competitive base salary + bonus + health benefits.`,
      status: 'OPEN',
    },
    {
      title: 'UI/UX Product Designer',
      department: 'Design',
      location: 'Remote',
      employmentType: 'PART_TIME',
      experienceRequired: '3+ years',
      requiredSkills: 'Figma, Design Systems, Wireframing, User Research, Prototyping',
      description: `## Job Summary
Craft intuitive interfaces, dark-mode visual design systems, and seamless recruitment workflows for interviewers, candidates, and hiring managers.

### Key Responsibilities
* Create high-fidelity Figma prototypes, interactive wireframes, and design token specifications.
* Conduct user research interviews with recruiters to identify friction points and optimize usability.
* Partner with frontend engineers to ensure design implementation pixel accuracy.

### Required Competencies & Qualifications
* **3+ years** of UI/UX product design experience for complex B2B or enterprise SaaS products.
* Deep proficiency in Figma design components, auto-layout, and dark-theme aesthetics.

### What We Offer
* Flexible part-time hours with opportunity for full-time expansion.`,
      status: 'OPEN',
    },
    {
      title: 'Data Scientist & Analytics Engineer',
      department: 'Data & Analytics',
      location: 'Boston, MA',
      employmentType: 'FULL_TIME',
      experienceRequired: '4+ years',
      requiredSkills: 'Python, SQL, Pandas, Scikit-learn, Metabase, PostgreSQL',
      description: `## Job Summary
Analyze recruitment funnel performance, build predictive candidate scoring models, and construct executive analytics dashboards for enterprise hiring metrics.

### Key Responsibilities
* Construct ETL data pipelines converting platform events into structured warehouse tables.
* Develop statistical algorithms analyzing interview evaluation data and pass-through funnel ratios.
* Build executive Metabase reports and real-time recruitment dashboards.

### Required Competencies & Qualifications
* **4+ years** experience in data science, analytics engineering, or data modeling.
* Expertise in complex SQL queries, Python data analysis libraries (Pandas, NumPy, Scikit-learn), and PostgreSQL.

### What We Offer
* Generous compensation and annual performance bonuses.`,
      status: 'OPEN',
    },
    {
      title: 'Technical Product Manager',
      department: 'Product',
      location: 'Remote',
      employmentType: 'FULL_TIME',
      experienceRequired: '5+ years',
      requiredSkills: 'Product Strategy, Agile, User Stories, REST APIs, Analytics',
      description: `## Job Summary
Drive the strategic product roadmap for candidate experience, enterprise recruiting workflows, live AI copilot tools, and interviewer evaluation management modules.

### Key Responsibilities
* Own the product lifecycle from discovery, user research, wireframing, technical user story creation, to launch.
* Define feature requirements, API specifications, and acceptance criteria in collaboration with engineering leads.
* Monitor product KPIs, candidate conversion funnels, and interviewer engagement metrics to iterate on features.

### Required Competencies & Qualifications
* **5+ years** of product management experience leading technical SaaS or recruitment tech applications.
* Strong technical fluency—ability to read API documentation, query SQL database tables, and discuss system architecture.
* Excellent cross-functional leadership and stakeholder communication skills.

### What We Offer
* Competitive executive salary, equity grant, and unlimited PTO.`,
      status: 'OPEN',
    },
  ];

  const createdJobs = [];
  for (const j of jobsData) {
    const existingJob = await prisma.job.findFirst({ where: { title: j.title } });
    if (existingJob) {
      const updated = await prisma.job.update({
        where: { id: existingJob.id },
        data: {
          description: j.description,
          requiredSkills: j.requiredSkills,
          experienceRequired: j.experienceRequired,
          location: j.location,
          department: j.department,
        },
      });
      createdJobs.push(updated);
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

  // 3. Define 10 Candidates with Rich Resumes
  const candidatesData = [
    {
      name: 'Alex Rivera',
      email: 'alex.rivera@example.com',
      phone: '+1 555-0101',
      experienceYears: 6,
      skills: 'React, TypeScript, Redux Toolkit, Webpack, Material UI',
      resumeText: `## Professional Summary
Accomplished Senior Frontend Developer with 6 years of experience architecting and scaling enterprise React single-page applications. Proven track record of improving web vital performance by 40% and delivering complex dashboard tools.

## Core Technical Competencies
* **Frontend Tech:** React 18, TypeScript, Redux Toolkit, Material-UI (MUI), HTML5/CSS3, Webpack, TailwindCSS
* **Architecture & Testing:** Web Performance Optimization, Component Design Systems, Jest, React Testing Library
* **Tools:** Git, JIRA, Figma, CI/CD, Postman, Vercel

## Professional Work Experience

### Senior Frontend Engineer | CloudMatrix SaaS (2022 - Present)
* Spearheaded the migration of legacy client portal to React 18 + TypeScript, reducing bundle load time by 45%.
* Developed reusable Material-UI design system components utilized across 4 enterprise product lines.
* Led a squad of 4 frontend engineers, conducting daily code reviews and setting architectural standards.

### Frontend Developer | Apex Interactive (2019 - 2022)
* Built real-time analytics dashboard with WebSockets handling 10k+ live events per second.
* Implemented client-side caching and dynamic route lazy loading to maintain under 1.2s First Contentful Paint.

## Education & Credentials
* **B.S. in Computer Science** - University of California, Berkeley
* AWS Certified Cloud Practitioner`,
      status: 'SHORTLISTED',
      jobIndex: 0,
    },
    {
      name: 'Beatriz Chen',
      email: 'beatriz.chen@example.com',
      phone: '+1 555-0102',
      experienceYears: 4,
      skills: 'Node.js, Express, PostgreSQL, Prisma, Docker, Redis',
      resumeText: `## Professional Summary
Backend Software Engineer with 4 years of experience building high-throughput microservices, REST APIs, and event-driven architectures using Node.js, Express, and PostgreSQL.

## Core Technical Competencies
* **Backend:** Node.js, Express.js, TypeScript, REST APIs, GraphQL, Webhooks
* **Databases & Caching:** PostgreSQL, Prisma ORM, SQLite, Redis Cluster
* **DevOps & Infrastructure:** Docker, Kubernetes, AWS (S3, RDS, EC2), GitHub Actions

## Professional Work Experience

### Backend Software Engineer | Dataflow Inc. (2022 - Present)
* Architected scalable Node.js microservices processing over 5M daily API requests with 99.95% uptime.
* Designed relational database schemas and optimized Prisma ORM queries, reducing DB read latency by 60ms.
* Implemented JWT-based OAuth2 authentication and role-based access control (RBAC) security filters.

### Software Developer | TechPulse Systems (2020 - 2022)
* Built background job queues using Redis and BullMQ for automated notification deliveries.
* Developed automated integration testing suite achieving 92% code coverage across core API routes.

## Education
* **B.S. in Software Engineering** - University of Texas at Austin`,
      status: 'INTERVIEW',
      jobIndex: 1,
    },
    {
      name: 'Charlie Davis',
      email: 'charlie.davis@example.com',
      phone: '+1 555-0103',
      experienceYears: 5,
      skills: 'React, Node.js, TypeScript, PostgreSQL, GraphQL',
      resumeText: `## Professional Summary
Versatile Full Stack Software Engineer with 5 years of commercial experience delivering end-to-end web applications. Expert in React frontend architecture and Node.js backend integration.

## Core Technical Competencies
* **Full Stack Stack:** React, Node.js, Express, TypeScript, PostgreSQL, Prisma, GraphQL
* **State & Styling:** Redux Toolkit, Context API, MUI, TailwindCSS, CSS Modules
* **Database & Cloud:** PostgreSQL, Redis, Docker, Vercel, AWS S3

## Professional Work Experience

### Senior Full Stack Engineer | Enterprise Connect (2021 - Present)
* Built candidate evaluation workflows from scratch, connecting React frontend forms to Express/Prisma APIs.
* Streamlined real-time WebSocket communication for multi-user collaboration during active interview evaluation sessions.
* Reduced backend query times by 50% using strategic indexing and Redis response caching.

### Full Stack Developer | ByteCraft Solutions (2019 - 2021)
* Developed responsive web applications for enterprise clients using React, Node.js, and SQL databases.

## Education
* **B.S. in Computer Engineering** - Columbia University`,
      status: 'HIRED',
      jobIndex: 2,
    },
    {
      name: 'Diana Evans',
      email: 'diana.evans@example.com',
      phone: '+1 555-0104',
      experienceYears: 4,
      skills: 'AWS, Kubernetes, Terraform, Docker, GitHub Actions',
      resumeText: `## Professional Summary
DevOps & Infrastructure Engineer with 4 years experience automating cloud environments, container orchestration, and continuous deployment pipelines.

## Core Technical Competencies
* **Cloud & Infrastructure:** AWS (EKS, EC2, RDS, IAM, VPC), Terraform, CloudFormation
* **Containerization & CI/CD:** Docker, Kubernetes, Helm, GitHub Actions, Jenkins
* **Monitoring:** Datadog, Prometheus, Grafana, CloudWatch

## Professional Work Experience

### DevOps Engineer | CloudScale Tech (2022 - Present)
* Managed multi-region Kubernetes (EKS) clusters serving high-traffic web applications.
* Automated infrastructure provisioning using Terraform, reducing environment setup times from days to 15 minutes.
* Configured GitHub Actions CI/CD pipelines for automated zero-downtime deployment.

## Education
* **B.S. in Information Technology** - University of Washington`,
      status: 'SCREENING',
      jobIndex: 3,
    },
    {
      name: 'Ethan Foster',
      email: 'ethan.foster@example.com',
      phone: '+1 555-0105',
      experienceYears: 3,
      skills: 'Python, OpenAI API, LangChain, PyTorch, Vector Databases',
      resumeText: `## Professional Summary
AI & Prompt Pipeline Engineer with 3 years experience building LLM-backed applications, retrieval-augmented generation (RAG) systems, and AI summarization workflows.

## Core Technical Competencies
* **AI & ML:** OpenAI API, LangChain, Python, PyTorch, Vector Databases (Pgvector, Pinecone)
* **Backend:** Node.js, Express, Python FastAPI, REST APIs, JSON Schema validation
* **Data Processing:** Pandas, NumPy, Prompt Engineering, Semantic Search

## Professional Work Experience

### AI Software Engineer | Cognitive AI Labs (2023 - Present)
* Developed automated resume parsing and candidate evaluation summarization algorithms using OpenAI APIs.
* Implemented vector embedding pipelines for fast semantic candidate-to-job matching algorithms.

## Education
* **M.S. in Artificial Intelligence** - Carnegie Mellon University`,
      status: 'APPLIED',
      jobIndex: 4,
    },
    {
      name: 'Fiona Garcia',
      email: 'fiona.garcia@example.com',
      phone: '+1 555-0106',
      experienceYears: 4,
      skills: 'React Native, TypeScript, Redux, iOS Swift, Android Kotlin',
      resumeText: `## Professional Summary
Mobile App Developer with 4 years experience creating high-rating cross-platform iOS and Android mobile applications using React Native and native mobile bridges.

## Core Technical Competencies
* **Mobile Stack:** React Native, TypeScript, Redux Toolkit, React Navigation, Expo
* **Native Platforms:** iOS (Swift / Xcode), Android (Kotlin / Android Studio)
* **Integrations:** REST APIs, WebSockets, Push Notifications, Audio Recording

## Professional Work Experience

### Senior Mobile Engineer | AppVibe Studio (2021 - Present)
* Built and published 3 commercial React Native mobile apps with over 250k combined downloads.
* Integrated real-time audio recording and transcription APIs for mobile meeting evaluations.

## Education
* **B.S. in Computer Science** - Georgia Institute of Technology`,
      status: 'INTERVIEW',
      jobIndex: 5,
    },
    {
      name: 'George Harris',
      email: 'george.harris@example.com',
      phone: '+1 555-0107',
      experienceYears: 3,
      skills: 'Cypress, Playwright, Jest, JavaScript, Postman API Testing',
      resumeText: `## Professional Summary
QA Automation Specialist with 3 years experience writing automated test frameworks, regression suites, and REST API contract verifications.

## Core Technical Competencies
* **Testing Frameworks:** Cypress, Playwright, Jest, Supertest, Postman
* **Languages & Tools:** JavaScript, TypeScript, Git, GitHub Actions, JIRA

## Professional Work Experience

### QA Automation Engineer | QualityFirst Software (2022 - Present)
* Built end-to-end Cypress test automation pipeline covering 150+ critical web user journeys.
* Reduced manual regression testing duration by 80% through parallel test execution in CI/CD.

## Education
* **B.S. in Computer Science** - Illinois Institute of Technology`,
      status: 'SHORTLISTED',
      jobIndex: 6,
    },
    {
      name: 'Hannah Ishii',
      email: 'hannah.ishii@example.com',
      phone: '+1 555-0108',
      experienceYears: 4,
      skills: 'Figma, Design Systems, User Research, Prototyping, Wireframing',
      resumeText: `## Professional Summary
UI/UX Product Designer with 4 years experience designing accessible B2B SaaS interfaces, dark-theme component libraries, and recruitment workflow solutions.

## Core Technical Competencies
* **Design Tools:** Figma, Design Tokens, Auto-Layout, Adobe Creative Cloud, Framer
* **Methods:** User Research, Usability Testing, Wireframing, High-Fidelity Prototyping

## Professional Work Experience

### UI/UX Product Designer | PixelCraft Design (2021 - Present)
* Redesigned enterprise recruiter navigation dashboard, increasing candidate processing efficiency by 35%.
* Developed complete dark-mode design system with 200+ accessible Figma components.

## Education
* **B.F.A. in Interaction Design** - Rhode Island School of Design`,
      status: 'APPLIED',
      jobIndex: 7,
    },
    {
      name: 'Ian Jenkins',
      email: 'ian.jenkins@example.com',
      phone: '+1 555-0109',
      experienceYears: 5,
      skills: 'Python, SQL, Pandas, Scikit-Learn, PostgreSQL, Metabase',
      resumeText: `## Professional Summary
Data Scientist & Analytics Engineer with 5 years experience converting raw platform metrics into actionable hiring funnel insights and predictive candidate scoring models.

## Core Technical Competencies
* **Data Analytics:** Python (Pandas, NumPy, Scikit-Learn), SQL, PostgreSQL
* **BI & Visualization:** Metabase, Tableau, Matplotlib, Data Warehousing

## Professional Work Experience

### Senior Data Analyst | MetricPulse Analytics (2020 - Present)
* Constructed predictive candidate scoring models evaluating recruiter pass-through probabilities.
* Created automated Metabase analytics dashboards tracking quarterly time-to-hire metrics.

## Education
* **M.S. in Statistics** - Harvard University`,
      status: 'SCREENING',
      jobIndex: 8,
    },
    {
      name: 'Julia Kapoor',
      email: 'julia.kapoor@example.com',
      phone: '+1 555-0110',
      experienceYears: 6,
      skills: 'Agile/Scrum, Product Strategy, User Research, Technical Specs, API Design',
      resumeText: `## Professional Summary
Technical Product Manager with 6 years experience driving product roadmap strategy for enterprise SaaS platforms, AI recruiting workflows, and candidate management applications.

## Core Technical Competencies
* **Product Management:** Agile/Scrum, User Story Mapping, Roadmap Strategy, Product Analytics
* **Technical Fluency:** REST APIs, SQL, Data Modeling, Wireframing, Technical Architecture Specs

## Professional Work Experience

### Senior Technical Product Manager | TalentFlow Tech (2020 - Present)
* Owned end-to-end candidate management product lifecycle, increasing monthly active recruiter usage by 55%.
* Defined API specifications and user stories for live interview feedback and evaluation scorecards.
* Led daily scrum ceremonies, backlog grooming, and sprint planning for 2 engineering squads.

### Technical Product Analyst | SaaS Venture Group (2018 - 2020)
* Conducted market research and user interviews to define MVP features for enterprise recruitment software.

## Education & Certifications
* **B.S. in Management Information Systems** - New York University
* Certified Scrum Product Owner (CSPO)`,
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
      update: {
        resumeText: c.resumeText,
        skills: c.skills,
        experienceYears: c.experienceYears,
      },
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

    // Update all Candidate Job Application records for this email with rich resume text
    await prisma.candidate.updateMany({
      where: { email: c.email },
      data: {
        resumeText: c.resumeText,
        skills: c.skills,
        experienceYears: c.experienceYears,
      },
    });

    const existingCandidate = await prisma.candidate.findFirst({
      where: { email: c.email },
    });

    let candidateRecord;
    if (existingCandidate) {
      candidateRecord = existingCandidate;
    } else {
      candidateRecord = await prisma.candidate.create({
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
    }

    createdCandidates.push({
      id: candidateRecord.id,
      name: c.name,
      email: c.email,
      password: 'Candidate@123',
      jobTitle: job.title,
      status: c.status,
    });
  }

  console.log('✅ Successfully seeded 10 Jobs and 10 Candidates with rich Markdown descriptions and resumes into Supabase PostgreSQL!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
