const express = require("express"); //../../node_modules/
const app = express();
const server = require("http").Server(app);
const io = module.exports.io = require('socket.io/lib')(server) //../../node_modules/
const path = require("path")

const port = process.env.PORT || 4001; // 80? 443?
console.log("LISTENING ON PORT", process.env.PORT);
const socketManager = require('./SocketManager')

const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

const isDev = process.env.NODE_ENV !== 'production';



var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', "Origin, X-Requested-With, Content-Type, Accept");
    next();
}




// Multi-process to utilize all CPU cores.
if (!isDev && cluster.isMaster) {
  console.error(`Node cluster master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.error(`Node cluster worker ${worker.process.pid} exited: code ${code}, signal ${signal}`);
  });

} else {
  const app = express();

  // Priority serve any static files.
  app.use(express.static(path.resolve(__dirname, '../react-ui/build')));
  app.use(allowCrossDomain);

  app.get('*', function(request, response) {
    response.sendFile(path.resolve(__dirname, '../react-ui/build', 'index.html'));
  });

  
  io.on('connection', socketManager);
// app.use(express.static(__dirname + '/../../public/index.html'))

server.listen(port,() => {
    console.log("Listening on port", port)
})


// app.use(express.static(path.join(__dirname, '../react-ui/build')));
// if(process.env.NODE_ENV === 'production') {
//     app.use(express.static(path.join(__dirname, '../react-ui/build')));
//     //
//     app.get('/*', (req, res) => {
//       res.sendFile(path.join(__dirname+'../react-ui/build/index.html'));
//     })
//   }
//   //build mode
//   app.get('/*', (req, res) => {
//     res.sendFile(path.join(__dirname+'../react-ui/public/index.html'));
//   })



}
