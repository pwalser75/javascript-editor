
	
var scripts = [];
var currentScript;

var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
	lineNumbers: true,
	theme: 'base16-dark',
	extraKeys: {"Ctrl-Space": "autocomplete"},
	mode: {name: "javascript", globalVars: true}
});

const displayScript = function(script) {
	currentScript = script;
	editor.setValue(script.script);
}

const updateScriptList = function() {
	var scriptList = document.getElementById("script-list");
	scriptList.innerHTML = "";
	for (var script of scripts) {
		var item = createScriptElement(script);
		scriptList.appendChild(item);
	}
}

const createScriptElement = function(script) {
	
	var item = document.createElement("li");
	item.setAttribute("onClick", "loadScript("+script.id+")");
	item.setAttribute("style", "cursor:pointer");
	
	var actions = document.createElement("div");
	actions.setAttribute("class", "pull-right");
	item.append(actions);
	
	var renameAction = document.createElement("i");
	renameAction.setAttribute("title", "rename");
	renameAction.setAttribute("class", "fa fa-edit label-orange");
	renameAction.setAttribute("onClick", "renameScript("+script.id+")");
	actions.append(renameAction);
	
	actions.append(document.createTextNode("\u00A0"));
	
	var deleteAction = document.createElement("i");
	deleteAction.setAttribute("title", "delete");
	deleteAction.setAttribute("class", "fa fa-remove label-red");	
	deleteAction.setAttribute("onClick", "deleteScript("+script.id+")");
	actions.append(deleteAction);
	
	var name = document.createElement("strong");
	name.append(document.createTextNode(script.name));
	item.append(name);
	item.append(document.createElement("br"));
	var datetime = new Date(script.lastSaved);
	item.append(document.createTextNode("last saved: "+datetime.toLocaleDateString()+" "+datetime.toLocaleTimeString()));
	return item;    
}


const runScript = function() {
	
	clearConsole();
	var code = editor.getValue();
	
	try {
		eval(code); 
	} catch (e) {
		console.error(e.message +" [line "+e.lineNumber+", column "+e.columnNumber+"]");
	}
};

const init = function() {
	
	// Save action
	document.addEventListener("keydown", function(e) {
	  if ((window.navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey) && e.keyCode == 83) {
		e.preventDefault();
		saveScript();
	  }
	}, false);

	// Execute action
	document.addEventListener("keydown", function(e) {
	  if ((window.navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey) && e.keyCode == 13) {
		e.preventDefault();
		runScript();
	  }
	}, false);

	loadScripts();
	var latestScript = getLatestScript();
	displayScript(latestScript? latestScript : getDemoScript());
}

const getDemoScript = function() {
	return { script: `const now = () => new Date().toLocaleTimeString();
const format = text => now() + " | " + text;
const log = message => console.log(format(message));

var names = ["World", "Galaxy", "Universe"];

for (var name of names) {
	log("Hello "+name); 
}`};
}

const newScript = function() {
	displayScript( { script: "" } );
}

const getLatestScript = function() {
	scripts.sort((a, b) => (a.lastSaved < b.lastSaved) ? 1 : -1);
	return scripts && scripts.length > 0 ? scripts[0]  : null;
}

const loadScripts = function() {
	if (!localStorageAvailable()) return;
	var stored=localStorage.getItem('scripts');
	scripts=stored? JSON.parse(stored) : [];
	updateScriptList();
}

//	localStorage.removeItem('scripts');
	
const saveScripts = function() {
	if (!localStorageAvailable()) return;
	
	// sort by last saved, descending
	scripts.sort((a, b) => (a.lastSaved < b.lastSaved) ? 1 : -1)
	
	localStorage.setItem('scripts', JSON.stringify(scripts));
	updateScriptList();
}

const saveScript = function() {
	if (!localStorageAvailable()) return;
	
	currentScript.script = editor.getValue();
	
	if (!currentScript.name) {
		var input = prompt("Please enter a name for the script");
		if (!input) return;
		currentScript.name = input;
	}
	if (!currentScript.id) {
		currentScript.id = getNextScriptId();
		scripts.push(currentScript);
	}
	currentScript.lastSaved=new Date().getTime();
	saveScripts();
}

const loadScript = function(id) {
	var script = getScript(id);
	if (!script) return;
	displayScript(script);
};

const renameScript = function(id) {
	var script = getScript(id);
	var input = prompt("Please enter a new name for the script", script.name);
	if (!input) return;
	script.name = input;
	saveScripts();
};

const deleteScript = function(id) {
	var script = getScript(id);
	scripts.splice(scripts.indexOf(script),1);
	saveScripts();
};

const getScript = function(id) {
	for (var script of scripts) {
		if (id===script.id) {
			return script;
		}
	}
	return undefined;
};

const getNextScriptId = function() {
	var id = 1;
	for (var script of scripts) {
		if (script.id >= id) {
			id = script.id + 1;
		}
	}
	return id;
}

const localStorageAvailable = function() {
	try {
		return localStorage;
	} catch (e) {
		return false;
	}
}