const FK = require('./ForeignKeyReference.js');
const HT = require('./HOTTable.js');

const reviewerSource = ['Joe', 'Mike'];
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
