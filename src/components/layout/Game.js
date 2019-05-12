import React, { Component } from 'react'
import { BrowserRouter as Router, withRouter, Route, Link } from 'react-router-dom'
import Loader from '../Loader'
import '../../App.css'

import socketIOClient from "socket.io-client";
import $ from 'jquery'
import Locations from '../../Locations'
import LocationsRus from '../../LocationsRus'
import dict from '../../Dictionary'
import PreGame from './PreGame'

const socket = socketIOClient("http://127.0.0.1:4001");

export class Game extends Component {
    state = {
        roomCode: window.location.pathname.slice(2+window.location.pathname.slice(1).search("/")),
        name: this.props.location.state.name,
        language: this.props.location.state.language,

    }
    
    componentDidMount() {
        $(".location").on("click", function(event){
            console.log("Clicked")
            if (event.target.classList.contains('selected')) {
                event.target.classList.remove("selected");

            } else {
            event.target.classList.add('selected')
            }
        });
        $(".player-item").on("click", function(event){
            console.log("Clicked")
            if (event.target.classList.contains('selected')) {
                event.target.classList.remove("selected");

            } else {
            event.target.classList.add('selected')
            }
        });


        socket.emit("requestRoomInfo", this.state.roomCode);

        socket.on("room"+this.state.roomCode, room => {
                this.setState({room: room});
        })
        // socket.off("room"+this.state.roomCode);
        
    }

    componentWillUnmount() {
      socket.off("room"+this.state.roomCode);
    //   clearInterval(ongoingtimer);
    }
    

    showLocations() {
        if (this.state.language == "Russian") {
        return ( LocationsRus.locationsRus.map(loc => {
            return(
           <div className="location" key={loc.title}>{loc.title}</div>
           )}))
            } else {
                return ( Locations.locations.map(loc => {
                    return(
                   <div className="location" key={loc.title}>{loc.title}</div>
                   )}))
            }
        }

        showOneLocation(index, roleIndex) {
            let toreturn = {location: "", role: ""};
            if (this.state.language == "Russian") {
                toreturn = LocationsRus.locationsRus[index].roles[LocationsRus.locationsRus[index].roles.length * Math.random() | 0];
                console.log("Location:", LocationsRus.locationsRus[index].title, "Role:",toreturn)
            return ( {location: LocationsRus.locationsRus[index].title, role: LocationsRus.locationsRus[index].roles[roleIndex]} )
                } else if (this.state.language == "English") {
                    toreturn = Locations.locations[index].roles[Locations.locations[index].roles.length * Math.random() | 0];
                    console.log("Location:", Locations.locations[index].title, "Role:",toreturn)
                    return ( {location: Locations.locations[index].title, role: Locations.locations[index].roles[roleIndex]} )
            }
        }

    makePlayerList = () => {
        this.state.room && this.state.room.readyPlayerCount > 0 && this.state.room.readyPlayers.map(player => {
            $("#"+player).addClass("ingame");
        })
        return this.state.room ? this.state.room.players.map(player => (
            <div className="player-item" key={player.toString()} id={player}>{player}</div> 
        )) : <Loader />
        
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
                <button className="btn button btn-large red" onClick={() => this.handleFinish()}>{this.dict("finish")}</button>
            )
        }
    }

    

    checkMyRole = () => {
  
            if (this.state.room) {
                let notSpies = Object.keys(this.state.room.notSpies);
                // console.log("CHECKING FOR NAME IN NOTSPIES", notSpies, ("Rick" in notSpies))
                // console.log("TEST", )
                var notSpy = notSpies.find(name => name === this.state.name); // Returns name
                 if (notSpy) {
                    console.log("This player is not a spy, giving him a random role");
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

    startTimer = (duration) => {
        // getel("game").style.display = "block";
        
          let timer = duration, minutes, seconds;
          let remainingword = this.dict("timeRemaining");
            let  timesup = this.dict("timesUp");
            let ongoingtimer = setInterval(function () {
                if ($("#timer").length) {
                // if (this.state.room && this.state.room.isStarted) {
              console.log("Counting...", minutes, seconds)
              minutes = parseInt(timer / 60, 10)
              seconds = parseInt(timer % 60, 10);
      
              minutes = minutes < 10 ? "0" + minutes : minutes;
              seconds = seconds < 10 ? "0" + seconds : seconds;
      
              document.getElementById("timer").innerHTML = remainingword + ": " +minutes + ":" + seconds;
      
              if (--timer < 0 || timer < 0) {
                  timer = duration;
                  clearInterval(ongoingtimer); // BREAK FUNCTION SOMEHOW
                  this.finishGame();
                  document.getElementById("timer").innerHTML = timesup
              }
            // }
        } else {
            timer = duration;

            clearInterval(ongoingtimer);
        }
          }, 1000);
        
      
      }

    timer = () => {
        // Timer code goes here
        if (this.state.room && this.state.room.isStarted) {
            this.startTimer(30);
        }
        return (
            <p className="text" id="timer">{this.dict("timeRemaining")}: {this.state.room.timeLimit}</p>
        )
    }


  render() {
    if (this.state.room) {
    return (
      <div>
          {this.checkMyRole()}
          {this.timer()}
        <div className="container">
            <div className="player-list">
                {this.makePlayerList()}
            </div>
            
        </div>

        <div className="divider container"></div>
        <div>
                {this.hostButton()}
            </div>

        <div className="container">
            <div className="location-list">
                {this.showLocations()}
            </div>
        </div>

      </div>
    )
} else {
    return (<Loader />)
}
  }
}

export default withRouter(Game)
