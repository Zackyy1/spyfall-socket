import React, { Component } from 'react'
import { BrowserRouter as Router, Route, withRouter, Link } from 'react-router-dom'
import socketIOClient from "socket.io-client";
import Loader from '../Loader'
import $ from 'jquery'
import dict from '../../Dictionary'
const socket = socketIOClient("http://127.0.0.1:4001");

export class PreGame extends Component {
  
  state = {
    roomCode: window.location.pathname.slice(2+window.location.pathname.slice(1).search("/")),
    name: this.props.location.state.name,
    language: this.props.location.state.language,
    timeLimit: "07:00",
}
    

    componentDidMount() {

        // $(".player-item").on("click", function(event){
        //     if (event.target.classList.contains('selected')) {
        //         event.target.classList.remove("selected");

        //     } else {
        //     event.target.classList.add('selected')
        //     }
        // });

        $("#readyButton").click(function(){
            $(this).remove();
        });

        socket.emit("requestRoomInfo", this.state.roomCode);
        socket.on("room"+this.state.roomCode, room => {
                this.setState({room: room});
        })


        this.state.room && this.state.room.readyPlayerCount > 0 && this.state.room.readyPlayers.map(player => {
            if (!$("#"+player).hasClass("ready")){
            $("#"+player).addClass("ready");
            }
        })
        socket.emit("requestRoomInfo", this.state.roomCode);

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
    return (
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
    )
  }
}

export default withRouter(PreGame)
