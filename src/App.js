import React, { Component } from "react";
import './App.css'
import StartScreen from "./components/layout/StartScreen";
import { BrowserRouter as Router, Route, Link } from 'react-router-dom'
import PreGame from './components/layout/PreGame'
import Navbar from "./components/layout/Navbar";
import Lobby from "./components/layout/Lobby";
class App extends Component {

  render() {
    return (
        <div className="center">
        <Navbar />
        <Router>
          <Route path="/room/:roomCode" component={Lobby} />
          <Route exact path="/" component={StartScreen} />
          </Router>
        </div>
    );
  }
}

export default App;