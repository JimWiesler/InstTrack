const hh = require('./HOThelper.js');

const portStr = (window.location.port.length > 0) ? `:${window.location.port}` : '';
const preRoute = `${window.location.protocol}//${window.location.hostname}${portStr}/`;
const reviewers = ['Joe', 'Mike'];
const actionTypes = { prequote: 1, technical: 2, RFP: 3, PO: 4 };
let xhrTotalDropdown;
let xhrTotalActions;
const data = { prequote: null,
  technical: null,
  RFP: null,
  PO: null,
  HOT: { prequote: {}, technical: {}, RFP: {}, PO: {} },
  DD: { dispositionTypes: null, packages: null },
  changes: { prequote: [], technical: [], RFP: [], PO: [] },
  pendingChanges: { prequote: {}, technical: {}, RFP: {}, PO: {} }, // by table row
};
window.HOTdata = data; // for console debugging

class UserException {
  constructor(message) {
    this.message = message;
    this.name = 'UserException';
    console.log(message);
  }
}

// *********************************************************************
// INSERT
// post: {"table": "action", "data": {"idaction": null, "action_type_idaction_type": 2,
//  "package_idpackage": "33", "reviewer": "Jim", "action_start":"1999-01-13", "action_end": null}}
// response : { "fieldCount": 0, "affectedRows": 1, "insertId": 12, "serverStatus": 2,
//  "warningCount": 0, "message": "", "protocol41": true, "changedRows": 0 }
// UPDATE
// post: {"table": "action", "data": {"idaction": 10, "action_type_idaction_type": 3,
//  "package_idpackage": "99", "reviewer": "Matt", "action_start":"1999-01-13"}}
// response : { "fieldCount": 0, "affectedRows": 1, "insertId": 0, "serverStatus": 2,
//  "warningCount": 0,  "message": "(Rows matched: 1  Changed: 1  Warnings: 0",
//  "protocol41": true, "changedRows": 1 }
// *********************************************************************
function postAction(table, row) {
  const change = data.pendingChanges[table][row];
  data.DD.dispositionTypes.toID(change, 'disposition_type_iddisposition_type');
  data.DD.packages.toID(change, 'package_idpackage');
  hh.xhrPost(`${preRoute}changeAction`, { table: 'action', data: change }, (stat, res) => {
    if (stat === 'ERROR') throw new UserException(`Error changing Action in table ${table} row ${row}`);
    if (res.insertId > 0) { // new item inserted
      data[table][row].idaction = res.insertId;
      data.HOT[table].render(); // render the table with new ID inserted
    }
  });
  delete data.pendingChanges[table][row]; // TODO - how to handle failed inserts?
}

// update database with pending changes
function updateDB() {
  for (const table of Object.keys(data.pendingChanges)) {
    for (const row of Object.keys(data.pendingChanges[table])) {
      // POST pending changes with ID = null as INSERT requests; update ID to 'pending'
      if (data.pendingChanges[table][row].idaction == null) {
        postAction(table, row);
        data[table][row].idaction = 'pending';
      } else { // handle updates
        if (data.pendingChanges[table][row].idaction === 'pending') {
          // update id in change list with id from table
          data.pendingChanges[table][row].idaction = data[table][row].idaction;
        }
        // Handle UPDATE queries
        if (data.pendingChanges[table][row].idaction !== 'pending') {
          postAction(table, row);
        }
      }
    }
  }
}

// change is like [[0,"reviewer",null,"Mike"]] or [[row, colName, old, new]]
function handleHOTChanges(HOTtable, change, source) {
  // NOTE: logical not physical index passed in change event
  // https://github.com/handsontable/handsontable/issues/1501
  if (source === 'loadData') return; // data change emitted when data was loaded, do not change DB
  for (let i = 0; i < change.length; i++) {
    change[i][0] = hh.HOTLogicalRowsToPhysical(data.HOT[HOTtable], change[i][0]); // 2 phys row
    const HOTrow = change[i][0];
    if (typeof data.pendingChanges[HOTtable][HOTrow] === 'undefined') { // first data change for this data row
      // Create pending data structure to aggregate all changes to a single row
      data.pendingChanges[HOTtable][HOTrow] = {
        idaction: data[HOTtable][HOTrow].idaction,
        action_type_idaction_type: actionTypes[HOTtable],
      };
    }
    data.pendingChanges[HOTtable][HOTrow][change[i][1]] = change[i][3];
  }
  updateDB(); // initiate a database update of all pending changes
  data.changes[HOTtable].push(change);
  console.log(`HOTtable: ${HOTtable}, Change: ${JSON.stringify(change)}, Source: ${source}`);
}

