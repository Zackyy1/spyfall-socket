import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import socketIOClient from "socket.io-client";
import dict from '../../Dictionary'

import server from '../../config/serverConfig'
const socket = socketIOClient(server);





export class StartScreen extends Component {
  state = {
    name: "",
    response: false,
    language: "English",
    roomFound: true,
    roomCode: "",
    wrongCode: false,
    wrongName: false,
  }

  componentDidMount() {
    socket.on("roomFound", () => {
      this.props.history.push({
        pathname: "/room/"+this.state.roomCode,
        state: this.state,
   });
    });
    socket.on("room404", () => {
      console.log("Room not found")
      this.setState({roomFound: false})
      this.notifyRoom404();
    })
  }
  

  handleChange = e => {
    this.setState({
      [e.target.id]: e.target.value
    });
  }

  handleSubmit = e => {
    e.preventDefault();
    // console.log("Submitted")
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
    if (this.state.name.length < 2) {
      this.setState({wrongName: true})
      this.notifyWrongName();
      // alert("Hello!")
    } else {

    
      if (this.state.roomCode !== "" && this.state.roomCode !== null  && this.state.roomCode.length === 4) {
      socket.emit("joinGame", {name: this.state.name, roomCode: this.state.roomCode})
      } else {
        this.setState({wrongCode: true})
        this.notifyWrongCode();
      }
    // Check if game exists and not currently going on
    }
  }

  notifyRoom404() {
    
    setTimeout(() => {
      // document.getElementById("tempLabel").remove()
      this.setState({roomFound: true})

    }, 3000);
    
  }
  notifyWrongCode() {
    
    setTimeout(() => {
      // document.getElementById("tempLabel").remove()
      this.setState({wrongCode: false})

    }, 3000);
    
  }
  notifyWrongName() {
    
    setTimeout(() => {
      // document.getElementById("tempLabel").remove()
      this.setState({wrongName: false})

    }, 3000);
    
  }

  langRus = e => {
    this.setState({language: "Russian"})
    // console.log("CHANGED TO RUSSIAN");
  }
  langEng = e => {
    this.setState({language: "English"})
    // console.log("CHANGED TO ENGLISH");
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
            <input type="number" id="roomCode" onChange={this.handleChange} className="center text big-text"/>
            <button className="btn button big-text" onClick={() => this.handleJoinGame()}>{this.dict("joinGame")}</button>
            { this.state.roomFound === false && 
            <div id="tempLabel">
               <p style={{color: "white", fontSize: "1.3em", paddingTop: "15px"}}>{this.dict("room404")}</p>
            </div> }
            { this.state.wrongCode === true && 
            <div id="tempLabel2">
               <p style={{color: "white", fontSize: "1.3em", paddingTop: "15px"}}>{this.dict("wrongCode")}</p>
            </div> }
            { this.state.wrongName === true && 
            <div id="tempLabel3">
               <p style={{color: "white", fontSize: "1.3em", paddingTop: "15px"}}>{this.dict("wrongName")}</p>
            </div> }
          </div>
        </form>
        </div>
        <div className="dropdown" style={{marginTop: "50px"}}>
  <button className="btn button dropdown-toggle big-text" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
  {this.dict("language")}
  </button>
  <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
    <p className="dropdown-item big-text" onClick={() => this.langRus()}>{this.dict("russian")}</p>
    <p className="dropdown-item big-text" onClick={() => this.langEng()}>{this.dict("english")}</p>
  </div>
</div>
      </div>
    )
  }
}

export default withRouter(StartScreen)
