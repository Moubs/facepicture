const login = require("facebook-chat-api");
const { timers } = require('jquery');
const fs = require("fs");
const { off } = require('process');
const file_appstate = 'appstate.json'
const express = require("express");
const bodyParser = require('body-parser');
var wifi = require('node-wifi');
const checkInternetConnected = require('check-internet-connected');
const app  = express();
const port = 3000
app.use(bodyParser.urlencoded({extended:true}));

const config_internet = {
  timeout: 5000, //timeout connecting to each server, each try
  retries: 5,//number of retries to do before failing
  domain: 'https://www.facebook.com',//the domain to check DNS record of
}


facebookAPI = ''
//bot function

currentUserID = ''


wifi.init({
  iface: null // network interface, choose a random wifi interface if set to null
});


//test if we are already logged
function alreadyConnected(res,_callback){
  if (!fs.existsSync(file_appstate)) return _callback(res,"erreur");
  login({appState: JSON.parse(fs.readFileSync(file_appstate, 'utf8'))}, (err, api) => {
    if(err) return _callback(res,err);
    facebookAPI = api
    currentUserID = api.getCurrentUserID();
    _callback(res,"success");
  });
}

//Facebook connexion with creds
function loginFacebook(req,res,_callback){
  console.log(req.body);
  login(req.body, (err, api) => {
    if(err) return _callback(res,err);
    facebookAPI = api
    currentUserID = api.getCurrentUserID();
    fs.writeFileSync(file_appstate, JSON.stringify(api.getAppState()));
    _callback(res,"success");
  });
}




//"routing"
//connections

app.use('/public',express.static(__dirname+'/app'));
app.use('/public/jquery',express.static(__dirname+'/node_modules/jquery'));

app.get('/isInternetAccessible',(req,res)=>{
  checkInternetConnected().then((result) =>{
    res.send("success"); // if success
  }).catch((ex) =>{
    res.send('erreur'); //if error
  });
});

app.post('/connectToWifi',(req,res)=>{
  wifi.connect(req.body, error => {
    if (error) {
      res.send('erreur')
    }
    res.send('success');
  });
});

app.post('/loginFacebook',(req,res)=>{
  loginFacebook(req,res,successOrError);
});

app.get("/alreadyConnected",(req,res)=>{
  alreadyConnected(res,successOrError);
});

app.get("/disconnect",(req,res)=>{
  facebookAPI.logout();
  fs.unlinkSync(file_appstate);
  res.send("success");
})

app.get('/listThread',(req,res)=>{
  if (facebookAPI == '') return res.send("error");
  facebookAPI.getThreadList(20,null,[],(err,list)=>{
    if(err) res.send("error");
    res.send(list);
  });
});

app.post('/getMessages',(req,res)=>{
  console.log(req.body);
  threadID=req.body.id
  if (facebookAPI == '') return res.send("error");
  facebookAPI.getThreadHistory(threadID,4000,undefined,(err,history)=>{
    if(err){
      console.log(err);
      res.send("error");
    }else{
      extractPhotoFromMessages(res,history);
    }
  });
});

/*
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
*/
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

function extractPhotoFromMessages(res,history){
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
        if(err) res.send("error");
        photos.push(url);
        console.log('push');
      });
    });
  });
  setTimeout(function(){res.send(photos)},10000);
}

//callback for sync function
function successOrError(res,message){
  res.send(message)
}



app.listen(port,()=>{
  console.log(`Example app listening at http://localhost:${port}`);
});

