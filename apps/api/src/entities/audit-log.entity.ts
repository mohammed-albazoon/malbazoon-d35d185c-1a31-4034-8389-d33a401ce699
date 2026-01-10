import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { AuditAction } from '@task-management/data';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  userId?: string;

  @ManyToOne(() => User, (user) => user.auditLogs, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ length: 255 })
  userEmail!: string;

  @Column({
    type: 'varchar',
    length: 50,
  })
  action!: AuditAction;

  @Column({ length: 100 })
  resource!: string;

  @Column({ nullable: true })
  resourceId?: string;

  @Column({ type: 'text', nullable: true })
  details?: string;

  @Column({ length: 45, nullable: true })
  ipAddress?: string;

  @Column({ length: 500, nullable: true })
  userAgent?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
