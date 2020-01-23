/** TODO:
- save/load entire workspace
*/ 
var cmap;
var thumbnail;

class Rect {
  constructor(x, y, w, h) {
    this._x = x;
    this._y = y;
    this._w = w;
    this._h = h;
  }
  
  get x() { return this._x; }
  set x(xx) { this._x = xx; }
  get y() { return this._y; }
  set y(yy) { this._y = yy; }
  get w() { return this._w; }
  set w(w) { this._w = w; }
  get h() { return this._h; }
  set h(h) { this._h = h; }
  
	x1() { return this._x; }
  x2() { return (this._x + this._w); }
  y1() { return this._y; }
  y2() { return this._y + this._h; }
  
  center() { return [this._x + this._w/2.0, this._y + this._h/2.0]; }
  
  containsPoint(xpos, ypos) {
    if ((xpos > this._x) && (xpos < this._x + this._w) &&
        (ypos > this._y) && (ypos < this._y + this._h)) {
      return true; 
    }
    return false;
  }
}


class Swatch {
  constructor(rect, col) {
    this._rect = rect;
    this._col = col;
  }

  get rect() { return this._rect; }
  set rect(r) { this._rect = r; }
  
  get col() { return this._col; }
  set col(c) { this._col = c; }
  
  draw(highlight, clipBounds) {
    if (highlight) {
	    stroke(255,255,153);
    }
    else {
      stroke(0);
    }
    fill(this.col);
    //rect(this._rect.x, this._rect.y, this._rect.w, this._rect.h);
		// constrain within 10 pixels so the swatch never completely disappears
    var x1 = constrain(this._rect.x1(), 0, clipBounds.w-11);
    var x2 = constrain(this._rect.x2(), 10, clipBounds.w-1);
    var y1 = constrain(this._rect.y1(), 0, clipBounds.h-11);
    var y2 = constrain(this._rect.y2(), 10, clipBounds.h-1);
    rectMode(CORNERS);
	  rect(x1, y1, x2, y2);
    rectMode(CORNER); // reset to default
  }
}


class ColorMap {
  constructor() {
    this.entries = []; 
  }
  
  addControlPt(dataVal, col) {
    var entry = [dataVal, col];
    this.entries.push(entry);
    this.entries.sort(function(a,b) { return a[0]-b[0]; });
  }
  
  editControlPt(origDataVal, newDataVal, newColor) {
    var i=0;
    while (i < this.entries.length) {
      if (this.entries[i][0] == dataVal) {
        this.entries[i][0] = newDataVal;
        this.entries[i][1] = newColor;
				this.entries.sort(function(a,b) { return a[0]-b[0]; });
        return;
      }
      i++;
    }
    console.log("ColorMap::editControlPt no control point with data val = " + dataVal);
  }
  
  removeControlPt(dataVal) {
    var i=0;
    while (i < this.entries.length) {
      if (entries[i][0] == dataVal) {
        this.entries.splice(i, 1);
 				return;
      }
      i++;
    }
    console.log("ColorMap::removeControlPt no control point with data val = " + dataVal);
  }
  
  lookupColor(dataVal) {
    if (this.entries.length == 0) {
      //console.log("ColorMap::lookupColor empty color map.");
      return color(255); 
    }
    else if (this.entries.length == 1) {
      return this.entries[0][1]; 
    }
    else {
      var minVal = this.entries[0][0];
      var maxVal = this.entries[this.entries.length-1][0];
      
	    // check bounds
  	  if (dataVal >= maxVal) {
    	  return this.entries[this.entries.length-1][1];
      }
      else if (dataVal <= minVal) {
      	return this.entries[0][1];
      }
    	else {  // value within bounds
        
        // make i = upper control pt and (i-1) = lower control point
	      var i=1;
      	while (this.entries[i][0] < dataVal) {
					i++;
	      }
                
      	// convert the two control points to lab space, interpolate
        // in lab space, then convert back to rgb space        
	      var c1 = this.entries[i-1][1];
				var rgb1 = [red(c1), green(c1), blue(c1)];
        var lab1 = rgb2lab(rgb1);
        
	      var c2 = this.entries[i][1];
        var rgb2 = [red(c2), green(c2), blue(c2)];
        var lab2 = rgb2lab(rgb2);

        var v1 = this.entries[i-1][0];
      	var v2 = this.entries[i][0];
      	var alpha  = (dataVal - v1) / (v2 - v1);

        var labFinal = [lab1[0] * (1.0 - alpha)  +  lab2[0] * alpha,
                        lab1[1] * (1.0 - alpha)  +  lab2[1] * alpha,
        					      lab1[2] * (1.0 - alpha)  +  lab2[2] * alpha];
        
        var rgbFinal = lab2rgb(labFinal);
        return rgbFinal;
      }
    }
  }
}

function buildColorMapFromSwatches(mySwatches, yMin, yMax) {
  myCmap = new ColorMap();
  for (var i=0; i<mySwatches.length; i++) {
    var val = (mySwatches[i].rect.center()[1] - yMin) / (yMax - yMin);
    constrain(val, 0.0, 1.0);
    myCmap.addControlPt(val, mySwatches[i].col); 
  }
  return myCmap;
}



var canvas;
var xDragOffset, yDragOffset;
var xDragStart, yDragStart;
var border;

var cpPanelRect;

var srcPanelRect;
var srcImages;
var srcImageRects;
var srcNumSwatches;
var inSrcImage = -1;
var inSrcColor;
var srcSwatches = [];
var srcHighlighted = -1;
var srcLastHighlighted = -1;

var cmapPanelRect;
var cmapSwatches = [];
var cmapHighlighted = -1;

var srcAndCmapPanelRect;


