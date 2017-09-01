const xhr = require('./xhr.js');

class UserException {
  constructor(message) {
    this.message = message;
    this.name = 'UserException';
    console.log(message);
  }
}

class ForeignKeyReference {
  constructor(config) {
    this.config = config;
    this.data = [];
    this.dropDownList = [];
    this.HOTTables = [];
    const portStr = (window.location.port.length > 0) ? `:${window.location.port}` : '';
    this.pageRoot = `${window.location.protocol}//${window.location.hostname}${portStr}/`;
    this.keyByID = null;
    this.keyByVal = null;
    this.onUpdateList = []; // array of HOTTable objects to update when new data is received
    this.read();
    this.old = { keyByVal: null, keyByID: null };
    this.loadState = 'init';
  }

  read() {
    let url;
    if (this.config.source.urlRoot === 'page') {
      url = `${this.pageRoot}${this.config.source.url}`;
    } else {
      url = `${this.config.source.urlRoot}${this.config.source.url}`;
    }
    xhr.Get(url, (stat, tbl) => {
      if (stat === 'ERROR') throw new UserException(`Error reading ${this.name}`);
      this.data = tbl;
      // sort by sortField
      if (tbl.length > 0) {
        if (typeof tbl[0][this.config.sortField] === 'string') { // string sort
          tbl.sort((a, b) => {
            const valA = a[this.config.sortField].toUpperCase(); // ignore upper and lowercase
            const valB = b[this.config.sortField].toUpperCase(); // ignore upper and lowercase
            if (valA < valB) { return -1; }
            if (valA > valB) { return 1; }
            return 0;
          });
        } else { // number sort
          tbl.sort((a, b) => {
            return a[this.config.sortField] - b[this.config.sortField];
          });
        }
      }
      // set up cross references
      this.old.keyByID = this.keyByID;
      this.old.keyByVal = this.keyByVal;
      this.keyByID = {};
      this.keyByVal = {};
      this.dropDownList = [];
      this.loadState = (this.old.keyByVal === null) ? 'loaded' : 'reloaded';
      for (let i = 0; i < tbl.length; i++) {
        this.dropDownList.push(tbl[i][this.config.valueField]);
        this.keyByID[tbl[i][this.config.idField]] = tbl[i][this.config.valueField];
        this.keyByVal[tbl[i][this.config.valueField]] = tbl[i][this.config.idField];
      }
      // execute each callback function registered in onUpdateList
      this.onUpdateList.forEach((HOTTable) => { HOTTable.fkChanged(this); });
    });
  }

  // Takes an object or array of objects and replaces Values in Field with IDs
  toVal(field, data) {
    let dataArray;
    if (Array.isArray(data)) {
      dataArray = data;
    } else {
      dataArray = [data];
    }
    for (let i = 0; i < dataArray.length; i++) {
      if (this.keyByID !== null &&
        typeof dataArray[i][field] !== 'undefined' &&
        typeof this.keyByID[dataArray[i][field]] !== 'undefined') {
        dataArray[i][field] = this.keyByID[dataArray[i][field]];
      }
    }
  }

  // Takes an object or array of objects and replaces Values in Field with IDs
  toID(field, data, version) {
    let dataArray;
    if (Array.isArray(data)) {
      dataArray = data;
    } else {
      dataArray = [data];
    }
    let keyByVal;
    if (version === 'old') {
      keyByVal = this.old.keyByVal;
    } else {
      keyByVal = this.keyByVal;
    }
    for (let i = 0; i < dataArray.length; i++) {
      if (keyByVal !== null &&
        typeof dataArray[i][field] !== 'undefined' &&
        typeof keyByVal[dataArray[i][field]] !== 'undefined') {
        dataArray[i][field] = keyByVal[dataArray[i][field]];
      }
    }
  }
}
module.exports = ForeignKeyReference;


/* ************************************************************************************
Example Config:
***************************************************************************************
const config = {
  name: 'dispostion_type',
  source: {
    urlRoot: 'page',
    url: 'getTable?table=disposition_type',
  },
  idField: 'iddisposition_type',
  valueField: 'name',
  sortField: 'iddisposition_type',
}

 ********************************************************************************** */
