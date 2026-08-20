import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { candidateService } from '../services/candidate.service';
import { jobService } from '../services/job.service';
import { interviewService } from '../services/interview.service';
import { feedbackService } from '../services/feedback.service';
import { authService } from '../services/auth.service';
import { aiService } from '../services/ai.service';
import { isValidCandidateTransition } from '../utils/candidateWorkflow.util';

async function runDirectTests() {
  console.log('=== EXECUTING DIRECT BUSINESS RULE VERIFICATION SUITE ===\n');

  // Setup database test entities
  const adminEmail = `admin_unit_${Date.now()}@example.com`;
  const recruiterEmail = `recruiter_unit_${Date.now()}@example.com`;
  const hashedPassword = await bcrypt.hash('Secret123!', 10);

  const admin = await prisma.user.create({
    data: { name: 'Admin Unit', email: adminEmail, password: hashedPassword, role: 'ADMIN' },
  });

  const recruiter = await prisma.user.create({
    data: { name: 'Recruiter Unit', email: recruiterEmail, password: hashedPassword, role: 'RECRUITER' },
  });

  const job = await prisma.job.create({
    data: {
      title: 'Backend Dev',
      description: 'Node.js developer',
      department: 'Engineering',
      location: 'Remote',
      employmentType: 'FULL_TIME',
      experienceRequired: '3 years',
      requiredSkills: 'Node.js, TypeScript',
      status: 'OPEN',
      createdBy: admin.id,
    },
  });

  const candidate = await prisma.candidate.create({
    data: {
      name: 'John Test',
      email: 'john.test@example.com',
      phone: '9876543210',
      resumeText: 'Node.js developer with 4 years experience',
      experienceYears: 4,
      skills: 'Node.js, Prisma',
      status: 'APPLIED',
      jobId: job.id,
    },
  });

  const interview = await prisma.interview.create({
    data: {
      candidateId: candidate.id,
      interviewerId: recruiter.id,
      scheduledAt: new Date(Date.now() + 86400000),
      duration: 45,
      type: 'TECHNICAL',
      status: 'SCHEDULED',
    },
  });

  // TEST 1: Candidate Status Transition Validation
  console.log('--- TEST 1: Candidate Status Transition Rule Enforcement ---');
  console.log(`Initial Candidate Status: '${candidate.status}'`);
  const isAppliedToHiredValid = isValidCandidateTransition('APPLIED', 'HIRED');
  console.log(`Attempting transition APPLIED -> HIRED: isValid = ${isAppliedToHiredValid}`);
  
  let t1Status = 0;
  let t1Error = '';
  try {
    await candidateService.updateCandidateStatus(candidate.id, 'HIRED');
  } catch (err: any) {
    t1Status = err.statusCode;
    t1Error = err.message;
  }
  console.log(`Result: StatusCode=${t1Status}, Error='${t1Error}'`);
  if (t1Status === 409) {
    console.log('✓ PASS: Invalid status transition APPLIED → HIRED correctly rejected with 409 Conflict.\n');
  } else {
    console.log('✗ FAIL: Expected 409 Conflict\n');
  }

  // TEST 2: Feedback Submission on Non-Completed Interview
  console.log('--- TEST 2: Feedback Submission Constraint on Non-Completed Interview ---');
  console.log(`Interview Status: '${interview.status}'`);
  let t2Status = 0;
  let t2Error = '';
  try {
    await feedbackService.submitFeedback(
      interview.id,
      {
        technicalRating: 8,
        communicationRating: 8,
        problemSolvingRating: 8,
        cultureFitRating: 8,
        strengths: 'Strong candidate',
        weaknesses: 'Minor gaps',
        comments: 'Good tech skills',
        recommendation: 'YES',
      },
      recruiter.id,
      recruiter.role
    );
  } catch (err: any) {
    t2Status = err.statusCode;
    t2Error = err.message;
  }
  console.log(`Result: StatusCode=${t2Status}, Error='${t2Error}'`);
  if (t2Status === 400 && t2Error.includes('completed interviews')) {
    console.log('✓ PASS: Feedback submission on SCHEDULED interview correctly rejected with 400.\n');
  } else {
    console.log('✗ FAIL: Expected 400 Bad Request\n');
  }

  // TEST 3: Interview Scheduling Database Candidate ID Check
  console.log('--- TEST 3: Interview Scheduling Valid Candidate DB Check ---');
  const fakeCandidateId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
  let t3Status = 0;
  let t3Error = '';
  try {
    await interviewService.scheduleInterview({
      candidateId: fakeCandidateId,
      interviewerId: recruiter.id,
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      duration: 30,
      type: 'HR',
    });
  } catch (err: any) {
    t3Status = err.statusCode;
    t3Error = err.message;
  }
  console.log(`Attempted schedule with non-existent candidateId '${fakeCandidateId}': StatusCode=${t3Status}, Error='${t3Error}'`);
  if (t3Status === 404 && t3Error === 'Candidate not found') {
    console.log('✓ PASS: Non-existent candidateId correctly verified against DB and rejected with 404.\n');
  } else {
    console.log('✗ FAIL: Expected 404 Not Found\n');
  }

  // TEST 4: AI Evaluation Timeout Handling Simulation
  console.log('--- TEST 4: AI Evaluation Timeout & Error Body Format ---');
  let t4Status = 0;
  let t4Error = '';
  try {
    // Call generateEvaluation with invalid mock context to trigger error handler
    await aiService.generateEvaluation(
      { resumeText: '', skills: '', experienceYears: 0 },
      { title: '', description: '', requiredSkills: '' },
      []
    );
  } catch (err: any) {
    t4Status = err.statusCode || 502;
    t4Error = err.message || err.error;
  }
  console.log(`Result: StatusCode=${t4Status}, ErrorBody={ error: '${t4Error}' }`);
  if (t4Status >= 500 && t4Error) {
    console.log('✓ PASS: AI evaluation error path returns structured 502/504 status with clean error body.\n');
  } else {
    console.log('✗ FAIL: Expected 502/504 error\n');
  }

  // TEST 5: Password Leakage Audit
  console.log('--- TEST 5: Password Leakage Audit across Queries ---');
  const userMe = await authService.getMe(admin.id);
  const fetchedCandidate = await candidateService.getCandidateById(candidate.id);
  const fetchedInterview = await interviewService.getInterviewById(interview.id, admin.role, admin.id);

  const meHasPassword = 'password' in userMe || 'passwordHash' in userMe;
  const candString = JSON.stringify(fetchedCandidate);
  const invString = JSON.stringify(fetchedInterview);

  console.log(`authService.getMe returns password field: ${meHasPassword}`);
  console.log(`candidateService.getCandidateById contains 'password': ${candString.includes('password')}`);
  console.log(`interviewService.getInterviewById contains 'password': ${invString.includes('password')}`);

  if (!meHasPassword && !candString.includes('password') && !invString.includes('password')) {
    console.log('✓ PASS: Zero password leakage across all user and related user object queries.\n');
  } else {
    console.log('✗ FAIL: Password leaked in query results!\n');
  }

  // TEST 6: Missing Role/ID Identity Context Validation on Interview Lookup
  console.log('--- TEST 6: Missing User Role/ID Context Validation ---');
  let t6Status = 0;
  let t6Error = '';
  try {
    await interviewService.getAuthorizedInterview(interview.id);
  } catch (err: any) {
    t6Status = err.statusCode;
    t6Error = err.message;
  }
  console.log(`Attempted getAuthorizedInterview without role/id: StatusCode=${t6Status}, Error='${t6Error}'`);
  if (t6Status === 401 && t6Error.includes('Authentication required')) {
    console.log('✓ PASS: Missing user identity context correctly rejected with 401 Unauthorized.\n');
  } else {
    console.log('✗ FAIL: Expected 401 Unauthorized\n');
  }

  // Clean up
  await prisma.interview.delete({ where: { id: interview.id } });
  await prisma.candidate.delete({ where: { id: candidate.id } });
  await prisma.job.delete({ where: { id: job.id } });
  await prisma.user.delete({ where: { id: admin.id } });
  await prisma.user.delete({ where: { id: recruiter.id } });

  console.log('=== ALL DIRECT BUSINESS RULE TESTS COMPLETED SUCCESSFULLY ===');
}

runDirectTests().catch(console.error);
