//const {ipcRenderer} = require('electron');

function alreadyConnected(){
  response = $.get('/alreadyConnected',function(response){
    console.log(response);
    if (response == "success"){
      window.location.replace("/public/listThread.html");
    }
  });
}

function validate(event) {
  event.preventDefault();
  let email = $('#email')[0].value;
  let password = $('#password')[0].value;
  $.post('/loginFacebook',data={"email":email,"password":password},function(response){
    if (response == "success"){
      window.location.replace("/public/listThread.html");
    }else{
      console.log(response);
      alert(response.error);
    }
  })
}

alreadyConnected();