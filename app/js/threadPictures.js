
//const {ipcRenderer} = require('electron');
if (localStorage.settings == undefined){
    settings={
        "number_of_message":5000,
        "reactions":["e29da4"]
    }
    localStorage.setItem("settings",JSON.stringify(settings))
}

$.post("/setSettings",JSON.parse(localStorage.settings));

var id = window.location.href.substring(window.location.href.search(/=[0-9]/g)).substring(1);
localStorage.setItem("id",id);
pictures = [];
index = 0;

isStop=false;

var next_picture = "";

appearprocess = false;

function clickOnPlay(){
    isStop = !isStop;
    if (isStop == false){
        $(".fa-play").toggleClass("fa-pause");
        $(".fa-play").toggleClass("fa-play");
        changeBackground();
    }else{
        $(".fa-pause").toggleClass("fa-play");
        $(".fa-pause").toggleClass("fa-pause");
        if(next_picture != ""){
            clearTimeout(next_picture)
            next_picture = ""
        }
    }
}

function previous(){
    index = (index-1) % pictures.length;
    if (index < 0 ) index=index + pictures.length;
    $('#picture')[0].src=pictures[index];
    setTimeout(()=>{
        if ($('#picture')[0].clientWidth > $('#picture')[0].clientHeight){
            $('#picture')[0].style="width:100%";
            if ( $('#picture')[0].clientHeight  > window.innerHeight){
                $('#picture')[0].style="height:100%"; 
            }
        }else {
            $('#picture')[0].style="height:100%";
            if ( $('#picture')[0].clientWidth  > window.innerWidth){
                $('#picture')[0].style="width:100%"; 
            }
        } 
    },20);
}

function next(){
    index = (index + 1) % pictures.length;
    $('#picture')[0].src=pictures[index];
    setTimeout(()=>{
        if ($('#picture')[0].clientWidth > $('#picture')[0].clientHeight){
            $('#picture')[0].style="width:100%";
            if ( $('#picture')[0].clientHeight  > window.innerHeight){
                $('#picture')[0].style="height:100%"; 
            }
        }else {
            $('#picture')[0].style="height:100%";
            if ( $('#picture')[0].clientWidth  > window.innerWidth){
                $('#picture')[0].style="width:100%"; 
            }
        } 
    },1500);
}

function makeButtonAppear(){
    if (!appearprocess){
        appearprocess=true;
        appearing();
        setTimeout(disappearing,10000);
    }
}

function appearing(){
    for(i = 0; i< $('.buttonMenu').length;  i+=1){
        $('.buttonMenu')[i].style= "animation:hiding; animation-duration: 4s; animation-direction:reverse;";
    }
    $('.buttonMenu').toggleClass("shown");
    $('.buttonMenu').toggleClass("hide");
}

function disappearing(){
    for(i = 0; i< $('.buttonMenu').length;  i+=1){
        $('.buttonMenu')[i].style= "animation:hiding; animation-duration: 4s;";
    }
    $('.buttonMenu').toggleClass("hide");
    $('.buttonMenu').toggleClass("shown");
    appearprocess=false;
}

function changeBackground(){
    if (!isStop){
        next();
        next_picture= setTimeout(changeBackground,600000);
    }
}

function getNewPicture(){
    clickOnPlay();
    $.post('/getMessages',data={"id":id},function(list){
        pictures = []
        if (list==="error"){
            window.location="/public/wifi.html";
        }else{
            console.log(list);
            pictures= list;
            clickOnPlay();
            disappearing();
            setTimeout(getNewPicture,3600000);
        }
    });
}
/*
function getNewPicture(){
    clickOnPlay();
    ipcRenderer.send("getMessages",id);
}

ipcRenderer.on("getMessages",function(event,list){
    pictures = []
    if (list==="error"){
        return console.log("error");
    }else{
        console.log(list);
        pictures= list;
        clickOnPlay();
        disappearing();
        setTimeout(getNewPicture,3600000);
    }
    
});*/
getNewPicture();