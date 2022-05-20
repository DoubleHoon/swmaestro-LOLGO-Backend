const express = require("express");

const router = express.Router();
const axios = require("axios");
const tf = require("@tensorflow/tfjs-node");

require("dotenv").config();

const key = process.env.keyRiot;
axios.defaults.headers.common["X-Riot-Token"] = key;

const notTotem = (itemId) => {
  return itemId !== 3330 && itemId !== 3340 && itemId !== 3363 && itemId !== 3364;
};

// load timeline from RiotAPI by matchId
const getAnalyRes = async (matchId) => {
  try {
    const V5MatchesTimeline = `https://asia.api.riotgames.com/lol/match/v5/matches/${matchId}/timeline`;
    const res1 = await axios.get(V5MatchesTimeline);
    return res1.data.info.frames;
  } catch (err) {
    console.error(err);
    return false;
  }
};

// load participants list from RiotAPI by matchId
const getParticipantData = async (matchId) => {
  try {
    const V5Matches = `https://asia.api.riotgames.com/lol/match/v5/matches/${matchId}`;
    const res1 = await axios.get(V5Matches);
    return res1.data.info;
  } catch (err) {
    console.error(err);
    return false;
  }
};

let model;
async function loadModel() {
  model = await tf.loadLayersModel("file://tf_modules/model.json");
}
loadModel();

const tfWinRate = async (data) => {
  const nextPredict = model.predict(tf.tensor(data)).arraySync();
  let ret = [];
  for (let j = 0; j < 50; ++j) {
    ret.push(nextPredict[0][j][0]);
  }
  return ret;
};

