const mongoose = require("mongoose");

const championsSchema = new mongoose.Schema({}, { strict: false });
championsSchema.set("collection", "champions");
module.exports = mongoose.model("champions", championsSchema);
