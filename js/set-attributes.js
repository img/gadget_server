var currentArtifact;
// 1. Ask the server to tell me when an artifact is opened
RM.Event.subscribe(RM.Event.ARTIFACT_OPENED, requestFormat);

var boldButton = document.getElementById("embolden");
boldButton.onclick = requestPrimaryTextAndMakeBold;

// 2. When an artifact is opened 
function requestFormat(artifactRef) {
	// 2.1 Request the format of the artifact
	currentArtifact = artifactRef;
	RM.Data.getAttributes(artifactRef, RM.Data.Attributes.FORMAT, checkFormat);
}

// 2.2 When the format is available
function checkFormat(result) {
	var attributes = result.data[0];
	// 2.2.1 Check that the format is Text
	if (attributes.values[RM.Data.Attributes.FORMAT] === RM.Data.Formats.TEXT) {
		// 2.2.2 Enable the button
		document.getElementById("embolden").disabled = false;
	} else {
		document.getElementById("embolden").disabled = true;
	}
}

//  2.2.3 When that button is clicked :
function requestPrimaryTextAndMakeBold() {
	//     2.2.3.1 Request the Primary Text
	RM.Data.getAttributes(currentArtifact, RM.Data.Attributes.PRIMARY_TEXT, makeShallBold);
}

// 2.2.3.2 When the Primary Text is available 
function makeShallBold(result) {
	var attributes = result.data[0];
	var text = attributes.values[RM.Data.Attributes.PRIMARY_TEXT];
	//     2.2.3.2.1 Replace “shall” with bold version 
	text = text.replace(/shall/g, "<b>shall</b>");
	
	attributes.values[RM.Data.Attributes.PRIMARY_TEXT] = text;
	//     2.2.3.2.2 Write the updated Primary Text back to the server
	RM.Data.setAttributes(attributes, done);
}

function done(result) {
	console.debug("Done");
}
