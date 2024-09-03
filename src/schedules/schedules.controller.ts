import { Controller, Get, Logger } from '@nestjs/common';
import { SchedulesService } from './schedules.service';

@Controller('schedules')
export class SchedulesController {
  private logger = new Logger('SchedulesController');
  constructor(private schedulesService: SchedulesService) {}

  @Get('/passivityRunToTask')
  fetchAllItemSaveTasks() {
    this.logger.log(
      `수동으로 Task실행 : EFestivalList, EFestivalDetail 테이블에 contentid값에 대한 정보를 저장`,
    );
    return this.schedulesService.fetchAllItemSaveTasks();
  }
}
