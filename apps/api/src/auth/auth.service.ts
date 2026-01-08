import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Organization } from '../entities';
import { CreateUserDto, LoginDto, Role } from '@task-management/data';
import { JwtPayload } from './jwt.strategy';
import { AuditService } from '../modules/audit/audit.service';
import { AuditAction } from '@task-management/data';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService
  ) {}

  async register(createUserDto: CreateUserDto, ipAddress?: string, userAgent?: string) {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // If no organizationId provided, create a new organization for the user
    let organizationId = createUserDto.organizationId;
    if (!organizationId) {
      const newOrg = this.organizationRepository.create({
        name: `${createUserDto.firstName}'s Organization`,
        description: 'Default organization',
      });
      const savedOrg = await this.organizationRepository.save(newOrg);
      organizationId = savedOrg.id;
    }

    // Create user - if creating new org, user becomes owner
    const user = this.userRepository.create({
      ...createUserDto,
      organizationId,
      role: createUserDto.organizationId ? (createUserDto.role || Role.VIEWER) : Role.OWNER,
    });

    const savedUser = await this.userRepository.save(user);

    // Log registration
    await this.auditService.log({
      userId: savedUser.id,
      userEmail: savedUser.email,
      action: AuditAction.CREATE,
      resource: 'user',
      resourceId: savedUser.id,
      details: 'User registered',
      ipAddress,
      userAgent,
    });

    const tokens = this.generateTokens(savedUser);

    return {
      accessToken: tokens.accessToken,
      user: this.sanitizeUser(savedUser),
    };
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
      relations: ['organization'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await user.validatePassword(loginDto.password);

    if (!isPasswordValid) {
      // Log failed login attempt
      await this.auditService.log({
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.ACCESS_DENIED,
        resource: 'auth',
        details: 'Failed login attempt - invalid password',
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Log successful login
    await this.auditService.log({
      userId: user.id,
      userEmail: user.email,
      action: AuditAction.LOGIN,
      resource: 'auth',
      details: 'User logged in successfully',
      ipAddress,
      userAgent,
    });

    const tokens = this.generateTokens(user);

    return {
      accessToken: tokens.accessToken,
      user: this.sanitizeUser(user),
    };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization'],
    });
  }

  private generateTokens(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  private sanitizeUser(user: User) {
    const { password, ...sanitized } = user as any;
    return sanitized;
  }
}
