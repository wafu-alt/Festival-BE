import { Module } from '@nestjs/common';
import { FestivalController } from './festival.controller';
import { FestivalService } from './festival.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EFestivalDetail, EFestivalList } from 'src/schedules/schedules.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EFestivalList, EFestivalDetail])],
  controllers: [FestivalController],
  providers: [FestivalService],
})
export class FestivalModule {}
