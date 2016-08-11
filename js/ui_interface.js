
var channels = [];

var CAD_PACKET_HEADER = "CAD";
var CAN_PACKET_HEADER = "CAN";
var BUFFER_SIZE = 4096;
var buffer;

var serialPort = new SerialPort;
var isPaused = false;
var isAlwaysDown = false;

var currentFilterType = "none";
var minFilter, maxFilter;
var listFilter = [];

var mode = "chrono";
var chronoPacketsList = [];
var uniquePacketsList = [];
var txPacketList = [];

//Serial port functions

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

        for(var i = 0; i < 10; i++){
          setEnabled("#tx-btn-" + i, true);
        }

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

        for(var i = 0; i < 10; i++){
          setEnabled("#tx-btn-" + i, false);
        }

      }
      else{
        showAlert("#error-alert", response.error);
      }
    }
  );
}

function pause(){
  isPaused = !isPaused;
  $("#pause-btn").toggleClass("active");
}

function toggleAlwaysDown(){
  isAlwaysDown = !isAlwaysDown;
  $("#down-btn").toggleClass("active");
}

//Packet parsing functions

function onNewSerialData(data){
  if(!isPaused){
    var dv = new DataView(data);

    for(var i = 0; i < dv.byteLength; i++){
      buffer.pushByte(dv.getUint8(i));
    }

    parsePackets();
  }
}

function parsePackets(){
  var header = buffer.indexOfString(CAD_PACKET_HEADER);

  if(header != -1){
    //Check if can id and size have been read
    if(buffer.getLength() > CAD_PACKET_HEADER.length + 3){
      header += CAD_PACKET_HEADER.length;

      var id = buffer.getUint16FromStart(header);
      var size = buffer.getByteFromStart(header + 2);
      header += 3;

      if(size <= 0 || size > 8){
        buffer.pop(header);
        return 1;
      }

      if(buffer.getLength() > CAD_PACKET_HEADER.length + 3 + size){
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
    var conversionResponse;
    var dv = new DataView(new ArrayBuffer(data.length));
    for(var i = 0; i < data.length; i++){
      dv.setUint8(i, data[i]);
    }

    switch(channels[id].type){
      case 'B':
        conversionResponse = parseBitFlag(dv, 0, data.length);
        break;
      case 'U':
        conversionResponse = parseUInt(dv, 0, data.length);
        break;
      case 'I':
        conversionResponse = parseSInt(dv, 0, data.length);
        break;
      case 'D':
        conversionResponse = parseDecimal(dv, 0, data.length);
        break;
      case 'S':
        conversionResponse = parseString(dv, 0, data.length);
        break;
      default:
        return {value:"", notes:"Unknown channel"};
    }

    conversionResponse.value = channels[id].formula(conversionResponse.value);

    if(channels[id].type === 'D'){
      conversionResponse.value = conversionResponse.value.toFixed(6);
    }

    return conversionResponse;
  }
  return {value:"", notes:"Unknown channel"};
}

function addPacket(packet){
  //console.log(packet);

  if(checkFilter(packet.id)){

    uniquePacketsList[packet.id] = packet;
    chronoPacketsList.push(packet);

    if(chronoPacketsList.length > 1000){
      chronoPacketsList.splice(0, 100);
    }

    var rxTableRow = document.getElementById("rx-table-body").rows;
    if(rxTableRow.length > 700){
      for(var i = 0; i < 350; i++){
        rxTableRow[i].parentNode.removeChild(rxTableRow[i]);
      }
    }

    if(mode === "chrono"){
      addRowToChronoTable(packet);
    }
    else if(mode === "unique"){
      addRowToUniqueTable(packet);
    }

    if(isAlwaysDown){
      var rowpos = $('#rx-table-body tr:last').position();
      $('html, body').scrollTop(rowpos.top);
    }
  }
}

function clearTables(){
  chronoPacketsList.splice(0, chronoPacketsList.length);
  uniquePacketsList.splice(0, uniquePacketsList.length);
  $("#rx-table-body").empty();
  $("#tx-table-body").empty();
}

//Settings functions
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

//Filter functions
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
  $("#rx-table-body").empty();

  minFilter = $("#min-channel-list").val();
  maxFilter = $("#max-channel-list").val();

  if(mode === "chrono"){
    for(var i = 0; i < chronoPacketsList.length; i++){
      if(checkFilter(chronoPacketsList[i].id)){
        addRowToChronoTable(chronoPacketsList[i]);
      }
    }
  }
  else if(mode === "unique"){
    for(var key in uniquePacketsList){
      if(checkFilter(key)){
        addRowToUniqueTable(uniquePacketsList[key]);
      }
    }
  }
}

//Rx functions

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

  $("#rx-table-body").append(child);
}

