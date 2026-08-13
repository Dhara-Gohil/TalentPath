import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { RegisterInput, LoginInput, UpdateUserRoleInput, AddUserInput, UpdateUserInput } from '../schemas/auth.schema';

const USER_SELECT_FIELDS = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

export const authService = {
  async register(data: RegisterInput) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw { statusCode: 400, message: 'Email already exists' };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const role = data.role || 'CANDIDATE';

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: role,
      },
      select: USER_SELECT_FIELDS,
    });

    if (role === 'CANDIDATE') {
      // 1. Create CandidateProfile
      await prisma.candidateProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          name: user.name,
          email: user.email,
          phone: '',
          experienceYears: 0,
          skills: 'General',
          resumeText: '',
        },
      });

      // 2. Automatically list candidate in All Participants directory if an open job exists
      const openJob = await prisma.job.findFirst({
        where: { status: 'OPEN' },
        orderBy: { createdAt: 'desc' },
      });

      if (openJob) {
        const existingCand = await prisma.candidate.findFirst({
          where: { OR: [{ userId: user.id }, { email: user.email }] },
        });

        if (!existingCand) {
          await prisma.candidate.create({
            data: {
              name: user.name,
              email: user.email,
              phone: 'Not provided',
              experienceYears: 0,
              skills: 'Registered Candidate',
              resumeText: 'Registered Candidate Account',
              status: 'APPLIED',
              jobId: openJob.id,
              userId: user.id,
            },
          });
        }
      }
    }

    return user;
  },

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      throw { statusCode: 401, message: 'Invalid credentials' };
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) {
      throw { statusCode: 401, message: 'Invalid credentials' };
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    const { password, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword };
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: USER_SELECT_FIELDS,
    });

    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    return user;
  },

  async getAllUsers() {
    return prisma.user.findMany({
      select: USER_SELECT_FIELDS,
      orderBy: { createdAt: 'desc' },
    });
  },

  async addUser(data: AddUserInput) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw { statusCode: 400, message: 'Email already exists' };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role || 'RECRUITER',
      },
      select: USER_SELECT_FIELDS,
    });
  },

  async updateUserRole(id: string, data: UpdateUserRoleInput) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    return prisma.user.update({
      where: { id },
      data: { role: data.role },
      select: USER_SELECT_FIELDS,
    });
  },

  async updateUser(id: string, data: UpdateUserInput) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.role) updateData.role = data.role;
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    return prisma.user.update({
      where: { id },
      data: updateData,
      select: USER_SELECT_FIELDS,
    });
  },

  async deleteUser(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    try {
      await prisma.$transaction([
        prisma.feedback.deleteMany({ where: { createdBy: id } }),
        prisma.interview.deleteMany({ where: { interviewerId: id } }),
        prisma.user.delete({ where: { id } }),
      ]);
      return { message: 'User deleted successfully' };
    } catch (err: any) {
      throw { statusCode: 400, message: err.message || 'Failed to delete user' };
    }
  },
};

