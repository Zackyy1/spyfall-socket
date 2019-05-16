import React, { Component } from 'react'
import { BrowserRouter as Router, withRouter, Route, Redirect, Link } from 'react-router-dom'
import socketIOClient from "socket.io-client";
import dict from '../../Dictionary'
import Navbar from "./Navbar";

import server from '../../config/serverConfig'
const socket = socketIOClient(server);





export class StartScreen extends Component {
  state = {
    name: "",
    response: false,
    language: "English",
  }

  componentDidMount() {
  
  }
  

  handleChange = e => {
    this.setState({
      [e.target.id]: e.target.value
    });
  }

  handleSubmit = e => {
    e.preventDefault();
    console.log("Submitted")
  }

  getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

  handleCreateGame = () => {
    // Create game here
    const newRoomCode = this.getRandomInt(1000, 9999).toString();
    this.setState({roomCode: newRoomCode});
    socket.emit("gameCreate", {name: this.state.name, roomCode: newRoomCode});
    this.props.history.push({
      pathname: "/room/"+newRoomCode,
      state: this.state,
 });
      
  }

  handleJoinGame = () => {
    // Join game here
    socket.emit("joinGame", {name: this.state.name, roomCode: this.state.roomCode})
    this.props.history.push({
      pathname: "/room/"+this.state.roomCode,
      state: this.state,
 });
  }

  langRus = e => {
    this.setState({language: "Russian"})
    console.log("CHANGED TO RUSSIAN");
  }
  langEng = e => {
    this.setState({language: "English"})
    console.log("CHANGED TO ENGLISH");

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
  

  render() {
    return (
      <div className="center repeating">
        <div className="container" style={{paddingTop: "25px"}}>
        <form onSubmit={this.handleSubmit}>
          <div>
            <label htmlFor="name" className="text big-text">{this.dict("enterName")}</label>
            <input type="text" id="name" className="center text" onChange={this.handleChange}/>
          </div>
         
          

          <div style={{paddingTop: "15px"}}>
            <button className="btn button big-text" onClick={() => this.handleCreateGame()}>{this.dict("createGame")}</button>
          </div>
          <div style={{paddingTop: "25px"}}>
            <h5 className="text">{this.dict("or")}</h5>
            <label className="text big-text" htmlFor="roomCode">{this.dict("enterCode")}</label>
            <input type="text" id="roomCode" onChange={this.handleChange} className="center text big-text"/>
            <button className="btn button big-text" onClick={() => this.handleJoinGame()}>{this.dict("joinGame")}</button>

          </div>
        </form>
        </div>
        <div className="dropdown" style={{marginTop: "50px"}}>
  <button className="btn button dropdown-toggle big-text" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
  {this.dict("language")}
  </button>
  <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
    <a className="dropdown-item big-text" onClick={() => this.langRus()}>{this.dict("russian")}</a>
    <a className="dropdown-item big-text" onClick={() => this.langEng()}>{this.dict("english")}</a>
  </div>
</div>
      </div>
    )
  }
}

export default withRouter(StartScreen)
