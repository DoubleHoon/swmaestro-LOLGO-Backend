const mongoose = require("mongoose");

const banpickSchema = new mongoose.Schema({}, { strict: false });
banpickSchema.set("collection", "banpick");
module.exports = mongoose.model("banpick", banpickSchema);
