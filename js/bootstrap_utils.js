
function setError(id, hasError){
  if(hasError){
    $(id).parent().addClass("has-error");
  }
  else{
    $(id).parent().removeClass("has-error");
  }
}

function setEnabled(id, enable){
  if(enable){
    $(id).removeClass('disabled');
  }
  else{
    $(id).addClass('disabled');
  }
}

function setVisible(id, visible){
  if(visible){
    $(id).removeClass('hidden');
  }
  else{
    $(id).addClass('hidden');
  }
}

function showAlert(id, text){
  $(id + "-text").html(text);
  setVisible(id, true);
}

function hideAlert(id){
  setVisible(id, false)
}
