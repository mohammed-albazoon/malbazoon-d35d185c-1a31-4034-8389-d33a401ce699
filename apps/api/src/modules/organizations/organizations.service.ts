import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization, User } from '../../entities';
import { CreateOrganizationDto, UpdateOrganizationDto, Role, AuditAction } from '@task-management/data';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    private readonly auditService: AuditService
  ) {}

  async create(createDto: CreateOrganizationDto, user: User): Promise<Organization> {
    // Only owners can create organizations
    if (user.role !== Role.OWNER) {
      throw new ForbiddenException('Only owners can create organizations');
    }

    // Child organizations can only be created under user's organization
    if (createDto.parentId && createDto.parentId !== user.organizationId) {
      throw new ForbiddenException('Can only create child organizations under your own organization');
    }

    const organization = this.organizationRepository.create({
      ...createDto,
      parentId: createDto.parentId || user.organizationId,
    });

    const saved = await this.organizationRepository.save(organization);

    await this.auditService.log({
      userId: user.id,
      userEmail: user.email,
      action: AuditAction.CREATE,
      resource: 'organization',
      resourceId: saved.id,
      details: `Created organization: ${saved.name}`,
    });

    return saved;
  }

  async findAll(user: User): Promise<Organization[]> {
    // Get user's organization and its children
    const organizations = await this.organizationRepository.find({
      where: [
        { id: user.organizationId },
        { parentId: user.organizationId },
      ],
      relations: ['parent', 'children'],
      order: { name: 'ASC' },
    });

    return organizations;
  }

  async findOne(id: string, user: User): Promise<Organization> {
    const organization = await this.organizationRepository.findOne({
      where: { id },
      relations: ['parent', 'children', 'users'],
    });

    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    // Check access
    if (organization.id !== user.organizationId && organization.parentId !== user.organizationId) {
      throw new ForbiddenException('Access denied to this organization');
    }

    return organization;
  }

  async update(id: string, updateDto: UpdateOrganizationDto, user: User): Promise<Organization> {
    const organization = await this.findOne(id, user);

    // Only owners can update organizations
    if (user.role !== Role.OWNER) {
      throw new ForbiddenException('Only owners can update organizations');
    }

    Object.assign(organization, updateDto);
    const updated = await this.organizationRepository.save(organization);

    await this.auditService.log({
      userId: user.id,
      userEmail: user.email,
      action: AuditAction.UPDATE,
      resource: 'organization',
      resourceId: updated.id,
      details: `Updated organization: ${updated.name}`,
    });

    return updated;
  }

  async remove(id: string, user: User): Promise<void> {
    const organization = await this.findOne(id, user);

    // Only owners can delete organizations
    if (user.role !== Role.OWNER) {
      throw new ForbiddenException('Only owners can delete organizations');
    }

    // Can't delete user's own organization
    if (organization.id === user.organizationId) {
      throw new ForbiddenException('Cannot delete your own organization');
    }

    await this.organizationRepository.remove(organization);

    await this.auditService.log({
      userId: user.id,
      userEmail: user.email,
      action: AuditAction.DELETE,
      resource: 'organization',
      resourceId: id,
      details: `Deleted organization: ${organization.name}`,
    });
  }
}
