import Sequelize from 'sequelize';
import CONFIG from './db_config';

// Option 1: Passing parameters separately
const sequelize = new Sequelize(
  CONFIG.db_name,
  CONFIG.db_user,
  CONFIG.db_pass,
  {
    host: CONFIG.db_host,
    dialect: CONFIG.db_dialect,
    pool: {
      max: 5, // 풀의 최대 연결 수
      min: 0, // 풀의 최소 연결 수
      acquire: 30000, // 해당 풀이 오류를 발생시키기 전에 연결을 시도하는 최대 시간 (밀리 초)
      idle: 10000, // 연결이 해제되기 전에 유휴 상태가 될 수있는 최대 시간 (밀리 초)입니다.
    },
  }
);

sequelize.sync();

export default sequelize;