function handleHOTDelete(HOTtable, visualSource) {
  // NOTE: contrary to HOT documentation, visualSource is array of physical (data source) indices
  const idList = visualSource.map((i) => { return data[HOTtable][i].idaction; });
  console.log(`Raw: ${visualSource}, IDs: ${idList}`);
  hh.xhrPost(`${preRoute}deleteAction`, { table: 'action', data: { key: 'idaction', ids: idList } }, (stat, res) => {
    if (stat === 'ERROR') throw new UserException(`Error deleting Actions: ${idList}`);
    console.log(`Delete responses: ${res.length}`);
  });
}

function buildHot() {
  // PreQuote Handsontable
  const container = document.getElementById('hot-prequote');
  const tzoffset = (new Date()).getTimezoneOffset() * 60000;  // offset in milliseconds
  const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 10);
  data.HOT.prequote = new Handsontable(container, {
    data: data.prequote,
    colHeaders: ['ID', 'Package', 'Start Date', 'Instruments', 'Revision', 'Reviewer', 'End Date', 'Status', 'Hours'],
    rowHeaders: false,
    fillHandle: 'vertical', // possible values: true, false, "horizontal", "vertical"
    contextMenu: ['remove_row'],
    dropdownMenu: ['filter_by_value', 'filter_by_condition', 'filter_action_bar'],
    filters: true,
    columnSorting: true,
    sortIndicator: true,
    minSpareRows: 1,
    currentRowClassName: 'currentRow',
    columns: [
      { data: 'idaction', readOnly: true },
      { data: 'package_idpackage', type: 'dropdown', source: data.DD.packages.dd, allowInvalid: false },
      { data: 'action_start', type: 'date', dateFormat: 'YYYY-MM-DD', correctFormat: true, defaultDate: localISOTime },
      { data: 'act_count', type: 'numeric', allowInvalid: false },
      { data: 'revision' },
      { data: 'reviewer', type: 'dropdown', source: reviewers, allowInvalid: false },
      { data: 'action_end', type: 'date', dateFormat: 'YYYY-MM-DD', correctFormat: true, defaultDate: localISOTime },
      { data: 'disposition_type_iddisposition_type', type: 'dropdown', source: data.DD.dispositionTypes.dd, allowInvalid: false },
      { data: 'hours', type: 'numeric', allowInvalid: false },
    ],
    afterChange: (change, source) => { handleHOTChanges('prequote', change, source); },
    beforeRemoveRow: (index, amount, visualSource) => { handleHOTDelete('prequote', visualSource); },
    preventOverflow: 'horizontal',
    stretchH: 'all',
  });
}

// Req uests different action types from the database based on GET getActions?actionType parameter
function getAction(type) {
  hh.xhrGet(`${preRoute}getActions?actionType=${type}`, (stat, tbl) => {
    if (stat === 'ERROR') throw new UserException(`Error fetching ${type} actions`);
    data.DD.dispositionTypes.toVal(tbl, 'disposition_type_iddisposition_type');
    data.DD.packages.toVal(tbl, 'package_idpackage');
    data[type] = tbl;
    xhrTotalActions--;
    if (xhrTotalActions === 0) buildHot();
  });
}

// Runs wafter window load after the dropdown types have been successsfully queried
function getActions() {
  xhrTotalActions = 4;
  getAction('prequote');
  getAction('technical');
  getAction('RFP');
  getAction('PO');
}

// First script executed.  On load of DOM
window.onloadScript = () => {
  // Activate first tab
  document.getElementsByClassName('tablinks')[0].click();
  // GET queries for the dropdown types
  // Disposition Types
  xhrTotalDropdown = 2;
  hh.xhrGet(`${preRoute}getTable?table=disposition_type`, (stat, tbl) => {
    if (stat === 'ERROR') throw new UserException('Error fetching disposition_types');
    tbl.sort((a, b) => {
      return a.iddisposition_type - b.iddisposition_type;
    });
    data.DD.dispositionTypes = new hh.dropdownRef(tbl, 'iddisposition_type', 'name');
    xhrTotalDropdown--;
    if (xhrTotalDropdown === 0) getActions();
  });

  // Packages
  hh.xhrGet(`${preRoute}getTable?table=package`, (stat, tbl) => {
    if (stat === 'ERROR') throw new UserException('Error fetching packages');
    tbl.sort((a, b) => {
      const nameA = a.name.toUpperCase(); // ignore upper and lowercase
      const nameB = b.name.toUpperCase(); // ignore upper and lowercase
      if (nameA < nameB) { return -1; }
      if (nameA > nameB) { return 1; }
      return 0;
    });
    data.DD.packages = new hh.dropdownRef(tbl, 'idpackage', 'name');
    xhrTotalDropdown--;
    if (xhrTotalDropdown === 0) getActions();
  });
};

window.onload = window.onloadScript;

window.onresizeScript = () => {
  const div = document.getElementById('data-body');
  console.log(`DIV: ${div.clientWidth} x ${div.clientHeight}`);
  data.HOT.prequote.updateSettings({ width: div.clientWidth, height: div.clientHeight });
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
