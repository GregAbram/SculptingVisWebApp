/**

*/

let canvas;

let inputImg;
let synthImg;
let loopImg;
let simMat;
let goodJumps;

let justRepeatCheckbox;
let jumpProbabilitySlider;
let goodJumpThreshSlider;
let minJumpSizeSlider;
let jumpProbabilityInput;
let goodJumpThreshInput;
let minJumpSizeInput;
let goalHeight = 2048;
let synthHeight = goalHeight * 5;

let simMatInitialized = false;
let simMatReady;
let synthReady;
let calcSimMatRow;
let maxDiff;

// width of the panels used in the output display
let traySize = 270;
let inputSize = 300;
let bgcol = 100;

function initSimMat() {
  calcSimMatRow = 0;
  maxDiff = 0.0;
  simMatReady = false;
  synthReady = false;
  inputImg.loadPixels();
  // create similarity matrix -- simMat[i,j] stores a value 0.0 to 1.0 for how similar the i-th row
  // of pixels in the inputImg is to the j-th row of pixels
  maxDiff = 0.0;
  simMat = new Array(inputImg.height);
  for (let i=0; i<inputImg.height; i++) {
    simMat[i] = new Array(inputImg.height);
    for (let j=0; j<inputImg.height; j++) {
      simMat[i][j] = 0.0;
    }
  }
  simMatInitialized = true;
}


// Needs to be recalculated whenever the inputImg changes
function calcOneRowOfSimMat() {
  if (!simMatInitialized) {
    initSimMat();
  }
  let i = calcSimMatRow;
  // removed the i forloop below in favor of computing one line at a time and displaying a progress bar, since this takes a while
  //for (let i=0; i<inputImg.height; i++) {
    //simMat[i] = new Array(inputImg.height);
    for (let j=0; j<inputImg.height; j++) {
      let diff = 0.0;
      // TODO: here, could go forward and backward by a couple rows to account for "temporal" structure
      //for (let jj=max(j-2,0); jj <= min(j+2,inputImg.height); jj++) {
        for (let c=0; c<inputImg.width; c++) {
					let indexi = (i*inputImg.width + c) * 4;
          let indexj = (j*inputImg.width + c) * 4;
          let ri = inputImg.pixels[indexi];
          let gi = inputImg.pixels[indexi + 1];
          let bi = inputImg.pixels[indexi + 2];
          let rj = inputImg.pixels[indexj];
          let gj = inputImg.pixels[indexj + 1];
          let bj = inputImg.pixels[indexj + 2];

          let brighti = ri; // (ri + gi + bi) / 3.0;
          let brightj = rj; // (rj + gj + bj) / 3.0;

          let rowDiff = pow(brighti - brightj, 2.0);
          if (rowDiff > 0) {
           	rowDiff = sqrt(rowDiff);
            diff += rowDiff;
          }
        }
      //}
      simMat[i][j] = diff;
      if (diff > maxDiff) {
        maxDiff = diff;
      }
    }
    //console.log("computing similarity [" + nfc(100.0*i/inputImg.height,2) + "%]");
  //}
	calcSimMatRow++;

  // Finished last row, do a bit of computation on the whole matrix now...
  if (calcSimMatRow >= inputImg.height) {

    //console.log('Normalizing and converting from difference to similarity. ' + maxDiff);
    // normalize and convert from "difference" to "similarity"
    for (let i=0; i<simMat.length; i++) {
      for (let j=0; j<simMat[i].length; j++) {
        simMat[i][j] = 1.0 - (simMat[i][j] / maxDiff);
      }
    }

    //console.log('Done computing similarity matrix.');
    simMatReady = true;
    synthesizeTexture();
  }

}


// utility func for synthesizeTexture
function copyRow(inputRow, synthRow) {
  for (let c=0; c<inputImg.width; c++) {
    synthImg.set(c, synthRow, inputImg.get(c, inputRow));
  }
}

