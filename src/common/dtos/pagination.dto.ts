import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

/** 페이징네이션 DTO */
export class PaginationDto {
  /** 페이지값
   * @description 1 최소값
   */
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  readonly page?: number;

  /** 1페이지에 표시할 데이터 수 */
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  readonly limit?: number;
}
