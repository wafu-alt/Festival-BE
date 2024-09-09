import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

/** 날짜 문자열을 변환하는 함수
 * @param dateString date 문자열
 * @param isTime 시간변환이 필요한 경우
 * @returns YYYY-MM-DD HH:mm || YYYY-MM-DD
 */
export const formatDate = (dateString: string, isTime?: boolean): string => {
  // 문자열 날짜를 dayjs DATE 객체로 변환
  const date = dayjs(dateString).utc();

  if (isTime) {
    // 시간 포함된 형식으로 변환
    return date.format('YYYY-MM-DD HH:mm');
  } else {
    // 시간 없는 형식으로 변환
    return date.format('YYYY-MM-DD');
  }
};