function setup() {
  canvas = createCanvas(1100, 800);
  canvas.drop(gotFile);

  border = 15;
  
  cpPanelRect = new Rect(border, 7*border, 100-2*border, height-8*border);
  
  srcPanelRect = new Rect(100, 6*border, width-300-100, height-6*border);
  srcImageRects = [];
  srcImages = [];
  srcNumSwatches = [];
  srcNextSwatchX = [];
  srcNextSwatchY = [];
  

  cmapPanelRect = new Rect(width-300, 6*border, 300, height-6*border);

  srcAndCmapPanelRect = new Rect(100, 6*border, width-100, height-6*border);
  
  cmap = new ColorMap();
  /*
  cmapSwatches.push(new Swatch(new Rect(20,20,50,80), color(0,0,255)));
  cmapSwatches.push(new Swatch(new Rect(20,100,50,80), color(0,132,255)));
  cmapSwatches.push(new Swatch(new Rect(20,180,50,80), color(0,255,255)));
  cmapSwatches.push(new Swatch(new Rect(20,260,50,80), color(0,255,173)));
  cmapSwatches.push(new Swatch(new Rect(20,340,50,80), color(0,255,82)));
  cmapSwatches.push(new Swatch(new Rect(20,420,50,80), color(0,255,0)));
  cmapSwatches.push(new Swatch(new Rect(20,500,50,80), color(132,255,0)));
  cmapSwatches.push(new Swatch(new Rect(20,580,50,80), color(255,255,0)));
  cmapSwatches.push(new Swatch(new Rect(20,660,50,80), color(255,132,0)));
  cmapSwatches.push(new Swatch(new Rect(20,740,50,80), color(255,0,0)));
  cmap = buildColorMapFromSwatches(cmapSwatches, border, cmapPanelRect.h-border);  
  */
  
  let saveButton = createButton('Save and Download');
  saveButton.position(cmapPanelRect.x + cmapPanelRect.w/2 - 100, 60);
  saveButton.size(200, 20);
  saveButton.mousePressed(saveAndDownload);
  
  
  /**
  // pre-calc cPicker images
  cPickerImages = [];
  var spacer = 10;
  var hueWidth = 20;
  var rgb;
  for (var hue=0; hue<1; hue++) {
	  var img = createImage(255+spacer+hueWidth, 255);

    for (var hb=0; hb<255; hb++) {
      img.loadPixels();      
      // SB square for this hue
      for (let s=0; s < 255; s++) {
        rgb = HSVtoRGB(hue/255, s/255, hb/255);
        for (let j=0; j < img.height; j++) {
          img.set(s, hb, color(rgb));
        }
      }
      
      // spacer
      for (var xx=255; xx<255+spacer; xx++) {
        img.set(xx, hb, color(100,100,100,0)); 
      }

      // hue selector
      for (var hx=255+spacer; hx<img.width; hx++) {
        rgb = HSVtoRGB(hb/255, 0.5, 0.5);
        img.set(hx, hb, color(rgb)); 
      }
    }
    img.updatePixels();
    cPickerImages.push(img);
  }
  **/
}

var curHSB = [0.5, 0.5, 0.5];


function drawCPicker(rect) {
  colorMode(HSB, 1.0, 1.0, 1.0);
  var xstep = rect.w / 5;
  var x,y;
  for (y=rect.y1(); y<rect.y2(); y++) {
    x = rect.x;
    var a = (y-rect.y1()) / rect.h;
    
    stroke(a, 1.0, 0.7);//curHSB[1], curHSB[2]);
    line(x, y, x+xstep, y);
    x += 2*xstep;
    
    stroke(curHSB[0], a, curHSB[2]);
    line(x, y, x+xstep, y);
    x += 2*xstep
    
		stroke(curHSB[0], curHSB[1], a);
    line(x, y, x+xstep, y);
  }
  colorMode(RGB, 255, 255, 255);
  
  stroke(225);
	x = rect.x;
  y = rect.y + (curHSB[0] * rect.h);
  line(x, y, x+xstep, y);
  x += 2*xstep;
  y = rect.y + (curHSB[1] * rect.h);
  line(x, y, x+xstep, y);
  x += 2*xstep;
  y = rect.y + (curHSB[2] * rect.h);
  line(x, y, x+xstep, y);
}


