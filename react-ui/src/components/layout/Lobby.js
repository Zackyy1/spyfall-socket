import React, { Component } from 'react'
import { BrowserRouter as Router, Route, withRouter, Link } from 'react-router-dom'
import socketIOClient from "socket.io-client";
import Loader from '../Loader'
import $ from 'jquery'

import dict from '../../Dictionary'
import Locations from '../../Locations'
import LocationsRus from '../../LocationsRus'
import server from '../../config/serverConfig'


const socket = socketIOClient(server);

let ongoingtimer;
export class Lobby extends Component {

    

    constructor(props) {
        
        function tryParseJSON (jsonString){
            try {
                var o = JSON.parse(jsonString);
                console.log(o)
                // Handle non-exception-throwing cases:
                // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
                // but... JSON.parse(null) returns null, and typeof null === "object", 
                // so we must check for that, too. Thankfully, null is falsey, so this suffices:
                return o
            }
            catch (e) { console.log(e) }
        
            return "";
        };

        super(props);
        this.state = {
            timeLimit: "07:00",
            localTimer: tryParseJSON(localStorage.getItem('localTimer')),
            roomCode: window.location.pathname.slice(2+window.location.pathname.slice(1).search("/")),
            name: this.props.location.state.name,
            language: this.props.location.state.language,
        }
      }
    
    
    componentDidMount() {

        
        

        // this.setState({timeLimit: $("#timer").value})
        
        this.state.room && this.state.room.readyPlayerCount > 0 && this.state.room.readyPlayers.map(player => {
            $("#"+player).addClass("ready");
        });

        // if (this.state.room && this.state.name in this.state.room.readyPlayers && this.state.name == this.state.room.host) {
        //     console.log("Removing input for a ready host")
        //     $("#timerInput").remove();
        // }

       

        socket.emit("requestRoomInfo", this.state.roomCode);
        // 
        socket.on("room"+this.state.roomCode, room => {
                this.setState({room: room, timeLimit: room.timeLimit});
        })
        
   
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.room) {
            for (let i = 0; i < this.state.room.readyPlayers.length; i++) {
                if (this.state.name === this.state.room.readyPlayers[i]) {
                    $("#hostTimer").remove();
                    $("#readyButton").remove();
                }

            }
            this.state.room.readyPlayerCount > 0 && this.state.room.isStarted == false && this.state.room.readyPlayers.map(player => {
                $("#"+player).addClass("ready");
            })
        }

