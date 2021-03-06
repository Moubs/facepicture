const login = require("facebook-chat-api");
const { timers, data } = require('jquery');
const fs = require("fs");
const { off } = require('process');
const file_appstate = 'appstate.json'
const express = require("express");
const bodyParser = require('body-parser');
var wpa_supplicant = require('wireless-tools/wpa_supplicant');
const checkInternetConnected = require('check-internet-connected');
const { exec } = require("child_process");
const app  = express();
const port = 3000
app.use(bodyParser.urlencoded({extended:true}));

const config_internet = {
  timeout: 5000, //timeout connecting to each server, each try
  retries: 10,//number of retries to do before failing
  domain: 'https://www.facebook.com'//the domain to check DNS record of
}


facebookAPI = ''
//bot function

currentUserID = ''

settings = undefined;

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
  checkInternetConnected(config_internet).then((result) =>{
    res.send("success"); // if success
  }).catch((ex) =>{
    res.send('erreur'); //if error
  });
});

app.post('/connectToWifi',(req,res)=>{
  creds = req.body
  //sanitize entry
  if(creds.ssid.indexOf("'")!=-1){
    creds.ssid = creds.ssid.replace("'","\\'")
  }
  if(creds.ssid.indexOf(' ')!=-1){
    creds.ssid = "'"+creds.ssid+"'"
  }
  if(creds.password.indexOf("'")!=-1){
    creds.password = creds.password.replace("'","\\'")
  }
  if(creds.password.indexOf(' ')!=-1){
    creds.password = "'"+creds.password+"'"
  }
  //launch wpa_supplicant this is horrible but nothing more work
  exec("wpa_passphrase "+creds.ssid+" "+creds.password+" >> /etc/wpa_supplicant/wpa_supplicant.conf",(error,stdout,stderr)=>{
    if (error){
      console.log(error);
      res.send("error");
    }else{
      exec("systemctl restart wpa_supplicant",(error,stdout,stderr)=>{
        if (error){
          console.log(error);
          res.send("error");
        }else{
          setTimeout(()=>{
            checkInternetConnected().then((result) =>{
              res.send("success"); // if success
            }).catch((ex) =>{
              res.send('erreur'); //if error
            });
          },5000);
        }
      });
    }
    
  });
});

app.post('/loginFacebook',(req,res)=>{
  loginFacebook(req,res,successOrError);
});

app.get("/alreadyConnected",(req,res)=>{
  alreadyConnected(res,successOrError);
});

app.post("/setSettings",(req,res)=>{
  settings=req.body
  console.log(settings)
  res.send('done');
});

app.get("/disconnect",(req,res)=>{
  facebookAPI.logout();
  fs.unlinkSync(file_appstate);
  res.redirect("/public/login.html")
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
  facebookAPI.getThreadHistory(threadID,settings.number_of_message,undefined,(err,history)=>{
    if(err){
      console.log(err);
      res.send("error");
    }else{
      extractPhotoFromMessages(res,history);
    }
  });
});



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
              if( (settings.reactions == undefined) || ( (history[i].messageReactions[j].userID == currentUserID) && (settings.reactions.indexOf(Buffer.from(history[i].messageReactions[j].reaction).toString('hex')) != -1 )) ){
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