function draw() { 
  background(100);
  
  var i;
  
  var r = new Rect(10,10,70,150);
  drawCPicker(cpPanelRect);
  
  // Labels across top of screen
  noStroke();
  fill(255);
  textAlign(CENTER, CENTER);

  textSize(15);
  text('Source Image Workspace', srcPanelRect.x + srcPanelRect.w/2, 20);
  textSize(10);
  text('Drag up to 4 images onto the workspace.  Click and drag to sample colors from them.', srcPanelRect.x + srcPanelRect.w/2, 40);
  text('When you have a color you like, drag its swatch to the ColorMap Panel.', srcPanelRect.x + srcPanelRect.w/2, 55);
  text('Delete a swatch by pressing BACKSPACE or DELETE when your mouse is over it.', srcPanelRect.x + srcPanelRect.w/2, 70);
  
  textSize(15);
  text('ColorMap Workspace', cmapPanelRect.x + cmapPanelRect.w/2, 20);
  textSize(10);
  text('Arrange swatches vertically. Colors interpolated in Lab space.', cmapPanelRect.x + cmapPanelRect.w/2, 40);
  

  // ColorMap Panel
  resetMatrix();
  translate(cmapPanelRect.x1(), cmapPanelRect.y1());

  // Outline of orig location if a swatch is currently being dragged
	if ((cmapHighlighted != -1) && (mouseIsPressed)) {
    stroke(80);
    noFill();
		rect(xDragStart, yDragStart,
         cmapSwatches[cmapHighlighted].rect.w, cmapSwatches[cmapHighlighted].rect.h);
  }
  
	for (i=0; i<cmapSwatches.length; i++) {
    cmapSwatches[i].draw(i==cmapHighlighted, cmapPanelRect); 
  }
  
  // draw color map along right edge
  for (var y=border; y<cmapPanelRect.h-border; y++) {
    var val = (y - border) / (cmapPanelRect.h-border);
    var rgb = cmap.lookupColor(val);
		stroke(rgb);
    line(0.80*cmapPanelRect.w-border, y, cmapPanelRect.w-border, y);
  }
  

  textAlign(RIGHT, CENTER);
  var ypos = border;
  var ystep = (cmapPanelRect.h - 2*border) / 10;
  for (var p=0.0; p<=100.0; p += 10) {
    stroke(255);
    line(0.80*cmapPanelRect.w-border, ypos, 0.80*cmapPanelRect.w-1.5*border, ypos);
    noStroke();
    fill(255);
    text(p, 0.80*cmapPanelRect.w-2*border, ypos);
    ypos += ystep;
  }
	textAlign(CENTER, CENTER);  

  stroke(255);
  noFill();
  rect(0, 0, cmapPanelRect.w-1, cmapPanelRect.h-1);
  
  
    
  
  // Source Panel
  resetMatrix();
  translate(srcPanelRect.x1(), srcPanelRect.y1());
  
  for (i=0; i<srcImageRects.length; i++) {
    image(srcImages[i], srcImageRects[i].x, srcImageRects[i].y, srcImageRects[i].w, srcImageRects[i].h); 
  }
  
  if (inSrcImage != -1) {
    var mx = mouseX - srcPanelRect.x;
    var my = mouseY - srcPanelRect.y;
    noStroke();
    fill(inSrcColor);
		rect(mx-25, my-40, 15, 80);
    rect(mx-25, my-40, 50, 15);
    rect(mx+25-15, my-40, 15, 80);
    rect(mx-25, my+40-15, 50, 15);
    stroke(80);
    noFill();
  	rect(mx-25+15, my-40+15, 50-30, 80-30);
  	rect(mx-25, my-40, 50, 80);
  }
  
  // Outline of orig location if a swatch is currently being dragged
	if ((srcHighlighted != -1) && (mouseIsPressed)) {
    stroke(80);
    noFill();
		rect(xDragStart, yDragStart,
         srcSwatches[srcHighlighted].rect.w, srcSwatches[srcHighlighted].rect.h);
  }
  
  for (i=0; i<srcSwatches.length; i++) {
    srcSwatches[i].draw(i==srcHighlighted, srcAndCmapPanelRect); 
  }
  
  
  stroke(255);
  noFill();
  rect(0, 0, srcPanelRect.w-1, srcPanelRect.h-1);
}




function mouseMoved() {
  cmapHighlighted = -1;
  srcHighlighted = -1;
  inSrcImage = -1;
  
  var i, mx, my;
  
  // first check for a new highlight in cmap panel
  mx = mouseX - cmapPanelRect.x;
  my = mouseY - cmapPanelRect.y;
  i=cmapSwatches.length-1;
  while ((i>=0) && (cmapHighlighted == -1)) {
    if (cmapSwatches[i].rect.containsPoint(mx, my)) {
      cmapHighlighted = i;
      return;
    }
    i--;
  }

  // check for a new highlight in src panel
  mx = mouseX - srcPanelRect.x;
  my = mouseY - srcPanelRect.y;
  i=srcSwatches.length-1;
  while ((i>=0) && (srcHighlighted == -1)) {
    if (srcSwatches[i].rect.containsPoint(mx, my)) {
      srcHighlighted = i;
      srcLastHighlighted = i;
      curHSB = RGBtoHSV([red(srcSwatches[i].col), green(srcSwatches[i].col), blue(srcSwatches[i].col)]);
      return;
    }
    i--;
  }
    
  // check for mouse over source images
  mx = mouseX - srcPanelRect.x;
  my = mouseY - srcPanelRect.y;
  i=0;
  while (i<srcImageRects.length) {
    if (srcImageRects[i].containsPoint(mx, my)) {
			inSrcImage = i; 
      var x01 = (mx - srcImageRects[inSrcImage].x) / srcImageRects[inSrcImage].w;
      var y01 = (my - srcImageRects[inSrcImage].y) / srcImageRects[inSrcImage].h;    
      inSrcColor = srcImages[inSrcImage].get(x01*srcImages[inSrcImage].width, y01*srcImages[inSrcImage].height);
      return;
    }
    i++;
  }
}



