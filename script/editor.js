var scripts = [];
var currentScript;

var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
	mode: {name: "javascript", globalVars: true},
	lineNumbers: true,
    lineWrapping: true,
	theme: 'base16-dark',
	viewportMargin: Infinity,
	extraKeys: {"Ctrl-Space": "autocomplete"}
});

const displayScript = function(script) {
	currentScript = script;
	editor.setValue(script.script);
	updateScriptName();
}

const updateScriptName = function(script) {
	var scriptName = document.getElementById("script-name");
	scriptName.innerHTML=currentScript.name? `&laquo;${currentScript.name}&raquo;` : 'unnamed script';
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
	
	const charCode = c => c.charCodeAt(0);
	const ctrlPressed = e => window.navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey;
	
	// Save action
	document.addEventListener("keydown", function(e) {
	  if (ctrlPressed(e) && e.keyCode == charCode('S')) {
		e.preventDefault();
		saveScript();
	  }
	}, false);

	// Execute action
	document.addEventListener("keydown", function(e) {
	  if (ctrlPressed(e) && e.keyCode == 13) {
		e.preventDefault();
		runScript();
	  }
	}, false);
	
	// Copy script as JSON
	document.addEventListener("keydown", function(e) {
	  if (ctrlPressed(e) && e.keyCode == charCode('Q')) {
		e.preventDefault();
		var clipboardText=document.getElementById("clipboard-text");
		clipboardText.innerHTML=JSON.stringify(editor.getValue());
		clipboardText.select();
		document.execCommand("copy");
	  }
	}, false);

	loadScripts();
	loadTutorials();
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
	
	if (!currentScript.name || !currentScript.id) {
		var input = prompt("Please enter a name for the script", currentScript.name);
		if (!input) return;
		currentScript.name = input;
	}
	if (!currentScript.id) {
		currentScript.id = getNextScriptId();
		scripts.push(currentScript);
	}
	currentScript.lastSaved=new Date().getTime();
	saveScripts();
	updateScriptName();
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
	updateScriptName();
};

const deleteScript = function(id) {
	var script = getScript(id);
	if (confirm(`Do you really want to delete the script '${script.name}'?`)) {
		script.id=null;
		script.lastSaved=null;
		scripts.splice(scripts.indexOf(script),1);
		saveScripts();
	}
};

const getScript = function(id) {
	return scripts.find(script => script.id === id);
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

const loadTutorials = function() {
	var tutorialList = document.getElementById("tutorial-list");
	tutorialList.innerHTML = "";
	for (var tutorial of tutorials) {
		var item = createTutorialElement(tutorial);
		tutorialList.appendChild(item);
	}
}
const loadTutorial = function(id) {
	var tutorial = tutorials.find(t => t.id === id);
	if (tutorial) {
		var script = {
			name: tutorial.name,
			script: tutorial.script
		};
		displayScript(script);
	}
}

const createTutorialElement = function(tutorial) {
	
	var item = document.createElement("li");
	item.setAttribute("onClick", "loadTutorial("+tutorial.id+")");
	item.setAttribute("style", "cursor:pointer");
		
	var name = document.createElement("strong");
	name.append(document.createTextNode(tutorial.name));
	item.append(name);
	item.append(document.createElement("br"));
	item.append(document.createTextNode(tutorial.description));
	return item;    
}

const localStorageAvailable = function() {
	try {
		return localStorage;
	} catch (e) {
		return false;
	}
}

const tutorials = [
	{
	  "id": 1,
	  "name": "#1 Hello World",
	  "description": "Input and output",
	  "script":"// prompt for user name and save the value in a variable called 'name'\nvar name = prompt(\"Hello, what's your name?\");\n\n// output the name to the console log\nconsole.log(\"Hello \" + name);\n"
	}, 
	{
	  "id": 2,
	  "name": "#2 Variables",
	  "description": "Variables and basic value types",
	  "script":"var text = \"Hello World\"; // a string (text) value. You can use single (') or double (\") quotes.\nvar number = 123.45; // a number value\n\n// calculate with numbers an variables\nvar a = 1 + 2;\nvar b = 15 / a;\nvar c = a + b;\nconsole.log(c);\n\n// concatenate strings and numbers\nvar firstname = \"Indiana\";\nvar lastname = \"Jones\";\nvar fullname = firstname + ' ' + lastname;\nvar age = 42;\nconsole.log(fullname+\", \"+age+\" years old\");"
	},
	{
	  "id": 3,
	  "name": "#2 HTML/DOM",
	  "description": "Manipulating HTML in the browser",
	  "script":"const movies = [\n  { \n    title: \"Blade Runner\", \n    year: 1982, \n    genres: ['Sci-Fi', 'Thriller'] \n  },\n  { \n    title: \"The Cabin in the Woods\", \n    year: 2012, \n    genres: ['Fantasy', 'Horror', 'Mistery'] \n  },\n  { \n    title: \"Back to the Future\", \n    year: 1985, \n    genres: ['Adventure', 'Comedy', 'Sci-Fi'] \n  }\n];\n\nconst createMovieList = function() {\n  var list = document.createElement(\"ul\");\n  for (var movie of movies) {\n    var item = document.createElement(\"li\");\n\tvar title = document.createElement(\"b\");\n    title.append(document.createTextNode(movie.title));\n    item.append(title);\n    item.append(document.createElement(\"br\"));\n    item.append(document.createTextNode(movie.year));\n    item.append(document.createTextNode(\"  | \"));\n    var genres = document.createElement(\"i\");\n    genres.append(document.createTextNode(movie.genres.join(', ')));\n    item.append(genres);\n    list.append(item);\n  }\n  return list;\n}\n\nvar placeholder = document.getElementById(\"placeholder\");\nplaceholder.innerHTML=\"\"; // clear content\nvar list = createMovieList();\nplaceholder.append(list);\n"
	}
];