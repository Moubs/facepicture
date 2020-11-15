const {ipcRenderer} = require('electron');

function alreadyConnected(){
  response = ipcRenderer.sendSync('alreadyConnected',"test");
  console.log(response);
  if (response == "success"){
    window.location.replace("listThread.html");
  }
}

function validate(event) {
  event.preventDefault();
  let email = $('#email')[0].value;
  let password = $('#password')[0].value;
  response = ipcRenderer.sendSync('loginFacebook',{"email":email,"password":password});
  if (response == "success"){
    window.location.replace("listThread.html")
  }
  return false;
}

alreadyConnected();