// Needs to be recalculated whenever the slider parameters change
function synthesizeTexture() {
  synthReady = false;
  if (justRepeatCheckbox.checked()) {
    // create synth image and initialize with a random row from the input image
    synthImg = createImage(inputImg.width, inputImg.height);
    for (let r=0; r<synthImg.height; r++) {
      copyRow(r, r);
    }
    synthImg.updatePixels();

    loopImg = createImage(inputImg.width, goalHeight);
    for (let r=0; r<loopImg.height; r++) {
      for (let c=0; c<loopImg.width; c++) {
        loopImg.set(c, r, synthImg.get(c, r % synthImg.height));
      }
    }
    loopImg.updatePixels();
    synthReady = true;
  }
  else if (simMatReady) {
    //console.log('Computing good jumps for each row.');
    // Compute "good jumps" for each row
    goodJumps = new Array(inputImg.height);
    let thresh = goodJumpThreshSlider.value() / 100.0;
    for (let i=0; i<inputImg.height; i++) {
      goodJumps[i] = [];
      for (let j=0; j<simMat[i].length; j++) {
        if ((simMat[i][j] > thresh) && (abs(j-i) >= minJumpSizeSlider.value())) {
          goodJumps[i].push(j);
        }
      }
    }

    //console.log('Creating synth texture.');
    let rows = [];
    // create synth image and initialize with a random row from the input image
    synthImg = createImage(inputImg.width, synthHeight);
    let inputRow = floor(random(inputImg.height));
    let step = 1;
    for (let r=0; r<synthImg.height; r++) {
      copyRow(inputRow, r);
      rows[r] = inputRow;

      if ((goodJumps[inputRow].length > 0) && (random(100.0) <= jumpProbabilitySlider.value())) {
        // take (one of) the available good jumps
        let s = goodJumps[inputRow].length;
        let i = floor(random(goodJumps[inputRow].length));
        inputRow = goodJumps[inputRow][i];
      }
      else {
        // no fancy jump, just go to the next row
        inputRow += step;
        // if this would run off the bottom or top of the image, do something to save the day
        // new approach: just start over at the other side of the image -- should work well if the artist designed the
        // texture with this in mind.  A better idea for the future could be to check to find the first and last rows
        // in the image that have good jumps and then always take them.
        if (inputRow < 0) {
        	inputRow = inputImg.height-1;
        }
        else if (inputRow >= inputImg.height) {
        	inputRow = 0;
        }

        // orig: reversed direction, but turns out textures are often directional so bad idea.
        // could be made a toggle.
        //if ((inputRow < 0) || (inputRow >= inputImg.height)) {
        //  step = -step;
        //  inputRow += 2*step;
        //}
      }
      //console.log("synthesizing texture [" + nfc(100.0*r/synthImg.height,2) + "%]");
    }
    synthImg.updatePixels();


    //console.log("Creating loop texture.");
    // heuristic to make an output texture that loops.  find the best section of goal height
    let bestMatch = 0;
    let bestMatchVal = simMat[rows[0]][rows[goalHeight]];
    for (let r=1; r < synthImg.height - goalHeight; r++) {
      let matchVal = simMat[rows[r]][rows[r+goalHeight]];
      if (matchVal > bestMatchVal) {
        bestMatch = r;
        bestMatchVal = matchVal;
      }
    }
    loopImg = createImage(inputImg.width, goalHeight);
    for (let r=0; r<loopImg.height; r++) {
      for (let c=0; c<loopImg.width; c++) {
        loopImg.set(c, r, synthImg.get(c, bestMatch + r));
      }
    }
    loopImg.updatePixels();
    synthReady = true;
  }
}


