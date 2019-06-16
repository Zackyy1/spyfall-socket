import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
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

    tryParseJSON (jsonString){
        try {
            var o = JSON.parse(jsonString);
            return o
        }
        catch (e) { console.log(e) }
    
        return "";
    };

    constructor(props) {
        
        

        super(props);
        this.state = {
            timeLimit: "07:00",
            localTimer: null, //tryParseJSON(localStorage.getItem('localTimer')),
            roomCode: window.location.pathname.slice(2+window.location.pathname.slice(1).search("/")),
            name: this.props.location.state.name,
            language: this.props.location.state.language,
            roleHidden: false,
            timeLabel: 7,
        }
      }
    
    
    componentDidMount() {

        this.state.room && this.state.room.readyPlayerCount > 0 && this.state.room.readyPlayers.map(player => {
            return $("#"+player).addClass("ready");
        });

        socket.emit("requestRoomInfo", this.state.roomCode);
        // 
        socket.on("room"+this.state.roomCode, room => {
                this.setState({room: room, timeLimit: room.timeLimit, localTimer: room.timeLimit});
                localStorage.setItem('localTimer', JSON.stringify(room.timeLimit));
        })

        console.log(localStorage.getItem("localTimer"))

        // if (this.state.room) {
        //     this.setState({localTimer: this.state.room.timeLimit})
        //     console.log("Changed time correctly")
        // }

        


    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.room) {
            for (let i = 0; i < this.state.room.readyPlayers.length; i++) {
                if (this.state.name === this.state.room.readyPlayers[i]) {
                    $("#hostTimer").remove();
                    $("#readyButton").remove();
                }

            }
            this.state.room.readyPlayerCount > 0 && this.state.room.isStarted === false && this.state.room.readyPlayers.map(player => {
                return $("#"+player).addClass("ready");
            })
        }

        if ($("#"+this.state.name)) {
            console.log("Found my player label")
            document.getElementById(this.state.name).style.textDecoration = "underline"
        }

    }

    clickAction = (e) => {
        // console.log(e)
        if (!e.target.classList.contains("selected")) {
                e.target.classList.add("selected")
        } else {
            e.target.classList.remove("selected")

        }
    }

    
    classAction(id, classname) {
        if (!document.getElementById(id).classList.contains(classname)) {
            document.getElementById(id).classList.add(classname)
            document.getElementById("roleButton").innerHTML = this.dict("showRole");
            // console.log("added class", classname, " to", id)

        } else {
            document.getElementById(id).classList.remove(classname)
            // console.log("removed class", classname, " from", id)
            document.getElementById("roleButton").innerHTML = this.dict("hideRole");


        }
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
        // console.log("Game finished");
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
        if (this.state.language === "Russian") {
            toShow = LocationsRus.locationsRus;
        } else {
            toShow = Locations.locations;
        }

        return ( toShow.map(loc => {
            return(
           <div className="location" onClick={(e) => this.clickAction(e)} key={loc.title}>{loc.title}</div>
           )}))
            
        }

        showOneLocation(index, roleIndex) {
            if (this.state.language === "Russian") {
            
            return ( {location: LocationsRus.locationsRus[index].title, role: LocationsRus.locationsRus[index].roles[roleIndex]} )
                } else if (this.state.language === "English") {
        
                    return ( {location: Locations.locations[index].title, role: Locations.locations[index].roles[roleIndex]} )
            }
        }

    

    checkMyRole = () => {


  
            if (this.state.room) {
                for (let i = 0; i < this.state.room.players.length; i++) {
                    $("#"+this.state.room.players[i]).removeClass("ready");
                }
                let notSpies = Object.keys(this.state.room.notSpies);
                
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
        var duration = this.hmsToSecondsOnly(time);
        let timer = duration, minutes, seconds;
        if (!ongoingtimer) {

          ongoingtimer = setInterval(() => {
            
           
           
            minutes = parseInt(timer / 60, 10)
            seconds = parseInt(timer % 60, 10);
    
            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;
            this.changeTime(`${minutes}:${seconds}`);

            // console.log(this.state.localTimer, this.state.timeLimit, localStorage.getItem("localTimer"))
            
            if (--timer < 0 || timer < 0  || this.state.room.isStarted === false) {
              timer = duration;
              clearInterval(ongoingtimer); 
              ongoingtimer = null;
            //   console.log("GAME FINISHED")
              if (document.getElementById("timer") !== null) {
                document.getElementById("timer").innerHTML = this.dict("timesUp");
              }
            }
      
        }, 1000);
    } else {
        // console.log("What happens here?")
    }
}
    
    }    

    timer () {
        // Timer code goes here
        if (this.state.room && this.state.room.isStarted) {

        if (this.state.localTimer === null) {
            this.setState({localTimer: this.state.room.timeLimit})
            console.log("Localtimer null, making it the same as timeLimit, which is",this.state.room.timeLimit )
         }


            let toCount = JSON.parse(localStorage.getItem('localTimer'));

            if (toCount === "NaN:NaN") { toCount = this.state.room.timeLimit }
            // this.setState({timeLimit: toCount})
            console.log("Passing time to timer:", toCount)
            console.log("Localtimer:",this.state.localTimer)
            console.log("timeLimit:", this.state.timeLimit)
            this.startTimer(toCount) // toCount || this.state.localTimer
            return (
                <p className="text" id="timer">{this.dict("timeRemaining")}: {this.state.localTimer}</p>
            )
        }
        
    }

    makePlayerList = () => {
    this.state.room && this.state.room.isStarted === false && this.state.room.readyPlayerCount > 0 && this.state.room.readyPlayers.map(player => {
        return $("#"+player).addClass("ready");
    })
    return this.state.room ? this.state.room.players.map(player => (
        <div className="player" onClick={(e) => this.clickAction(e)} key={player.toString()} id={player}>{player}</div> 
    )) : <Loader />
    
    }

    showFirstQuestion() {
        if (this.state.room ){
            $("#"+this.state.room.firstQuestion).html(this.state.room.firstQuestion+"<sup>1st</sup>");
        }
    }

    handleReady = e => {
        $("#"+this.state.name).addClass("ready");
        if (this.state.room && this.state.name === this.state.room.host) {
          $("#hostTimer").remove()
          socket.emit("timeChange", {roomCode: this.state.roomCode, timeLimit: this.state.timeLimit})
        }
        if (this.state.room && this.state.room.isStarted === false) {
            // this.changeTime(this.state.room.timeLimit)
        }
        socket.emit("playerReady", {roomCode: this.state.roomCode, name: this.state.name})

    }

    setNewTimeLimit = e => {
        console.log("New time limit:", e.target.innerHTML)
        this.setState({timeLabel: e.target.innerHTML})
        this.handleTimeChange(e.target.innerHTML+":00")
    }

    hostTimer = () => {
      if (this.state.room && this.state.name === this.state.room.host) {
          // clear storage
          let newvalues =  $("#timerInput").val() || this.state.timeLimit;
        //   console.log(newvalues)

          socket.emit("timeChange", {roomCode: this.state.roomCode, timeLimit: newvalues})

          return (
            <div id="hostTimer">
            
            {/* <input type="time" className="time text center" id="timerInput" onChange={this.handleTimeChange} defaultValue="07:00"/> */}
            <p style={{color: "white"}}>{this.dict('choosetime')}</p>
            <div className="btn-group btn-group-toggle z-depth-0 btn-group-lg" id="timeSetter" data-toggle="buttons">
            
                <button className="btn z-depth-0 time-button" onClick={(e) => this.setNewTimeLimit(e)} checked>5</button>
                <button className="btn z-depth-0 time-button" onClick={(e) => this.setNewTimeLimit(e)} >7</button>
                <button className="btn z-depth-0 time-button" onClick={(e) => this.setNewTimeLimit(e)} >10</button>
                <button className="btn z-depth-0 time-button" onClick={(e) => this.setNewTimeLimit(e)} >15</button>

            </div>
            <div className="divider"></div>
                <h5 style={{color: "white", marginTop:"30px"}}>{this.state.timeLabel} {this.dict("minutes")}</h5>
            </div>
            )
      }
  }

  handleTimeChange = e => {
    console.log("New time:", e)
    // this.setState({timeLimit: e.target.value, localTimer: e.target.value});
    this.setState({timeLimit: e, localTimer: e})
    this.changeTime(e);

  }

  setLang = e => {
    if (e.target.id === 'ru') {
      this.setState({language: "Russian"})
      localStorage.setItem('lang', "Russian");


    } else if (e.target.id === 'en') {
      this.setState({language: "English"})
      localStorage.setItem('lang', "English");

    }
  }
    


  render() {

      if (this.state.room && this.state.room.isStarted !== true) { 

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
           
           
            <div className="dropdown" style={{marginTop: "50px"}}>
        <button className="btn button dropdown-toggle big-text" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            {this.dict("language")}
        </button>
        <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
            <p className="dropdown-item big-text" id="ru" onClick={(e) => this.setLang(e)}>{this.dict("russian")}</p>
            <p className="dropdown-item big-text" id="en" onClick={(e) => this.setLang(e)}>{this.dict("english")}</p>
        </div>
    </div>

        </div>
      </div>
                
        </div>
    ) } else if (this.state.room && this.state.room.isStarted === true) {
        return(
            <div className="center">
                <div className="role" id="role">
                    {this.checkMyRole()}
                </div>
                <div className="role-button-div">
                    <button className="btn z-depth-0 role-button" id="roleButton" onClick={(e) => this.classAction("role", "hidden-role")}>{this.dict("hideRole")}</button>
                </div>
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
                  <div className="divider container"></div>

                  <div className="dropdown" style={{margin: "50px"}}>
        <button className="btn button dropdown-toggle big-text" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            {this.dict("language")}
        </button>
        <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
            <p className="dropdown-item big-text" id="ru" onClick={(e) => this.setLang(e)}>{this.dict("russian")}</p>
            <p className="dropdown-item big-text" id="en" onClick={(e) => this.setLang(e)}>{this.dict("english")}</p>
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
