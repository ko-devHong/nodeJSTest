import sequelize from "../db_connect";
import Sequelize from "sequelize";

const User = sequelize.define(
  "user",
  {
    // attributes
    firstName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    lastName: {
      type: Sequelize.STRING,
      // allowNull defaults to true
    },
  },
  {
    // options
  }
);

export default User;
