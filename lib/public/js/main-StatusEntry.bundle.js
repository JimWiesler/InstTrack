(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"./xhr.js":4}],2:[function(require,module,exports){
const xhr = require('./xhr.js');

class UserException {
  constructor(message) {
    this.message = message;
    this.name = 'UserException';
    console.log(message);
  }
}

// Class to handle a HandsOnTable complete with all data handling, XHR requests, etc.
class HOTTable {
  constructor(config) {
    this.config = config;
    this.name = config.name;
    this.container = document.getElementById(config.divID);
    const portStr = (window.location.port.length > 0) ? `:${window.location.port}` : '';
    this.pageRoot = `${window.location.protocol}//${window.location.hostname}${portStr}/`;
    this.HOT = null;
    this.changes = [];
    this.pendingChanges = [];
    this.data = [];
    this.fk = {};
    this.fkRegistered = false;
    // get list of foreign key fields
    for (let i = 0; i < config.columns.length; i++) {
      if (config.columns[i].type === 'foreignKey') {
        this.fk[config.columns[i].field] = config.columns[i].fkSource;
      }
    }
    this.read(); // Get data from data source
  }

  // runs when the foreign key changes - sometimes after the HOT is loaded
  fkChanged(fk) {
    const fKeys = Object.keys(this.fk);
    console.log(`FK changed: ${fk.config.name}`);
    for (let i = 0; i < fKeys.length; i++) {
      if (this.fk[fKeys[i]] === fk) {
        if (fk.loadState === 'reloaded') {
          // convert back to ID via old foreign key list
          fk.toID(fKeys[i], this.data, 'old');
        }
        // convert field to foregin key value
        fk.toVal(fKeys[i], this.data);
      }
    }
    this.HOT.render();
  }

  fkToVal(obj) {
    const fKeys = Object.keys(this.fk);
    for (let i = 0; i < fKeys.length; i++) {
      if (!this.fkRegistered) this.fk[fKeys[i]].onUpdateList.push(this);
      this.fk[fKeys[i]].toVal(fKeys[i], obj);
    }
    this.fkRegistered = true;
  }

  fkToID(obj) {
    const fKeys = Object.keys(this.fk);
    for (let i = 0; i < fKeys.length; i++) {
      this.fk[fKeys[i]].toID(fKeys[i], obj);
    }
  }

  initHOT() {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;  // offset in milliseconds
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 10);
    this.HOTproperties = {
      data: this.data,
      colHeaders: [],
      rowHeaders: false,
      fillHandle: 'vertical', // possible values: true, false, "horizontal", "vertical"
      contextMenu: ['remove_row'],
      dropdownMenu: ['filter_by_value', 'filter_by_condition', 'filter_action_bar'],
      filters: true,
      columnSorting: true,
      sortIndicator: true,
      minSpareRows: 1,
      currentRowClassName: 'currentRow',
      columns: [],
      afterChange: (change, source) => { this.handleHOTChanges(change, source); },
      beforeRemoveRow: (index, amount, visualSource) => { this.delete(visualSource); },
      preventOverflow: 'horizontal',
      stretchH: 'all',
    };
    for (let i = 0; i < this.config.columns.length; i++) {
      this.HOTproperties.colHeaders.push(this.config.columns[i].header);
      const column = { data: this.config.columns[i].field };
      switch (this.config.columns[i].type) {
      case 'key':
        column.readOnly = true;
        break;
      case 'foreignKey':
        column.type = 'dropdown';
        column.source = (query, cb) => { cb(this.config.columns[i].fkSource.dropDownList); };
        column.allowInvalid = false;
        break;
      case 'list':
        column.type = 'dropdown';
        column.source = this.config.columns[i].source;
        column.allowInvalid = false;
        break;
      case 'date':
        column.type = 'date';
        column.dateFormat = 'YYYY-MM-DD';
        column.correctFormat = true;
        column.defaultDate = localISOTime;
        break;
      case 'currency':
        column.type = 'numeric';
        column.allowInvalid = false;
        switch (this.config.columns[i].format) {
        // TODO: need to get correct country codes
        // http://numbrojs.com/languages.html#supported-languages ?
        // https://github.com/BenjaminVanRyseghem/numbro/blob/develop/languages/en-IE.js
        case 'en-US':
          column.format = '$0,0.00';
          column.language = 'en-US';
          break;
        case 'en-IE':
          column.format = '$0,0.00';
          column.language = 'en-IE';
          break;
        case 'en-GB':
          column.format = '$0,0.00';
          column.language = 'en-GB';
          break;
        case 'fr-FR':
          column.format = '0.0,00 $';
          column.language = 'fr-FR';
          break;
        case 'zh-CN':
          column.format = '0,0.00 $';
          column.language = 'zh-CN';
          break;
        default:
          break;
        }
        break;
      case 'number':
        column.type = 'numeric';
        column.allowInvalid = false;
        break;
      case 'general':
        break;
      default:
        break;
      }
      this.HOTproperties.columns.push(column);
    }
    this.HOT = new window.Handsontable(this.container, this.HOTproperties);
  }

  HOTLogicalRowsToPhysical(logical) {
    let physical;
    if (typeof this.HOT.sortColumn === 'undefined' ||
      typeof this.HOT.sortIndex === 'undefined' ||
      this.HOT.sortIndex.length === 0) {
      physical = logical; // NO sorting so no translation
    } else {
      physical = this.HOT.sortIndex[logical][0];
    }
    return physical;
  }


  // change is like [[0,"reviewer",null,"Mike"]] or [[row, colName, old, new]]
  handleHOTChanges(change, source) {
    // NOTE: logical not physical index passed in change event
    // https://github.com/handsontable/handsontable/issues/1501
    if (source === 'loadData') return; // data change emitted when data was loaded, do not change DB
    for (let i = 0; i < change.length; i++) {
      change[i][0] = this.HOTLogicalRowsToPhysical(change[i][0]); // to row in data source
      const HOTrow = change[i][0];
      if (typeof this.pendingChanges[HOTrow] === 'undefined') { // first data change for this data row
        // Create pending data structure to aggregate all changes to a single row
        this.pendingChanges[HOTrow] = {};
      }
      this.pendingChanges[HOTrow][change[i][1]] = change[i][3];
    }
    this.processPending(); // initiate a database update of all pending changes
    this.changes.push(change);
    // console.log(`HOTtable: ${this.name}, Change: ${JSON.stringify(change)}, Source: ${source}`);
  }

  processPending() {
    const incomplete = 'incomplete';
    const pending = 'pending';
    let reRender = false;
    for (const row of Object.keys(this.pendingChanges)) {
      // key field NULL or incomplete indicates new record
      if (this.data[row][this.config.source.key] === null ||
        this.data[row][this.config.source.key] === incomplete) {
        // make sure all not null fields are not null
        let valid = true;
        const notNull = this.config.source.create.notNull;
        for (let i = 0; i < notNull.length; i++) {
          if (typeof this.pendingChanges[row][notNull[i]] === 'undefined' ||
            this.pendingChanges[row][notNull[i]] === null) valid = false;
        }
        if (!valid) {
          this.pendingChanges[row][this.config.source.key] = incomplete;
          this.data[row][this.config.source.key] = incomplete;
          reRender = true;
        } else {
          // POST this new record
          this.fkToID(this.pendingChanges[row]); // convert back to foreign keys
          // Append default values to new record if not already defined
          for (const defKey of Object.keys(this.config.source.create.default)) {
            if (typeof this.pendingChanges[row][defKey] === 'undefined') {
              this.pendingChanges[row][defKey] = this.config.source.create.default[defKey];
            }
          }
          this.create(row);
          this.data[row][this.config.source.key] = pending;
          reRender = true;
        }
      } else {
        if (this.pendingChanges[row][this.config.source.key] === pending) {
          // update id in change list with id from table
          this.pendingChanges[row][this.config.source.key] = this.data[row][this.config.source.key];
        }
        // Handle UPDATE queries
        if (this.pendingChanges[row][this.config.source.key] !== 'pending') {
          this.fkToID(this.pendingChanges[row]); // convert back to foreign keys
          this.update(row);
        }
      }
    }
    if (reRender) this.HOT.render();
  }

  create(newRow) {
    let url;
    if (this.config.source.urlRoot === 'page') {
      url = `${this.pageRoot}${this.config.source.create.url}`;
    } else {
      url = `${this.config.source.urlRoot}${this.config.source.create.url}`;
    }
    const payload = {
      table: this.config.source.table,
      key: this.config.source.key,
      data: this.pendingChanges[newRow],
    };
    payload.data[this.config.source.key] = null;
    xhr.Post(url, payload, (stat, res) => {
      if (stat === 'ERROR') throw new UserException(`Error inserting row ${newRow}`);
      if (res.insertId > 0) { // new item inserted
        this.data[newRow][this.config.source.key] = res.insertId;
        this.HOT.render(); // render the table with new ID inserted
      }
    });
    delete this.pendingChanges[newRow]; // TODO - how to handle failed inserts?
  }

  read() {
    let url;
    if (this.config.source.urlRoot === 'page') {
      url = `${this.pageRoot}${this.config.source.read.url}`;
    } else {
      url = `${this.config.source.urlRoot}${this.config.source.read.url}`;
    }
    xhr.Get(url, (stat, tbl) => {
      if (stat === 'ERROR') throw new UserException(`Error reading ${this.name}`);
      this.data = tbl;
      this.fkToVal(this.data); // Convert foreign keys to values
      if (this.HOT === null) {
        this.initHOT();
      } else {
        this.hotTable.loadData(this.data);
        this.hotTable.render();
      }
    });
  }

  update(changedRow) {
    let url;
    if (this.config.source.urlRoot === 'page') {
      url = `${this.pageRoot}${this.config.source.update.url}`;
    } else {
      url = `${this.config.source.urlRoot}${this.config.source.update.url}`;
    }
    const payload = {
      table: this.config.source.table,
      key: this.config.source.key,
      data: this.pendingChanges[changedRow],
    };
    payload.data[this.config.source.key] = this.data[changedRow][this.config.source.key];
    xhr.Post(url, payload, (stat, res) => {
      if (stat === 'ERROR') throw new UserException(`Error updating row ${changedRow}`);
      if (res.affectedRows !== 1) console.log(`Possible update problem row ${changedRow}: ${JSON.stringify(res)}`);
    });
    delete this.pendingChanges[changedRow]; // TODO - how to handle failed inserts?
  }

  delete(visualSource) {
    let url;
    if (this.config.source.urlRoot === 'page') {
      url = `${this.pageRoot}${this.config.source.delete.url}`;
    } else {
      url = `${this.config.source.urlRoot}${this.config.source.delete.url}`;
    }
    // NOTE: contrary to HOT documentation, visualSource is array of physical (data source) indices
    const idList = visualSource.map((i) => { return this.data[i].idaction; });
    // console.log(`Raw: ${visualSource}, IDs: ${idList}`);
    const payload = {
      table: this.config.source.table,
      key: this.config.source.key,
      data: { key: this.config.source.key, ids: idList },
    };
    xhr.Post(url, payload, (stat, res) => {
      if (stat === 'ERROR') throw new UserException(`Error deleting Actions: ${idList}`);
      console.log(`Delete responses: ${res.length}`);
    });
  }

}
module.exports = HOTTable;

/* ************************************************************************************
Example Config:
***************************************************************************************
const config = {
  name: 'prequote',
  divID: 'hot-prequote',
  source: {
    urlRoot: 'page',
    key: 'idaction',
    table: 'action',
    create: {
      url: 'changeAction',
      notNull: ['package_idpackage'],
      default: { action_type: 1 } },
    read: { url: 'getActions?actionType=1' },
    update: { url: 'changeAction' },
    delete: { url: 'deleteAction' },
  },
  columns: [
    { field: 'idaction', header: 'ID', type: 'key' },
    { field: 'package_idpackage', header: 'Package', type: 'foreignKey', fkSource: fkObject },
    { field: 'action_start', header: 'Start Date', type: 'date' },
    { field: 'act_count', header: 'Instruments', type: 'number' },
    { field: 'revision', header: 'Revision', type: 'general' },
    { field: 'reviewer', header: 'Reviewer', type: 'list', source: ['Joe', 'Mike'] },
    { field: 'action_end', header: 'End Date', type: 'date' },
    { field: 'disposition_type_iddisposition_type', header: 'Status',
      type: 'foreignKey', fkSource: fkObject },
    { field: 'hours', header: 'Status', type: 'number' },
  ],
 }

 ********************************************************************************** */

},{"./xhr.js":4}],3:[function(require,module,exports){
const FK = require('./ForeignKeyReference.js');
const HT = require('./HOTTable.js');

const reviewerSource = ['Amanda', 'Joe', 'Mike'];
const dt = new FK({
  name: 'dispostion_type',
  source: { urlRoot: 'page', url: 'getTable?table=disposition_type' },
  idField: 'iddisposition_type',
  valueField: 'name',
  sortField: 'iddisposition_type',
});

const pkg = new FK({
  name: 'packages',
  source: { urlRoot: 'page', url: 'getTable?table=package' },
  idField: 'idpackage',
  valueField: 'name',
  sortField: 'name',
});

const prequoteConfig = {
  name: 'Prequote',
  divID: 'hot-prequote',
  source: {
    urlRoot: 'page',
    key: 'idaction',
    table: 'action',
    create: {
      url: 'changeAction',
      notNull: ['package_idpackage'],
      default: { action_type_idaction_type: 1 } },
    read: { url: 'getActions?actionType=prequote' },
    update: { url: 'changeAction' },
    delete: { url: 'deleteAction' },
  },
  columns: [
    { field: 'idaction', header: 'ID', type: 'key' },
    { field: 'package_idpackage', header: 'Package', type: 'foreignKey', fkSource: pkg },
    { field: 'action_start', header: 'Start Date', type: 'date' },
    { field: 'act_count', header: 'Instruments', type: 'number' },
    { field: 'revision', header: 'Revision', type: 'general' },
    { field: 'reviewer', header: 'Reviewer', type: 'list', source: reviewerSource },
    { field: 'action_end', header: 'End Date', type: 'date' },
    {
      field: 'disposition_type_iddisposition_type',
      header: 'Status',
      type: 'foreignKey',
      fkSource: dt,
    },
    { field: 'hours', header: 'Hours', type: 'number' },
  ],
};

const technicalConfig = {
  name: 'Technical',
  divID: 'hot-technical',
  source: {
    urlRoot: 'page',
    key: 'idaction',
    table: 'action',
    create: {
      url: 'changeAction',
      notNull: ['package_idpackage'],
      default: { action_type_idaction_type: 2 } },
    read: { url: 'getActions?actionType=technical' },
    update: { url: 'changeAction' },
    delete: { url: 'deleteAction' },
  },
  columns: [
    { field: 'idaction', header: 'ID', type: 'key' },
    { field: 'package_idpackage', header: 'Package', type: 'foreignKey', fkSource: pkg },
    { field: 'action_start', header: 'Start Date', type: 'date' },
    { field: 'act_count', header: 'Instruments', type: 'number' },
    { field: 'revision', header: 'Revision', type: 'general' },
    { field: 'reviewer', header: 'Reviewer', type: 'list', source: reviewerSource },
    { field: 'action_end', header: 'End Date', type: 'date' },
    {
      field: 'disposition_type_iddisposition_type',
      header: 'Status',
      type: 'foreignKey',
      fkSource: dt,
    },
    { field: 'hours', header: 'Hours', type: 'number' },
  ],
};

const RFPConfig = {
  name: 'RFP',
  divID: 'hot-RFP',
  source: {
    urlRoot: 'page',
    key: 'idaction',
    table: 'action',
    create: {
      url: 'changeAction',
      notNull: ['package_idpackage'],
      default: { action_type_idaction_type: 3 } },
    read: { url: 'getActions?actionType=RFP' },
    update: { url: 'changeAction' },
    delete: { url: 'deleteAction' },
  },
  columns: [
    { field: 'idaction', header: 'ID', type: 'key' },
    { field: 'package_idpackage', header: 'Package', type: 'foreignKey', fkSource: pkg },
    { field: 'action_start', header: 'Start Date', type: 'date' },
    { field: 'act_count', header: 'Instruments', type: 'number' },
    { field: 'revision', header: 'Revision', type: 'general' },
    { field: 'product_cost', header: 'Product (€)', type: 'currency', format: 'en-IE' },
    { field: 'document_cost', header: 'Document (€)', type: 'currency', format: 'en-IE' },
    { field: 'transportation_cost', header: 'Transport (€)', type: 'currency', format: 'en-IE' },
  ],
};

const POConfig = {
  name: 'PO',
  divID: 'hot-PO',
  source: {
    urlRoot: 'page',
    key: 'idaction',
    table: 'action',
    create: {
      url: 'changeAction',
      notNull: ['package_idpackage'],
      default: { action_type_idaction_type: 4 } },
    read: { url: 'getActions?actionType=PO' },
    update: { url: 'changeAction' },
    delete: { url: 'deleteAction' },
  },
  columns: [
    { field: 'idaction', header: 'ID', type: 'key' },
    { field: 'package_idpackage', header: 'Package', type: 'foreignKey', fkSource: pkg },
    { field: 'action_start', header: 'Start Date', type: 'date' },
    { field: 'act_count', header: 'Instruments', type: 'number' },
    { field: 'revision', header: 'Revision', type: 'general' },
  ],
};

window.dbg = { dt, pkg, sheets: [] };

// First script executed.  On load of DOM
window.onloadScript = () => {
  // Activate first tab
  document.getElementsByClassName('tablinks')[0].click();
  // create HandsOnTables
  window.dbg.sheets[0] = new HT(prequoteConfig);
  window.dbg.sheets[1] = new HT(technicalConfig);
  window.dbg.sheets[2] = new HT(RFPConfig);
  window.dbg.sheets[3] = new HT(POConfig);
};

window.onload = window.onloadScript;

window.onresizeScript = () => {
  const div = document.getElementById('data-body');
  console.log(`DIV: ${div.clientWidth} x ${div.clientHeight}`);
  // data.HOT.prequote.updateSettings({ width: div.clientWidth, height: div.clientHeight });
};
window.onresize = window.onresizeScript;

window.openTab = (evt, tabName) => {
  const tabcontent = document.getElementsByClassName('tabcontent');
  for (let i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = 'none';
  }
  const tablinks = document.getElementsByClassName('tablinks');
  for (let i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(' active', '');
  }
  document.getElementById(tabName).style.display = 'block';
  evt.currentTarget.className += ' active';
};

},{"./ForeignKeyReference.js":1,"./HOTTable.js":2}],4:[function(require,module,exports){
function Get(url, callback) {
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
module.exports.Get = Get;

function Post(url, obj, callback) {
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
module.exports.Post = Post;

},{}]},{},[3]);
