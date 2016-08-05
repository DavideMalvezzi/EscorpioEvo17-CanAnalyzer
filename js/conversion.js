function parseBitFlag(dv, index, size){
  var value;
  switch (size){
    case 1:
      value = {value: dv.getUint8(index, true).toString(2), notes: ""};
    case 2:
      value = {value: dv.getUint16(index, true).toString(2), notes: ""};
    case 4:
      value = {value: dv.getUint32(index, true).toString(2), notes: ""};
    case 8:
      value =  {value: ((dv.getUint32(index + 4, true) << 32) | dv.getUint32(index, true)).toString(2), notes: ""};
  }

  return {value: NaN, notes: "Size must be a power of 2."};
}

function parseUInt(dv, index, size){
  switch (size){
    case 1:
      return {value: dv.getUint8(index, true), notes: ""};
    case 2:
      return {value: dv.getUint16(index, true), notes: ""};
    case 4:
      return {value: dv.getUint32(index, true), notes: ""};
    case 8:
      return  {value: (dv.getUint32(index + 4, true) << 32) | dv.getUint32(index, true), notes: ""};
  }

  return {value: NaN, notes: "Size must be a power of 2."};
}

function parseSInt(dv, index, size){
  switch (size){
    case 1:
      return {value: dv.getInt8(index, true), notes: ""};
    case 2:
      return {value: dv.getInt16(index, true), notes: ""};
    case 4:
      return {value: dv.getInt32(index, true), notes: ""};
    case 8:
      return  {value: (dv.getInt32(index + 4, true) << 32) | dv.getInt32(index, true), notes: ""};
  }

  return {value: NaN, notes: "Size must be a power of 2."};
}

function parseDecimal(dv, index, size){
  switch (size){
    case 4:
      return {value: dv.getFloat32(index, true), notes: ""};
    case 8:
      return {value: dv.getFloat64(index, true), notes: ""};

  }
  return {value: NaN, notes: "Size must be 4 or 8."};
}

function parseString(dv, index, size){
    var str = "";
    for(var i = 0; i < size; i++){
        str = str.concat(String.fromCharCode(dv.getUint8(index + i, true)));
    }
    return {value: str, notes:""};
}
