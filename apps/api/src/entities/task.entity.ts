import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';
import { TaskStatus, TaskCategory, TaskPriority } from '@task-management/data';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 200 })
  title!: string;

  @Column({ length: 2000, nullable: true })
  description?: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: TaskStatus.TODO,
  })
  status!: TaskStatus;

  @Column({
    type: 'varchar',
    length: 20,
    default: TaskCategory.OTHER,
  })
  category!: TaskCategory;

  @Column({
    type: 'varchar',
    length: 20,
    default: TaskPriority.MEDIUM,
  })
  priority!: TaskPriority;

  @Column({ default: 0 })
  order!: number;

  @Column({ nullable: true })
  dueDate?: Date;

  @Column({ nullable: true })
  createdById?: string;

  @ManyToOne(() => User, (user) => user.tasks, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdById' })
  createdBy?: User;

  @Column()
  organizationId!: string;

  @ManyToOne(() => Organization, (org) => org.tasks)
  @JoinColumn({ name: 'organizationId' })
  organization?: Organization;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