function setup() {
  // create canvas
  canvas = createCanvas(1400, 700);
  // Add an event for when a file is dropped onto the canvas
  canvas.drop(gotFile);

  // Setup sliders for various parameters of the algorithm
  justRepeatCheckbox = createCheckbox('', true);
  justRepeatCheckbox.position(20, 40);
  justRepeatCheckbox.changed(updateTextParam);

  jumpProbabilitySlider = createSlider(0, 100, 10);
  jumpProbabilitySlider.position(20, 100);
  jumpProbabilitySlider.input(updateSliderParam);
  jumpProbabilityInput = createInput(jumpProbabilitySlider.value());
  jumpProbabilityInput.position(jumpProbabilitySlider.x + jumpProbabilitySlider.width + 10, jumpProbabilitySlider.y);
  jumpProbabilityInput.style('width', '24px');
  jumpProbabilityInput.input(updateTextParam);

  goodJumpThreshSlider = createSlider(0, 100, 95);
  goodJumpThreshSlider.position(20, 160);
  goodJumpThreshSlider.input(updateSliderParam);
  goodJumpThreshInput = createInput(goodJumpThreshSlider.value());
  goodJumpThreshInput.position(goodJumpThreshSlider.x + goodJumpThreshSlider.width + 10, goodJumpThreshSlider.y);
  goodJumpThreshInput.style('width', '24px');
  goodJumpThreshInput.input(updateTextParam);

  minJumpSizeSlider = createSlider(0, 100, 20);
  minJumpSizeSlider.position(20, 220);
  minJumpSizeSlider.input(updateSliderParam);
  minJumpSizeInput = createInput(minJumpSizeSlider.value());
  minJumpSizeInput.position(minJumpSizeSlider.x + minJumpSizeSlider.width + 10, minJumpSizeSlider.y);
  minJumpSizeInput.style('width', '24px');
  minJumpSizeInput.input(updateTextParam);

  texHeightInput = createInput(2048);
  texHeightInput.position(20, 280);
  texHeightInput.style('width', '60px');
  texHeightInput.input(updateTextParam);

  familyInput = createInput();
  familyInput.position(90, 380);
  familyInput.style('width', '120px');

  classInput = createInput();
  classInput.position(90, 410);
  classInput.style('width', '120px');

  let saveButton = createButton('Save to Library');
  saveButton.position(20, 440);
  saveButton.mousePressed(saveToLibrary);
}


let yOffset = 0;



function draw() {
  background(bgcol);

  noStroke();
  textSize(15);
  textAlign(LEFT);
  text('Nothing fancy -- just repeat it.', justRepeatCheckbox.x, 32);

  if (justRepeatCheckbox.checked()) {
    fill(150);
  }
  text('How often to jump around?', jumpProbabilitySlider.x, 92);
  text('How well do jumps have to match?', goodJumpThreshSlider.x, 152);
  text('Minimum jump size in pixels?', minJumpSizeSlider.x, 212);
  text(' of output texture?', texHeightInput.x, 272);

  fill(255);
  text("Family?", 20, familyInput.y+12);
  text("Class?", 20, classInput.y+12);


  stroke(255);
  canvas.strokeWeight(3);
  line(traySize, 0, traySize, canvas.height);
  canvas.strokeWeight(1);

  if (inputImg) {

    // draw the raw input image on left hand side
    let margin = 30;
    let inputStart = traySize;
    let synthStart = traySize + inputSize;
    let synthSize = canvas.width - synthStart;

    noStroke();
    textAlign(CENTER);
    text('Raw input (' + inputImg.width + "x" + inputImg.height + ")", inputStart + inputSize/2, margin/2);
    
    // draw at the native resolution, but will run off the bottom of the screen
    //image(inputImg, inputStart + inputSize/2 - inputImg.width/2, margin, inputImg.width, inputImg.height);

    // scale the image so the whole thing fits inside the window
    let h = canvas.height - 2*margin;
    let scale = h / inputImg.height;
    let w = scale * inputImg.width;
    image(inputImg, inputStart + inputSize/2 - inputImg.width/2, margin, w, h);

    if ((!simMatReady) && (!justRepeatCheckbox.checked())) { // calcSimMatRow < inputImg.height
      calcOneRowOfSimMat();
      textAlign(CENTER);
      text('Analyzing input image line by line...', synthStart + synthSize/2, canvas.height/2 - 35);
      stroke(0);
      canvas.strokeWeight(1);
      line(synthStart + synthSize/2 - 150, canvas.height/2,
           synthStart + synthSize/2 + 150, canvas.height/2);
      stroke(255);
      canvas.strokeWeight(10);
      let progressLen = 300.0 * calcSimMatRow / inputImg.height;
      line(synthStart + synthSize/2 - 150, canvas.height/2,
           synthStart + synthSize/2 - 150 + progressLen, canvas.height/2);
    }

    // draw the new synthesized image on the right hand side
    if (synthReady) {
      let step = loopImg.width + 10;
      let yTotal = canvas.height - margin;
      let y = 0; // carryover from previous column
      for (let x = synthStart + loopImg.width/2; x < canvas.width; x += step) {
        while (y < canvas.height) {
          image(loopImg, x, y, loopImg.width, loopImg.height);
          y += loopImg.height;
        }
        y -= canvas.height;
        while (y > 0) {
	        y -= loopImg.height;
        }
        y += margin;
      }

      fill(bgcol);
			rect(synthStart, 0, synthSize, margin);
      fill(255);
      noStroke();
      text('Synthesized, looping texture (' + loopImg.width + "x" + loopImg.height + ")",  synthStart + synthSize/2, 15);

    }
	}
	else {
    fill(255);
    noStroke();
    textSize(24);
    textAlign(CENTER);
    text('To start, drag and drop a tall input texture of a vertical line onto this canvas.', traySize + (canvas.width - traySize)/2, canvas.height / 2);
    text('The image width should be less than 256 pixels.  Height can be anything.', traySize + (canvas.width - traySize)/2, 30 + canvas.height / 2);
    text('The image can include an alpha channel if you want.', traySize + (canvas.width - traySize)/2, 60 + canvas.height / 2);
	}
}

