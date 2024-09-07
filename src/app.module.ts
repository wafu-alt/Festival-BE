import { Module } from '@nestjs/common';
// import { BoardsModule } from './boards/boards.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeORMConfig } from './configs/typeorm.config';
// import { AuthModule } from './auth/auth.module';
import { SchedulesModule } from './schedules/schedules.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    // .env연결
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
    }),
    // BoardsModule,
    // AuthModule,
    SchedulesModule, // 커스텀 모듈 연결
    ScheduleModule.forRoot(), // 스케쥴링 기능 연결
    // DB 비동기 연결 설정
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) =>
        await typeORMConfig(configService),
    }),
  ],
})
export class AppModule {}
