const DB_Config = {};

DB_Config.db_dialect = process.env.DB_DIALECT || 'mysql';
DB_Config.db_host = process.env.DB_HOST || 'localhost';
DB_Config.db_port = process.env.DB_PORT || '3306';
DB_Config.db_name = process.env.DB_NAME || 'testdatabase';
DB_Config.db_user = process.env.DB_USER || 'root';
DB_Config.db_pass = process.env.DB_PASS || 'ghd123';

export default DB_Config;