function addRowToUniqueTable(packet){
  var d;
  var child;

  child = "<td>" + packet.id + "</td>";
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

  if($("#row-" + packet.id).length){
    $("#row-" + packet.id).html(child);
  }
  else{
     child = "<tr id='row-" + packet.id +"'>" + child + "<tr>";
     $("#rx-table-body").append(child);
  }



}

function setRxChronoMode(){
  if(mode !== "chrono"){
    $("#rx-chrono-btn").addClass("active");
    $("#rx-unique-btn").removeClass("active");
    $("#tx-btn").removeClass("active");

    mode = "chrono";
    applyFilter();

    setVisible("#rx-table-container", true);
    setVisible("#tx-table-container", false);
  }
}

function setRxUniqueMode(){
  if(mode !== "unique"){
    $("#rx-chrono-btn").removeClass("active");
    $("#rx-unique-btn").addClass("active");
    $("#tx-btn").removeClass("active");

    mode = "unique";
    applyFilter();

    setVisible("#rx-table-container", true);
    setVisible("#tx-table-container", false);
  }
}

//Tx functions

function setTxMode() {
  if(mode !== "tx"){
    $("#rx-chrono-btn").removeClass("active");
    $("#rx-unique-btn").removeClass("active");
    $("#tx-btn").addClass("active");

    loadTxSendData();

    setVisible("#rx-table-container", false);
    setVisible("#tx-table-container", true);

    mode = "tx";
  }
}

function checkSendData(index, evt){
  evt = evt || window.event;
  var charCode = evt.keyCode || evt.which;
  var charStr = String.fromCharCode(charCode);

  var text = $("#tx-text-" + index).val();
  var size = channels[$("#tx-combo-" + index).val()].size;

  if(text.length + 1 > size * 2)return false;

  charStr = charStr.replace(/[^0-9a-fA-F]/g, "");

  return charStr.length != 0;

  //$("#tx-text-" + index).val(text);

}

function sendTxData(inputIndex){
  var id = $("#tx-combo-" + inputIndex).val();
  var text = $("#tx-text-" + inputIndex).val();

  if(channels[id].size * 2 == text.length){
    var data = hexToBytes(text);
    var sendPacket = new DataView(new ArrayBuffer(CAN_PACKET_HEADER.length + 3 + data.byteLength));
    var index = 0;

    for(var i = 0; i < CAN_PACKET_HEADER.length; i++){
      sendPacket.setUint8(i, CAN_PACKET_HEADER.charCodeAt(i));
      index++;
    }

    sendPacket.setUint16(index, id);
    index += 2;

    sendPacket.setUint8(index, channels[id].size);
    index += 1;

    for(var i = 0; i < data.byteLength; i++){
      sendPacket.setUint8(index + i, data.getUint8(i));
    }

    txPacketList.push({id: id, size: channels[id].size, data: data});
    addRowToTxTable({id: id, size: channels[id].size, data: data});
    saveTxSendData(inputIndex);

    serialPort.write(sendPacket.buffer, function(){});
  }
}

function addRowToTxTable(packet){
  var d;
  var child = "<tr>";
  child += "<td>" + packet.id + "</td>";
  child += "<td>" + channels[packet.id].name + "</td>";

  child += "<td>" + packet.size + "</td>";
  for(var j = 0; j < packet.size; j++){
    d = packet.data.getUint8(j).toString(16).toUpperCase();
    if(d.length < 2){
      d = '0' + d;
    }
    child += "<td>" + d + "</td>";
  }
  for(var j = 0; j < 8 - packet.size; j++){
    child += "<td></td>";
  }

  $("#tx-table-body").append(child);
}

function hexToBytes(hex) {
    var bytes = new DataView(new ArrayBuffer(hex.length / 2));
    for (var i = 0; i < hex.length / 2; i++){
      bytes.setUint8(i, parseInt(hex.substr(i * 2, 2), 16));
    }
    return bytes;
}

function loadTxSendData(){
  for(var i = 0; i < 10; i++){
    if(checkCookie("can.tx.combo" + i)){
      $("#tx-combo-" + i).val(getCookie("can.tx.combo" + i));
    }
    if(checkCookie("can.tx.text" + i)){
      $("#tx-text-" + i).val(getCookie("can.tx.text" + i));
    }
  }
}

function saveTxSendData(index){
  console.log(index);
  console.log($("#tx-combo-" + index).val());
  console.log($("#tx-text-" + index).val());

  setCookie("can.tx.combo" + index, $("#tx-combo-" + index).val());
  setCookie("can.tx.text" + index, $("#tx-text-" + index).val());
  console.log(getCookie("can.tx.text" + index));
  console.log(getCookie("can.tx.combo" + index));

}

window.onscroll = function(){
  if(mode === "tx"){
    $("#tx-send-panel").css("top", window.scrollY);
  }
}
