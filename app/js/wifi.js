//const {ipcRenderer} = require('electron');

function alreadyConnected(){
  response = $.get('/isInternetAccessible',function(response){
    console.log(response);
    if (response == "success"){
      window.location.replace("/public/login.html");
    }
  });
}

function validate(event) {
  event.preventDefault();
  let ssid = $('#ssid')[0].value;
  let password = $('#password')[0].value;
  $.post('/connectToWifi',data={"ssid":ssid,"password":password},function(response){
    if (response == "success"){
      window.location.replace("/public/login.html")
    }
  })
}

alreadyConnected();