const firebaseConfig = {
  apiKey: "AIzaSyDs2EhHfOUT7a2E4aumlJSUWo3M5IxbV5o",
  authDomain: "crud-fatec-0905.firebaseapp.com",
  databaseURL: "https://crud-fatec-0905-default-rtdb.firebaseio.com",
  projectId: "crud-fatec-0905",
  storageBucket: "crud-fatec-0905.appspot.com",
  messagingSenderId: "1080973940501",
  appId: "1:1080973940501:web:d449cad76a109eead23b1c"
};
  //inicializando o Firebase
  firebase.initializeApp(firebaseConfig)
  //efetuando a ligação com o database
  const database = firebase.database()