const express = require("express"); //../../node_modules/
const app = express();
const server = require("http").Server(app);
const io = module.exports.io = require('socket.io/lib')(server) //../../node_modules/
const path = require("path")

const port = process.env.PORT || 4001; // 80? 443?
console.log("LISTENING ON PORT", process.env.PORT);
const socketManager = require('./SocketManager')

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', "Origin, X-Requested-With, Content-Type, Accept");
    next();
}
app.use(allowCrossDomain);

app.use(express.static(path.join(__dirname, '../../build')));
if(process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../../build')));
    console.log("DEBUG HERE", __dirname, path.join(__dirname+'../../build'));
    //
    app.get('/*', (req, res) => {
      res.sendFile(path.join(__dirname+'../../build/index.html'));
    })
  }
  //build mode
  app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname+'../../public/index.html'));
  })

  
io.on('connection', socketManager);
// app.use(express.static(__dirname + '/../../public/index.html'))

server.listen(port,() => {
    console.log("Listening on port", port)
})