function gotFile(file) {
  if (file.type === 'image') {
    inputImg = loadImage(file.data, newInputLoaded);
  }
  else {
    console.log('Not an image file!');
  }
}

function newInputLoaded() {
  //console.log('Loaded input texture (' + inputImg.height + 'x' + inputImg.width + ')');
  simMatInitialized = false;
  simMatReady = false;
  synthReady = false;
  synthesizeTexture();
}

function updateTextParam() {
  jumpProbabilitySlider.value(jumpProbabilityInput.value());
	goodJumpThreshSlider.value(goodJumpThreshInput.value());
  minJumpSizeSlider.value(minJumpSizeInput.value());
  if (parseInt(texHeightInput.value()) > 0) {
	  goalHeight = parseInt(texHeightInput.value());
  }
  synthesizeTexture();
}

function updateSliderParam() {
  jumpProbabilityInput.value(jumpProbabilitySlider.value());
	goodJumpThreshInput.value(goodJumpThreshSlider.value());
  minJumpSizeInput.value(minJumpSizeSlider.value());
  synthesizeTexture();
}


function keyTyped() {
  if (key === 's') {
    //saveAndDownload();
  }
}

function saveAndDownload() {
  // save in a vertical orientation:
  loopImg.save('synthesized-texture-vert', 'png');

	// save in a horizontal orientation:
  var img = createImage(loopImg.height, loopImg.width);
	img.loadPixels();
	for (let i=0; i < img.width; i++) {
    for (let j=0; j < img.height; j++) {
    	img.set(i, j, loopImg.get(j,i));
  	}
	}
	img.updatePixels();
  img.save('synthesized-texture-horiz', 'png');
}


function saveToLibrary() {

  let fd = new FormData();
  let names = []

  let name = 'vertical';
  fd.append(name + '_size', new Blob([JSON.stringify({'width': loopImg.width, 'height': loopImg.height})], {type: "text"}));
  fd.append(name + '_pixels', new Blob([loopImg.pixels], {'type': 'image/png'}));
  names.push(name);

	// save in a horizontal orientation:
  var horizImg = createImage(loopImg.height, loopImg.width);
	horizImg.loadPixels();
	for (let i=0; i < horizImg.width; i++) {
    for (let j=0; j < horizImg.height; j++) {
    	horizImg.set(i, j, loopImg.get(j,i));
  	}
	}
	horizImg.updatePixels();

  name = 'horizontal';
  fd.append(name + '_size', new Blob([JSON.stringify({'width': horizImg.width, 'height': horizImg.height})], {type: "text"}));
  fd.append(name + '_pixels', new Blob([horizImg.pixels], {'type': 'image/png'}));
  names.push(name);

  fd.append('thumbnail_size', new Blob([JSON.stringify({'width': horizImg.width, 'height': horizImg.height})], {type: "text"}));
  fd.append('thumbnail_pixels', new Blob([horizImg.pixels], {'type': 'image/png'}));

  metadata = {'family': familyInput.value(), 'class': classInput.value()}
  fd.append('metadata', new Blob([JSON.stringify(metadata)], {type: "text"}));

  fd.append('names', new Blob([JSON.stringify(names)]));

  var msg = $.ajax({
    headers: { "X-CSRFToken": csrftoken },
    url: '/applets/upload_infinite_line/',
    type: 'POST',
    data: fd,
    async: false,
    contentType: false,
    processData: false,
    enctype: 'multipart/form-data',
    error: function (error) {
      console.log(error);
    }
  });
}
