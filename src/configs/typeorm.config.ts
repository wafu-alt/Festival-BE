import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

const host: number = Number(process.env.DB_PORT);

export const typeORMConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.RDS_HOSTNAME || process.env.DB_HOST, // 서버에서 설정한 이름
  port: Number(process.env.RDS_PORT) || host, // 서버에서 설정한 포트
  username: process.env.RDS_USERNAME || process.env.DB_USERNAME, // 서버에서 설정한 유저이름
  password: process.env.RDS_PASSWORD || process.env.DB_PASSWORD, // 설치할 때 설정한 비밀번호
  database: process.env.RDS_NAME || process.env.DB_NAME, // 데이터베이스에서 설정한 이름
  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
};
