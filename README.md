# Festival Moa Api

> 페스티벌 모아 Api

### 배포한 사이트 URL

- <a href="http://ec2-13-125-195-205.ap-northeast-2.compute.amazonaws.com/" target="_blank">Festival-Moa 바로가기</a>

### 소개

- [프론트엔드](https://github.com/wafu-alt/Festival-FE)와 연동하여 데이터를 보냅니다.
- 스케쥴러를 활용하여 특정 시간에 데이터를 받아오고 정리하여 저장합니다.
- 해당 정보는 [공공데이터포털](https://www.data.go.kr/tcs/dss/selectApiDataDetailView.do?publicDataPk=15101578#/API%20%EB%AA%A9%EB%A1%9D/detailIntro1) ([한국관광공사](https://api.visitkorea.or.kr/#/hubTourSearch))제공 API를 활용하여 축제일정을 받아옵니다.

### 기술 스택

   <img src="https://img.shields.io/badge/nestjs-black?style=for-the-badge&logo=nestjs&logoColor=#E0234E">
   <img src="https://img.shields.io/badge/typeorm-black?style=for-the-badge&logo=typeorm&logoColor=#FE0803">
   <img src="https://img.shields.io/badge/postgresql-black?style=for-the-badge&logo=postgresql&logoColor=#4169E1">
   <img src="https://img.shields.io/badge/npm-black?style=for-the-badge&logo=npm&logoColor=#CB3837">
   <img src="https://img.shields.io/badge/pm2-black?style=for-the-badge&logo=pm2&logoColor=#2B037A">
   <img src="https://img.shields.io/badge/nginx-black?style=for-the-badge&logo=nginx&logoColor=#009639">

### API 개발 가이드

1. 프로젝트 클론

   ```sh
   git clone https://github.com/wafu-alt/Festival-BE
   ```

2. `node_modules` 설치

   ```sh
   npm install
   ```

3. .env 파일 생성

- `../.env.development` 최상단에서 만들어야합니다

  ```sh
  touch .env.development
  ```

- 아래 내용이 들어가야합니다

  ```sh
    PUBLIC_DATA_PORTAL=공공데이터포털 api 주소

    FESTIVAL_INQUIRY=정보요청path위치
    COMMON_INQUIRY=정보요청path위치
    INTRODUCTION_INQUIRY=정보요청path위치
    DETAIL_INQUIRY=정보요청path위치

    PUBLIC_DATA_KEY_DECODING=공공데이터포털 개인api인증키

    SERVER_PORT=서버포트
    DB_TYPE=DB타입
    DB_HOST=DB호스트
    DB_PORT=DB포트
    DB_USERNAME=DB유저이름
    DB_PASSWORD=DB유저비번
    DB_NAME=DB이름
    DB_SYNCHRONIZE=DB동기화여부

    ALLOWED_ORIGINS=CORS 접근 허용 URL
  ```

4. 실행
   ```sh
   npm run start:dev
   ```

### 추가돼야 할 개발

- TASK 중 오류 난 것 LOG 남기는 테이블 추가, 관련 로직 추가
- 관리자 로그인 로직 추가
- CONTENT ID로 LIST 추가, 수정, 삭제 API
- CONTENT ID로 DETAIL 추가, 수정, 삭제 API
- LOG 조회 API

### 해결한 경험

- [CORS 문제에 대한 설정하기](https://blog.naver.com/dacapolin/223604790062)
- [특정 횟수 요청 후 CORS 에러](https://blog.naver.com/dacapolin/223604801082)
