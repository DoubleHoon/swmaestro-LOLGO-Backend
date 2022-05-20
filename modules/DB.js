const mongoose = require("mongoose");

require("dotenv").config();

module.exports = () => {
  function connect() {
    mongoose.connect(
      process.env.lol_stat,
      {
        auth: {
          authSource: "lol_stat",
        },
        user: process.env.mongoId,
        pass: process.env.mongoPw,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false,
      },
      function getErr(err) {
        if (err) {
          console.error("mongodb error", err);
        }
        console.log("mongodb connected");
      }
    );
  }
  connect();
  mongoose.connection.on("disconnected", connect);
};
