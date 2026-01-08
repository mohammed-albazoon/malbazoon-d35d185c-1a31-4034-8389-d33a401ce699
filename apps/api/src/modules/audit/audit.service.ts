import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { AuditLog } from '../../entities';
import { AuditAction, IAuditLogFilter } from '@task-management/data';

interface CreateAuditLogDto {
  userId: string;
  userEmail: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>
  ) {}

  async log(data: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create(data);
    const saved = await this.auditLogRepository.save(auditLog);

    // Also log to console for visibility
    console.log(
      `[AUDIT] ${new Date().toISOString()} | ${data.action} | ${data.resource} | User: ${data.userEmail} | ${data.details || ''}`
    );

    return saved;
  }

  async findAll(
    filter: IAuditLogFilter,
    organizationId: string,
    page = 1,
    limit = 50
  ): Promise<{ data: AuditLog[]; total: number; page: number; limit: number }> {
    const where: any = {};

    if (filter.userId) {
      where.userId = filter.userId;
    }

    if (filter.action) {
      where.action = filter.action;
    }

    if (filter.resource) {
      where.resource = Like(`%${filter.resource}%`);
    }

    if (filter.startDate && filter.endDate) {
      where.createdAt = Between(filter.startDate, filter.endDate);
    }

    const [data, total] = await this.auditLogRepository.findAndCount({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findByUser(userId: string, limit = 100): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