const match2csv = async (matchId) => {
  try {
    const matchRes = await getAnalyRes(matchId);
    const matchSummary = await getParticipantData(matchId);

    // detect exceptions
    if (matchRes === false || matchSummary === false) {
      return "failed";
    }

    const matchData = JSON.parse(JSON.stringify(matchRes));
    const matchInfo = JSON.parse(JSON.stringify(matchSummary));
    const matchTeams = matchInfo.teams;
    const participantData = matchInfo.participants;

    let resData = {};
    let csvData = new Array(50);
    let modelInputData = new Array(1);
    modelInputData[0] = new Array(50);

    let participantInfo = {};
    let totTime;
    let kdaData = {};
    let killData = {};
    let towerData = {};
    let towerDataFull = [];
    let levelData = {};
    let itemData = {};
    let goldData = {};
    let eliteData = [];
    let redWinRate;

    for (let i = 1; i <= 10; ++i) {
      participantInfo[i] = {};
    }
    // maximum 50 frames
    for (let i = 0; i < 50; ++i) {
      csvData[i] = new Array(16);
      modelInputData[0][i] = new Array(8);
      for (let j = 0; j < 16; ++j) {
        csvData[i][j] = 0;
      }
      for (let j = 0; j < 7; ++j) {
        modelInputData[0][i][j] = 0;
      }
      kdaData[i] = {};
      for (let j = 1; j <= 10; ++j) {
        kdaData[i][j] = { k: 0, d: 0, a: 0 };
      }
      killData[i] = [];
      towerData[i] = {};
      for (let j = 1; j <= 2; ++j) {
        towerData[i][j] = 0;
      }
      levelData[i] = {};
      for (let j = 1; j <= 10; ++j) {
        levelData[i][j] = 0;
      }
      itemData[i] = {};
      for (let j = 1; j <= 10; ++j) {
        itemData[i][j] = [];
      }
      goldData[i] = {};
      for (let j = 1; j <= 10; ++j) {
        goldData[i][j] = 0;
      }
    }

    let frameNow = 0;
    for (const frames of matchData) {
      if (frameNow > 49) {
        break;
      }
      for (let i = 1; i <= 10; ++i) {
        if (frames.participantFrames[i].participantId <= 5) {
          csvData[frameNow][0] += frames.participantFrames[i].totalGold;
          csvData[frameNow][1] += frames.participantFrames[i].level;
        } else {
          csvData[frameNow][8] += frames.participantFrames[i].totalGold;
          csvData[frameNow][9] += frames.participantFrames[i].level;
        }
        levelData[frameNow][i] = frames.participantFrames[i].level;
        goldData[frameNow][i] = frames.participantFrames[i].totalGold;
      }
      if (frameNow !== 0) {
        for (let j = 1; j <= 10; ++j) {
          itemData[frameNow][j] = itemData[frameNow - 1][j].slice();
        }
      }

      for (const events of frames.events) {
        if (events.type === "CHAMPION_KILL") {
          if (events.killerId !== 0) {
            killData[frameNow].push({
              killerId: events.killerId,
              victimId: events.victimId,
              assistId: events.assistingParticipantIds ? events.assistingParticipantIds : [],
              x: events.position.x,
              y: events.position.y,
            });
            kdaData[frameNow][events.killerId].k += 1;
          }
          kdaData[frameNow][events.victimId].d += 1;
          for (const assist in events.assistingParticipantIds) {
            kdaData[frameNow][events.assistingParticipantIds[assist]].a += 1;
          }

          if (events.killerId <= 5) {
            csvData[frameNow][7] += 1;
          } else {
            csvData[frameNow][15] += 1;
          }
        } else if (events.type === "BUILDING_KILL") {
          towerData[frameNow][events.teamId / 100] += 1;

          towerDataFull.push({
            timestamp: events.timestamp,
            towerType: events.towerType || events.buildingType,
            laneType: events.laneType,
            teamId: events.teamId,
            x: events.position.x,
            y: events.position.y,
          });

          if (events.teamId === 100) {
            csvData[frameNow][10] += 1;
          } else {
            csvData[frameNow][2] += 1;
          }
        } else if (events.type === "ELITE_MONSTER_KILL") {
          if (events.killerId <= 5) {
            csvData[frameNow][3] += 1;
          } else {
            csvData[frameNow][11] += 1;
          }

          if (events.monsterType === "DRAGON") {
            if (events.killerId <= 5) {
              csvData[frameNow][6] += 1;
            } else {
              csvData[frameNow][14] += 1;
            }
            eliteData.push({
              timestamp: events.timestamp,
              monsterType: events.monsterSubType,
              killerId: events.killerId,
              x: events.position.x,
              y: events.position.y,
            });
          } else if (events.monsterType === "RIFTHERALD") {
            if (events.killerId > 0) {
              if (events.killerId <= 5) {
                csvData[frameNow][5] += 1;
              } else {
                csvData[frameNow][13] += 1;
              }
              eliteData.push({
                timestamp: events.timestamp,
                monsterType: events.monsterType,
                killerId: events.killerId,
                x: events.position.x,
                y: events.position.y,
              });
            }
          } else if (events.monsterType === "BARON_NASHOR") {
            if (events.killerId <= 5) {
              csvData[frameNow][4] += 1;
            } else {
              csvData[frameNow][12] += 1;
            }
            eliteData.push({
              timestamp: events.timestamp,
              monsterType: events.monsterType,
              killerId: events.killerId,
              x: events.position.x,
              y: events.position.y,
            });
          }
        } else if (events.type === "ITEM_PURCHASED") {
          if (notTotem(events.itemId) === false) {
            for (const items of itemData[frameNow][events.participantId]) {
              if (notTotem(items) === false) {
                itemData[frameNow][events.participantId].splice(itemData[frameNow][events.participantId].indexOf(items), 1);
              }
            }
          }
          itemData[frameNow][events.participantId].push(events.itemId);
        } else if (events.type === "ITEM_SOLD" || events.type === "ITEM_DESTROYED") {
          if (notTotem(events.itemId)) {
            if (itemData[frameNow][events.participantId].indexOf(events.itemId) !== -1) {
              itemData[frameNow][events.participantId].splice(itemData[frameNow][events.participantId].indexOf(events.itemId), 1);
            }
          }
        } else if (events.type === "ITEM_UNDO") {
          if (events.beforeId !== 0) {
            itemData[frameNow][events.participantId].splice(itemData[frameNow][events.participantId].indexOf(events.beforeId), 1);
          }
          if (events.afterId !== 0) {
            itemData[frameNow][events.participantId].push(events.afterId);
          }
        } else if (events.type === "GAME_END") {
          totTime = events.timestamp;
        }
      }

      // handle ward exception
      if (frameNow === 2) {
        for (let i = 1; i <= 10; ++i) {
          if (
            itemData[frameNow][i].indexOf(3330) === -1 &&
            itemData[frameNow][i].indexOf(3340) === -1 &&
            itemData[frameNow][i].indexOf(3363) === -1 &&
            itemData[frameNow][i].indexOf(3364) === -1
          ) {
            itemData[frameNow][i].push(3340);
          }
        }
      }
      frameNow += 1;
    }

    for (let i = 1; i <= frameNow - 1; ++i) {
      for (let j = 1; j <= 10; ++j) {
        kdaData[i][j].k += kdaData[i - 1][j].k;
        kdaData[i][j].d += kdaData[i - 1][j].d;
        kdaData[i][j].a += kdaData[i - 1][j].a;
      }
    }
    for (let i = 1; i <= frameNow - 1; ++i) {
      towerData[i][1] += towerData[i - 1][1];
      towerData[i][2] += towerData[i - 1][2];
    }
    for (let i = 1; i <= frameNow - 1; ++i) {
      for (let j = 0; j <= 15; ++j) {
        if (j !== 0 && j !== 1 && j !== 8 && j !== 9) {
          csvData[i][j] += csvData[i - 1][j];
        }
      }
    }

    // estimate win rate
    for (let i = 0; i < 50; ++i) {
      for (let j = 0; j < 8; ++j) {
        modelInputData[0][i][j] = csvData[i][j] - csvData[i][j + 8];
      }
    }
    redWinRate = await tfWinRate(modelInputData);

    for (const participants of participantData) {
      participantInfo[participants.participantId].summonerName = participants.summonerName;
      participantInfo[participants.participantId].championId = participants.championId;
      participantInfo[participants.participantId].teamId = participants.teamId;
    }

    let winTeam = 100;
    if (matchTeams[0].win === true) {
      winTeam = matchTeams[0].teamId;
    } else {
      winTeam = matchTeams[1].teamId;
    }
    resData.win = winTeam;
    resData.participantInfo = participantInfo;
    resData.totTime = totTime;
    resData.totFrame = frameNow - 1;
    resData.highlightData = [];
    for (let i = 1; i <= frameNow - 1; ++i) {
      if (redWinRate[i] - redWinRate[i - 1] > 0.05 || redWinRate[i] - redWinRate[i - 1] < -0.05) {
        resData.highlightData.push(i);
      }
    }
    resData.winRate = redWinRate;
    resData.kdaData = kdaData;
    resData.killData = killData;
    resData.towerDataFull = towerDataFull;
    resData.levelData = levelData;
    resData.itemData = itemData;
    resData.goldData = goldData;
    resData.eliteData = eliteData;

    return resData;
  } catch (err) {
    console.error(err);
    return "false";
  }
};

router.post("/", (req, res) => {
  res.send("AnalyRequestPost");
});

router.get("/:matchId", async (req, res) => {
  res.send(await match2csv(`KR_${req.params.matchId}`));
});

module.exports = router;
