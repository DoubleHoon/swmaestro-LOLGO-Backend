require("newrelic");

const express = require("express");
const cors = require("cors");

const app = express();
const db = require("./modules/DB");
const ChampRequest = require("./routes/ChampRequest");
const SummonRequest = require("./routes/SummonRequest");
const AnalyRequest = require("./routes/AnalyRequest");

db();

app.use(cors());
app.use(express.json());
app.use("/champrequest", ChampRequest);
app.use("/summonrequest", SummonRequest);
app.use("/analyrequest", AnalyRequest);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// RiotAPI verification
app.get("//riot.txt", (req, res) => {
  console.log("riot");
  res.send("20435fec-4e29-4427-8b11-593267d3db49");
});

app.listen(3000, () => {
  console.log(`Example app listening`);
});
