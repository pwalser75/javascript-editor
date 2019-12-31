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

function displayScript(script) {
	clear();
	currentScript = script;
	editor.setValue(script.script);
	updateScriptName();
}

function updateScriptName(script) {
	var scriptName = document.getElementById("script-name");
	scriptName.innerHTML=currentScript.name? `&laquo;${currentScript.name}&raquo;` : 'unnamed script';
}

function updateScriptList() {
	var scriptList = document.getElementById("script-list");
	scriptList.innerHTML = "";
	for (var script of scripts) {
		var item = createScriptElement(script);
		scriptList.appendChild(item);
	}
}

function createScriptElement(script) {
	var datetime = new Date(script.lastSaved);
	
	var item = new HTMLBuilder("li")
		.attribute("onClick", "loadScript("+script.id+")")
		.attribute("style", "cursor:pointer");
	
	var actions = item.element("div").attribute("class", "pull-right");
	actions.element("i")
		.attribute("title", "rename")
		.attribute("class", "fa fa-edit label-orange")
		.attribute("onClick", "renameScript("+script.id+")");
	actions.text("\u00A0");
	actions.element("i")
		.attribute("title", "delete")
		.attribute("class", "fa fa-remove label-red")
		.attribute("onClick", "deleteScript("+script.id+")");
	
	item.element("strong").text(script.name);
	item.element("br");
	item.element("small").text("last saved: "+datetime.toLocaleDateString()+" "+datetime.toLocaleTimeString());
	return item.node;
}

function runScript() {
	
	clear();
	var code = editor.getValue();
	
	try {
		eval(code); 
	} catch (e) {
		console.error(e.message +" [line "+e.lineNumber+", column "+e.columnNumber+"]");
	}
};

function clear() {
	clearConsole();
	clearPlaceholder();
}

function init() {
	
	const charCode = c => c.charCodeAt(0);
	const ctrlPressed = e => window.navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey;
	const shiftPressed = e => e.shiftKey;
	
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
	  if (ctrlPressed(e) && shiftPressed(e) && e.keyCode == charCode('Q')) {
		e.preventDefault();
		var clipboardText=document.getElementById("clipboard-text");
		clipboardText.innerHTML=JSON.stringify(editor.getValue());
		clipboardText.select();
		document.execCommand("copy");
		clipboardText.innerHTML='';
	  }
	}, false);

	loadScripts();
	loadTutorials();
	var latestScript = getLatestScript();
	displayScript(latestScript? latestScript : getDemoScript());
}

function getDemoScript() {
	return { script: `const now = () => new Date().toLocaleTimeString();
const format = text => now() + " | " + text;
const log = message => console.log(format(message));

var names = ["World", "Galaxy", "Universe"];

for (var name of names) {
	log("Hello "+name); 
}`};
}

function newScript() {
	displayScript( { script: "" } );
}

function getLatestScript() {
	scripts.sort((a, b) => (a.lastSaved < b.lastSaved) ? 1 : -1);
	return scripts && scripts.length > 0 ? scripts[0]  : null;
}

function loadScripts() {
	if (!localStorageAvailable()) return;
	var stored=localStorage.getItem('scripts');
	scripts=stored? JSON.parse(stored) : [];
	updateScriptList();
}

//	localStorage.removeItem('scripts');
	
function saveScripts() {
	if (!localStorageAvailable()) return;
	
	// sort by last saved, descending
	scripts.sort((a, b) => (a.lastSaved < b.lastSaved) ? 1 : -1)
	
	localStorage.setItem('scripts', JSON.stringify(scripts));
	updateScriptList();
}

function saveScript() {
	if (!localStorageAvailable()) return false;

	currentScript.script = editor.getValue();
	
	if (!currentScript.name || !currentScript.id) {
		var input = prompt("Please enter a name for the script", currentScript.name);
		if (!input) {
			return false;
		}
		currentScript.name = input;
	}
	if (!currentScript.id) {
		currentScript.id = getNextScriptId();
		scripts.push(currentScript);
	}
	currentScript.lastSaved=new Date().getTime();
	saveScripts();
	updateScriptName();
	return true;
}

function loadScript(id) {
	var script = getScript(id);
	if (!script) return;
	displayScript(script);
};

function renameScript(id) {
	var script = getScript(id);
	var input = prompt("Please enter a new name for the script", script.name);
	if (!input) return;
	script.name = input;
	saveScripts();
	updateScriptName();
};

function deleteScript(id) {
	var script = getScript(id);
	if (confirm(`Do you really want to delete the script '${script.name}'?`)) {
		script.id=null;
		script.lastSaved=null;
		scripts.splice(scripts.indexOf(script),1);
		saveScripts();
	}
};

function downloadScript() {
	if (!saveScript()) {
		return;
	}
	download(currentScript.name+'.js', "application/javascript", currentScript.script);
}

