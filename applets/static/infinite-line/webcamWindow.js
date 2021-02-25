var webcamWindowDiv = document.getElementById("webcamWindow");
webcamWindowDiv.style.display = "none";

let myp5 = new p5(( sketch ) => {

    let backgroundColor = 'rgb(120, 120, 120)';

    let videoH = 400;
    let videoW = videoH * 1.333;
    let videoMargin = 6;

    let closeButtonSize = 27;
    let webcamTextSize = 16;

    let webcamVideo;
    let webcamImageX = videoMargin;
    let webcamImageY = videoMargin*2 + closeButtonSize;

    let inputImgW = 110;
    let inputImgH = videoH;
    let inputImgX = webcamImageX + videoW/2 - inputImgW/2;
    let inputImgY = webcamImageY;

    let myCanvas;
    
    var thresholdValue = 0.3; // Value between 0.0 and 1.0 for the filter(THRESHOLD)
    var thresholdMode = false;

    sketch.setup = () => {
        // Attach the canvas to the draggable div
        myCanvas = sketch.createCanvas(videoW + videoMargin*2, videoH + videoMargin*2 + 60);
        myCanvas.parent("webcamWindow");
        myCanvas.style(`
          transform: rotateY(180deg);
          -webkit-transform:rotateY(180deg); /* Safari and Chrome */
          -moz-transform:rotateY(180deg); /* Firefox */
        `);

        sketch.background(backgroundColor);

        // Get the webcam input
        webcamVideo = sketch.createCapture(VIDEO);
        // webcamVideo.parent("webcamWindow");
        // webcamVideo.size(videoW, videoH);
        // webcamVideo.style(`
        //   position: absolute; 
        //   top: ${webcamImageY}; 
        //   left: ${webcamImageX};
        // `);
        webcamVideo.hide();

        // UI Stuff -----------------------------------------------------

        // White outline around the webcam image
        sketch.fill(0);
        sketch.rect(webcamImageX, webcamImageY, videoW, videoH);

        let snapButton = sketch.createButton("Snap!");
        snapButton.parent("webcamWindow");
        snapButton.position(webcamImageX, myCanvas.height - videoMargin - 30);
        snapButton.size(videoW, 30);
        snapButton.mousePressed(sketch.takeASnap);

        // sketch.textAlign(CENTER, TOP);
        // sketch.textSize(webcamTextSize);
        // sketch.fill(255);
        let webcamText = sketch.createP("Webcam");
        webcamText.parent("webcamWindow");
        webcamText.position(0, webcamTextSize/2);
        webcamText.size(myCanvas.width, webcamTextSize);
        webcamText.style(`
          color: white;
          text-align: center;
          margin: 0;
        `);

        let closeButton = sketch.createImg("/static/infinite-line/closeButton.png");
        closeButton.parent("webcamWindow");
        closeButton.position(myCanvas.width - videoMargin - closeButtonSize, 6);
        closeButton.size(closeButtonSize, closeButtonSize);
        closeButton.style(`
          border-radius: 3px;
          padding: 7px;
          background: none;
        `);
        closeButton.mouseOver(() => {
          closeButton.style(`
            background: rgba(255, 255, 255, 0.25);
          `);
        });
        closeButton.mouseOut(() => {
          closeButton.style(`
            background: none;
          `);
        });
        closeButton.mousePressed(() => {
          webcamWindowDiv.style.display = "none";
        });
    };

    // Add the image from webcam to color loom
    sketch.takeASnap = () => {        
        sketch.image(webcamVideo, webcamImageX, webcamImageY, videoW, videoH);

        sketch.filter(THRESHOLD, thresholdValue);

        // Draw in the background for the webcam text and close button
        sketch.fill(120);
        sketch.rect(0, 0, myCanvas.width, webcamImageY);

        // inputImg and newInputLoaded() are variables in Infinite Line
        inputImg = sketch.get(inputImgX, inputImgY, inputImgW, inputImgH);
        newInputLoaded();
    };

    let overlayRectW = (videoW - inputImgW)/2;
    let overlayRectH = videoH;

    sketch.draw = () => {
      sketch.image(webcamVideo, webcamImageX, webcamImageY, videoW, videoH);
      if (thresholdMode)
      {
        sketch.filter(THRESHOLD, thresholdValue);

        // Draw in the background for the webcam text and close button
        sketch.fill(120);
        sketch.rect(0, 0, myCanvas.width, webcamImageY);
      }

      sketch.fill("rgba(0, 0, 0, 0.75)");
      sketch.noStroke();
      sketch.rect(webcamImageX, webcamImageY, overlayRectW, overlayRectH);
      sketch.rect(webcamImageX + overlayRectW + inputImgW, webcamImageY, overlayRectW, overlayRectH);
    };

    sketch.keyPressed = () => {
      console.log(sketch.keyCode);
      switch (sketch.keyCode)
      {
        case RIGHT_ARROW:
          thresholdValue += 0.05;
          if (thresholdValue >= 1)
          {
            thresholdValue = 1;
          }
          break;
        case LEFT_ARROW:
          thresholdValue -= 0.05;
          if (thresholdValue <= 0)
          {
            thresholdValue = 0;
          }
          break;
        case 32:
          thresholdMode = !thresholdMode;
          break;
      }
      return false;
    }
});

// Make element draggable ---------------------------------------------------------------------------------------
// Reference from w3schools: https://www.w3schools.com/howto/howto_js_draggable.asp

makeElementDraggable(webcamWindowDiv);

function makeElementDraggable(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    /* if present, the header is where you move the DIV from:*/
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    /* otherwise, move the DIV from anywhere inside the DIV:*/
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    /* stop moving when mouse button is released:*/
    document.onmouseup = null;
    document.onmousemove = null;
  }
}