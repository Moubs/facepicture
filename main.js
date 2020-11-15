const { app, BrowserWindow, ipcMain, ipcRenderer } = require('electron');
const login = require("facebook-chat-api");
const { timers } = require('jquery');
const fs = require("fs");
const { off } = require('process');
const file_appstate = 'appstate.json'

facebookAPI = ''
//bot function

currentUserID = ''

//test if we are already logged
function alreadyConnected(event,_callback){
  if (!fs.existsSync(file_appstate)) return _callback(event,"erreur");
  login({appState: JSON.parse(fs.readFileSync(file_appstate, 'utf8'))}, (err, api) => {
    if(err) return _callback(event,err);
    facebookAPI = api
    currentUserID = api.getCurrentUserID();
    _callback(event,"success");
  });
}

//Facebook connexion with creds
function loginFacebook(creds,event,_callback){
  login(creds, (err, api) => {
    if(err) return _callback(event,err);
    facebookAPI = api
    currentUserID = api.getCurrentUserID();
    fs.writeFileSync(file_appstate, JSON.stringify(api.getAppState()));
    _callback(event,"success");
  });
}






//"routing"
//connections
ipcMain.on("loginFacebook",function(event,data){
  console.log(data);
  loginFacebook(data,event,successOrError);
});

ipcMain.on("alreadyConnected",function(event,data){
  alreadyConnected(event,successOrError);
})

//thread listing
ipcMain.on("listThread", function(event,data){
  if (facebookAPI == '') return event.sender.send("getThreads","error");
  facebookAPI.getThreadList(20,null,[],(err,list)=>{
    if(err) event.sender.send('getThreads',"error");
    event.sender.send("getThreads",list);
  });
});

ipcMain.on("getPicturesFromThread",function(event,threadID){
  if (facebookAPI == '') return event.sender.send("getPictures","error");
  //have to store picture 20 by twenty
  offset = 0;
  pictures = [];
  concatPicture(event,threadID,offset,pictures);
});

ipcMain.on("getMessages",(event,threadID) =>{
  if (facebookAPI == '') return event.sender.send("getMessages","error");
  facebookAPI.getThreadHistory(threadID,4000,undefined,(err,history)=>{
    if(err){
      console.log(err);
      event.sender.send('getMessages',"error");
    }else{
      extractPhotoFromMessages(event,history);
    }
  });
});

function concatPicture(event,threadID,offset,pictures){
  if (offset == 100){
    console.log(pictures);
    event.sender.send("getPictures",pictures);
  }else{
    facebookAPI.getThreadPictures(threadID,offset,20,(err,list)=>{
      if(err){
        console.log(err);
        event.sender.send('getPictures',"error");
      }else{
        pictures = pictures.concat(list);
        concatPicture(event,threadID,offset+20,pictures);
      }
    });
  }
}

function extractPhotoFromMessages(event,history){
  pictures = []
  for (i in history){
    //message with attachments
    if (history[i].hasOwnProperty('attachments')){
      if (history[i].attachments.length > 0 ){
        //that are photos
        if (history[i].attachments[0].type=="photo"){
          //that i liked
          if(history[i].messageReactions.length > 0){
            for(j in history[i].messageReactions){
              if((history[i].messageReactions[j].userID == currentUserID) && (history[i].messageReactions[j].reaction== "❤") ){
                pictures.push(history[i]);
                break;
              }
            }
          }
        }
      }
    }
  }
  photos= []
  pictures.forEach(message => {
    message.attachments.forEach( picture =>{
      facebookAPI.resolvePhotoUrl(picture.ID,(err,url)=>{
        if(err) event.sender.send('getMessages',"error");
        photos.push(url);
        console.log('push');
      });
    });
  });
  setTimeout(function(){event.sender.send('getMessages',photos)},10000);
}

//callback for sync function
function successOrError(event,message){
  event.returnValue = message
}

function createWindow () {
  // Cree la fenetre du navigateur.
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })
  //win.setFullScreen(true)
  //win.removeMenu()
  // et charger le fichier index.html de l'application.
  win.loadFile('app/login.html')
}



app.whenReady().then(createWindow)