function mousePressed() {
  var tmp, mx, my;

  // if a cmap swatch is highlighted  
  if (cmapHighlighted != -1) {
    // move the highlighted swatch to the last element so it is
    // drawn last, on top of all the other swatches
    tmp = cmapSwatches[cmapHighlighted];
    cmapSwatches.splice(cmapHighlighted, 1);
    cmapSwatches.push(tmp);
    cmapHighlighted = cmapSwatches.length-1;
    mx = mouseX - cmapPanelRect.x;
    my = mouseY - cmapPanelRect.y;
    xDragOffset = cmapSwatches[cmapHighlighted].rect.x - mx;
    yDragOffset = cmapSwatches[cmapHighlighted].rect.y - my;
    xDragStart = cmapSwatches[cmapHighlighted].rect.x;
    yDragStart = cmapSwatches[cmapHighlighted].rect.y;
  }
  
  // else if a source swatch is highlighted
	else if (srcHighlighted != -1) {
    // move the highlighted swatch to the last element so it is
    // drawn last, on top of all the other swatches
    tmp = srcSwatches[srcHighlighted];
    srcSwatches.splice(srcHighlighted, 1);
    srcSwatches.push(tmp);
    srcHighlighted = srcSwatches.length-1;
    mx = mouseX - srcPanelRect.x;
    my = mouseY - srcPanelRect.y;
    xDragOffset = srcSwatches[srcHighlighted].rect.x - mx;
    yDragOffset = srcSwatches[srcHighlighted].rect.y - my;
    xDragStart = srcSwatches[srcHighlighted].rect.x;
    yDragStart = srcSwatches[srcHighlighted].rect.y;
  }

  // else if mouse is inside a src image
  else if (inSrcImage != -1) {
    // Create a new swatch
    var x = srcNextSwatchX[inSrcImage];
    var y = srcNextSwatchY[inSrcImage];
    srcSwatches.push(new Swatch(new Rect(x,y,50,80), inSrcColor));
    srcNumSwatches[inSrcImage]++;
		// Update position for next swatch
    srcNextSwatchX[inSrcImage] += border + 50;
    if (srcNextSwatchX[inSrcImage] >= srcPanelRect.w - border - 50) {
      srcNextSwatchX[inSrcImage] = srcImageRects[inSrcImage].x2() + border;
      srcNextSwatchY[inSrcImage] += border + 80;
    }
  }
  
  // check for mouse over color picker
  if (cpPanelRect.containsPoint(mouseX, mouseY)) {
	  mx = mouseX - cpPanelRect.x;
  	my = mouseY - cpPanelRect.y;
    var index = Math.floor(5.0 * mx / cpPanelRect.w);
    if (index == 0) {
      curHSB[0] = my / cpPanelRect.h;
      if (srcLastHighlighted != -1) {
        srcSwatches[srcLastHighlighted].col = HSVtoRGB(curHSB); 
      }
    }
    else if (index == 2) {
	    curHSB[1] = my / cpPanelRect.h;   
      if (srcLastHighlighted != -1) {
        srcSwatches[srcLastHighlighted].col = HSVtoRGB(curHSB); 
      }
    }
    else if (index == 4) {
	    curHSB[2] = my / cpPanelRect.h;   
      if (srcLastHighlighted != -1) {
        srcSwatches[srcLastHighlighted].col = HSVtoRGB(curHSB); 
      }
    }
  }  
}



function mouseDragged() {
  var mx,my;
  
  if (srcHighlighted != -1) { 
    mx = mouseX - srcPanelRect.x;
    my = mouseY - srcPanelRect.y;
		srcSwatches[srcHighlighted].rect.x = mx + xDragOffset;
    srcSwatches[srcHighlighted].rect.y = my + yDragOffset;
  }
  
  else if (cmapHighlighted != -1) { 
    mx = mouseX - cmapPanelRect.x;
    my = mouseY - cmapPanelRect.y;
		cmapSwatches[cmapHighlighted].rect.x = mx + xDragOffset;
    cmapSwatches[cmapHighlighted].rect.y = my + yDragOffset;
    cmap = buildColorMapFromSwatches(cmapSwatches, border, cmapPanelRect.h-border);  
  }
  
  // check for mouse over color picker
  else if (cpPanelRect.containsPoint(mouseX, mouseY)) {
	  mx = mouseX - cpPanelRect.x;
  	my = mouseY - cpPanelRect.y;
    var index = Math.floor(5.0 * mx / cpPanelRect.w);
    if (index == 0) {
      curHSB[0] = my / cpPanelRect.h;
      if (srcLastHighlighted != -1) {
        srcSwatches[srcLastHighlighted].col = HSVtoRGB(curHSB); 
      }
    }
    else if (index == 2) {
	    curHSB[1] = my / cpPanelRect.h;   
      if (srcLastHighlighted != -1) {
        srcSwatches[srcLastHighlighted].col = HSVtoRGB(curHSB); 
      }
    }
    else if (index == 4) {
	    curHSB[2] = my / cpPanelRect.h;  
      if (srcLastHighlighted != -1) {
        srcSwatches[srcLastHighlighted].col = HSVtoRGB(curHSB); 
      }
    }
  }  

}



function mouseReleased() {  
  // check to see if a src swatch was just dropped onto the cmap panel
  if ((srcHighlighted != -1) &&  (srcSwatches[srcHighlighted].rect.center()[0] > srcPanelRect.w)) {

    // add a new swatch to the cmap panel at the location where the mouse is released
    var mx = mouseX - cmapPanelRect.x + xDragOffset;
    var my = mouseY - cmapPanelRect.y + yDragOffset;
		var c = srcSwatches[srcHighlighted].col;
    cmapSwatches.push(new Swatch(new Rect(mx,my,50,80), c));
    cmap = buildColorMapFromSwatches(cmapSwatches, border, cmapPanelRect.h-border);  

  	// move the src swatch back to its original location
    srcSwatches[srcHighlighted].rect.x = xDragStart;
    srcSwatches[srcHighlighted].rect.y = yDragStart;
  }  
  
  // update highlight
  mouseMoved();
}



var droppedImg;
var droppedX, droppedY;
function gotFile(file) {
  if (file.type === 'image') {
    droppedImg = loadImage(file.data, newInputLoaded);
    droppedX = mouseX;
    droppedY = mouseY;
  } 
  else {
    console.log('Not an image file!');
  }
}



function newInputLoaded() {
  srcImages.push(droppedImg);
  srcImages[srcImages.length-1].loadPixels();
  var h = 0.2*srcPanelRect.h
  var s = h / droppedImg.height;
  var r = new Rect(border, border + srcImageRects.length*(h+2*border), s*droppedImg.width, s*droppedImg.height);
  srcImageRects.push(r);
  srcNumSwatches.push(0);
  
  droppedImg.loadPixels();
  var pixelData = [];
	for (var j=0; j<droppedImg.height; j++) {
    for (var i=0; i<droppedImg.width; i++) {
      var index = 4*(i + j*droppedImg.width);
      pixelData.push([droppedImg.pixels[index+0], droppedImg.pixels[index+1], droppedImg.pixels[index+2]]);
    }
  }
  
  srcNextSwatchX.push(srcImageRects[srcImageRects.length-1].x2() + border);
  srcNextSwatchY.push(srcImageRects[srcImageRects.length-1].y);

  var maxColors = 6;
  var cmap    = MMCQ.quantize(pixelData, maxColors);
  var palette = cmap? cmap.palette() : null;

  if (palette) {
    palette.sort(function(a, b){return RGBtoHSV(a)[2]-RGBtoHSV(b)[2]});
    
    for (var p=0; p<palette.length; p++) {
      // Create a new swatch
    	var x = srcNextSwatchX[srcImageRects.length-1];
    	var y = srcNextSwatchY[srcImageRects.length-1];
    	srcSwatches.push(new Swatch(new Rect(x,y,50,80), color(palette[p])));
    	srcNumSwatches[srcImageRects.length-1]++;
			// Update position for next swatch
    	srcNextSwatchX[srcImageRects.length-1] += border + 50;
    	if (srcNextSwatchX[srcImageRects.length-1] >= srcPanelRect.w - border - 50) {
      	srcNextSwatchX[srcImageRects.length-1] = srcImageRects[srcImageRects.length-1].x2() + border;
      	srcNextSwatchY[srcImageRects.length-1] += border + 80;
    	}
    }
  }  
}

