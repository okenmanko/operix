import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function toNumber(value: any, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

@Injectable()
export class HrService {
  constructor(private readonly prisma: PrismaService) {}

  employees(companyId: string) {
    return this.prisma.employee.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      include: {
        attendanceRecords: { orderBy: { createdAt: 'desc' }, take: 5 },
        salaryPayments: { orderBy: { paidAt: 'desc' }, take: 5 },
      },
    });
  }

  async createEmployee(companyId: string, data: any) {
    if (!data?.fullName) {
      throw new BadRequestException('Xodim ismi kerak');
    }

    const salary = data.salaryUZS ?? data.salary;

    return this.prisma.employee.create({
      data: {
        companyId,
        fullName: data.fullName,
        phone: data.phone || null,
        position: data.position || null,
        salary: salary === undefined ? null : toNumber(salary),
        status: data.status || 'ACTIVE',
        hiredAt: data.hiredAt ? new Date(data.hiredAt) : null,
        comment: data.comment || null,
      },
    });
  }

  async updateEmployee(companyId: string, id: string, data: any) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, companyId },
    });

    if (!employee) {
      throw new NotFoundException('Xodim topilmadi');
    }

    const salary = data.salaryUZS ?? data.salary;

    return this.prisma.employee.update({
      where: { id },
      data: {
        fullName: data.fullName ?? undefined,
        phone: data.phone ?? undefined,
        position: data.position ?? undefined,
        salary: salary === undefined ? undefined : toNumber(salary),
        status: data.status ?? undefined,
        hiredAt: data.hiredAt ? new Date(data.hiredAt) : undefined,
        firedAt: data.firedAt ? new Date(data.firedAt) : undefined,
        comment: data.comment ?? undefined,
      },
    });
  }

  async deleteEmployee(companyId: string, id: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, companyId },
    });

    if (!employee) {
      throw new NotFoundException('Xodim topilmadi');
    }

    return this.prisma.employee.delete({ where: { id } });
  }

  attendance(companyId: string) {
    return this.prisma.attendanceRecord.findMany({
      where: { companyId },
      orderBy: { date: 'desc' },
      include: { employee: true },
    });
  }

  async createAttendance(companyId: string, data: any) {
    if (!data?.employeeId) {
      throw new BadRequestException('employeeId kerak');
    }

    const employee = await this.prisma.employee.findFirst({
      where: { id: data.employeeId, companyId },
    });

    if (!employee) {
      throw new NotFoundException('Xodim topilmadi');
    }

    return this.prisma.attendanceRecord.create({
      data: {
        companyId,
        employeeId: data.employeeId,
        date: data.date ? new Date(data.date) : new Date(),
        status: data.status || 'PRESENT',
        checkIn: data.checkIn ? new Date(data.checkIn) : null,
        checkOut: data.checkOut ? new Date(data.checkOut) : null,
        comment: data.comment || null,
      },
      include: { employee: true },
    });
  }

  salaryPayments(companyId: string) {
    return this.prisma.salaryPayment.findMany({
      where: { companyId },
      orderBy: { paidAt: 'desc' },
      include: { employee: true },
    });
  }

  async createSalaryPayment(companyId: string, data: any) {
    if (!data?.employeeId) {
      throw new BadRequestException('employeeId kerak');
    }

    const employee = await this.prisma.employee.findFirst({
      where: { id: data.employeeId, companyId },
    });

    if (!employee) {
      throw new NotFoundException('Xodim topilmadi');
    }

    return this.prisma.salaryPayment.create({
      data: {
        companyId,
        employeeId: data.employeeId,
        amount: toNumber(data.amount),
        method: data.method || null,
        comment: data.comment || null,
        paidAt: data.paidAt ? new Date(data.paidAt) : new Date(),
      },
      include: { employee: true },
    });
  }

  async summary(companyId: string) {
    const [employees, salaryPayments, attendance] = await Promise.all([
      this.prisma.employee.findMany({ where: { companyId } }),
      this.prisma.salaryPayment.findMany({ where: { companyId } }),
      this.prisma.attendanceRecord.findMany({ where: { companyId } }),
    ]);

    const activeEmployees = employees.filter((e) => e.status === 'ACTIVE');
    const monthlySalary = activeEmployees.reduce(
      (sum, e) => sum + toNumber(e.salary),
      0,
    );
    const paidTotal = salaryPayments.reduce(
      (sum, p) => sum + toNumber(p.amount),
      0,
    );

    return {
      employeesCount: employees.length,
      activeEmployeesCount: activeEmployees.length,
      monthlySalary,
      paidTotal,
      attendanceCount: attendance.length,
    };
  }
}
