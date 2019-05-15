const io = require('./index.js').io
const fs = require("fs");
// const server = http.createServer(app);
const path = require("path")
const locs = fs.readFileSync(__dirname+'/Locations.json', 'utf8')
const firebase = require('firebase');
const firestore = require('firebase/firestore');
const locations = JSON.parse(locs).locations

/*
 
########## CONFIG VARIABLES ###########

*/
const allowTimer = false;
/*

########## CONFIG VARIABLES ###########

*/

const onGoingTimers = [];

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

          const getRoomFromCode = (socket, roomCode) => {
            // console.log("GETTING ROOM", roomCode)
              db.collection("rooms").doc(roomCode).get().then(doc => {
                console.log("REQUESTED", doc.data());
                io.emit(("room"+roomCode), doc.data());
              }).catch(err => {
                console.log(err)
              })
          }

          const startTimer = (socket, roomCode, duration) => {
              let timer = duration, minutes, seconds;
                console.log("tried starting a new timer for", roomCode)
                console.log("Here's onGoingTimers", onGoingTimers);
                let ongoingtimer = setInterval(function () {
                  
                  // console.log("Timer going for", roomCode, roomCode in onGoingTimers);
                    // if (roomCode in onGoingTimers) {
                 
                  minutes = parseInt(timer / 60, 10)
                  seconds = parseInt(timer % 60, 10);
          
                  minutes = minutes < 10 ? "0" + minutes : minutes;
                  seconds = seconds < 10 ? "0" + seconds : seconds;
          
                  socket.emit("timer"+roomCode, minutes + ":" + seconds);
                  console.log("EMITTING TIMER:", minutes + ":" + seconds)
                  
                  if (--timer < 0 || timer < 0) {
                    timer = duration;
                    clearInterval(ongoingtimer); 
                  }
                 
                // } else {
                //   timer = duration;
                //   clearInterval(ongoingtimer); 
                // }
            
            
              }, 1000);
              
              io.on('stop'+roomCode, () => {
                timer = duration;
                clearInterval(ongoingtimer); 
              })
          
          }

          const createRoom = (socket, name, roomCode) => {
            db.collection("rooms").doc(roomCode).set(
              {
                host: name, 
                roomCode: roomCode,
                isStarted: false,
                isFinished: false,
                readyPlayers: [],
                readyPlayerCount: 0,
                players: [name],
                playerCount: 1,
                language: "English",
                timeLimit: "07:00",
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
            let launchtimer = false;
            let timerValue = "";
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
                    // stop timer here
                    // onGoingTimers.splice(onGoingTimers.indexOf(roomCode));
                    io.emit("stop"+roomCode, "stop");
                    
                  } else if (doc.isStarted === false) {
                  launchtimer = true;
                  timerValue = doc.timeLimit;
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
              if (launchtimer === true && allowTimer === true) {
                console.log("TRYING TO START TIMER FOR ROOM"+roomCode)
                var timeInSeconds = (parseInt(timerValue.substring(0, 2)) * 60) + parseInt(timerValue.substring(4,6));
                onGoingTimers.push(roomCode);
                startTimer(socket, roomCode, timeInSeconds);
              }
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
                  let doc = sfDoc.data();
                  let newTime = timeLimit || "07:00";
                  console.log("Trying to push new time:", newTime)
        
                transaction.update(db.collection("rooms").doc(roomCode), { 
                  timeLimit: newTime
                });
        
        
              });
          }).then(function() {
              // getRoomFromCode(socket, roomCode)
              console.log("Transaction TIME CHANGE successfully committed!");
          }).catch(function(error) {
              console.log("Transaction failed: ", error);
          });
          }

module.exports = function(socket){
    console.log("Socket Id:" + socket.id);

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
    
    // });  
    

}