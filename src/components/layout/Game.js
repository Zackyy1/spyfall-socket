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
        $(".location-list.location").on("click", function(event){
            if (event.target.classList.contains('selected')) {
                event.target.classList.remove("selected");

            } else {
            event.target.classList.add('selected')
            }
        });
        socket.emit("requestRoomInfo", this.state.roomCode);

        socket.on("room"+this.state.roomCode, room => {
            console.log("RECIEVED EMIT FOR ROOM", this.state.roomCode)
                this.setState({room: room});
        })
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

        showOneLocation(index) {
            let toreturn = "";
            if (this.state.language == "Russian") {
                toreturn = LocationsRus.locationsRus[index].roles[LocationsRus.locationsRus[index].roles.length * Math.random() | 0];
                console.log("Location:", LocationsRus.locationsRus[index].title, "Role:",toreturn)
            return ( {location: LocationsRus.locationsRus[index].title, role: toreturn} )
                } else if (this.state.language == "English") {
                    toreturn = Locations.locations[index].roles[Locations.locations[index].roles.length * Math.random() | 0];
                    console.log("Location:", Locations.locations[index].title, "Role:",toreturn)
                    return ( {location: Locations.locations[index].title, role: toreturn} )
            }
        }

    makePlayerList = () => {
        this.state.room && this.state.room.readyPlayerCount > 0 && this.state.room.readyPlayers.map(player => {
            $("#"+player).addClass("ingame");
        })
        return this.state.room ? this.state.room.players.map(player => (
            <li className="player-item" key={player.toString()} id={player}>{player}</li> 
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

    

    checkMyRole = () => {
        if (this.state.room && this.state.room.notSpies.indexOf(this.state.name) > -1) {
            console.log("This player is not a spy, giving him a random role");
            let index = this.state.room.locationIndex;
            let loc = this.showOneLocation(index)
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


  render() {
    return (
      <div>
          {this.checkMyRole()}
        <div className="container players center" id="">
            <ul className="player-list center">
                {this.makePlayerList()}
            </ul>
        </div>
        <div className="divider"></div>
        <div className="container">
            <div className="location-list">
                {this.showLocations()}
            </div>
        </div>

      </div>
    )
  }
}

export default withRouter(Game)
