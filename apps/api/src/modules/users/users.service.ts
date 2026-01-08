import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User, Organization } from '../../entities';
import { CreateUserDto, UpdateUserDto, Role, AuditAction } from '@task-management/data';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    private readonly auditService: AuditService
  ) {}

  async create(createDto: CreateUserDto, currentUser: User): Promise<User> {
    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Validate organization access
    const targetOrgId = createDto.organizationId || currentUser.organizationId;
    await this.validateOrganizationAccess(targetOrgId, currentUser);

    // Validate role assignment
    this.validateRoleAssignment(createDto.role, currentUser);

    const user = this.userRepository.create({
      ...createDto,
      organizationId: targetOrgId,
      role: createDto.role || Role.VIEWER,
    });

    const savedUser = await this.userRepository.save(user);

    await this.auditService.log({
      userId: currentUser.id,
      userEmail: currentUser.email,
      action: AuditAction.CREATE,
      resource: 'user',
      resourceId: savedUser.id,
      details: `Created user: ${savedUser.email} with role ${savedUser.role}`,
    });

    // Remove password from response
    const { password, ...result } = savedUser;
    return result as User;
  }

  async findAll(currentUser: User): Promise<User[]> {
    // Get accessible organization IDs
    const accessibleOrgIds = await this.getAccessibleOrganizationIds(currentUser);

    const users = await this.userRepository.find({
      where: { organizationId: In(accessibleOrgIds) },
      relations: ['organization'],
      order: { createdAt: 'DESC' },
    });

    // Remove passwords
    return users.map(({ password, ...user }) => user as User);
  }

  async findOne(id: string, currentUser: User): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['organization'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check access
    const accessibleOrgIds = await this.getAccessibleOrganizationIds(currentUser);
    if (!accessibleOrgIds.includes(user.organizationId)) {
      throw new ForbiddenException('Access denied to this user');
    }

    const { password, ...result } = user;
    return result as User;
  }

  async update(id: string, updateDto: UpdateUserDto, currentUser: User): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check access
    const accessibleOrgIds = await this.getAccessibleOrganizationIds(currentUser);
    if (!accessibleOrgIds.includes(user.organizationId)) {
      throw new ForbiddenException('Access denied to this user');
    }

    // Validate role change
    if (updateDto.role) {
      this.validateRoleAssignment(updateDto.role, currentUser);
    }

    // Prevent changing own role (unless owner)
    if (id === currentUser.id && updateDto.role && currentUser.role !== Role.OWNER) {
      throw new ForbiddenException('Cannot change your own role');
    }

    Object.assign(user, updateDto);
    const savedUser = await this.userRepository.save(user);

    await this.auditService.log({
      userId: currentUser.id,
      userEmail: currentUser.email,
      action: AuditAction.UPDATE,
      resource: 'user',
      resourceId: savedUser.id,
      details: `Updated user: ${savedUser.email}`,
    });

    const { password, ...result } = savedUser;
    return result as User;
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Can't delete yourself
    if (id === currentUser.id) {
      throw new ForbiddenException('Cannot delete your own account');
    }

    // Check access
    const accessibleOrgIds = await this.getAccessibleOrganizationIds(currentUser);
    if (!accessibleOrgIds.includes(user.organizationId)) {
      throw new ForbiddenException('Access denied to this user');
    }

    // Only owners can delete users
    if (currentUser.role !== Role.OWNER) {
      throw new ForbiddenException('Only owners can delete users');
    }

    await this.userRepository.remove(user);

    await this.auditService.log({
      userId: currentUser.id,
      userEmail: currentUser.email,
      action: AuditAction.DELETE,
      resource: 'user',
      resourceId: id,
      details: `Deleted user: ${user.email}`,
    });
  }

  private async getAccessibleOrganizationIds(user: User): Promise<string[]> {
    const orgIds = [user.organizationId];

    if (user.role === Role.OWNER || user.role === Role.ADMIN) {
      const childOrgs = await this.organizationRepository.find({
        where: { parentId: user.organizationId },
      });
      orgIds.push(...childOrgs.map((o) => o.id));
    }

    return orgIds;
  }

  private async validateOrganizationAccess(targetOrgId: string, currentUser: User): Promise<void> {
    const accessibleOrgIds = await this.getAccessibleOrganizationIds(currentUser);
    if (!accessibleOrgIds.includes(targetOrgId)) {
      throw new ForbiddenException('Cannot create users in this organization');
    }
  }

  private validateRoleAssignment(role: Role | undefined, currentUser: User): void {
    if (!role) return;

    // Owners can assign any role
    if (currentUser.role === Role.OWNER) return;

    // Admins can only assign Viewer role
    if (currentUser.role === Role.ADMIN && role !== Role.VIEWER) {
      throw new ForbiddenException('Admins can only assign Viewer role');
    }
  }
}