function saveAndDownload() {
  thumbnail = createImage(1024, 64);
	thumbnail.loadPixels();
	for (let i=0; i < thumbnail.width; i++) {
    var rgb = cmap.lookupColor(i/thumbnail.width);
    for (let j=0; j < thumbnail.height; j++) {
    	thumbnail.set(i, j, color(rgb));
  	}
	}

	thumbnail.updatePixels();
  
  colormap = [];
  colormap.push("<ColorMaps>");
	colormap.push('<ColorMap space="CIELAB" indexedLookup="false" name="ColorLoom">');  
  for (let j=0; j<cmap.entries.length; j++) {
    colormap.push('<Point x="' + cmap.entries[j][0] + '"' +
                    ' o="1" ' + 
                    ' r="' + red(cmap.entries[j][1])/255 + '"' +
                    ' g="' + green(cmap.entries[j][1])/255 + '"' +
                    ' b="' + blue(cmap.entries[j][1])/255 + '"/>');
  }
  colormap.push('<NaN r="0.25" g="0" b="0"/>');
  colormap.push('</ColorMap>');
  colormap.push('</ColorMaps>');

  document.getElementById('UploadDialog').open = true;
}

function upload(event)
{
  var form = document.getElementById('upload_form');
  var fd = new FormData(form);

  fd.append("colormap", new Blob([colormap.join()]));
  fd.append("thumbnail_size", new Blob([JSON.stringify({'width': thumbnail.width, 'height': thumbnail.height})],  { type: "text"}));

  var b = new Blob([thumbnail.pixels], {type: "image/png"});
  fd.append("thumbnail_pixels", b);

  var tet = $.ajax({
      headers: { "X-CSRFToken": csrftoken },
      url: '/Library/applets/upload_color_loom/',
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

function keyPressed() {
  if ((keyCode == DELETE) || (keyCode == BACKSPACE)) {
		if (srcHighlighted != -1) {
     	srcSwatches.splice(srcHighlighted, 1);
    }
		else if (cmapHighlighted != -1) {
     	cmapSwatches.splice(cmapHighlighted, 1);
      cmap = buildColorMapFromSwatches(cmapSwatches, border, cmapPanelRect.h-border);  
    }
    
    // update highlight
    mouseMoved();
  }
}

function cpickerUpdate() {
  console.log(cPicker.value()); 
  if (srcLastHighlighted != -1) {
    srcSwatches[srcLastHighlighted].col = cPicker.value(); 
  }
}



// -----
// https://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately
// For use with:
// HSV in 0..1 range
// RGB in 0..255 range

function HSVtoRGB(hsv) {
		var h = hsv[0], s = hsv[1], v = hsv[2];
    var r, g, b, i, f, p, q, t;
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function RGBtoHSV(rgb) {
    var r = rgb[0], g = rgb[1], b = rgb[2];
    var max = Math.max(r, g, b), min = Math.min(r, g, b),
        d = max - min,
        h,
        s = (max === 0 ? 0 : d / max),
        v = max / 255;

    switch (max) {
        case min: h = 0; break;
        case r: h = (g - b) + d * (g < b ? 6: 0); h /= 6 * d; break;
        case g: h = (b - r) + d * 2; h /= 6 * d; break;
        case b: h = (r - g) + d * 4; h /= 6 * d; break;
    }

    return [h, s, v];
}

// -----



// ----- BEGIN EXTERNAL CODE FOR RGB-LAB CONVERSION -----
// https://github.com/antimatter15/rgb-lab

/*
MIT License

Copyright (c) 2014 Kevin Kwok <antimatter15@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

// the following functions are based off of the pseudocode
// found on www.easyrgb.com

function lab2rgb(lab){
  var y = (lab[0] + 16) / 116,
      x = lab[1] / 500 + y,
      z = y - lab[2] / 200,
      r, g, b;

  x = 0.95047 * ((x * x * x > 0.008856) ? x * x * x : (x - 16/116) / 7.787);
  y = 1.00000 * ((y * y * y > 0.008856) ? y * y * y : (y - 16/116) / 7.787);
  z = 1.08883 * ((z * z * z > 0.008856) ? z * z * z : (z - 16/116) / 7.787);

  r = x *  3.2406 + y * -1.5372 + z * -0.4986;
  g = x * -0.9689 + y *  1.8758 + z *  0.0415;
  b = x *  0.0557 + y * -0.2040 + z *  1.0570;

  r = (r > 0.0031308) ? (1.055 * Math.pow(r, 1/2.4) - 0.055) : 12.92 * r;
  g = (g > 0.0031308) ? (1.055 * Math.pow(g, 1/2.4) - 0.055) : 12.92 * g;
  b = (b > 0.0031308) ? (1.055 * Math.pow(b, 1/2.4) - 0.055) : 12.92 * b;

  return [Math.max(0, Math.min(1, r)) * 255, 
          Math.max(0, Math.min(1, g)) * 255, 
          Math.max(0, Math.min(1, b)) * 255]
}


function rgb2lab(rgb){
  var r = rgb[0] / 255,
      g = rgb[1] / 255,
      b = rgb[2] / 255,
      x, y, z;

  r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
  z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

  x = (x > 0.008856) ? Math.pow(x, 1/3) : (7.787 * x) + 16/116;
  y = (y > 0.008856) ? Math.pow(y, 1/3) : (7.787 * y) + 16/116;
  z = (z > 0.008856) ? Math.pow(z, 1/3) : (7.787 * z) + 16/116;

  return [(116 * y) - 16, 500 * (x - y), 200 * (y - z)]
}

// calculate the perceptual distance between colors in CIELAB
// https://github.com/THEjoezack/ColorMine/blob/master/ColorMine/ColorSpaces/Comparisons/Cie94Comparison.cs

function deltaE(labA, labB){
  var deltaL = labA[0] - labB[0];
  var deltaA = labA[1] - labB[1];
  var deltaB = labA[2] - labB[2];
  var c1 = Math.sqrt(labA[1] * labA[1] + labA[2] * labA[2]);
  var c2 = Math.sqrt(labB[1] * labB[1] + labB[2] * labB[2]);
  var deltaC = c1 - c2;
  var deltaH = deltaA * deltaA + deltaB * deltaB - deltaC * deltaC;
  deltaH = deltaH < 0 ? 0 : Math.sqrt(deltaH);
  var sc = 1.0 + 0.045 * c1;
  var sh = 1.0 + 0.015 * c1;
  var deltaLKlsl = deltaL / (1.0);
  var deltaCkcsc = deltaC / (sc);
  var deltaHkhsh = deltaH / (sh);
  var i = deltaLKlsl * deltaLKlsl + deltaCkcsc * deltaCkcsc + deltaHkhsh * deltaHkhsh;
  return i < 0 ? 0 : Math.sqrt(i);
}
// ----- END EXTERNAL CODE FOR RGB-LAB CONVERSION -----


// ------ BEGIN External ColorThief Code -----
// Although, I don't need much of what is in ColorThief, the interesting parts seem to have
// been lifted by ColorThief from other projects as noted below.

/*
 * Color Thief v2.0
 * by Lokesh Dhakar - http://www.lokeshdhakar.com
 *
 * Thanks
 * ------
 * Nick Rabinowitz - For creating quantize.js.
 * John Schulz - For clean up and optimization. @JFSIII
 * Nathan Spady - For adding drag and drop support to the demo page.
 *
 * License
 * -------
 * Copyright 2011, 2015 Lokesh Dhakar
 * Released under the MIT license
 * https://raw.githubusercontent.com/lokesh/color-thief/master/LICENSE
 *
 * @license
 */

/*!
 * quantize.js Copyright 2008 Nick Rabinowitz.
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 * @license
 */

// fill out a couple protovis dependencies
/*!
 * Block below copied from Protovis: http://mbostock.github.com/protovis/
 * Copyright 2010 Stanford Visualization Group
 * Licensed under the BSD License: http://www.opensource.org/licenses/bsd-license.php
 * @license
 */
if (!pv) {
    var pv = {
        map: function(array, f) {
          var o = {};
          return f ? array.map(function(d, i) { o.index = i; return f.call(o, d); }) : array.slice();
        },
        naturalOrder: function(a, b) {
            return (a < b) ? -1 : ((a > b) ? 1 : 0);
        },
        sum: function(array, f) {
          var o = {};
          return array.reduce(f ? function(p, d, i) { o.index = i; return p + f.call(o, d); } : function(p, d) { return p + d; }, 0);
        },
        max: function(array, f) {
          return Math.max.apply(null, f ? pv.map(array, f) : array);
        }
    };
}



/**
 * Basic Javascript port of the MMCQ (modified median cut quantization)
 * algorithm from the Leptonica library (http://www.leptonica.com/).
 * Returns a color map you can use to map original pixels to the reduced
 * palette. Still a work in progress.
 *
 * @author Nick Rabinowitz
 * @example
// array of pixels as [R,G,B] arrays
var myPixels = [[190,197,190], [202,204,200], [207,214,210], [211,214,211], [205,207,207]
                // etc
                ];
var maxColors = 4;
var cmap = MMCQ.quantize(myPixels, maxColors);
var newPalette = cmap.palette();
var newPixels = myPixels.map(function(p) {
    return cmap.map(p);
});
 */
var MMCQ = (function() {
    // private constants
    var sigbits = 5,
        rshift = 8 - sigbits,
        maxIterations = 1000,
        fractByPopulations = 0.75;

    // get reduced-space color index for a pixel
    function getColorIndex(r, g, b) {
        return (r << (2 * sigbits)) + (g << sigbits) + b;
    }

    // Simple priority queue
    function PQueue(comparator) {
        var contents = [],
            sorted = false;

        function sort() {
            contents.sort(comparator);
            sorted = true;
        }

        return {
            push: function(o) {
                contents.push(o);
                sorted = false;
            },
            peek: function(index) {
                if (!sorted) sort();
                if (index===undefined) index = contents.length - 1;
                return contents[index];
            },
            pop: function() {
                if (!sorted) sort();
                return contents.pop();
            },
            size: function() {
                return contents.length;
            },
            map: function(f) {
                return contents.map(f);
            },
            debug: function() {
                if (!sorted) sort();
                return contents;
            }
        };
    }

    // 3d color space box
    function VBox(r1, r2, g1, g2, b1, b2, histo) {
        var vbox = this;
        vbox.r1 = r1;
        vbox.r2 = r2;
        vbox.g1 = g1;
        vbox.g2 = g2;
        vbox.b1 = b1;
        vbox.b2 = b2;
        vbox.histo = histo;
    }
    VBox.prototype = {
        volume: function(force) {
            var vbox = this;
            if (!vbox._volume || force) {
                vbox._volume = ((vbox.r2 - vbox.r1 + 1) * (vbox.g2 - vbox.g1 + 1) * (vbox.b2 - vbox.b1 + 1));
            }
            return vbox._volume;
        },
        count: function(force) {
            var vbox = this,
                histo = vbox.histo;
            if (!vbox._count_set || force) {
                var npix = 0,
                    index, i, j, k;
                for (i = vbox.r1; i <= vbox.r2; i++) {
                    for (j = vbox.g1; j <= vbox.g2; j++) {
                        for (k = vbox.b1; k <= vbox.b2; k++) {
                             index = getColorIndex(i,j,k);
                             npix += (histo[index] || 0);
                        }
                    }
                }
                vbox._count = npix;
                vbox._count_set = true;
            }
            return vbox._count;
        },
        copy: function() {
            var vbox = this;
            return new VBox(vbox.r1, vbox.r2, vbox.g1, vbox.g2, vbox.b1, vbox.b2, vbox.histo);
        },
        avg: function(force) {
            var vbox = this,
                histo = vbox.histo;
            if (!vbox._avg || force) {
                var ntot = 0,
                    mult = 1 << (8 - sigbits),
                    rsum = 0,
                    gsum = 0,
                    bsum = 0,
                    hval,
                    i, j, k, histoindex;
                for (i = vbox.r1; i <= vbox.r2; i++) {
                    for (j = vbox.g1; j <= vbox.g2; j++) {
                        for (k = vbox.b1; k <= vbox.b2; k++) {
                             histoindex = getColorIndex(i,j,k);
                             hval = histo[histoindex] || 0;
                             ntot += hval;
                             rsum += (hval * (i + 0.5) * mult);
                             gsum += (hval * (j + 0.5) * mult);
                             bsum += (hval * (k + 0.5) * mult);
                        }
                    }
                }
                if (ntot) {
                    vbox._avg = [~~(rsum/ntot), ~~(gsum/ntot), ~~(bsum/ntot)];
                } else {
//                    console.log('empty box');
                    vbox._avg = [
                        ~~(mult * (vbox.r1 + vbox.r2 + 1) / 2),
                        ~~(mult * (vbox.g1 + vbox.g2 + 1) / 2),
                        ~~(mult * (vbox.b1 + vbox.b2 + 1) / 2)
                    ];
                }
            }
            return vbox._avg;
        },
        contains: function(pixel) {
            var vbox = this,
                rval = pixel[0] >> rshift;
                gval = pixel[1] >> rshift;
                bval = pixel[2] >> rshift;
            return (rval >= vbox.r1 && rval <= vbox.r2 &&
                    gval >= vbox.g1 && gval <= vbox.g2 &&
                    bval >= vbox.b1 && bval <= vbox.b2);
        }
    };

    // Color map
    function CMap() {
        this.vboxes = new PQueue(function(a,b) {
            return pv.naturalOrder(
                a.vbox.count()*a.vbox.volume(),
                b.vbox.count()*b.vbox.volume()
            );
        });
    }
    CMap.prototype = {
        push: function(vbox) {
            this.vboxes.push({
                vbox: vbox,
                color: vbox.avg()
            });
        },
        palette: function() {
            return this.vboxes.map(function(vb) { return vb.color; });
        },
        size: function() {
            return this.vboxes.size();
        },
        map: function(color) {
            var vboxes = this.vboxes;
            for (var i=0; i<vboxes.size(); i++) {
                if (vboxes.peek(i).vbox.contains(color)) {
                    return vboxes.peek(i).color;
                }
            }
            return this.nearest(color);
        },
        nearest: function(color) {
            var vboxes = this.vboxes,
                d1, d2, pColor;
            for (var i=0; i<vboxes.size(); i++) {
                d2 = Math.sqrt(
                    Math.pow(color[0] - vboxes.peek(i).color[0], 2) +
                    Math.pow(color[1] - vboxes.peek(i).color[1], 2) +
                    Math.pow(color[2] - vboxes.peek(i).color[2], 2)
                );
                if (d2 < d1 || d1 === undefined) {
                    d1 = d2;
                    pColor = vboxes.peek(i).color;
                }
            }
            return pColor;
        },
        forcebw: function() {
            // XXX: won't  work yet
            var vboxes = this.vboxes;
            vboxes.sort(function(a,b) { return pv.naturalOrder(pv.sum(a.color), pv.sum(b.color));});

            // force darkest color to black if everything < 5
            var lowest = vboxes[0].color;
            if (lowest[0] < 5 && lowest[1] < 5 && lowest[2] < 5)
                vboxes[0].color = [0,0,0];

            // force lightest color to white if everything > 251
            var idx = vboxes.length-1,
                highest = vboxes[idx].color;
            if (highest[0] > 251 && highest[1] > 251 && highest[2] > 251)
                vboxes[idx].color = [255,255,255];
        }
    };

    // histo (1-d array, giving the number of pixels in
    // each quantized region of color space), or null on error
    function getHisto(pixels) {
        var histosize = 1 << (3 * sigbits),
            histo = new Array(histosize),
            index, rval, gval, bval;
        pixels.forEach(function(pixel) {
            rval = pixel[0] >> rshift;
            gval = pixel[1] >> rshift;
            bval = pixel[2] >> rshift;
            index = getColorIndex(rval, gval, bval);
            histo[index] = (histo[index] || 0) + 1;
        });
        return histo;
    }

    function vboxFromPixels(pixels, histo) {
        var rmin=1000000, rmax=0,
            gmin=1000000, gmax=0,
            bmin=1000000, bmax=0,
            rval, gval, bval;
        // find min/max
        pixels.forEach(function(pixel) {
            rval = pixel[0] >> rshift;
            gval = pixel[1] >> rshift;
            bval = pixel[2] >> rshift;
            if (rval < rmin) rmin = rval;
            else if (rval > rmax) rmax = rval;
            if (gval < gmin) gmin = gval;
            else if (gval > gmax) gmax = gval;
            if (bval < bmin) bmin = bval;
            else if (bval > bmax)  bmax = bval;
        });
        return new VBox(rmin, rmax, gmin, gmax, bmin, bmax, histo);
    }

    function medianCutApply(histo, vbox) {
        if (!vbox.count()) return;

        var rw = vbox.r2 - vbox.r1 + 1,
            gw = vbox.g2 - vbox.g1 + 1,
            bw = vbox.b2 - vbox.b1 + 1,
            maxw = pv.max([rw, gw, bw]);
        // only one pixel, no split
        if (vbox.count() == 1) {
            return [vbox.copy()];
        }
        /* Find the partial sum arrays along the selected axis. */
        var total = 0,
            partialsum = [],
            lookaheadsum = [],
            i, j, k, sum, index;
        if (maxw == rw) {
            for (i = vbox.r1; i <= vbox.r2; i++) {
                sum = 0;
                for (j = vbox.g1; j <= vbox.g2; j++) {
                    for (k = vbox.b1; k <= vbox.b2; k++) {
                        index = getColorIndex(i,j,k);
                        sum += (histo[index] || 0);
                    }
                }
                total += sum;
                partialsum[i] = total;
            }
        }
        else if (maxw == gw) {
            for (i = vbox.g1; i <= vbox.g2; i++) {
                sum = 0;
                for (j = vbox.r1; j <= vbox.r2; j++) {
                    for (k = vbox.b1; k <= vbox.b2; k++) {
                        index = getColorIndex(j,i,k);
                        sum += (histo[index] || 0);
                    }
                }
                total += sum;
                partialsum[i] = total;
            }
        }
        else {  /* maxw == bw */
            for (i = vbox.b1; i <= vbox.b2; i++) {
                sum = 0;
                for (j = vbox.r1; j <= vbox.r2; j++) {
                    for (k = vbox.g1; k <= vbox.g2; k++) {
                        index = getColorIndex(j,k,i);
                        sum += (histo[index] || 0);
                    }
                }
                total += sum;
                partialsum[i] = total;
            }
        }
        partialsum.forEach(function(d,i) {
            lookaheadsum[i] = total-d;
        });
        function doCut(color) {
            var dim1 = color + '1',
                dim2 = color + '2',
                left, right, vbox1, vbox2, d2, count2=0;
            for (i = vbox[dim1]; i <= vbox[dim2]; i++) {
                if (partialsum[i] > total / 2) {
                    vbox1 = vbox.copy();
                    vbox2 = vbox.copy();
                    left = i - vbox[dim1];
                    right = vbox[dim2] - i;
                    if (left <= right)
                        d2 = Math.min(vbox[dim2] - 1, ~~(i + right / 2));
                    else d2 = Math.max(vbox[dim1], ~~(i - 1 - left / 2));
                    // avoid 0-count boxes
                    while (!partialsum[d2]) d2++;
                    count2 = lookaheadsum[d2];
                    while (!count2 && partialsum[d2-1]) count2 = lookaheadsum[--d2];
                    // set dimensions
                    vbox1[dim2] = d2;
                    vbox2[dim1] = vbox1[dim2] + 1;
//                    console.log('vbox counts:', vbox.count(), vbox1.count(), vbox2.count());
                    return [vbox1, vbox2];
                }
            }

        }
        // determine the cut planes
        return maxw == rw ? doCut('r') :
            maxw == gw ? doCut('g') :
            doCut('b');
    }

    function quantize(pixels, maxcolors) {
        // short-circuit
        if (!pixels.length || maxcolors < 2 || maxcolors > 256) {
//            console.log('wrong number of maxcolors');
            return false;
        }

        // XXX: check color content and convert to grayscale if insufficient

        var histo = getHisto(pixels),
            histosize = 1 << (3 * sigbits);

        // check that we aren't below maxcolors already
        var nColors = 0;
        histo.forEach(function() { nColors++; });
        if (nColors <= maxcolors) {
            // XXX: generate the new colors from the histo and return
        }

        // get the beginning vbox from the colors
        var vbox = vboxFromPixels(pixels, histo),
            pq = new PQueue(function(a,b) { return pv.naturalOrder(a.count(), b.count()); });
        pq.push(vbox);

        // inner function to do the iteration
        function iter(lh, target) {
            var ncolors = 1,
                niters = 0,
                vbox;
            while (niters < maxIterations) {
                vbox = lh.pop();
                if (!vbox.count())  { /* just put it back */
                    lh.push(vbox);
                    niters++;
                    continue;
                }
                // do the cut
                var vboxes = medianCutApply(histo, vbox),
                    vbox1 = vboxes[0],
                    vbox2 = vboxes[1];

                if (!vbox1) {
//                    console.log("vbox1 not defined; shouldn't happen!");
                    return;
                }
                lh.push(vbox1);
                if (vbox2) {  /* vbox2 can be null */
                    lh.push(vbox2);
                    ncolors++;
                }
                if (ncolors >= target) return;
                if (niters++ > maxIterations) {
//                    console.log("infinite loop; perhaps too few pixels!");
                    return;
                }
            }
        }

        // first set of colors, sorted by population
        iter(pq, fractByPopulations * maxcolors);

        // Re-sort by the product of pixel occupancy times the size in color space.
        var pq2 = new PQueue(function(a,b) {
            return pv.naturalOrder(a.count()*a.volume(), b.count()*b.volume());
        });
        while (pq.size()) {
            pq2.push(pq.pop());
        }

        // next set - generate the median cuts using the (npix * vol) sorting.
        iter(pq2, maxcolors - pq2.size());

        // calculate the actual colors
        var cmap = new CMap();
        while (pq2.size()) {
            cmap.push(pq2.pop());
        }

        return cmap;
    }

    return {
        quantize: quantize
    };
})();
// ------ END External ColorThief Code -----
