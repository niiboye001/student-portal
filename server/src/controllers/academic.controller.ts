import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';
import { logAudit } from '../services/audit.service';
import { AuthRequest } from '../middleware/auth.middleware';

// Validation Schemas
const createDepartmentSchema = z.object({
    name: z.string().min(2),
    code: z.string().min(2).max(10),
});

const createProgramSchema = z.object({
    name: z.string().min(2),
    code: z.string().min(2).max(10),
    departmentId: z.string().uuid(),
});

// --- Departments ---

export const getDepartments = async (req: Request, res: Response) => {
    try {
        const departments = await prisma.department.findMany({
            include: {
                programs: {
                    include: {
                        _count: {
                            select: {
                                students: true,
                                courses: true
                            }
                        }
                    }
                },
                _count: {
                    select: { courses: true }
                }
            },
            orderBy: { name: 'asc' }
        });
        res.json(departments);
    } catch (error) {
        console.error('Get departments error:', error);
        res.status(500).json({ message: 'Error fetching departments' });
    }
};

// ... (skipping create/delete which are handled in other chunks, wait, I can't skip ranges in this tool easily without overlap risks. Let me just target the specific lines for Get)

// Actually, I'll do this in a separate call to be safer, or just accept that I might have missed the headers.
// Wait, I can just do MultiReplace for the file if I want.
// But I will stick to single replaces for now.

export const createDepartment = async (req: Request, res: Response) => {
    try {
        const { name, code } = createDepartmentSchema.parse(req.body);

        const existing = await prisma.department.findFirst({
            where: { OR: [{ name }, { code }] }
        });

        if (existing) {
            return res.status(400).json({ message: 'Department with this name or code already exists' });
        }

        const department = await prisma.department.create({
            data: { name, code }
        });

        await logAudit((req as AuthRequest).user!.userId, 'CREATE_DEPARTMENT', 'DEPARTMENT', { id: department.id, name }, req.ip);

        res.status(201).json(department);
    } catch (error: any) {
        console.error('Create department error:', error);
        res.status(500).json({ message: error.message || 'Error creating department' });
    }
};

export const deleteDepartment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Check for dependencies? Prisma might restrict or cascade.
        // Usually good to check if it has programs/courses.

        await prisma.department.delete({ where: { id } });

        await logAudit((req as AuthRequest).user!.userId, 'DELETE_DEPARTMENT', 'DEPARTMENT', { id }, req.ip);

        res.json({ message: 'Department deleted successfully' });
    } catch (error) {
        console.error('Delete department error:', error);
        res.status(500).json({ message: 'Error deleting department' });
    }
};

// --- Programs ---

export const getPrograms = async (req: Request, res: Response) => {
    try {
        const programs = await prisma.program.findMany({
            include: {
                department: true,
                _count: {
                    select: { students: true }
                }
            },
            orderBy: { name: 'asc' }
        });
        res.json(programs);
    } catch (error) {
        console.error('Get programs error:', error);
        res.status(500).json({ message: 'Error fetching programs' });
    }
};

export const createProgram = async (req: Request, res: Response) => {
    try {
        const { name, code, departmentId } = createProgramSchema.parse(req.body);

        const existing = await prisma.program.findUnique({
            where: { code }
        });

        if (existing) {
            return res.status(400).json({ message: 'Program with this code already exists' });
        }

        const program = await prisma.program.create({
            data: { name, code, departmentId }
        });

        await logAudit((req as AuthRequest).user!.userId, 'CREATE_PROGRAM', 'PROGRAM', { id: program.id, name }, req.ip);

        res.status(201).json(program);
    } catch (error: any) {
        console.error('Create program error:', error);
        res.status(500).json({ message: error.message || 'Error creating program' });
    }
};

export const deleteProgram = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.program.delete({ where: { id } });

        await logAudit((req as AuthRequest).user!.userId, 'DELETE_PROGRAM', 'PROGRAM', { id }, req.ip);

        res.json({ message: 'Program deleted successfully' });
    } catch (error) {
        console.error('Delete program error:', error);
        res.status(500).json({ message: 'Error deleting program' });
    }
};

export const updateDepartment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, code } = createDepartmentSchema.parse(req.body);

        // Check for duplicates excluding self
        const existing = await prisma.department.findFirst({
            where: {
                OR: [{ name }, { code }],
                NOT: { id }
            }
        });

        if (existing) {
            return res.status(400).json({ message: 'Department with this name or code already exists' });
        }

        const department = await prisma.department.update({
            where: { id },
            data: { name, code }
        });

        await logAudit((req as AuthRequest).user!.userId, 'UPDATE_DEPARTMENT', 'DEPARTMENT', { id, name }, req.ip);

        res.json(department);
    } catch (error: any) {
        console.error('Update department error:', error);
        res.status(500).json({ message: error.message || 'Error updating department' });
    }
};

export const updateProgram = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, code, departmentId } = createProgramSchema.parse(req.body);

        const existing = await prisma.program.findFirst({
            where: {
                code,
                NOT: { id }
            }
        });

        if (existing) {
            return res.status(400).json({ message: 'Program with this code already exists' });
        }

        const program = await prisma.program.update({
            where: { id },
            data: { name, code, departmentId }
        });

        await logAudit((req as AuthRequest).user!.userId, 'UPDATE_PROGRAM', 'PROGRAM', { id, name }, req.ip);

        res.json(program);
    } catch (error: any) {
        console.error('Update program error:', error);
        res.status(500).json({ message: error.message || 'Error updating program' });
    }
};
