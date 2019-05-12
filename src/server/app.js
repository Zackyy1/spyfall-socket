const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const axios = require("axios");
const port = process.env.PORT || 4001;
const index = require("./routes/index");
const app = express();
const fs = require("fs");
const locs = fs.readFileSync('../../Locations.json', 'utf8')
const server = http.createServer(app);
const io = socketIo(server); // < Interesting!
const firebase = require('firebase/app');
const firestore = require('firebase/firestore');
const locations = JSON.parse(locs).locations

let randomLocation = locations[locations.length * Math.random() | 0]
let randomRole = randomLocation.roles[randomLocation.roles.length * Math.random() | 0]

          console.log("Random location:", randomLocation.title, "Random role:", randomRole)


const config = {
    apiKey: "AIzaSyDIRnGTgaKjEP8yUCYWpOOLHwxMGZiSlhQ",
    authDomain: "spyfall-socket.firebaseapp.com",
    databaseURL: "https://spyfall-socket.firebaseio.com",
    projectId: "spyfall-socket",
    storageBucket: "spyfall-socket.appspot.com",
    messagingSenderId: "953236483938",
    appId: "1:953236483938:web:1cba61673213ae7d"
  };

  firebase.initializeApp(config);
  const db = firebase.firestore();

  // --------------------------------------------------------------------------------------------------------------------------------


  const getRoomFromCode = (socket, roomCode) => {
    // console.log("GETTING ROOM", roomCode)
      db.collection("rooms").doc(roomCode).get().then(doc => {
        console.log("REQUESTED", doc.data());
        io.emit(("room"+roomCode), doc.data());
      })
  }

  

  const createRoom = (socket, name, roomCode) => {
    db.collection("rooms").doc(roomCode).set(
      {
        host: name, 
        roomCode,
        isStarted: false,
        isFinished: false,
        readyPlayers: [],
        readyPlayerCount: 0,
        players: [name],
        playerCount: 1,
        language: "English",

      }).then(() => {
        getRoomFromCode(socket, roomCode)
      console.log("Successfully created room")
    }).catch(err => {
      console.log(err)
    });
  }
  const addPlayerToRoom = (socket, roomCode, name) => {
    return db.runTransaction(function(transaction) {
      return transaction.get(db.collection("rooms").doc(roomCode)).then(function(sfDoc) {
          if (!sfDoc.exists) {
              throw "Document does not exist!";
          }
          var newPopulation = sfDoc.data().playerCount + 1;
          var newPlayers = [...sfDoc.data().players, name];
          transaction.update(db.collection("rooms").doc(roomCode), { playerCount: sfDoc.data().playerCount + 1, players: newPlayers });
      });
  }).then(function() {
      console.log("Transaction JOIN successfully committed!");
      getRoomFromCode(socket, roomCode)
  }).catch(function(error) {
      console.log("Transaction failed: ", error);
  });
  }

  const makePlayerReady = (socket, roomCode, name) => {
    return db.runTransaction(function(transaction) {
      return transaction.get(db.collection("rooms").doc(roomCode)).then(function(sfDoc) {
          if (!sfDoc.exists) {
              throw "Document does not exist!";
          }
          var newPopulation = sfDoc.data().readyPlayerCount + 1;
          var newPlayers = [...sfDoc.data().readyPlayers, name];
          if (sfDoc.data().playerCount == newPopulation) {
            io.emit("startGame"+roomCode, {})
            startOrStopGame(socket, roomCode);
            console.log("All players ready, starting game")
          }
          transaction.update(db.collection("rooms").doc(roomCode), { readyPlayerCount: sfDoc.data().readyPlayerCount + 1, readyPlayers: newPlayers });
      });
  }).then(function() {
      getRoomFromCode(socket, roomCode)
      console.log("Transaction READY successfully committed!");
  }).catch(function(error) {
      console.log("Transaction failed: ", error);
  });
  }

  const startOrStopGame = (socket, roomCode) => {
    return db.runTransaction(function(transaction) {
      return transaction.get(db.collection("rooms").doc(roomCode)).then(function(sfDoc) {
          if (!sfDoc.exists) {
              throw "Document does not exist!";
          }
          let doc = sfDoc.data();
          let newState = true;
          // let players = doc.players;
          let spy = "";
          let notSpies = {};
          let locationIndex = 0;
          let location = "";
          let roleIndex = 0;

          if (doc.isStarted === true) { 
            newState = false;
            
          } else if (doc.isStarted === false) {

          let players = doc.players;
          spy = players[players.length * Math.random() | 0]
          notSpies = {};
          locationIndex = locations.length * Math.random() | 0;
          location = locations[locationIndex].title;
          
          for (let i = 0; i < players.length; i++) {
            notSpies[players[i]] = {role: locations[locationIndex].roles[roleIndex],
            roleIndex: roleIndex = locations[locationIndex].roles.length * Math.random() | 0,
          }
          }
          delete notSpies[spy];
          console.log("SPY", spy, "NOT SPIES", notSpies)
        };

        transaction.update(db.collection("rooms").doc(roomCode), { 
          isStarted: newState, 
          spy, 
          notSpies, 
          location,
          locationIndex,
          readyPlayerCount: 0,
          readyPlayers: [],
        });


      });
  }).then(function() {
      getRoomFromCode(socket, roomCode)
      console.log("Transaction START GAME successfully committed!");
  }).catch(function(error) {
      console.log("Transaction failed: ", error);
  });
  }

  const setTimeLimitForRoom = (socket, roomCode, timeLimit) => {
    return db.runTransaction(function(transaction) {
      return transaction.get(db.collection("rooms").doc(roomCode)).then(function(sfDoc) {
          if (!sfDoc.exists) {
              throw "Document does not exist!";
          }

        transaction.update(db.collection("rooms").doc(roomCode), { 
          timeLimit: timeLimit
        });


      });
  }).then(function() {
      // getRoomFromCode(socket, roomCode)
      console.log("Transaction START GAME successfully committed!");
  }).catch(function(error) {
      console.log("Transaction failed: ", error);
  });
  }


// --------------------------------------------------------------------------------------------------------------------------------



  io.on("connection", socket => {
  console.log("New client connected");

  socket.on("gameCreate", e => {
    console.log(`Room ${e.roomCode} created by ${e.name}`);
    createRoom(socket, e.name, e.roomCode);
  }); 
  
  // setInterval(() => testFunction(socket), 2000);

  socket.on("requestRoomInfo", roomCode => {
    console.log(`Room ${roomCode} info requested`);
    getRoomFromCode(socket, roomCode);
  });

  socket.on("joinGame", e => {
    console.log(`Player ${e.name} tried to join room ${e.roomCode}`)
    addPlayerToRoom(socket, e.roomCode, e.name);
    // socket.emit("newPlayerAddedToRoom"+e.roomCode, e.name);
  })
  socket.on("playerReady", player => {
    makePlayerReady(socket, player.roomCode, player.name )
  })

  socket.on("finish", roomCode => {
    startOrStopGame(socket, roomCode);
  })

  socket.on("timeChange", data => {
    setTimeLimitForRoom(socket, data.roomCode, data.timeLimit)
  })

 

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });

});




server.listen(port, () => console.log(`Listening on port ${port}`));
