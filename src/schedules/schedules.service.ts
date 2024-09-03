import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
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

    this.logger.log(`종료 : 20시 스케쥴 종료`);
  }
}
