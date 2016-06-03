function respondWithWindowName(/*string*/ response) {
   alert("Setting window name to '" + response + "'");
   // Step #2: read the return URL
    debugger;
   var returnURL = window.name;
    alert("provider will redirect to " + returnURL);
    alert("window.name " + window.name);

   // Step #4: send the response via the window.name variable
   window.name = response;
    alert("window.name " + window.name);
    alert(window.location);
   // Step #5: indicate that user has responded
   window.location = returnURL;
}


var checkLoad = function() {
    document.readyState !== "complete" ? setTimeout(checkLoad,11) : respondWithWindowName("some_useful_information");
};

checkLoad();
