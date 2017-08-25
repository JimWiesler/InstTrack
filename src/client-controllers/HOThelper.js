// tbl is array like [{"idaction_type":1,"name":"Prequote Review"},
//                    {"idaction_type":2,"name":"Technical Review"},
//                    {"idaction_type":3,"name":"RFP"},
//                    {"idaction_type":4,"name":"PO Issue"}]
// idKey is object key used for the ID
// valKey is the value to be displayed in HOT table

class dropdownRef {
  constructor(tbl, idKey, valKey) {
    this.dd = [];
    this.idKey = idKey;
    this.valKey = valKey;
    this.keyByID = {};
    this.keyByVal = {};
    for (let i = 0; i < tbl.length; i++) {
      this.dd.push(tbl[i][valKey]);
      this.keyByID[tbl[i][idKey]] = tbl[i][valKey];
      this.keyByVal[tbl[i][valKey]] = tbl[i][idKey];
    }
  }

  // Takes single object or an array of objects and replaces IDs in Field with Values
  toVal(data, field) {
    if (Array.isArray(data)) {
      for (let i = 0; i < data.length; i++) {
        if (typeof data[i][field] !== 'undefined' && typeof this.keyByID[data[i][field]] !== 'undefined') {
          data[i][field] = this.keyByID[data[i][field]];
        }
      }
    } else if (typeof data[field] !== 'undefined' && typeof this.keyByID[data[field]] !== 'undefined') {
      data[field] = this.keyByID[data[field]];
    }
  }

  // Takes an array of objects and replaces Values in Field with IDs
  toID(data, field) {
    if (Array.isArray(data)) {
      for (let i = 0; i < data.length; i++) {
        if (typeof data[i][field] !== 'undefined' && typeof this.keyByVal[data[i][field]] !== 'undefined') {
          data[i][field] = this.keyByVal[data[i][field]];
        }
      }
    } else if (typeof data[field] !== 'undefined' && typeof this.keyByVal[data[field]] !== 'undefined') {
      data[field] = this.keyByVal[data[field]];
    }
  }
}
module.exports.dropdownRef = dropdownRef;

function xhrGet(url, callback) {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.onload = () => {
    if (xhr.status === 200) {
      callback('OK', JSON.parse(xhr.responseText));
    } else {
      console.log(`Request failed.  Returned status of ${xhr.status}`);
      callback('ERROR', JSON.parse(xhr.status));
    }
  };
  xhr.send();
}
module.exports.xhrGet = xhrGet;

function xhrPost(url, obj, callback) {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', url);
  xhr.setRequestHeader('Content-type', 'application/json');
  xhr.onload = () => {
    if (xhr.status === 200) {
      callback('OK', JSON.parse(xhr.responseText));
    } else {
      console.log(`Request failed.  Returned status of ${xhr.status}`);
      callback('ERROR', JSON.parse(xhr.status));
    }
  };
  console.log(`POST: ${url}, ${JSON.stringify(obj)}`);
  xhr.send(JSON.stringify(obj));
}
module.exports.xhrPost = xhrPost;

function HOTLogicalRowsToPhysical(HOT, logical) {
  let physical;
  if (typeof HOT.sortColumn === 'undefined' ||
    typeof HOT.sortIndex === 'undefined' ||
    HOT.sortIndex.length === 0) {
    physical = logical; // NO sorting so no translation
  } else {
    physical = HOT.sortIndex[logical][0];
  }
  return physical;
}
module.exports.HOTLogicalRowsToPhysical = HOTLogicalRowsToPhysical;
