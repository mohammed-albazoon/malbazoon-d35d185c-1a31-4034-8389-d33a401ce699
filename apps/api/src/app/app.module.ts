import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TasksModule } from '../modules/tasks/tasks.module';
import { UsersModule } from '../modules/users/users.module';
import { OrganizationsModule } from '../modules/organizations/organizations.module';
import { AuditModule } from '../modules/audit/audit.module';
import { User, Organization, Task, AuditLog } from '../entities';

// Database configuration: Uses PostgreSQL if DATABASE_URL is set, otherwise SQLite
const getDatabaseConfig = (): TypeOrmModuleOptions => {
  const isPostgres = !!process.env['DATABASE_URL'];

  if (isPostgres) {
    return {
      type: 'postgres',
      url: process.env['DATABASE_URL'],
      entities: [User, Organization, Task, AuditLog],
      synchronize: true,
      logging: process.env['NODE_ENV'] === 'development',
      ssl: { rejectUnauthorized: false },
    };
  }

  return {
    type: 'sqlite',
    database: process.env['DATABASE_PATH'] || 'data/task-management.db',
    entities: [User, Organization, Task, AuditLog],
    synchronize: true,
    logging: process.env['NODE_ENV'] === 'development',
  };
};

@Module({
  imports: [
    TypeOrmModule.forRoot(getDatabaseConfig()),
    AuthModule,
    TasksModule,
    UsersModule,
    OrganizationsModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply JWT auth guard globally
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