function downloadZIP() {
	if (scripts.length == 0) {
		return;
	}
	if (!saveScript()) {
		return;
	}
	var zip = new JSZip();
	var dir = zip.folder('scripts');

	for (var script of scripts) {
		dir.file(fileName(script.name+'.js'), script.script);
	}
	// see FileSaver.js
	zip.generateAsync({type:"blob"})
		.then(content => saveAs(content, 'scripts.zip'));
}

function fileName(name) {
	if (!name) {
		return name;
	}
	return name
	.replace('/', '-')
	.replace('\\', '-')
	.replace('\t', ' ')
	.replace('\n', ' ')
	.replace('\r', '')
	.replace('\"', '\'');
}

function download(filename, mimeType, text) {
	var blob = new Blob([text], {type: mimeType});
	saveAs(blob, fileName(filename));
}

function getScript(id) {
	return scripts.find(script => script.id === id);
};

function getNextScriptId() {
	var id = 1;
	for (var script of scripts) {
		if (script.id >= id) {
			id = script.id + 1;
		}
	}
	return id;
}

function loadTutorials() {
	var tutorialList = document.getElementById("tutorial-list");
	tutorialList.innerHTML = "";
	for (var tutorial of tutorials) {
		var item = createTutorialElement(tutorial);
		tutorialList.appendChild(item);
	}
}
function loadTutorial(id) {
	var tutorial = tutorials.find(t => t.id === id);
	if (tutorial) {
		var script = {
			name: tutorial.name,
			script: tutorial.script
		};
		displayScript(script);
	}
}

function createTutorialElement(tutorial) {
	
	var item = new HTMLBuilder("li")
		.attribute("onClick", "loadTutorial("+tutorial.id+")")
		.attribute("style", "cursor:pointer");
	
	item.element('strong').text(tutorial.name);
	item.element('br');
	item.element('small').text(tutorial.description);
	return item.node;    
}

function localStorageAvailable() {
	try {
		return localStorage;
	} catch (e) {
		return false;
	}
}

function clearPlaceholder() {
	var placeholder = document.getElementById("placeholder");
	placeholder.innerHTML="";
}

// class to simplify DOM manipulation
class HTMLBuilder {
  
	constructor(node) {
	  this.node = typeof node == "string" ? document.createElement(node) : node;
	}
	
	element(elementName) {
	  var element = document.createElement(elementName);
	  this.node.append(element);
	  return new HTMLBuilder(element);
	}
	
	text(text) {
	  this.node.append(document.createTextNode(text));
	  return this;
	}
	
	attribute(key, value) {
	  this.node.setAttribute(key,value);
	  return this;
	}
	
	clear() {
	  this.node.innerHTML="";
	  return this;
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
	  "name": "#3 Guess number",
	  "description": "Guess a number between 1 and 100",
	  "script": "var number = Math.ceil(Math.random() * 100);\nvar found = false;\nvar message = \"Guess a number between 1 and 100\";\n\nwhile (!found) {\n    var input = prompt(message);\n    var guess = Number.parseFloat(input);\n\n    if (guess < number) {\n        message = \"Larger than \"+guess;\n    } else if (guess > number) {\n        message = \"Smaller than \"+guess;\n    } else if (guess) { // check if there was any input at all\n        found = true;\n    }\n}\nalert(\"Exactly, the number is \"+number);\n"
	},
	{
	  "id": 4,
	  "name": "#4 HTML/DOM",
	  "description": "Manipulating HTML in the browser",
	  "script":"// Example data: some movies\nconst movies = [\n  { \n    title: \"Blade Runner\", \n    year: 1982, \n    genres: ['Sci-Fi', 'Thriller']\n  },\n  { \n    title: \"The Cabin in the Woods\", \n    year: 2012, \n    genres: ['Fantasy', 'Horror', 'Mistery'] \n  },\n  { \n    title: \"Back to the Future\", \n    year: 1985, \n    genres: ['Adventure', 'Comedy', 'Sci-Fi'] \n  }\n];\n\nclass HTMLBuilder {\n  \n\tconstructor(node) {\n\t  this.node = typeof node == \"string\" ? document.createElement(node) : node;\n\t}\n\t\n\telement(elementName) {\n\t  var element = document.createElement(elementName);\n\t  this.node.append(element);\n\t  return new HTMLBuilder(element);\n\t}\n\t\n\ttext(text) {\n\t  this.node.append(document.createTextNode(text));\n\t  return this;\n\t}\n\t\n\tattribute(key, value) {\n\t  this.node.setAttribute(key,value);\n\t  return this;\n\t}\n\t\n\tclear() {\n\t  this.node.innerHTML=\"\";\n\t  return this;\n\t}\n}\n\n// render the movies as HTML\nfunction createMovieList() {\n  var placeholder = document.getElementById(\"placeholder\");\n  var builder = new HTMLBuilder(placeholder);\n  \n  var list = builder.element('ul');\n  for (var movie of movies) {\n    var item = list.element('li');\n    item.element('b').text(movie.title);\n    item.element('br');\n    item.text(movie.year).text(' | ')\n    item.element('i').text(movie.genres.join(', '));\n  }\n  placeholder.append(list.node);\n}\n\ncreateMovieList();\n"
	}
];
