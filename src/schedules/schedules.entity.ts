import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FestivalStatus } from './schedules-status.enum';

// EFestivalList에는 이벤트 리스트 정보가 담김
@Entity('EFestivalList')
export class EFestivalList {
  @PrimaryGeneratedColumn() // id열이 Board 엔티티의 기본 키 열임을 나타냄
  Id: number;

  /** 고유아이디
   * @param contentid
   */
  @Column({ unique: true })
  ContentId: number;

  /** 관광타입
   * @param contenttypeid
   * @example (12:관광지, 14:문화시설, 15:축제공연행사, 25:여행코스, 28:레포츠, 32:숙박, 38:쇼핑, 39:음식점)  */
  @Column()
  ContentType: number;

  /** 제목
   * @param title
   */
  @Column() // Board 엔티티 열을 나타내는데 사용
  Title: string;

  /** 시작일
   * @param eventstartdate
   */
  @Column()
  StartDate: Date;

  /** 종료일
   * @param eventenddate
   */
  @Column()
  EndDate: Date;

  /** 이벤트 상태 */
  @Column({
    type: 'enum',
    enum: FestivalStatus,
    default: FestivalStatus.UPCOMING, // '준비중'이 기본 상태
  })
  Status: FestivalStatus;

  /** 지역 + 군,구
   * @param addr1 앞의 2단어 */
  @Column()
  ShortAddres: string;

  /** 지역코드
   * @param areacode
   * @example (1: 서울)*/
  @Column()
  AreaCode: number;

  /** 군,구 코드
   * @param sigungucode
   */
  @Column()
  CityCode: number;

  /** 공공데이터에서 가져온 생성날짜
   * @param createdtime
   */
  @Column()
  ExternalApiCreateDate: Date;

  /** 공공데이터에서 수정날짜
   * @param modifiedtime
   */
  @Column()
  ExternalApiUpdateDate: Date;

  /** 생성날짜 */
  @CreateDateColumn()
  CreateDate: Date;

  /** 수정날짜 */
  @UpdateDateColumn()
  UpdateDate: Date;
}

// EFestivalDetail에는 이벤트 상세정보가 담김
@Entity('EFestivalDetail')
export class EFestivalDetail {
  @PrimaryGeneratedColumn() // id열이 Board 엔티티의 기본 키 열임을 나타냄
  Id: number;

  @Column({ unique: true })
  ContentId: number;

  /** 대문 이미지
   * @param firstimage
   */
  @Column()
  FirstImage: string;

  /** 썸네일 이미지
   * @param firstimage2
   * */
  @Column()
  ThumbnailImage: string;

  //
  /** 풀(우편번호 포함) 주소
   * @param 'zipcode + addr1 + addr2'
   */
  @Column()
  FullAddres: string;

  /** 행사 장소
   * @param eventplace
   * */
  @Column()
  EventPlace: string;

  /** 주최자
   * @param sponsor1
   */
  @Column()
  PlanHost: string;

  /** 주최자 전화번호
   * @param sponsor1tel
   */
  @Column()
  PlanHostTel: string;

  //
  /** 주관사
   * @param sponsor2
   */
  @Column()
  ManageHost: string;

  /** 주관사 전화번호
   * @param sponsor2tel
   */
  @Column()
  ManageHostTel: string;

  /** 홈페이지
   * @param homepage
   */
  @Column()
  HomePage: string;

  /** 행사소개
   * @param infotext[0]
   */
  @Column()
  IntroText: string;

  /** 행사내용
   * @param infotext[1]
   */
  @Column()
  DetailText: string;

  /** 진행 시간
   * @param playtime
   */
  @Column()
  Playtime: string;

  /** 이용 요금
   * @param usetimefestival
   */
  @Column()
  Cost: string;

  /** 위도
   * @param mapx
   */
  @Column()
  MapX: string;

  /** 경도
   * @param mapy
   */
  @Column()
  MapY: string;
}
