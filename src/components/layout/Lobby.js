import React, { Component } from 'react'
import { BrowserRouter as Router, Route, withRouter, Link } from 'react-router-dom'
import socketIOClient from "socket.io-client";
import Loader from '../Loader'
import $ from 'jquery'
import PreGame from './PreGame'
import Game from './Game';
const socket = socketIOClient("http://127.0.0.1:4001");


export class Lobby extends Component {
    state = {
        roomCode: window.location.pathname.slice(2+window.location.pathname.slice(1).search("/")),
        name: this.props.location.state.name,
    }
    componentDidMount() {
        socket.emit("requestRoomInfo", this.state.roomCode);

        socket.on("room"+this.state.roomCode, room => {
            console.log("RECIEVED EMIT FOR ROOM", this.state.roomCode)
                this.setState({room: room});
        })
    }
    


  render() {
      console.log(this.state);
      if (this.state.room && this.state.room.isStarted != true) { 
          return (
        <div>
            {this.state.room.isStarted === false ?  (<PreGame />) : <Loader />}
        </div>
    ) } else if (this.state.room && this.state.room.isStarted === true) {
        return (<Game />)
    } else {
        return <Loader /> // Return game sequence
    }

    
  }
}

export default withRouter(Lobby)
