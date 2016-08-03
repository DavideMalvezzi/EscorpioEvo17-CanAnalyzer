
function reloadPort(){
  getDevicesList(
     function(response){
       //Empty the list
       $('#port-combo').empty();
       //If result is ok reload the list
       if(response.result === "ok"){
         for(var i = 0; i < response.ports.length; i++){
           $('#port-combo').append('<option value="' + response.ports[i].path +  '">' +
                                      response.ports[i].displayName + '(' + response.ports[i].path + ')' +
                                    '</option>');
         }
         setEnabled($('#open-btn'), response.ports.length > 0);
       }
       else{
         showAlert('#error-alert', response.error);
       }
     }
   );
}

function openPort(){
  
}
