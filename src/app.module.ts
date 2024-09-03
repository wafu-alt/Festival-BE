import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeORMConfig } from './configs/typeorm.config';
import { SchedulesModule } from './schedules/schedules.module';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeORMConfig), // DB연결 설정
    SchedulesModule,
    ConfigModule.forRoot(), // .env연결
    ScheduleModule.forRoot(), // 스케쥴 연결
  ],
})
export class AppModule {}
