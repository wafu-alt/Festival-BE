import { HttpService } from '@nestjs/axios';
import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { catchError, firstValueFrom } from 'rxjs';
import { EFestivalList, EFestivalDetail } from './schedules.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as dayjs from 'dayjs';
import { JSDOM } from 'jsdom';

//TODO : type 연결 제대로 해주기
//TODO : 스케쥴로 DB에 저장 못한 contents id들 수동으로 따로 저장하는 API 만들기
//TODO : 자정이 넘어간 날 이벤트 Status를 일괄 업데이트하는 것이 필요

@Injectable()
export class SchedulesService {
  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(EFestivalList)
    private festivalListRepository: Repository<EFestivalList>,
    @InjectRepository(EFestivalDetail)
    private festivalDetailRepository: Repository<EFestivalDetail>,
  ) {}

  private logger = new Logger('SchedulesService');
  /** 정보 조회 때 필요한 파라미터 기본 값 */
  private readonly detailConfig = {
    params: {
      MobileOS: 'ETC', // IOS (아이폰), AND (안드로이드), WIN (윈도우폰), ETC(기타)
      MobileApp: 'testMobile',
      _type: 'json', // 기본 : XML
      serviceKey: process.env.PUBLIC_DATA_KEY_DECODING, // 실제 사용 시 인코딩된 서비스 키를 사용해야 합니다
    },
  };

  /** 공공데이터 포털 기본 도메인+페스 */
  private readonly dataGoDomain = process.env.PUBLIC_DATA_PORTAL;
  private readonly linkReggex = /http[s]?:\/\/[^"]+/;

  /** html에서 A태그의 Link주소를 return */
  private readonly findAtagLinkfunc = (htmlTag: string) => {
    let parseLink = htmlTag;

    // http값이 있을 경우
    if (this.linkReggex.test(htmlTag)) {
      // html 파싱
      const dom = new JSDOM(htmlTag);
      const document = dom.window.document;
      // a태그를 선택
      const link = document.querySelector('a');
      // a태그의 href를 파싱
      parseLink = link.href;
    }

    return parseLink;
  };

  /** 이벤트 시작일로 조회해서 EFestivalList 테이블에 저장  */
  async fetchAllItemListSave() {
    // 재사용 되는 config 깊은 복사
    const config = JSON.parse(JSON.stringify(this.detailConfig));

    const searchPath = process.env.FESTIVAL_INQUIRY;

    const url = `${this.dataGoDomain}/${searchPath}`;

    const today = dayjs();
    const tomorrow = today.add(1, 'day').format('YYYYMMDD');

    this.logger.log(`시작 : 이벤트 시작[${tomorrow}]일 정보 받기`);
    // 이유: 최대한 공공데이터에서 수정이 끝난 데이터를 받아오기 위함

    // 필요한 부분 추가해서 사용
    config.params = {
      ...config.params,
      arrange: 'D', // 정렬구분 (A=제목순, C=수정일순, D=생성일순) 대표이미지가반드시있는정렬(O=제목순, Q=수정일순, R=생성일순)
      eventStartDate: tomorrow,
      numOfRows: 1000, // 1000개 리스트 조회
      areaCode: 1, // 지역코드 : 서울
      // 기본 listYN = Y (Y=목록, N=개수)
      // 종료일 eventEndDate :YYYYMMDD
      // 시군구코드 sigunguCode :
      // 수정일 modifiedtime :YYYYMMDD
    };

    const { data } = await firstValueFrom(
      this.httpService.get(url, config).pipe(
        catchError((error) => {
          throw new Error(`[${searchPath}] 조회 중 에러 발생\n${error}`);
        }),
      ),
    );

    // data 파싱
    const {
      response: {
        header: { resultMsg },
        body: {
          items: { item },
        },
      },
    } = data;

    // 데이터 정상적으로 받아졌는지 확인
    if (resultMsg !== 'OK') {
      throw new ForbiddenException(`데이터를 정상적으로 받지 못 했습니다`);
    }

    // 데이터 갯수 로그
    if (item) {
      this.logger.log(`[${item.length}] 갯수를 API 데이터를 받았습니다`);
    }

    // EFestivalList 테이블에 contentId 중복 제외
    // SELECT "ContentId" FROM "EFestivalList";
    const listQuery = await this.festivalListRepository
      .createQueryBuilder('list')
      .select('list.ContentId', 'contentId')
      .getRawMany();

    // listTableContentIds의 contentId를 Set으로 변환 , Set(4) {1,2,3,4 ...}
    const listTableContentIds = new Set(
      listQuery.map((item) => item.contentId),
    );

    // 중복되지 않은 항목을 추출
    const newFetchSaveItems = item.filter(
      (item) => !listTableContentIds.has(Number(item.contentid)),
    );

    this.logger.log(
      `EFestivalList 테이블에 [${newFetchSaveItems.length}] 데이터가 추가되어야 합니다.\n = 새로 받은 contentId 갯수 [${item.length}] - 기존 contentId 갯수 [${listTableContentIds.size}]`,
    );

    // 데이터 파싱 후 각 데이터를 객체로 만들어서 [{},{}, ...]로 리턴
    const festivalList = newFetchSaveItems.map((item) => {
      const {
        contentid,
        contenttypeid,
        createdtime,
        modifiedtime,
        areacode,
        sigungucode,
        firstimage,
        firstimage2,
        title,
        addr1,
        eventstartdate,
        eventenddate,
        mapx,
        mapy,
        tel,
      } = item;

      // 데이터 수정
      // 문자열을 띄워쓰기로 자르기
      const addressPart: [] = addr1.split(' ');
      // 앞의 2개의 index만 가져와서 띄워쓰기 넣어서 붙이기
      const address = addressPart.slice(0, 2).join(' ');

      // 날짜 변환
      const _createdtime = dayjs(createdtime, 'YYYYMMDDHHmmss');
      const _modifiedtime = dayjs(modifiedtime, 'YYYYMMDDHHmmss').toDate();
      const _eventstartdate = dayjs(eventstartdate, 'YYYYMMDD').toDate();
      const _eventenddate = dayjs(eventenddate, 'YYYYMMDD').toDate();

      return {
        ContentId: Number(contentid),
        ContentType: Number(contenttypeid),
        Title: title,
        ShortAddres: address,
        AreaCode: Number(areacode),
        CityCode: Number(sigungucode),
        StartDate: _eventstartdate,
        EndDate: _eventenddate,
        ExternalApiCreateDate: _createdtime,
        ExternalApiUpdateDate: _modifiedtime,
        //Status:enum 기본값 UPCOMING이 세팅됨 (내일 데이터를 미리 받기 때문)
      };
    });

    // [{},{}, ...] 데이터를 DB에 한번에 저장
    await this.festivalListRepository.save(festivalList);

    this.logger.log(
      `EFestivalList 저장\n[${searchPath}] 종료 : 총 [${festivalList.length}] 데이터를 저장하였습니다.`,
    );
  }

  /** list테이블과 detail테이블을 비교하고 없는 contentID를 상세조회한다 */
  async fetchItemDetails() {
    this.logger.log(
      `시작 : EFestivalList와 EFestivalDetail테이블의 ContentId 비교 시작`,
    );

    // DB 테이블에서 ContentId 가져옴
    // EFestivalList 쿼리 시작
    const listQuery = this.festivalListRepository.createQueryBuilder('list');

    // EFestivalDetail 쿼리 시작
    const detailQuery =
      this.festivalDetailRepository.createQueryBuilder('detail');

    listQuery
      .select('list.ContentId', 'contentId')
      .addSelect('list.ContentType', 'contentType');

    // SELECT "ContentId", "ContentType" FROM "EFestivalList";
    const listTableContentIds = await listQuery.getRawMany();

    detailQuery.select('detail.ContentId', 'contentId');

    // SELECT "ContentId" FROM "EFestivalDetail";
    const fesDetailTableContentIds = await detailQuery.getRawMany();

    // 비교 시작

    // ContentId만 추출하여 Set으로 변환
    const fesDetailContentIdsSet = new Set(
      fesDetailTableContentIds.map((item) => item.ContentId),
    );

    // 중복되는 ContentIds 거르기
    const notDuplicatedContentIds = listTableContentIds.filter(
      (item) => !fesDetailContentIdsSet.has(item.ContentId),
    );

    this.logger.log(
      `받아올 상세 정보 contentId 갯수 : [${notDuplicatedContentIds.length}]`,
    );

    // 병렬로 fetch - 각 item에 대한 상세 정보 조회
    const fetchPromises = notDuplicatedContentIds.map(async (item) => {
      try {
        await this.fetchCommonItemDetail(item);
        return { contentId: item.contentId, status: 'fulfilled' };
      } catch (error) {
        return { contentId: item.contentId, status: 'rejected', reason: error };
      }
    });

    try {
      // 모든 fetch 작업이 완료될 때까지 기다림
      const allSettledResult = await Promise.allSettled(fetchPromises);

      // 실패한 요청 로그 출력
      const rejectedContentsIds = allSettledResult
        .map((result) => {
          if (
            result.status === 'fulfilled' &&
            result.value.status === 'rejected'
          ) {
            return result.value.contentId;
          }
          return null;
        })
        .filter((element) => element !== null); // null값을 제거

      if (rejectedContentsIds.length > 0) {
        /** @example [5]개 [1,2,3,4,5] */
        this.logger.error(
          `해당 공공데이터 조회 중.. 총 [${rejectedContentsIds.length}]개가 에러 발생\n> 해당 'ContentsIds' [${rejectedContentsIds}]`,
        );
      } else {
        this.logger.log('모든 항목에 대한 세부 정보 저장 완료');
      }
    } catch (error) {
      this.logger.error('해당 스케쥴을 실행하는 동안 에러가 발생\n', error);
    }
  }

  /** 공통정보조회
   * @return {homepage, 풀주소(addr1, addr2, zipcode), 위도(mapx), 경도(mapy), 대문이미지(firstimage), 썸네일(firstimage2)}
   */
  async fetchCommonItem(contentId: number, contentType: number) {
    // 재사용 되는 config 깊은 복사
    const config = JSON.parse(JSON.stringify(this.detailConfig));

    // 필요한 부분 추가해서 사용
    config.params = {
      ...config.params,
      contentId: contentId,
      contentTypeId: contentType,
      defaultYN: 'Y', // 제목, 생성일,수정일, 홈페이지
      firstImageYN: 'Y', // 이미지(대문,썸네일)
      addrinfoYN: 'Y', // 주소
      mapinfoYN: 'Y', // 경도, 위도
    };

    // path정보 파싱
    const commonPath = process.env.COMMON_INQUIRY;

    // url 완성
    const url = `${this.dataGoDomain}/${commonPath}`;

    const { data } = await firstValueFrom(
      this.httpService.get(url, config).pipe(
        catchError((error) => {
          throw new Error(
            `[${contentId}]번호로 [${commonPath}] 조회 중 에러 발생\n${error}`,
          );
        }),
      ),
    );

    // data 파싱
    const {
      response: {
        header: { resultMsg },
        body: {
          items: { item },
        },
      },
    } = data;

    // 데이터 정상적으로 받아졌는지 확인
    if (resultMsg !== 'OK') {
      throw new ForbiddenException(
        `[${contentId}]번호로 [${commonPath}]조회 요청에서 데이터를 정상적으로 받지 못했습니다.`,
      );
    }

    const {
      homepage,
      zipcode, // 우편번호
      addr1,
      addr2,
      mapx,
      mapy,
      firstimage,
      firstimage2,
      //title
    } = item[0];

    // 주소 파싱
    const fullAddres = `[${zipcode}] ${addr1 + addr2}`;

    // a태그에서 url 파싱
    let _homePage = homepage;
    _homePage = this.findAtagLinkfunc(_homePage);

    // homepage, addr1, addr2, zipcode, mapx, mapy, firstimage, firstimage2,
    return {
      mapX: mapx,
      mapY: mapy,
      firstImage: firstimage,
      thumbnailImage: firstimage2,
      homePage: _homePage,
      fullAddres: fullAddres,
    };
  }

  /** 소개정보조회
   * @return {주최자(sponsor1, sponsor1tel), 주관사(sponsor2, sponsor2tel), 행사시간(playtime), 행사장소(eventplace), 참여비용(usetimefestival)}
   */
  async fetchIntroItem(contentId: number, contentType: number) {
    // 재사용 되는 config 깊은 복사
    const config = JSON.parse(JSON.stringify(this.detailConfig));

    // 필요한 부분 추가해서 사용
    config.params = {
      ...config.params,
      contentId: contentId,
      contentTypeId: contentType,
    };

    // path정보 파싱
    const introPath = process.env.INTRODUCTION_INQUIRY;

    // url 완성
    const url = `${this.dataGoDomain}/${introPath}`;

    const { data } = await firstValueFrom(
      this.httpService.get(url, config).pipe(
        catchError((error) => {
          throw new Error(
            `[${contentId}]번호로 [${introPath}] 조회 중 에러 발생\n${error}`,
          );
        }),
      ),
    );

    // data 파싱
    const {
      response: {
        header: { resultMsg },
        body: {
          items: { item },
        },
      },
    } = data;

    // 데이터 정상적으로 받아졌는지 확인
    if (resultMsg !== 'OK') {
      throw new ForbiddenException(
        `[${contentId}]번호로 [${introPath}]조회 요청에서 데이터를 정상적으로 받지 못했습니다.`,
      );
    }

    const {
      sponsor1, // 주최자
      sponsor1tel,
      sponsor2, // 주관사
      sponsor2tel,
      playtime, // 행사시간
      usetimefestival, // 요금
      eventplace, // 행사장소
      //title
    } = item[0];

    // sponsor1, sponsor1tel, sponsor2, sponsor2tel, playtime, eventplace, usetimefestival

    // 전화번호 작업
    // 주최자 번호에 url이 있을 경우 파싱
    let _sponsor1tel = sponsor1tel;
    _sponsor1tel = this.findAtagLinkfunc(_sponsor1tel);

    // 주관사 번호에 url이 있을 경우 파싱
    let _sponsor2tel = sponsor2tel;
    _sponsor2tel = this.findAtagLinkfunc(_sponsor2tel);

    return {
      planhost: sponsor1,
      planHostTel: _sponsor1tel,
      manageHost: sponsor2,
      manageHostTel: _sponsor2tel,
      playtime: playtime,
      cost: usetimefestival,
      eventPlace: eventplace,
    };
  }

  /** 상세 정보 조회
   * @return {행사 소개(infotext), 행사 내용(infotext)}
   */
  async fetchDetailItem(contentId: number, contentType: number) {
    // 재사용 되는 config 깊은 복사
    const config = JSON.parse(JSON.stringify(this.detailConfig));

    // 필요한 부분 추가해서 사용
    config.params = {
      ...config.params,
      contentId: contentId,
      contentTypeId: contentType,
    };

    // path정보 파싱
    const detailPath = process.env.DETAIL_INQUIRY;

    // url 완성
    const url = `${this.dataGoDomain}/${detailPath}`;

    const { data } = await firstValueFrom(
      this.httpService.get(url, config).pipe(
        catchError((error) => {
          throw new Error(
            `[${contentId}]번호로 [${detailPath}] 조회 중 에러 발생\n${error}`,
          );
        }),
      ),
    );

    // data 파싱
    const {
      response: {
        header: { resultMsg },
        body: {
          items: {
            item: [{ infotext: introText }, { infotext: detailText }],
          },
        },
      },
    } = data;

    // 데이터 정상적으로 받아졌는지 확인
    if (resultMsg !== 'OK') {
      throw new ForbiddenException(
        `[${contentId}]번호로 [${detailPath}]조회 요청에서 데이터를 정상적으로 받지 못했습니다.`,
      );
    }

    // 행사 소개(infotext), 행사 내용(infotext)
    return {
      introText: introText,
      detailText: detailText,
    };
  }

  /**
   * 1개의 item에 대해
   * @param {Object} item
   * @param {number} item.contentId - 유니크 값
   * @param {number} item.contentType - 관광 타입
   */
  async fetchCommonItemDetail(item: {
    contentId: number;
    contentType: number;
  }) {
    // 파싱
    const { contentId, contentType } = item;

    // EFestivalDetail DB에 저장하기 전 외부API로 불러오기
    const [commonItem, introItem, detailItem] = await Promise.all([
      // 공통 정보 조회 - homepage, 풀주소(addr1, addr2, zipcode), 위도(mapx), 경도(mapy), 대문이미지(firstimage), 썸네일(firstimage2)
      this.fetchCommonItem(contentId, contentType),
      // 소개 정보 조회 - 주최자(sponsor1, sponsor1tel), 주관사(sponsor2, sponsor2tel), 행사시간(playtime), 행사장소(eventplace), 참여비용(usetimefestival)
      this.fetchIntroItem(contentId, contentType),
      // 상세 정보 조회 - 행사 소개(infotext), 행사 내용(infotext)
      this.fetchDetailItem(contentId, contentType),
    ]);

    // return한 정보들 객체로 취합해서
    const resultFesivalDetailInfo = {
      ContentId: contentId,
      FullAddres: commonItem.fullAddres || '',
      HomePage: commonItem.homePage || '',
      FirstImage: commonItem.firstImage || '',
      ThumbnailImage: commonItem.thumbnailImage || '',
      MapX: commonItem.mapX || '',
      MapY: commonItem.mapY || '',
      IntroText: detailItem.introText || '',
      DetailText: detailItem.detailText || '',
      EventPlace: introItem.eventPlace || '',
      Playtime: introItem.playtime || '',
      Cost: introItem.cost || '',
      PlanHost: introItem.planhost || '',
      PlanHostTel: introItem.planHostTel || '',
      ManageHost: introItem.manageHost || '',
      ManageHostTel: introItem.manageHostTel || '',
    };

    // 데이터베이스에 저장
    await this.festivalDetailRepository.save(resultFesivalDetailInfo);

    this.logger.log(
      `EFestivalDetail 저장 : ${[contentId]}에 상세 정보를 저장 완료하였습니다.`,
    );
  }

  /**
   * 초 (0~59)
   *    분 (0~59)
   *      시간 (0~23)
   *         날짜 (1~31)
   *             달 (0~12, 0과 12는 12월달)
   *              요일 (0~7, 0과 7은 일요일)
   */
  /** 매일 20시 스케쥴 실행 */
  @Cron('0 0 20 * * *')
  async fetchAllItemSaveTasks() {
    this.logger.log(
      `시작 : 20시 스케쥴 시작\n공공데이터에서 list와 detail정보 저장 로직`,
    );

    // EFestivalList 테이블에 이벤트 리스트 저장
    await this.fetchAllItemListSave();

    // EFestivalDetail 테이블에는 List에서 ContentId로 정보 조회 후 상세정보 저장
    await this.fetchItemDetails();

    this.logger.log(`종료 : 20시 스케쥴 종료`);
  }
}
