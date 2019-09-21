var logOut = [];
var errorOut = [];

// Capture console log and error output

var originalConsoleLog = console.log;
var originalConsoleError = console.error;

console.log = function(msg) {
    logOut.push(msg);
    originalConsoleLog.apply(null, arguments);
	deferredOutput();
}
console.error = function(msg) {
    errorOut.push(msg);
    originalConsoleError.apply(null, arguments);
	deferredOutput();
}

function clearConsole() {
	logOut=[];
	errorOut=[];
	printConsole();
};

function printConsole() {
	var consoleOutput=document.getElementById("console-out");
	consoleOutput.innerHTML=logOut.join("\n");
	
	var errorCard=document.getElementById("error-card");
	errorCard.style.display = errorOut.length > 0 ? "block" : "none";
	
	var errorOutput=document.getElementById("error-out");
	errorOutput.innerHTML=errorOut.join("\n");	
}

function deferredOutput() {
	clearTimeout();
	setTimeout(printConsole, 50);
}

function currentTimeMs() {
	return new Date().getTime();
}