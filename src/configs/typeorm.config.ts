import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const typeORMConfig = async (
  configService: ConfigService,
): Promise<TypeOrmModuleOptions> => {
  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOST'), // 서버에서 설정한 이름
    port: Number(configService.get<string>('DB_PORT')), // 서버에서 설정한 포트
    username: configService.get<string>('DB_USERNAME'), // 서버에서 설정한 유저이름
    password: configService.get<string>('DB_PASSWORD'), // 설치할 때 설정한 비밀번호
    database: configService.get<string>('DB_NAME'), // 데이터베이스에서 설정한 이름
    entities: [__dirname + '/../**/*.entity.{js,ts}'],
    synchronize: configService.get<string>('DB_SYNCHRONIZE') === 'true',
  };
};