        $(".location").click( e => {
            if (e.target.classList.contains('selected')) {
                e.target.classList.remove("selected");

            } else {
            e.target.classList.add('selected')
            console.log("Added class selected")
            }
    });
    $(".player").on("click", function(event){
        console.log("Clicked")
        if (event.target.classList.contains('selected')) {
            event.target.classList.remove("selected");

        } else {
        event.target.classList.add('selected')
        }
    });


    }
    

    
    
    changeTime = (newTime) => {
        this.setState({localTimer: newTime});
        localStorage.setItem('localTimer', JSON.stringify(newTime))
      }

    componentWillUnmount() {
        socket.off("room"+this.state.roomCode);
      }

    dict(word) {
        let from = dict.russian // change to english at production
        if (this.state.language === "Russian") {
          from = dict.russian;
        } else {
          from = dict.english;
        }
        return from[word];
      }

      handleFinish = e => {
        console.log("Game finished");
        // clearInterval(ongoingtimer);
        socket.emit("finish", this.state.roomCode);
    }

    hostButton = () => {
        if (this.state.room && this.state.name === this.state.room.host) {
            return (
                <button className="btn button btn-large red" id="finishButton" onClick={() => this.handleFinish()}>{this.dict("finish")}</button>
            )
        }
    }

    showLocations() {
        let toShow = LocationsRus.locationsRus;
        if (this.state.language == "Russian") {
            toShow = LocationsRus.locationsRus;
        } else {
            toShow = Locations.locations;
        }

        return ( toShow.map(loc => {
            return(
           <div className="location" key={loc.title}>{loc.title}</div>
           )}))
            
        }

        showOneLocation(index, roleIndex) {
            if (this.state.language == "Russian") {
            
            return ( {location: LocationsRus.locationsRus[index].title, role: LocationsRus.locationsRus[index].roles[roleIndex]} )
                } else if (this.state.language == "English") {
        
                    return ( {location: Locations.locations[index].title, role: Locations.locations[index].roles[roleIndex]} )
            }
        }

    

    checkMyRole = () => {


  
            if (this.state.room) {
                for (let i = 0; i < this.state.room.players.length; i++) {
                    $("#"+this.state.room.players[i]).removeClass("ready");
                }
                let notSpies = Object.keys(this.state.room.notSpies);
                // console.log("CHECKING FOR NAME IN NOTSPIES", notSpies, ("Rick" in notSpies))
                // console.log("TEST", )
                var notSpy = notSpies.find(name => name === this.state.name); // Returns name
                 if (notSpy) {
                    let index = this.state.room.locationIndex;
                    let loc = this.showOneLocation(index, this.state.room.notSpies[notSpy].roleIndex)
                    return (
                        <div>
                            <p key={index} className="text">{this.dict("location")}: {loc.location}</p>
                            <p key={index+1} className="text">{this.dict("role")}: {loc.role}</p>
                        </div>
                    )
                } else {
                    return (
                        <div>
                            <p key={Math.random()*100} className="text">{this.dict("location")}: ???</p>
                            <p key={Math.random()*100} className="text">{this.dict("role")}: {this.dict("spy")}</p>
        
                        </div>
                    )
                }
        
    }
        
    }

    finishGame() {
        this.setState({room: {...this.state.room, isFinished: true, isStarted: false}})
    }

    hmsToSecondsOnly(str) {
        var p = str.split(':'),
            s = 0, m = 1;
    
        while (p.length > 0) {
            s += m * parseInt(p.pop(), 10);
            m *= 60;
        }
    
        return s;
    }

    startTimer = (time) => {
        if (time) {
        var duration = this.hmsToSecondsOnly(time);//(parseInt(time.substring(0, 2)) * 60) + parseInt(time.substring(4,6));
        let timer = duration, minutes, seconds;
        if (!ongoingtimer) {

          ongoingtimer = setInterval(() => {
            
            // console.log("Timer going for", roomCode, roomCode in onGoingTimers);
              // if (roomCode in onGoingTimers) {
           
            minutes = parseInt(timer / 60, 10)
            seconds = parseInt(timer % 60, 10);
    
            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;
    
            // $("#timer").innerHTML= `${word}: ${minutes}:${seconds}`;

            
            // this.setState({localTimer: `${minutes}:${seconds}`})
            this.changeTime(`${minutes}:${seconds}`);
            
            if (--timer < 0 || timer < 0  || this.state.room.isStarted == false) {
              timer = duration;
              clearInterval(ongoingtimer); 
              ongoingtimer = null;
            }
           
          // } else {
          //   timer = duration;
          //   clearInterval(ongoingtimer); 
          // }
      
      
        }, 1000);
        
    } else {
        // console.log(this.state.timeLimit, this.state.localTimer, this.state.room.timeLimit)
    }
}
    
    }    

    timer () {
        // Timer code goes here
        if (this.state.room && this.state.room.isStarted) {

        if (this.state.localTimer == undefined) {
            this.setState({localTimer: this.state.room.timeLimit})
         }
            let toCount = JSON.parse(localStorage.getItem('localTimer'));
            if (toCount == "NaN:NaN") { toCount = this.state.room.timeLimit}
            this.startTimer(toCount) // this.state.localTimer
            return (
                <p className="text" id="timer">{this.dict("timeRemaining")}: {this.state.localTimer}</p>
            )
        }
        
    }

    makePlayerList = () => {
    this.state.room && this.state.room.isStarted == false && this.state.room.readyPlayerCount > 0 && this.state.room.readyPlayers.map(player => {
        $("#"+player).addClass("ready");
    })

    // if (this.state.room && this.state.room.readyPlayers.indexOf(this.state.name) > -1) {
    //   $("#readyButton").remove();
    // }

    // console.log(this.state.timeLimit, this.state.localTimer, this.state.room.timeLimit, localStorage.getItem('localTimer'))

    
    return this.state.room ? this.state.room.players.map(player => (
        <div className="player" key={player.toString()} id={player}>{player}</div> 
    )) : <Loader />
    
    }

    showFirstQuestion() {
        if (this.state.room ){
            // console.log($("#"+this.state.room.firstQuestion).insertAfter("p", "1st"))
            $("#"+this.state.room.firstQuestion).html(this.state.room.firstQuestion+"<sup>1st</sup>");
            console.log($("#"+this.state.room.firstQuestion).text)
            // $("#"+this.state.room.firstQuestion).innerHTML =  $("#"+this.state.room.firstQuestion).innerHTML + "-1st"
        }
    }

    handleReady = e => {
        $("#"+this.state.name).addClass("ready");
        if (this.state.room && this.state.name === this.state.room.host) {
          $("#hostTimer").remove()
          socket.emit("timeChange", {roomCode: this.state.roomCode, timeLimit: this.state.timeLimit})
        }
        if (this.state.room && this.state.room.isStarted == false) {
            this.changeTime(this.state.room.timeLimit)
            console.log("TIMER RESET TO", this.state.timeLimit)
        }
        socket.emit("playerReady", {roomCode: this.state.roomCode, name: this.state.name})

    }

    hostTimer = () => {
      if (this.state.room && this.state.name === this.state.room.host) {
          // clear storage
          let newvalues =  $("#timerInput").val() || this.state.timeLimit;
          console.log(newvalues)

          socket.emit("timeChange", {roomCode: this.state.roomCode, timeLimit: newvalues})

          return (
            <div id="hostTimer">
            <label htmlFor="timeLimit" className="text">{this.dict('choosetime')}</label>
            <input type="time" className="time text center" id="timerInput" onChange={this.handleTimeChange} defaultValue="07:00"/>
            </div>
            )
      }
  }

  handleTimeChange = e => {
    console.log("New time:", e.target.value)
    this.setState({timeLimit: e.target.value, localTimer: e.target.value});
    this.changeTime(e.target.value);
    // socket.emit("timeChange", {roomCode: this.state.roomCode, timeLimit: this.state.timeLimit})

  }
    


  render() {

      if (this.state.room && this.state.room.isStarted != true) { 

          return (
        <div className="center">
        <div className="center">
          
        <h5 style={{paddingBottom: "15px"}} className="text">{this.dict("roomCode")}{this.state.roomCode}</h5>
        <div className="container players center" id="">
            <div className="player-list center">
                {this.makePlayerList()}
            </div>
            <div style={{paddingTop: "30vh"}} className="container">
                {this.hostTimer()}

            </div>
            <button style={{marginTop: "15vh"}} className="btn btn-large button" id="readyButton" onClick={() => this.handleReady()}>{this.dict("ready")}</button>
        </div>
      </div>
                
        </div>
    ) } else if (this.state.room && this.state.room.isStarted === true) {
        return(
            <div className="center">
            
                {this.checkMyRole()}
                {this.timer()}
             
                  <div className="player-list container">
                      {this.makePlayerList()}
                      {this.showFirstQuestion()}
                  </div>
                  
             
      
              <div className="divider container"></div>
              <div>
                      {this.hostButton()}
                  </div>
      
              
                  <div className="location-list container">
                      {this.showLocations()}
                  </div>
      
            </div>
          )
    } else {
        return <Loader /> 
    }

    
  }
}

export default withRouter(Lobby)
