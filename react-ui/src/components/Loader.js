import React, { Component } from 'react'

class Loader extends Component {
  render() {
    return (
      <div className="center" style={{paddingTop: "45vh"}}>
        
  <div className="preloader-wrapper big active center" >
    <div className="spinner-layer spinner-blue-only">
      <div className="circle-clipper left">
        <div className="circle"></div>
      </div><div className="gap-patch">
        <div className="circle"></div>
      </div><div className="circle-clipper right">
        <div className="circle"></div>
      </div>
    </div>
  </div>
      </div>
    )
  }
}

export default Loader
