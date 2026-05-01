/* Library page script.
   Depends on jQuery being loaded first.
   Expects a <div id="svis-config" data-artifacts-url="..."> element in the DOM
   (rendered by the Django template) to supply the artifacts static URL. */

var ARTIFACTS_URL = document.getElementById('svis-config').dataset.artifactsUrl;
var csrftoken = jQuery("[name=csrfmiddlewaretoken]").val();

var selections = [];

var RenderSelections = function()
{
  if (selections.length > 0)
  {
    $("#cselection").prop('disabled', false);
    $("#dselection").prop('disabled', false);
    $("#rselection").prop('disabled', false);
  }
  else
  {
    $("#cselection").prop('disabled', true);
    $("#dselection").prop('disabled', true);
    $("#rselection").prop('disabled', true);
  }

  let table = document.createElement('table');
  let b = document.createElement('tbody');
  table.appendChild(b);

  selections.forEach(function (uuid) {

    let r = document.createElement('tr');
    b.appendChild(r);

    let d = document.createElement('td');
    r.appendChild(d);

    console.log("XXXXXX ", uuid);
    if (uuid != 'none')
    {
      img = document.createElement('img');
      img.setAttribute('src', ARTIFACTS_URL + uuid + '/thumbnail.png');
      img.setAttribute('alt', '(none)');
      img.setAttribute('onerror', 'this.onerror=null');
      img.setAttribute('width', '100');
    }

    d.appendChild(img);

    d = document.createElement('td');
    r.appendChild(d);

    inpt = document.createElement('input');
    inpt.setAttribute('type', 'button');
    inpt.setAttribute('value', 'Remove');
    inpt.setAttribute('onclick', 'RmSelection("' + uuid + '");');

    d.appendChild(inpt);

  });

  document.getElementById('selectionDiv').innerHTML = '';
  document.getElementById('selectionDiv').appendChild(table);
}

var hideArtifact = function(ev)
{
  var uuid = ev.dataTransfer.getData("uuid");
  var url = '/library/hideArtifact/' + uuid;
  $.ajax({
   url: url,
     success: function(data) { ShowArtifacts(); },
     failure: function(data) { alert("failed"); }
  });
}

var downloadArtifact = function(ev)
{
  a = document.createElement("a");
  a.href = '/library/downloadartifact/' + ev.dataTransfer.getData("uuid");
  a.setAttribute("download", "Will not be used");
  a.click();
}

var selectedArtifact = function(ev, uuid)
{
}

var allowDropArtifact = function(ev)
{
  ev.preventDefault();
}

var dropArtifact = function(ev)
{
  ev.preventDefault();
  var uuid = ev.dataTransfer.getData("uuid");
  var host = ev.dataTransfer.getData("host");
  if (host != location.host)
  {
    var url = '/library/pullFromRemoteLibrary/' + host + '/' + uuid;
    $.ajax({
     url: url,
       success: function(data) { ShowArtifacts(); },
       failure: function(data) { alert("failed"); }
    });
  }
}

var exportArtifact = function(ev)
{
  if (document.getElementById('dropDir').value == '(required)' || document.getElementById('dropName').value == 'required')
    alert("got to give me a destination directoty and name");
  else
  {
    ev.preventDefault();
    var uuid = ev.dataTransfer.getData('uuid');
    var destination = document.getElementById('dropDir').value + '/' + document.getElementById('dropName').value;
    var url = '/library/copyArtifactLocal/' + destination + '/' + uuid;
    $.ajax({
       url: url,
       success: function(data) { document.getElementById('dropName').value = '(required)'; },
       failure: function(data) { alert("failed"); }
    });
  }
}

var sendArtifact = function(event, uuid)
{
  event.dataTransfer.setData("uuid", uuid);
  event.dataTransfer.setData("host", location.host);

  let dataForIframe = {
    'uuid': uuid,
    'host': location.host,
  };

  window.parent.postMessage(JSON.stringify(dataForIframe), window.location.origin);
}

var artifact_type = 'glyph';

var ShowFamily = function(i)  {
  $.get('/library/showtypefamily/' + artifact_type + '/' + i, "", function(data){  $('div[name="grid"]').html(data); }, "html");
};

var ShowClass = function(i)  {
  $.get('/library/showtypeclass/' + artifact_type + '/' + i, "", function(data){  $('div[name="grid"]').html(data); }, "html");
};

var ShowArtifacts = function() {
  $.get('/library/showtype/' + artifact_type, "",
    function(data) {
      g = $('div[name="grid"]');
      g.html(data);
    }, "html");
}

var lastType;

var ShowType = function(me)  {
  if (lastType)
    lastType.style.backgroundColor = "#A1998F";
  lastType = me;
  me.style.backgroundColor = "lightgrey";

  artifact_type = me.innerHTML;
  ShowArtifacts();
}

$(document).ready(function()
{
  ShowType(document.getElementById("glyphs_menu_item"));
});
