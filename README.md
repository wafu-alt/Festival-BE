# Festival Moa Api

> 페스티벌 모아 Api

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
