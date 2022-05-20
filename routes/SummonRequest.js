const express = require("express");

const router = express.Router();
const axios = require("axios");
const urlencode = require("urlencode");

require("dotenv").config();

const key = process.env.keyRiot;
axios.defaults.headers.common["X-Riot-Token"] = key;

// load match list from RiotAPI by summonerName
const getMatchesByName = async (summonerName) => {
  try {
    const summonersByName = `https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-name/${urlencode(summonerName)}`;
    const res1 = await axios.get(summonersByName);
    const matchesByPuuid = `https://asia.api.riotgames.com/lol/match/v5/matches/by-puuid/${res1.data.puuid}/ids?start=0&count=20`;
    const res2 = await axios.get(matchesByPuuid);
    const ret = {};
    ret.summonerName = res1.data.name;
    ret.matches = [];
    res2.data.forEach((e) => {
      // rip "KR_"
      ret.matches.push(e.split("_")[1]);
    });
    return ret;
  } catch (err) {
    console.error(err);
    return "false";
  }
};

router.post("/", (req, res) => {
  res.send("SummonRequestPost");
});

router.get("/:summonerName", async (req, res) => {
  res.send(await getMatchesByName(req.params.summonerName));
});

module.exports = router;
