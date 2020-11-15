const {ipcRenderer} = require('electron');

if (localStorage.id != undefined){
    location.href = "threadPictures.html?id="+localStorage.id;
}

ipcRenderer.on("getThreads",function(event,list){
    if (list=="error") return console.log("error");
    console.log(list);
    list.forEach(thread => {
        if(thread.name !=null){
            $("#threads")[0].innerHTML += "<li ><a href='threadPictures.html?id="+thread.threadID+"'>"+thread.name+"</a></li>";
        }else {
            var name ='';
            thread.participants.forEach(participant => {
                name += participant.name +", "
            });
            $("#threads")[0].innerHTML += "<li><a href='threadPictures.html?id="+thread.threadID+"'>"+name+"</a></li>";
        }
    });
});
ipcRenderer.send('listThread',"giveMe");

