import React, { Component } from 'react'
import { BrowserRouter as Router, Route, withRouter, Link } from 'react-router-dom'
import socketIOClient from "socket.io-client";
import Loader from '../Loader'
import $ from 'jquery'

import dict from '../../Dictionary'
import Locations from '../../Locations'
import LocationsRus from '../../LocationsRus'
import server from '../../config/serverConfig'
import Navbar from "./Navbar";

const socket = socketIOClient(server);


export class Lobby extends Component {
    state = {
        roomCode: window.location.pathname.slice(2+window.location.pathname.slice(1).search("/")),
        name: this.props.location.state.name,
        language: this.props.location.state.language,
        timeLimit: "07:00",
    }
    
    componentDidMount() {
        socket.emit("requestRoomInfo", this.state.roomCode);
        socket.on("timer"+this.state.roomCode, time => {
            console.log(this.state)
            if (this.state.room && this.state.room.isStarted === true) {
                this.setState({timeLimit: time})
                console.log("CHANGED STATE TIME TO", time)
             }
        })
        socket.on("room"+this.state.roomCode, room => {
                this.setState({room: room});
        })
        
        
        // socket.off("room"+this.state.roomCode)
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

        this.setState({timeLimit: $("#timer").value})

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
                <button className="btn button btn-large red" onClick={() => this.handleFinish()}>{this.dict("finish")}</button>
            )
        }
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
            if (this.state.language == "Russian") {
            
            return ( {location: LocationsRus.locationsRus[index].title, role: LocationsRus.locationsRus[index].roles[roleIndex]} )
                } else if (this.state.language == "English") {
        
                    return ( {location: Locations.locations[index].title, role: Locations.locations[index].roles[roleIndex]} )
            }
        }

    

    checkMyRole = () => {
  
            if (this.state.room) {
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

    

    timer () {
        // Timer code goes here

            return (
                <p className="text" id="timer">{this.dict("timeRemaining")}: {this.state.timeLimit}</p>
            )
       
        
    }

    makePlayerList = () => {
    this.state.room && this.state.room.readyPlayerCount > 0 && this.state.room.readyPlayers.map(player => {
        $("#"+player).addClass("ready");
    })

    if (this.state.room && this.state.room.readyPlayers.indexOf(this.state.name) > -1) {
      $("#readyButton").remove();
    }
    
    return this.state.room ? this.state.room.players.map(player => (
        <div className="player" key={player.toString()} id={player}>{player}</div> 
    )) : <Loader />
    
    }

    handleReady = e => {
        console.log(this.state.name, 'is now ready', $("#"+this.state.name));
        $("#"+this.state.name).addClass("ready");
        if (this.state.room && this.state.name === this.state.room.host) {
          $("#hostTimer").remove()
          socket.emit("timeChange", {roomCode: this.state.roomCode, timeLimit: this.state.timeLimit})
        }
        socket.emit("playerReady", {roomCode: this.state.roomCode, name: this.state.name})
    }

    hostTimer = () => {
      if (this.state.room && this.state.name === this.state.room.host) {
          return (
            <div id="hostTimer">
            <label htmlFor="timeLimit" className="text">{this.dict('choosetime')}</label>
            <input type="time" className="time text center" onChange={this.handleTimeChange} defaultValue="07:00"/>
            </div>
            )
      }
  }

  handleTimeChange = e => {
    console.log("New time:", e.target.value)
    this.setState({timeLimit: e.target.value});

  }
    


  render() {
      if (this.state.room && this.state.room.isStarted != true) { 
          return (
        <div className="center">
        <div>
          
        <h5 style={{paddingBottom: "15px"}} className="text">{this.dict("roomCode")}{this.state.roomCode}</h5>
        <div className="container players center" id="">
            <div className="player-list center">
                {this.makePlayerList()}
            </div>
            {this.hostTimer()}
            <button style={{marginTop: "15vh"}} className="btn btn-large button" id="readyButton" onClick={() => this.handleReady()}>{this.dict("ready")}</button>
        </div>
      </div>
                
        </div>
    ) } else if (this.state.room && this.state.room.isStarted === true) {
        return(
            <div className="center">
            
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
        return <Loader /> 
    }

    
  }
}

export default withRouter(Lobby)
