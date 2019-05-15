import React, { Component } from "react";
import './App.css'
import StartScreen from "./components/layout/StartScreen";
import { BrowserRouter as Router, Route, Link, Switch } from 'react-router-dom'
import Navbar from "./components/layout/Navbar";
import Lobby from "./components/layout/Lobby";
class App extends Component {
 
  render() {
    return (
        
        
          <Router>
          <Navbar />
          <Switch >
              <Route path="/room/:roomCode" component={Lobby} />
              <Route exact path="/" component={StartScreen} />
            </Switch>
          </Router>
        
        
    );
  }
}

export default App;