
function CircularBuffer(size){

  var bufferDv = new DataView(new ArrayBuffer(size));
  var bufferStart = 0;
  var bufferEnd = 0;

  this.getByteFromStart = function(index){
    if(index >= this.getLength()){
      return -1;
    }

    return bufferDv.getUint8((bufferStart + index) % bufferDv.byteLength);
  }

  this.getUint16FromStart = function(index){
    if(index + 1 >= this.getLength()){
      return -1;
    }

    return bufferDv.getUint16((bufferStart + index) % bufferDv.byteLength);
  }

  this.pushByte = function(value){
    bufferDv.setUint8(bufferEnd, value);
    bufferEnd = (bufferEnd + 1) % bufferDv.byteLength;
  }

  this.pop = function(len){
    bufferStart = (bufferStart + len) % bufferDv.byteLength;
  }

  this.getLength = function(){
    return (bufferEnd - bufferStart + 1 + bufferDv.byteLength) % bufferDv.byteLength;
  }

  this.getStartIndex = function(){
    return bufferStart;
  }

  this.indexOfString = function(string){
    var j;

    for(var i = 0; i < this.getLength() - string.length; i++){
      j = 0;
      while(this.getByteFromStart(i + j) === string.charCodeAt(j)){
        j++;
      }

      if(j >= string.length){
        return i;
      }
    }
    return -1;
  }



}
