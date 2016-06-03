// Display status updates in the extension
function println(msg) {
	if (msg==null) {	// special reset arg
		 divStatus.innerHTML="";
	}
	else {
		// Scrolling last 5 lines status history 
		var s = divStatus.innerHTML;
		var lines = s.split("<br>");
		if (lines.length>5) {
			s="";
			var i;
			for (i=lines.length-5; i<lines.length; ++i)
				if (lines[i].length>0)
					s+=lines[i]+"<br>";
		}
		divStatus.innerHTML=s+msg+"<br>";
	}
}


var initialDialog  =""; 
var blah ="<table class=innerTable><tr><th colspan=2>Operations</th></tr><tr><td><input type=radio name=impexp value=import>Import</td><td><input type=radio name=impexp value=export>Export</td></tr><tr><td colspan=2 align=right><button id=cancel>Cancel</button></td><td><button id=ok>Ok</button></td></tr></table>";

// TODO: file select
var importDialog   = "<table class=innerTable><tr><th colspan=2>Import Options </th></tr>"
					+"<tr><td colspan=2><input type=radio name=imprad value=opt1>Option1</td></tr>"
					+"<tr><td colspan=2><input type=radio name=imprad value=opt2>Option2</td></tr>"
					+"<tr><td colspan=2 align=right><button id=cancel>Cancel</button></td><td><button id=ok>Ok</button></td></tr></table>";
var exportDialog   = "<table class=innerTable><tr><th colspan=2>Export Options</th></tr>"
					+"<tr><td colspan=2 align=right><button id=cancel>Cancel</button></td><td><button id=ok>Ok</button></td></tr></table>";

var currentOpArgs=null;					

function onCancel() {
	currentOpArgs=null;
	placeHolder.innerHTML=initialDialog;	
	//$("#unsubscribe").on("click", onUnsubscribeClick);
	//$("#cancel").empty();
	//$("#ok").empty();
}

function onOK() {
	printRefs(currentOpArgs.refs, currentOpArgs.op+" submit")
	onCancel();
}		
		

function onImport(args) {
	placeHolder.innerHTML=importDialog;	
	currentOpArgs=args;
	currentOpArgs.op="IMPORT";
	$("#cancel").on("click", onCancel);
	$("#ok").on("click", onOK);
	
	if (args.moduleUrl) {
		var ref=new RM.ArtifactRef(args.moduleUrl, args.componentURI);
		currentOpArgs.refs=ref
		printAndLogArtifactRefs(ref, "onImport")
	}
	else println("onImport");
	console.log("onImport:\n"+toString(args));	
}

function onExport(args) {
	placeHolder.innerHTML=exportDialog;
	currentOpArgs=args;
	currentOpArgs.op="EXPORT";
	$("#cancel").on("click", onCancel);
	$("#ok").on("click", onOK);
	
	// The passed view RDF XML defines the resource(s) being exported.  
	// As a very crude demonstration of this, parse out the resource uris from the view. 
	// **This is demo - pretty unsafe xml parsing!**
	var artifactRefs=[], str=args.viewDefinition, len=str.length;
	var found, ch, sos, eos;  // start-of-string, end-of-string
	for (var hit, cur=-1; (hit=str.indexOf("/resources/", cur+1))>=0; cur=hit) {
		for (found=false, sos=hit; sos>=0 && (ch=str.charAt(sos))>' ' && (ch!='h' ||!(found=(str.substr(sos,8)=="https://"))); --sos);
		if (found) {
			for (eos=hit; eos<len && (ch=str.charAt(eos))>' ' && ch!='\"' && ch!='&'; ++eos);
			if (eos<len) {
				var uri=str.substr(sos, eos-sos);
				artifactRefs.push(new RM.ArtifactRef(uri, args.componentURI));
			}
		}
	}
	if (artifactRefs.length>0) {
		currentOpArgs.refs=artifactRefs
		printAndLogArtifactRefs(artifactRefs, "onExport")
		//console.log("onExport:\n"+objectToString(args));
	} 
	else {
		//console.log("onExport:\n"+objectToString(args));
		println("onExport");
	}
	console.log("onExport:\n"+toString(args));	
}

// Sample unsubscribe code
// Note1: that multiple handers can be associated with an event - they will all be called
// Note2: At unsubscribe time, you can specify an individual handler to unsubscribe (stop), or unsubsctibe all handlers of an event n one go.
// Note3: At gadget unload time, all handlers will be automatically unsubscribed
function onUnsubscribeClick() {
	RM.Event.unsubscribe(RM.Event.ARTIFACT_OPENED, onOpened1);		// Will unsubscribe this one callback, leaving onOpened still subscribed
	RM.Event.unsubscribe(RM.Event.ARTIFACT_CLOSED);					// Will unsubscribe all callbacks on the event, ie onClosed and onClosed1 both removed
	RM.Event.unsubscribe(RM.Event.ARTIFACT_SELECTED, onSelected1);	// Will unsubscribe both onSelected1 registrations, leaving onSelected
	println("unsubscribed onOpened1, onClosed, onClosed1, onSelected1");
}

