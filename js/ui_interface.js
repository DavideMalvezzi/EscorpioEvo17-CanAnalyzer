
var serialPort = new SerialPort;
var isPaused = false;

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
         setEnabled($('#open-btn'), response.ports.length > 0 && !serialPort.isOpen());
       }
       else{
         showAlert('#error-alert', response.error);
       }
     }
   );
}

function openPort(){
  var bitrate = checkCookie("can.port.bitrate") ? getCookie("can.port.bitrate") : "9600";
  var databits = checkCookie("can.port.databits") ? getCookie("can.port.databits") : "eight";
  var stopbit = checkCookie("can.port.stopbit") ? getCookie("can.port.stopbit") : "one";
  var paritybit = checkCookie("can.port.paritybit") ? getCookie("can.port.paritybit") : "no";

  serialPort.openPort(
    {
      portName: $('#port-combo').val(),
      bitrate: parseInt(bitrate),
      dataBits: databits,
      stopBits: stopbit,
      parityBit: paritybit
    },
    function(response){
      if(response.result === "ok"){
        setEnabled("#open-btn", false);
        setEnabled("#pause-btn", true);
        setEnabled("#close-btn", true);
        serialPort.setOnDataReceivedCallback(onNewSerialData);
      }
      else{
        showAlert("#error-alert", response.error);
      }
    }
  );
}

function closePort(){
  serialPort.closePort(
    function(response){
      if(response.result === "ok"){
        setEnabled("#open-btn", true);
        setEnabled("#pause-btn", false);
        setEnabled("#close-btn", false);
      }
      else{
        showAlert("#error-alert", response.error);
      }
    }
  );
}

function pause(){
  isPaused = !isPaused;
}

function onNewSerialData(data){
  if(!isPaused){
    var dv = new DataView(data);
  }
}

function showSettingsModal(){
  var bitrate = checkCookie("can.port.bitrate") ? getCookie("can.port.bitrate") : "9600";
  var databits = checkCookie("can.port.databits") ? getCookie("can.port.databits") : "eight";
  var stopbit = checkCookie("can.port.stopbit") ? getCookie("can.port.stopbit") : "one";
  var paritybit = checkCookie("can.port.paritybit") ? getCookie("can.port.paritybit") : "no";

  $("#serial-port-bitrate").val(bitrate);
  $("#serial-port-databits").val(databits);
  $("#serial-port-stopbit").val(stopbit);
  $("#serial-port-paritybit").val(paritybit);

  $('#settings-modal').modal();
}

function saveSettings(){
  setCookie("can.port.bitrate", $("#serial-port-bitrate").val());
  setCookie("can.port.databits", $("#serial-port-databits").val());
  setCookie("can.port.stopbit", $("#serial-port-stopbit").val());
  setCookie("can.port.paritybit", $("#serial-port-paritybit").val());
}
