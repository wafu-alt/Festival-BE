import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EFestivalDetail, EFestivalList } from 'src/schedules/schedules.entity';
import { Repository } from 'typeorm';
import { formatDate } from '@utils/date';

@Injectable()
export class FestivalService {
  constructor(
    @InjectRepository(EFestivalList)
    private festivalListRepository: Repository<EFestivalList>, // EFestivalList 레포지토리 추가

    @InjectRepository(EFestivalDetail)
    private festivalDetailRepository: Repository<EFestivalDetail>, // EFestivalDetail 레포지토리 추가
  ) {}

  /** 축제 일정 가져오기 */
  async getFestivalList(page: number, limit?: number) {
    // 페이징네이션 설정
    const _pageSize = limit ? Number(limit) : undefined;
    const _page = _pageSize ? (page - 1) * _pageSize : 0; // limit이 없으면 offset은 0 = 전체 조회

    // 쿼리
    /**
    SELECT festival.*, "detail"."ThumbnailImage" AS "ThumbnailImage" FROM "EFestivalList" "festival" LEFT JOIN "EFestivalDetail" "detail" ON "festival"."ContentId" = "detail"."ContentId" ORDER BY CASE
          WHEN "festival"."Status" = 'BEING' THEN 1
          WHEN "festival"."Status" = 'UPCOMING' THEN 2
          ELSE 3
        END ASC, "festival"."StartDate" ASC LIMIT 15 OFFSET 1
     */
    const listQuery = this.festivalListRepository
      .createQueryBuilder('festival')
      .leftJoinAndSelect(
        'EFestivalDetail',
        'detail',
        'festival.ContentId = detail.ContentId',
      ) // EFestivalDetail 조인
      .orderBy(
        `CASE 
          WHEN festival.Status = 'BEING' THEN 1 
          WHEN festival.Status = 'UPCOMING' THEN 2 
          ELSE 3 
        END`,
      )
      .addOrderBy('festival.StartDate', 'ASC')
      .select([
        'festival.*',
        'detail.ThumbnailImage AS "ThumbnailImage"', // 가져올 ThumbnailImage 컬럼 추가
      ]);

    // 페이징네이션 설정
    if (_pageSize) {
      listQuery.offset(_page).limit(_pageSize);
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
      EndDate: formatDate(item.EndDate),
      ThumbnailImage: item.ThumbnailImage || '',
    }));

    return result;
  }

  /** 특정 축제 상세 정보 가져오기 */
  async getFestivalById(id: number) {
    // 쿼리
    /**
     * SELECT
     *  "list"."Title" AS "Title", "list"."StartDate" AS "StartDate", "list"."EndDate" AS "EndDate", detail.*
     * FROM "EFestivalDetail" "detail"
     * LEFT JOIN "EFestivalList" "list" ON "detail"."ContentId" = "list"."ContentId"
     * WHERE "detail"."ContentId" = $1
     */
    const _festivalData = this.festivalDetailRepository
      .createQueryBuilder('detail')
      .leftJoinAndSelect(
        'EFestivalList',
        'list',
        'detail.ContentId = list.ContentId',
      )
      .select([
        'list.Title AS "Title"',
        'list.StartDate AS "StartDate"',
        'list.EndDate AS "EndDate"',
        'detail.*',
      ])
      .where('detail.ContentId = :id', { id });

    // DB에서 조회
    const festivalData = await _festivalData.getRawOne();

    // festivalData은 데이터가 없을 경우 null값을 리턴된다
    if (!festivalData) {
      throw new NotFoundException(
        `[${id}] 해당 상세 축제 정보를 찾을 수 없습니다.`,
      );
    }

    // 날짜 변환을 위한 파싱 Date -> string
    const { StartDate, EndDate } = festivalData;

    const result = {
      ...festivalData,
      StartDate: formatDate(StartDate),
      EndDate: formatDate(EndDate),
    };

    // 썸네일 제거
    delete result.ThumbnailImage;
    // 주관사 제거
    delete result.ManageHost;
    delete result.ManageHostTel;
    // MapX와 MapY 제거
    delete result.MapX;
    delete result.MapY;

    return result;
  }
}
