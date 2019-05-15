// let server = 'https://hidden-waters-73936.herokuapp.com/socket.io/?EIO=4&transport=websocket'; // 404
let server = window.location.hostname; // 404, same as above
// let server = 'http://localhost:7810'; // works locally on heroku
// let server = '/'; // 404, not found, AND CONNECTION_REFUSED

// let server = 'https://127.0.0.1:4001';

// let server = 'http://0.0.0.0:4001';


const env = process.env.NODE_ENV;

if (env === 'development') {
    server = 'http://localhost:4001';
    console.log("Using dev port")
}
console.log("CURRENT SeRVER", server);
module.exports = server;