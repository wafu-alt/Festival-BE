import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EFestivalList } from 'src/schedules/schedules.entity';
import { Repository } from 'typeorm';
import { formatDate } from '@utils/date';

@Injectable()
export class FestivalService {
  constructor(
    @InjectRepository(EFestivalList)
    private festivalListRepository: Repository<EFestivalList>,
  ) {}

  /** 축제 일정 가져오기 */
  async getFestivalList(page: number, limit?: number) {
    // 숫자로 변환
    const _limit = Number(limit);

    // 쿼리
    /**
     * SELECT *
      FROM "EFestivalList"
      ORDER BY
        CASE
          WHEN "Status" = 'BEING' THEN 1
          WHEN "Status" = 'UPCOMING' THEN 2
          ELSE 3
        END,
        "StartDate" ASC
      LIMIT 15 OFFSET 0
     */
    const listQuery = this.festivalListRepository
      .createQueryBuilder('festival')
      .orderBy(
        `CASE 
      WHEN festival.Status = 'BEING' THEN 1 
      WHEN festival.Status = 'UPCOMING' THEN 2 
      ELSE 3 
    END`,
      )
      .addOrderBy('festival.StartDate', 'ASC')
      .select('*');

    // 페이징네이션 설정
    if (_limit) {
      listQuery.skip((page - 1) * _limit).take(_limit);
    }

    // else : limit 값이 없을경우 전체 데이터 조회

    // 표시될 리스트 (진행중 + 준비중)
    const resultList = await listQuery.getRawMany();

    const _result = resultList;

    //todo 타입 설정 필요함
    // 날짜 변환
    const result = _result.map((item) => ({
      ...item,
      CreateDate: formatDate(item.CreateDate, true),
      UpdateDate: formatDate(item.UpdateDate, true),
      ExternalApiCreateDate: formatDate(item.ExternalApiCreateDate, true),
      ExternalApiUpdateDate: formatDate(item.ExternalApiUpdateDate, true),
      StartDate: formatDate(item.StartDate),
      EndDate: formatDate(item.StartDate),
    }));

    return result;
  }
}
