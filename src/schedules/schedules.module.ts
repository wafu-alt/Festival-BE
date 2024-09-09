import { Module } from '@nestjs/common';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EFestivalList, EFestivalDetail } from './schedules.entity';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([EFestivalList, EFestivalDetail]),
  ],
  exports: [TypeOrmModule.forFeature([EFestivalList, EFestivalDetail])],
  controllers: [SchedulesController],
  providers: [SchedulesService],
})
export class SchedulesModule {}
