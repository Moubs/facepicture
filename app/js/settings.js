settings = JSON.parse(localStorage.settings);
nb_message = $('#number_message')[0];
nb_message_output = $("#number_message_print")[0];
coeur = $('#coeur')[0];
laugth = $('#laugth')[0];
surprise = $('#surprise')[0];
sad = $('#sad')[0];
anger = $('#anger')[0];
thumbs = $('#thumbs')[0];

nb_message.value = settings.number_of_message;
nb_message_output.innerHTML = settings.number_of_message;
settings.reactions.forEach(reaction => {
  if (reaction == coeur.value) coeur.click()
  if (reaction == laugth.value) laugth.click()
  if (reaction == surprise.value) surprise.click()
  if (reaction == sad.value) sad.click()
  if (reaction == anger.value) anger.click()
  if (reaction == thumbs.value) thumbs.click()
});


function validate(event) {
  event.preventDefault();
  settings.number_of_message = nb_message.value
  settings.reactions = []
  if(coeur.checked) settings.reactions.push(coeur.value)
  if(laugth.checked) settings.reactions.push(laugth.value)
  if(surprise.checked) settings.reactions.push(surprise.value)
  if(sad.checked) settings.reactions.push(sad.value)
  if(anger.checked) settings.reactions.push(anger.value)
  if(thumbs.checked) settings.reactions.push(thumbs.value)
  localStorage.settings = JSON.stringify(settings)
  $.post("/setSettings",settings,function(){
    location.href = "/public/threadPictures.html?id="+localStorage.id;
  });
  console.log()
}

