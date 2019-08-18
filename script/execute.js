var logOut = [];
var errorOut = [];

const editor = CodeMirror.fromTextArea(document.getElementById("code"), {
	lineNumbers: true,
	theme: 'base16-dark',
	extraKeys: {"Ctrl-Space": "autocomplete"},
	mode: {name: "javascript", globalVars: true}
});

const loadScript = function() {
	var code=localStorage.getItem('code');
	if (code) {
		editor.setValue(code);
	}
}

const saveScript = function() {
	var code = editor.getValue();
	localStorage.setItem('code', code);
    console.log("Saved in local storage");
	printConsole();
}

const removeScript = function() {
	localStorage.removeItem('code');
	window.location.reload();
}

// load on startup
loadScript();

const clearConsole = function() {
	logOut=[];
	errorOut=[];
	printConsole();
};

const printConsole = function() {
	var consoleOutput=document.getElementById("console-out");
	consoleOutput.innerHTML=logOut.join("\n");
	
	var errorCard=document.getElementById("error-card");
	errorCard.style.display = errorOut.length > 0 ? "block" : "none";
	
	var errorOutput=document.getElementById("error-out");
	errorOutput.innerHTML=errorOut.join("\n");	
}

const execute = function() {
	
	console.log("Executing code:");
	
	clearConsole();
	var code = editor.getValue();
	
	try {
		eval(code); 
	} catch (e) {
		console.error(e.message +" [line "+e.lineNumber+", column "+e.columnNumber+"]");
	}
	
	printConsole();
};

// Capture console log and error output

var originalConsoleLog = console.log;
var originalConsoleError = console.error;

console.log = function(msg) {
    logOut.push(msg);
    originalConsoleLog.apply(null, arguments);
}
console.error = function(msg) {
    errorOut.push(msg);
    originalConsoleError.apply(null, arguments);
}

// Save action
document.addEventListener("keydown", function(e) {
  if ((window.navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey) && e.keyCode == 83) {
    e.preventDefault();
	saveScript();
  }
}, false);
