import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/auth'

const config = {
    apiKey: "AIzaSyDIRnGTgaKjEP8yUCYWpOOLHwxMGZiSlhQ",
    authDomain: "spyfall-socket.firebaseapp.com",
    databaseURL: "https://spyfall-socket.firebaseio.com",
    projectId: "spyfall-socket",
    storageBucket: "spyfall-socket.appspot.com",
    messagingSenderId: "953236483938",
    appId: "1:953236483938:web:1cba61673213ae7d"
  };

  firebase.initializeApp(config);
  firebase.firestore();
  // firebase.database();

  export default firebase;