// uses async getAttributes, so needs a callback for the reply
function getAttributes(refs, 	// The ref or refs[] to getAttributes for
					context, 	// The "this" context to invoke the callback in (can pass null if not required)
					callback, 	// The callback to invoke, passing the getAttributes reply to
					attrs) {	// Optional - an array of RM.Data.Attributes to fetch. Default is FORMAT, NAME, IDENTIFIER
	if (!refs || (Array.isArray(refs) && refs.length==0)) {
		var reply = { code:RM.OperationResult.OPERATION_OK, data:[] };
		if (context)
			 callback.bind(context)(reply);
		else callback(reply);
	}
	else {
		if (!Array.isArray(refs)) refs=[refs];
		if (!attrs) attrs=[RM.Data.Attributes.FORMAT,RM.Data.Attributes.NAME, RM.Data.Attributes.IDENTIFIER];
		context = { cb:callback, cbContext:context }	// Outer wrap the context, adding the callback
		RM.Data.getAttributes(refs, attrs, function(reply) {
			// 	reply.code:	retcode as a string (eg "OK")
			// 	reply.data[].ref: ref as passed in, use for eg attrs.data[].ref.uri
			// 	reply.data[].values: requested attributes as name/value properties
			
			if (reply.code !== RM.OperationResult.OPERATION_OK)
				reply.data=[];
			else if (!Array.isArray(reply.data))
				reply.data=[reply.data];		// Convert to array[1]

			if (this.cbContext)
				 this.cb.bind(this.cbContext)(reply);
			else this.cb(reply);
		}.bind(context));
	}
}



/******************************************************************************************************
// DEBUG / LOGGING HELPERS
******************************************************************************************************/

// Just log the top level property names contained in an object
function logKeys(name, obj) {
	var s="", keys=Object.getOwnPropertyNames(obj);	
	for (var k=0; k<keys.length; k++) 
		s+=','+keys[k];	 
	console.log(name+"={"+s.substr(1)+"}");
}


// In console.log friendly format, string out the eventArgs to see what we have to play with
// Intended to be object-agnostic, not rm-specific, but only tested on rm ref/refs objects
function toString(obj, _pfx, _depth) {	// Object to parse, and internal reserved state params
	if (_pfx==undefined) { 
		_pfx="";
		_depth=0;
	}
	else if (_depth>10)
		return _pfx+"<TO_DEEP>\n";
	
	var s="";
	if (Array.isArray(obj)) {
		if (obj.length==0)
			s+=_pfx+"=[]\n";
		else for (var i=0; i<obj.length; ++i) 
			s+=toString(obj[i], _pfx+'['+i+"].", _depth+1)
	}
	else if (typeof(obj)==="object") {
		var props=0;
		for (var property in obj) { 
			if (obj.hasOwnProperty(property)) {
				// Dojo objects have deep references normally of no interest:  
				if (property==="ownerDocument" || property==="ownerElement" || property==="parentNode" || property==="parentElement" || property==="firstChild"|| property==="lastChild")
					continue;
				try {
					var i, val = obj[property];
					// Always show everything at the root, then only non-null/non-undefined/non-empty-string values below (keep boolean false though)
					if (_depth==0 || (val!=null && val!=undefined && !(typeof(val)==="string" && val.trim().length==0))) {
						if ((i=property.lastIndexOf('/'))>=0)
							 property=property.substr(i+1);
						if (!val || Array.isArray(val) || typeof(val)!=="object")
							 s+=toString(val, _pfx+property, _depth+1)
						else s+=toString(val, _pfx+property+'.', _depth+1)
						props++;
					}
				}
				catch(e){//s+=e+"\n";
				}
			}
		}
		if (props==0) s+=_pfx+'='+obj+'\n';
	}
	else if (typeof(obj)==="function")
		 s+=_pfx+"=function\n";			// Just the function name, skip params and implementation
	else if (typeof(obj)==="boolean")
		 s+=_pfx+'='+obj+" (boolean)\n";	// Show boolean true different from "true" without inflicting messy quotes on all string values
	else s+=_pfx+'='+obj+'\n';
	return s;
}

	
// In console.log friendly format, string out an object
// Intended to be object-agnostic, not rm-specific, but only tested on rm ref/refs objects
function objectToString(obj, 				// Object to parse
						_pfx, _depth) { 	// All reserved, call with obj argument alone
	if (_pfx===undefined) { 
		_pfx="";
		_depth=0;
		if (obj===undefined) return "<undefined>\n";
		if (obj===null) return "<null>\n";
		if (obj==="") return "<empty string>";
	}
	if (obj===undefined) return "";	// skip empty properties
	if (obj===null) return "";		// skip empty properties
	if (obj=="" || obj==="") return "";		// skip empty properties
	if (typeof(obj)==="string" && obj.trim().length==0) return "";		// skip empty properties
	if (_depth++>10) return _pfx+"<TO_DEEP>\n";
		
	var i, s="";
		
	if (Array.isArray(obj))
		for (var j=0; j<obj.length; ++j) 
			s+=objectToString(obj[j], _pfx+'['+j+"].", _depth)
	else for (var property in obj) { 
		if (obj.hasOwnProperty(property)) {
			try {
				var val = obj[property];
				if (Array.isArray(val)) 
					if (val.length==0 || property==="_stateClasses" || property==="_attachPoints")
						s+=_pfx+property+"=[]\n";
					else for (var j=0; j<val.length; ++j) 
						s+=objectToString(val[j], _pfx+property+'['+j+"].", _depth)
				else if (typeof(val)==="object")
					if (property==="ownerDocument" || property==="ownerElement" || property==="parentNode" || property==="parentElement" || property==="firstChild"|| property==="lastChild")
						s+=_pfx+property+"=<object>\n";
					else s+=objectToString(val, _pfx+property+'.', _depth)
				else if (typeof(val)==="function")
					s+=_pfx+property+"=function\n";
				else if (typeof(val)==="string" && val.length==0)
					;
				else if ((i=property.lastIndexOf('/'))>=0)
					s+=_pfx+property.substr(i+1)+'='+val+'\n';
				else s+=_pfx+property+'='+val+'\n';
			}
			catch(e){//s+=e+"\n";
			}
		}
	}
	if (s.length==0) return _pfx+"<" + typeof(obj) + " has no properties>\n";
	return s;
}
	

