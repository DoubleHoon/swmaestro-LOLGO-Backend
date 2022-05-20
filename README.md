<img src = "https://user-images.githubusercontent.com/37856995/128962448-39fc7809-0127-4d36-a232-be0b46e72185.png" width="40%">

### Desktop League of Legends coach service
By team LOLGO, the 12th generation of Software Maestro 

## Features
- Recommend the best & worst champions based on statistics during the Pick-Ban process
- Game flow analysis based on deep learning

## LOLGO_Backend
Backend API server for LOLGO based on Node.js

```bash
lolgo_backend
├── README.md
├── app.js
├── ecosystem.config.js
├── modules
│   ├── Banpick.js
│   ├── Champions.js
│   ├── DB.js
│   └── Lane.js
├── newrelic.js
├── package-lock.json
├── package.json
├── routes
│   ├── AnalyRequest.js
│   ├── ChampRequest.js
│   └── SummonRequest.js
└── tf_modules
    ├── group1-shard1of1.bin
    └── model.json
```

## API Details
[View Postman document](https://documenter.getpostman.com/view/16511898/Tzz4QewW)  
- ChampRequest  
  - Recommends the appropriate champion based on the currently selected champions  
- SummonRequest  
  - Returns the tier information of allies through the RiotAPI and their nicknames  
- AnalyRequest  
  - Return the timeline of the game through the RiotAPI and MatchId  

## Packages
```bash
lolgo_backend
├── @tensorflow/tfjs-node@3.9.0
├── axios@0.21.4
├── cors@2.8.5
├── dotenv@10.0.0
├── eslint-config-airbnb-base@14.2.1
├── eslint-config-prettier@8.3.0
├── eslint-plugin-import@2.23.4
├── eslint-plugin-prettier@3.4.0
├── eslint@7.30.0
├── express@4.17.1
├── mongoose@5.13.10
├── newrelic@8.3.0
├── prettier@2.3.2
└── urlencode@1.1.0
```

![SWM_Logos_Color_CMYK1](https://user-images.githubusercontent.com/14193000/169504541-b103b767-8d19-4753-b328-ff79ddeef9f2.png)
