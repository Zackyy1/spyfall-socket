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
const lol = "its nothing here"
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

          

          const createRoom = (socket, name, roomCode) => {
            db.collection("rooms").doc(roomCode).set(
              {
                host: name, 
                roomCode: roomCode,
                isStarted: false,
                isFinished: false,
                readyPlayers: [],
                readyPlayerCount: 0,
                firstQuestion: "",
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
                    var newPopulation = sfDoc.data().playerCount;
                    var newPlayers = [...sfDoc.data().players];
                    var plrs = sfDoc.data().players;
                    console.log(plrs.indexOf(name), name in plrs);
                  if (plrs.indexOf(name) == -1) { 
                    console.log("USER NOT EXISTING, MAKING NEW ENTRY")
                    newPopulation = sfDoc.data().playerCount + 1;
                    newPlayers = [...sfDoc.data().players, name]; 
                  } else {
                    console.log("USER EXISTS, SKIPPING ADD")
                  }
                  transaction.update(db.collection("rooms").doc(roomCode), { playerCount: newPopulation, players: newPlayers });
              });
          }).then(function() {
              console.log("Transaction JOIN successfully committed!");
              getRoomFromCode(socket, roomCode)
              socket.emit("roomFound", roomCode)
          }).catch(function(error) {
              console.log("Transaction failed: ", error);
              socket.emit("room404", {})
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
                  let fromStart = {
                    readyPlayers: newPlayers,
                    readyPlayerCount: newPopulation,
                    isStarted: false, 
                    spy: "", 
                    firstQuestion: "",
                    notSpies: [], 
                    location: "",
                    locationIndex: 0,}
                  if (sfDoc.data().playerCount == newPopulation) {
                    // io.emit("startGame"+roomCode, {})
                    fromStart = startGame(sfDoc.data());
                    console.log(fromStart)
                    console.log("All players ready, starting game")
                  }
                  transaction.update(db.collection("rooms").doc(roomCode), { 
                    readyPlayerCount: newPopulation,
                    readyPlayers: newPlayers,
                    isStarted: fromStart.isStarted, 
                    spy: fromStart.spy, 
                    notSpies: fromStart.notSpies, 
                    location: fromStart.location,
                    locationIndex: fromStart.locationIndex,
                    firstQuestion: fromStart.firstQuestion,
                  });
              });
          }).then(function() {
              getRoomFromCode(socket, roomCode)
              console.log("Transaction READY successfully committed!");
          }).catch(function(error) {
              console.log("Transaction failed: ", error);
          });
          }
        
          const finishGame = (socket, roomCode) => {
            return db.runTransaction(function(transaction) {
              return transaction.get(db.collection("rooms").doc(roomCode)).then(function(sfDoc) {
                  if (!sfDoc.exists) {
                      throw "Document does not exist!";
                  }
                  
                  transaction.update(db.collection("rooms").doc(roomCode), { 
                    readyPlayerCount: 0,
                    readyPlayers: [],
                    isStarted: false, 
                    
                    
                  });
              });
          }).then(function() {
              getRoomFromCode(socket, roomCode)
              console.log("Transaction READY successfully committed!");
          }).catch(function(error) {
              console.log("Transaction failed: ", error);
          });
          }


          const startGame = (data) => {
          
           
                  let doc = data;
                  let newState = true;
                  // let players = doc.players;
                  let spy = "";
                  let notSpies = {};
                  let locationIndex = 0;
                  let location = "";
                  let roleIndex = 0;
                  let firstQuestion = "";
                  if (doc.isStarted === true) { 
                    newState = false;
                  
                  } else if (doc.isStarted === false) {
                  launchtimer = true;
                  timerValue = doc.timeLimit;
                  let players = doc.players;
                  spy = players[players.length * Math.random() | 0]
                  notSpies = {};
                  locationIndex = locations.length * Math.random() | 0;
                  location = locations[locationIndex].title;
                  firstQuestion = players[players.length * Math.random() | 0];
                  for (let i = 0; i < players.length; i++) {
                    notSpies[players[i]] = {role: locations[locationIndex].roles[roleIndex],
                    roleIndex: roleIndex = locations[locationIndex].roles.length * Math.random() | 0,
                  }
                  }
                  delete notSpies[spy];
                };
                return {
                  isStarted: newState, 
                  spy, 
                  firstQuestion: firstQuestion,
                  notSpies, 
                  location,
                  locationIndex,}
          }
        
          const setTimeLimitForRoom = (socket, roomCode, timeLimit) => {
            return db.runTransaction(function(transaction) {
              return transaction.get(db.collection("rooms").doc(roomCode)).then(function(sfDoc) {
                  if (!sfDoc.exists) {
                      throw "Document does not exist!";
                  }
                  let doc = sfDoc.data();
                  let newTime = timeLimit;
                  console.log("Trying to push new time:", newTime)
                  // console.log(sfDoc.data());
                transaction.update(db.collection("rooms").doc(roomCode), { 
                  timeLimit: newTime
                })
        
        
              });
          }).then(function() {
              // getRoomFromCode(socket, roomCode)
              console.log("Transaction TIME CHANGE successfully committed!");
          }).catch(function(error) {
              console.log("Transaction failed: ", error);
          });
          }

module.exports = async function(socket){
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
        finishGame(socket, roomCode);
      })
    
      socket.on("timeChange", data => {
        setTimeLimitForRoom(socket, data.roomCode, data.timeLimit)
      })
    
     
    
      socket.on("disconnect", () => {
        console.log("Client disconnected");
      });
    
    // });  
    

}