// Display string for returned references, eg "M123" for ArtifactFormat=Module, ArifactID=123
// detail==0 ->  M123
// detail==1 ->  M123:Modname
// detail>=2 ->  https://artifact-uri Text:234 "artifact name"
function dataToString(data, detail) {
	var s = "";
	if (detail>1) 
		s=data.ref.uri+' ';
	
	var fmt = data.values[RM.Data.Attributes.FORMAT];
	if (fmt && fmt.length>0)
		if (detail<=1)
			s=fmt.charAt(0);	// M or T for Module, Text, ...
		else s+=fmt+':';
	
	s+=data.values[RM.Data.Attributes.IDENTIFIER];
	
	if (detail>0) {
		var name=data.values[RM.Data.Attributes.NAME];
		if (detail>1)
			if (name)
				s+=" \""+name+'\"';
			else s+=' '+name;
		else s+=':'+name
	}
	return s;
}
	
// Simple example using getAttributes to html print the passed refs attributes
function printRefs(refs, msgPrefix) {
	getAttributes(refs, {pfx:msgPrefix}, function(reply) {
		if (reply.data) {
			var s="", count=reply.data.length;
			for (var i=0; i<count; ++i)
				s+=';'+dataToString(reply.data[i], count==1?1:0);
			println(this.pfx +' '+s.substr(1));
		}		
		else println(this.pfx +' '+reply.code);
	});
}


// Fetches attributes for the refs, formats into appropriate strings, and print and logs them.
// refs: an RM.ArtifactRef, or array or RM.ArtifcactRef.
function printAndLogArtifactRefs(refs, msgPrefix) {
	console.log(msgPrefix+":\n"+toString(refs))
	getAttributes(refs, {pfx:msgPrefix}, function (reply){
		if (reply.data && reply.data.length>0) {
			var sPrint="", sLog="";
			var count=reply.data.length;
			for (var i=0; i<count; ++i) {
				sPrint+=';'+dataToString(reply.data[i], count==1?1:0);
				sLog+="\n   "+dataToString(reply.data[i], 9);
			}
			println(this.pfx+' '+sPrint.substr(1));	
			console.log(this.pfx+sLog.substr(count==1?3:0));	
		}
		else {
			println(this.pfx+" [] ("+reply.code+')');
			console.log(this.pfx+" [] ("+reply.code+')');	
		}
	});
}	

/******************************************************************************************************
// MAIN
******************************************************************************************************/


$(function() {
	// Invokes rm_feature.js RM.Event.subscribe, registering a callback function for the events
	RM.Event.subscribe("artifact.import.DSF", onImport);
	RM.Event.subscribe("artifact.export.DSF", onExport);		// eventName from gadget.xml
	RM.Event.subscribe(RM.Event.ARTIFACT_SAVED,    	function(refs){ printAndLogArtifactRefs(refs, "onSaved");    });
	RM.Event.subscribe(RM.Event.ARTIFACT_SELECTED, 	function(refs){ printAndLogArtifactRefs(refs, "onSelected"); });
	RM.Event.subscribe(RM.Event.ARTIFACT_OPENED, 	function(ref) { printAndLogArtifactRefs(ref,  "onOpened");   });	
	RM.Event.subscribe(RM.Event.ARTIFACT_CLOSED, 	function(ref) { printAndLogArtifactRefs(ref,  "onClosed");   });
	
	onCancel();	// Insert default/reset dialog html view

	console.log("extension loaded");
	println("loaded");
	// Note that there is no need to unsubscribe events onunload. This is done automatically.
});




