import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // env에서 정보 불러오기
  const configService = app.get(ConfigService);

  // cors 허락 주소 파싱
  const allowedOrigins = configService
    .get<string>('ALLOWED_ORIGINS')
    .split(',');

  const corsConfig = {
    origin: allowedOrigins, //"*" 기본값
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', //기본값
    // allowedHeaders: ['Content-Type', 'Authorization'] 어떤 헤더
    // credentials: true, // 쿠키, 인증 헤더 사용할 것인지?
    // exposedHeaders 사용할 헤더 추가
    // maxAge 캐싱할 시간 몇으로 설정?
    preflightContinue: false, // 응답 다음 미들웨어로 전달할 것인지?
    optionsSuccessStatus: 200, // 응답 상태코드
  };

  // cors 설정
  app.enableCors(corsConfig);

  // 글로벌 파이프 설정
  app.useGlobalPipes(new ValidationPipe());

  // 서버 포트 파싱
  const serverPort = configService.get('SERVER_PORT');

  // 서버 실행
  await app.listen(serverPort);

  Logger.log(`애플리케이션 시작 포트 : ${serverPort}`);
}
bootstrap(); // main.ts가 시작점 : 엔트리 포인트라고도 함
