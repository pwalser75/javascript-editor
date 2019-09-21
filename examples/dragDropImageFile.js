var placeholder = document.getElementById("placeholder");

placeholder.style.background = '#DDDDDD';
placeholder.style.height = '300px';

placeholder.addEventListener('drop', function(evt) {
  console.log('File(s) dropped:');
  evt.preventDefault();

  if (evt.dataTransfer.items) {
    for (var item of evt.dataTransfer.items) {
      if (item.kind === 'file') {
        dropFile(item.getAsFile());
      }
    }
  } else {
    for (var item of evt.dataTransfer.files) {
      dropFile(item);
    }
  }
});

placeholder.addEventListener('dragover', function(evt) {
  evt.preventDefault();
  placeholder.style.background='#AAAAAA';
});


placeholder.addEventListener('dragleave', function(evt) {
  evt.preventDefault();
  placeholder.style.background='#DDDDDD';
});

function dropFile(file) {
	console.log(`file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
	if (file.type.match(/image\/[a-z]+/i)) {
		previewFile(file);
	}
}

function previewFile(file) {
  console.log("Preview: "+file.name);
  let reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onloadend = function() {
    console.log("Loaded "+file.name);
    let img = document.createElement('img')
    img.src = reader.result
    placeholder.appendChild(img)
  }
}