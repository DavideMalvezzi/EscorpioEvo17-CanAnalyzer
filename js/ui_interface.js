
var channels = [];

var PACKET_HEADER = "CAD";
var BUFFER_SIZE = 4096;
var buffer;

var serialPort = new SerialPort;
var isPaused = false;
var isAlwaysDown = false;

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
        buffer = new CircularBuffer(BUFFER_SIZE);
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

function toggleAlwaysDown(){
  isAlwaysDown = !isAlwaysDown;
  $("#down-btn").toggleClass("active");
}

function onNewSerialData(data){
  if(!isPaused){
    var dv = new DataView(data);

    for(var i = 0; i < dv.byteLength; i++){
      buffer.pushByte(dv.getUint8(i));
    }

    while(parsePackets());
  }
}

function parsePackets(){
  var header = buffer.indexOfString(PACKET_HEADER);

  if(header != -1){
    //Check if can id and size have been read
    if(buffer.getLength() > PACKET_HEADER.length + 3){
      header += PACKET_HEADER.length;
      var id = buffer.getUint16FromStart(header);
      var size = buffer.getByteFromStart(header + 2);
      header += 3;

      if(size <= 0 || size > 8){
        buffer.pop(header);
        return 1;
      }

      if(buffer.getLength() > PACKET_HEADER.length + 3 + size){
        var data = [];
        for(var i = 0; i < size; i++){
          data.push(buffer.getByteFromStart(header + i));
        }

        conversionResponse = getPacketValue(id, data);

        addPacket({id: id, size: size, data: data, value: conversionResponse.value, notes: conversionResponse.notes});

        buffer.pop(header + size);

        return 1;
      }
    }
  }
  return 0;
}

function getPacketValue(id, data){
  if(id in channels){
    var dv = new DataView(new ArrayBuffer(data.length));
    for(var i = 0; i < data.length; i++){
      dv.setUint8(i, data[i]);
    }

    switch(channels[id].type){
      case 'B':
        return parseBitFlag(dv, 0, data.length);
      case 'U':
        return parseUInt(dv, 0, data.length);
      case 'I':
        return parseSInt(dv, 0, data.length);
      case 'D':
        return parseDecimal(dv, 0, data.length);
      case 'S':
        return parseString(dv, 0, data.length);
    }
  }

  return {value:"", notes:"Unknown channel"};
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

var currentFilterType = "none";
var minFilter;
var maxFilter;
var listFilter = [];

var rxType = "chrono";
var chronoPacketsList = [];
var uniquePacketsList = [];

function addPacket(packet){
  console.log(packet);

  if(checkFilter(packet.id)){

    uniquePacketsList[packet.id] = packet;
    chronoPacketsList.push(packet);

    if(chronoPacketsList.length > 1000){
      chronoPacketsList.splice(0, 100);
    }

    if(rxType === "chrono"){
      addRowToChronoTable(packet);
    }
    else if(rxType === "unique"){
      addRowToUniqueTable(packet);
    }

    if(isAlwaysDown){
      var rowpos = $('#rx-table tr:last').position();

      $('html, body').scrollTop(rowpos.top);
    }
  }
}

function clearTables(){
  chronoPacketsList.splice(0, chronoPacketsList.length);
  uniquePacketsList.splice(0, uniquePacketsList.length);
  $("#rx-table").empty();
}

function showFilterModal(){
  $("#filter-" + currentFilterType).attr("checked", true);
  onFilterSelected(currentFilterType);

  $("#filter-modal").modal();
}

function addToSelectedChannels(){
  var idToAdd = $("#channel-list").val();
  if(listFilter.indexOf(idToAdd) == -1){
    listFilter.push(idToAdd);
    $("#selected-channel-list").append('<option value="' + idToAdd + '">' + $("#channel-list option:selected").text() + '</option>');
  }
}

function removeFromSelectedChannels(){
  var index;
  $('#selected-channel-list :selected').each(
    function(i, selected){
      index = listFilter.indexOf($(selected).val());
      listFilter.splice(index, 1);
      $(selected).remove();
    }
  );
}

function onFilterSelected(filter){
  currentFilterType = filter;
  if(currentFilterType === "none"){
    setEnabled("#min-channel-list", false);
    setEnabled("#max-channel-list", false);
    setEnabled("#channel-list", false);
    setEnabled("#add-channel", false);
    setEnabled("#remove-channel", false);
    setEnabled("#selected-channel-list", false);
  }
  else if(currentFilterType === "range"){
    setEnabled("#min-channel-list", true);
    setEnabled("#max-channel-list", true);
    setEnabled("#channel-list", false);
    setEnabled("#add-channel", false);
    setEnabled("#remove-channel", false);
    setEnabled("#selected-channel-list", false);
  }
  else if(currentFilterType === "list"){
    setEnabled("#min-channel-list", false);
    setEnabled("#max-channel-list", false);
    setEnabled("#channel-list", true);
    setEnabled("#add-channel", true);
    setEnabled("#remove-channel", true);
    setEnabled("#selected-channel-list", true);
  }
}

function checkFilter(id){
  if(currentFilterType === "none"){
    return true;
  }
  else if(currentFilterType === "range"){
    if(id >= minFilter && id <= maxFilter){
      return true;
    }
  }
  else if(currentFilterType === "list"){
    if(listFilter.indexOf(id.toString()) != -1){
      return true;
    }
  }
  return false;
}

function applyFilter(){
  $("#rx-table").empty();

  minFilter = $("#min-channel-list").val();
  maxFilter = $("#max-channel-list").val();

  if(rxType === "chrono"){
    for(var i = 0; i < chronoPacketsList.length; i++){
      if(checkFilter(chronoPacketsList[i].id)){
        addRowToChronoTable(chronoPacketsList[i]);
      }
    }
  }
  else if(rxType === "unique"){
    for(var i = 0; i < uniquePacketsList.length; i++){
      if(checkFilter(uniquePacketsList[i].id)){
        /*
        child = "<tr id='" + uniquePacketsList[i].id + "'>";
        child += "<td>" + uniquePacketsList[i].id + "</td>";
        child += "<td>" + uniquePacketsList[i].name + "</td>";
        child += "<td>" + uniquePacketsList[i].size + "</td>";
        for(var j = 0; j < uniquePacketsList[i].size; j++){
          child += "<td>" + uniquePacketsList[i].data[j].toString(16) + "</td>";
        }
        child += "<td>" + uniquePacketsList[i].value + "</td>";
        child += "<td>" + uniquePacketsList[i].notes + "</td>";
        child += "</tr>"
        */
      }
    }
  }
}

function addRowToChronoTable(packet){
  var d;
  var child = "<tr>";
  child += "<td>" + packet.id + "</td>";
  if(packet.id in channels){
    child += "<td>" + channels[packet.id].name + "</td>";
  }
  else{
    child += "<td>Unknown</td>";
  }
  child += "<td>" + packet.size + "</td>";
  for(var j = 0; j < packet.size; j++){
    d = packet.data[j].toString(16).toUpperCase();
    if(d.length < 2){
      d = '0' + d;
    }
    child += "<td>" + d + "</td>";
  }
  for(var j = 0; j < 8 - packet.size; j++){
    child += "<td></td>";
  }
  child += "<td>" + packet.value + "</td>";
  child += "<td>" + packet.notes + "</td>";
  child += "</tr>"

  $("#rx-table").append(child);

}

function addRowToUniqueTable(packet){

}
