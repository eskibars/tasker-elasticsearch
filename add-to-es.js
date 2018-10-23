var esServer = par[0];
if (esServer.substr(esServer.length - 1) !== "/") {
    esServer = esServer + "/";
}
setLocal('%esserver', esServer);
setLocal('%authinfo', par[1]);
var indexPrefix = "tasker";

var d = new Date();
var dateStr = d.toISOString().slice(0,10);

var intVars = { battery: '%BATT', cell_signal_strength: '%CELLSIG',
                                      display_brightness: '%BRIGHT', light_level: '%LIGHT',
                                        uptime: '%UPS', free_memory: '%MEMF', pedometer: '%STEPSTAKEN'
                                    };
var doubleVars = { altitude: '%LOCALT', magnetic_strength: '%MFIELD', temperature: '%TEMP' };
var booleanVars = { bluetooth_on: '%BLUE', locked: '%KEYG', muted: '%MUTED', speakerphone: '%SPHONE',
                                      wifi_enabled: '%WIFI', wimax_enabled: '%WIMAX', screen_on: '%SCREEN', roaming: '%ROAM',
airplane_mode: '%AIR'
                                    };
var keywordVars = { bluetooth_on: '%BLUE', cell_network: '%TNET', device: '%DEVID', device_id: '%DEVTID' };

postData = { timestamp: d.toISOString() };
template = { timestamp: { type: 'date' } };

for (var i in keywordVars) {
  var res = global(keywordVars[i]);
  if (typeof(res) !== 'undefined') {
      postData[i] = res;
  }
  template[i] = { type: 'keyword' };
}

for (var i in booleanVars) {
  var res = global(booleanVars[i]);
  if (typeof(res) !== 'undefined' && res !== '') {
      postData[i] = (res === 'true' || res === 'on');
  }
  template[i] = { type: 'boolean' };
}

for (var i in intVars) {
  var res = global(intVars[i]);
  if (typeof(res) !== 'undefined' && res !== '') {
      if (res >= 0) {
        postData[i] = parseInt(res);
    }
  }
  template[i] = { type: 'long' };
}

for (var i in doubleVars) {
  var res = global(doubleVars[i]);
  if (typeof(res) !== 'undefined' && res !== '') {
      if (res !== 0) {
        postData[i] = parseFloat(res);
    }
  }
  template[i] = { type: 'double' };
}

template['location'] = { type: 'geo_point' };
if (getLocation('any', true, 30)) {
  var loc = global('%LOC');
    var latlon = loc.split(',');
    postData['location'] = { 'lat': parseFloat(latlon[0]), 'lon': parseFloat(latlon[1]) };
}

template['song'] = { type: 'text' };
template['music_playing'] = { type: 'boolean' };
if (global('%ARTIST') !== '' && global('%TRACK') !== ''
   ) {
      postData['music_playing'] = (global('%ISPLAYING') === 'true' || global('%ISPLAYING') === true);
      if (postData['music_playing'] === true) {
          postData['song'] = global('%ARTIST') + ' - ' + global('%TRACK');
        }
} else {
    if (global('%ISPLAYING') === 'false' || global('%ISPLAYING') === false) {
      postData['music_playing'] = false;
    }
}

var wifii = global('%WIFII');
if (typeof(wifii) !== 'undefined' && res !== '') {
    var wifiarr = wifii.split("\n");
    if (wifiarr[0] === '>>> CONNECTION <<<') {
        postData['wifi_name'] = (wifiarr[2]).slice(1,-1);
    }
    template['wifi_name'] = { type: 'keyword' };
}

var jsondocstring = JSON.stringify(postData);
var indexName = indexPrefix + '-' + dateStr;
indexType = 'doc';
setLocal('%jsondocbulkheader', JSON.stringify({ "_index": indexName, "_type": indexType}));
setLocal('%jsondocstring',jsondocstring);

var xhrTemplate = new XMLHttpRequest();
xhrTemplate.open("PUT", esServer + "_template/" + indexPrefix, false);
xhrTemplate.setRequestHeader("Content-type", "application/json");
if (typeof(par[1]) !== 'undefined') {
    xhrTemplate.setRequestHeader("Authorization", "Basic " + btoa(par[1]));
}
var templateString = JSON.stringify({ template: indexPrefix + '-*', mappings: { doc: { properties: template } } });

try {
xhrTemplate.send(templateString);
} catch (e) { }
try {
var xhrDoc = new XMLHttpRequest();
xhrDoc.open("POST", esServer + indexName + '/' + indexType, false);
xhrDoc.setRequestHeader("Content-type", "application/json");
if (typeof(par[1]) !== 'undefined') {    xhrDoc.setRequestHeader("Authorization", "Basic " + btoa(par[1]));
}

xhrDoc.send(jsondocstring);
setLocal('%sentdoc','1');
} catch (e) { }
exit();
