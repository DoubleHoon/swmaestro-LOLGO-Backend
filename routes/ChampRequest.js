const express = require("express");

const router = express.Router();
const Banpick = require("../modules/Banpick");
const Lane = require("../modules/Lane");

require("dotenv").config();

const { getChampId, getChampName } = require("../modules/Champions");

const HarmonicMean = (arr) => {
  let ret = 0;
  for (const idx in arr) {
    ret += 1 / arr[idx];
  }
  return Math.round((arr.length / ret) * 100000000) / 100000000;
};

let data;
let lanePosition;
// load win rates by champion from database
async function loadData() {
  try {
    const bp = await Banpick.find({}, (error, result) => {
      return result;
    });
    data = JSON.parse(JSON.stringify(bp));
    const ln = await Lane.find({}, (error, result) => {
      return result;
    });
    lanePosition = JSON.parse(JSON.stringify(ln));
  } catch (err) {
    console.error(err);
  }
}
loadData();

router.post("/", async (req, res) => {
  let chkArr = new Array(1111);
  let resPosition = req.body.position;
  // MatchV5 position validation
  if (resPosition !== "TOP" && resPosition !== "JUNGLE" && resPosition !== "MIDDLE" && resPosition !== "BOTTOM" && resPosition !== "UTILITY") {
    resPosition = "TOTAL";
  }

  for (let i = 0; i < 1111; ++i) chkArr[i] = 1;
  for (const i in req.body.bans) {
    chkArr[req.body.bans[i]] = 0;
  }
  for (const i in req.body.ally) {
    chkArr[req.body.ally[i]] = 0;
  }
  for (const i in req.body.enemy) {
    chkArr[req.body.enemy[i]] = 0;
  }

  const ret = {};
  let chk = false;
  for (const idx in data) {
    if (chkArr[Number(data[idx].championId)] === 0) continue;
    // verify the pick rate above the threshold
    if (lanePosition[idx].lane[resPosition] / lanePosition[idx].lane.TOTAL < 0.1) continue;

    const hmArr = [];
    chk = true;
    for (const i in req.body.ally) {
      const tar = getChampName(String(req.body.ally[i]));
      if (data[idx].friendly[tar].win === 0) {
        chk = false;
        break;
      }
      if (data[idx].friendly[tar].tot === 0) {
        chk = false;
        break;
      }
      hmArr.push(Math.round((data[idx].friendly[tar].win / data[idx].friendly[tar].tot) * 100000000) / 100000000);
    }
    for (const i in req.body.enemy) {
      const tar = getChampName(String(req.body.enemy[i]));
      if (data[idx].enemy[tar].win === 0) {
        chk = false;
        break;
      }
      if (data[idx].enemy[tar].tot === 0) {
        chk = false;
        break;
      }
      hmArr.push(Math.round((data[idx].enemy[tar].win / data[idx].enemy[tar].tot) * 100000000) / 100000000);
    }

    if (chk === false) continue;
    ret[data[idx].championName] = HarmonicMean(hmArr);
  }

  // extract the best-5 and the worst-5
  let sortable = [];
  for (let a in ret) {
    sortable.push([a, ret[a]]);
  }
  sortable.sort((a, b) => {
    return b[1] - a[1];
  });

  let goodbad = { good: [], bad: [] };
  for (let i = 0; i <= 4; ++i) {
    goodbad.good.push(getChampId(sortable[i][0]));
    goodbad.bad.push(getChampId(sortable[sortable.length - 1 - i][0]));
  }

  res.json(goodbad);
});

router.get("/", (req, res) => {
  res.send("ChampRequestWeb");
});

module.exports = router;
