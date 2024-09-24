import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { FestivalService } from './festival.service';
import { PaginationDto } from 'src/common/dtos/pagination.dto';

@Controller('festival')
export class FestivalController {
  constructor(private festivalService: FestivalService) {}

  /** 축제 일정 가져오기 */
  @Get('/')
  getFestivalList(@Query() paginationDto: PaginationDto) {
    const { page = 1, limit } = paginationDto;
    return this.festivalService.getFestivalList(page, limit);
  }

  /** 특정 축제 상세 정보 가져오기 */
  @Get('/:id')
  getBoardById(@Param('id', ParseIntPipe) id: number) {
    return this.festivalService.getFestivalById(id);
  }
}
