const mongoose = require("mongoose");
const User = require("../models/user");

mongoose.set("strictQuery", false);

db_conn().catch((e) => {
  console.log("DB not connected" + e);
});

async function db_conn() {
  await mongoose.connect(process.env.MONGODB_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: false,
  });
}
