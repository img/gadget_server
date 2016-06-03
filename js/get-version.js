RM.Event.subscribe(RM.Event.ARTIFACT_SELECTED, onSelection);

function onSelection(selectionInfo) {
    // deal with one at a time for now
    if (selectionInfo.length ==1) {
        var version = getVersion(selectionInfo[0]);
    } else {
        setVersionUI('');
    }
}

function getVersion(artefactRef) {
    RM.Data.getAttributes(artefactRef, [RM.Data.Attributes.MODIFIED_ON, RM.Data.Attributes.IDENTIFIER], renderVersion);
}

var ver_id;

/*var btn = document.getElementById("copytoclipboard");
btn.addEventListener("click", clickHandler, false);
btn.addEventListener("copy", copyHandler, false);

function clickHandler(e) {
  e.target.dispatchEvent(new ClipboardEvent("copy"));
}

function copyHandler(e) {
  e.clipboardData.setData("text/plain", "hello world");

  // CRITICAL: Must call `preventDefault();` to get this data into the system/desktop clipboard!!!
  e.preventDefault();
} 
*/


/*$('copytoclipboard').click(function(e) {
        var clip = new ClipboardEevnt("copy");
        clip.clipboardData.setData("text/plain", ver_id);

        e.target.dispatchEvent(clip);
    });
*/

function setVersionUI(str) {
    $('#versionUI').html(str);
}


function renderVersion(result) {
    var attributes = result.data[0];
    var lastModifiedAttr = attributes.values[RM.Data.Attributes.MODIFIED_ON];
    var art_id = attributes.values[RM.Data.Attributes.IDENTIFIER];
    ver_id = "<i>" + art_id + "</i>:<b>" + lastModifiedAttr.getTime() + "</b>";
    setVersionUI(ver_id);
}

