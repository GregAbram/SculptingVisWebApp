const wcWindow = 'webcamWindow';
const webcamWindowDiv = document.getElementById(wcWindow);
const webcamWindowDivStyles = {
  display: 'none',
  boxShadow: '1px 2px 25px -5px rgba(0,0,0,0.74)',
  webkitBoxShadow: '1px 2px 25px -5px rgba(0,0,0,0.74)',
  mozBoxShadow: '1px 2px 25px -5px rgba(0,0,0,0.74)'
};
Object.assign(webcamWindowDiv.style, webcamWindowDivStyles);

var webcamVideo;

let myp5 = new p5(( sketch ) => {

    let backgroundColor = 'rgb(120, 120, 120)';

    let videoH = 320;
    let videoW = videoH * 1.333;
    let videoMargin = 10;

    let closeButtonSize = 27;
    let webcamTextSize = 16;

    let webcamImageX = videoMargin;
    let webcamImageY = videoMargin*2 + closeButtonSize;

    let inputImgW = 110;
    let inputImgH = videoH;
    let inputImgX = webcamImageX + videoW/2 - inputImgW/2;
    let inputImgY = webcamImageY;

    let snapButtonX = videoMargin;
    let snapButtonY = webcamImageY + videoH;

    let myCanvas;
    
    var thresholdValue = 0.3; // Value between 0.0 and 1.0 for the filter(THRESHOLD)
    var blackAnhWhiteMode = false;

    let blackAndWhiteSlider;

    sketch.setup = () => {
        // Attach the canvas to the draggable div
        myCanvas = sketch.createCanvas(videoW + videoMargin*2, videoH + videoMargin*2 + 100);
        myCanvas.parent("webcamWindow");
        myCanvas.style(`
          transform: rotateY(180deg);
          -webkit-transform:rotateY(180deg); /* Safari and Chrome */
          -moz-transform:rotateY(180deg); /* Firefox */
        `);

        sketch.background(backgroundColor);

        // Get the webcam input
        webcamVideo = sketch.createCapture(VIDEO, (stream) => {
          stopWebcam(webcamVideo);
        });
        webcamVideo.hide();
        
        // UI Stuff -----------------------------------------------------

        // White outline around the webcam image
        sketch.fill(0);
        sketch.rect(webcamImageX, webcamImageY, videoW, videoH);

        let snapButton = sketch.createButton("Snap!");
        snapButton.parent("webcamWindow");
        snapButton.position(snapButtonX, snapButtonY);
        snapButton.size(videoW, 30);
        snapButton.style(`
          cursor: pointer;
        `);
        snapButton.mousePressed(sketch.takeASnap);

        let blackAndWhiteCheckbox = sketch.createCheckbox();
        blackAndWhiteCheckbox.parent("webcamWindow");
        blackAndWhiteCheckbox.position(snapButton.x, snapButton.y + 45);

        let blackAndWhiteText = sketch.createP("Black and white filter");
        blackAndWhiteText.parent("webcamWindow");
        blackAndWhiteText.position(blackAndWhiteCheckbox.x + 20, blackAndWhiteCheckbox.y - 5);
        blackAndWhiteText.size(myCanvas.width/2, webcamTextSize);
        blackAndWhiteText.style(`
          color: white;
          margin: 0;
        `);

        let sliderMin = 0.2;
        let sliderMax = 0.6;
        let sliderDefault = 0.3;
        let sliderStep = 0.005;
        blackAndWhiteSlider = sketch.createSlider(sliderMin, sliderMax, sliderDefault, sliderStep);
        blackAndWhiteSlider.parent("webcamWindow");
        blackAndWhiteSlider.position(blackAndWhiteCheckbox.x + 200, blackAndWhiteCheckbox.y);
        blackAndWhiteSlider.size(220, 15);
        blackAndWhiteSlider.style('opacity', '0.2');

        blackAndWhiteCheckbox.changed(() => {
          blackAnhWhiteMode = blackAndWhiteCheckbox.checked();
          if (blackAnhWhiteMode) {
            blackAndWhiteSlider.style('opacity', '1');
          }
          else {
            blackAndWhiteSlider.style('opacity', '0.15');
          }
        });

        let webcamText = sketch.createP("Webcam");
        webcamText.parent("webcamWindow");
        webcamText.position(0, videoMargin + 3);
        webcamText.size(myCanvas.width, webcamTextSize);
        webcamText.style(`
          color: white;
          text-align: center;
          margin: 0;
        `);

        let closeButton = sketch.createImg("/static/infinite-line/closeButton.png");
        closeButton.parent("webcamWindow");
        closeButton.position(myCanvas.width - videoMargin - closeButtonSize, videoMargin);
        closeButton.size(closeButtonSize, closeButtonSize);
        closeButton.style(`
          z-index: 2;
          border-radius: 3px;
          padding: 7px;
          background: none;
        `);
        closeButton.mouseOver(() => {
          closeButton.style(`
            background: rgba(255, 255, 255, 0.25);
            cursor: pointer;
          `);
        });
        closeButton.mouseOut(() => {
          closeButton.style(`
            background: none;
          `);
        });
        closeButton.mousePressed(() => {
          webcamWindowDiv.style.display = "none";
          stopWebcam(webcamVideo);
        });
    };

    // Add the image from webcam to color loom
    sketch.takeASnap = () => {        
        sketch.image(webcamVideo, webcamImageX, webcamImageY, videoW, videoH);

        // Apply the black and white filter
        sketch.filter(THRESHOLD, thresholdValue);

        // Draw in the background for the webcam text and close button
        sketch.fill(120);
        sketch.rect(0, 0, myCanvas.width, webcamImageY);
        sketch.rect(0, snapButtonY, myCanvas.width, 100);
        sketch.rect(0, webcamImageY, videoMargin, videoH);
        sketch.rect(videoMargin + videoW, webcamImageY, videoMargin, videoH);

        // inputImg and newInputLoaded() are variables in Infinite Line
        inputImg = sketch.get(inputImgX, inputImgY, inputImgW, inputImgH);
        newInputLoaded();
    };

    let overlayRectW = (videoW - inputImgW)/2;
    let overlayRectH = videoH;

    sketch.draw = () => {
      sketch.image(webcamVideo, webcamImageX, webcamImageY, videoW, videoH);
      
      thresholdValue = blackAndWhiteSlider.value();
      if (blackAnhWhiteMode)
      {
        sketch.filter(THRESHOLD, thresholdValue);

        // Draw in the background for the webcam text and close button
        sketch.fill(120);
        sketch.rect(0, 0, myCanvas.width, webcamImageY);
        sketch.rect(0, snapButtonY, myCanvas.width, 100);
        sketch.rect(0, webcamImageY, videoMargin, videoH);
        sketch.rect(videoMargin + videoW, webcamImageY, videoMargin, videoH);
      }

      // Draw overlay transparent boxes
      sketch.fill("rgba(0, 0, 0, 0.75)");
      sketch.noStroke();
      sketch.rect(webcamImageX, webcamImageY, overlayRectW, overlayRectH);
      sketch.rect(webcamImageX + overlayRectW + inputImgW, webcamImageY, overlayRectW, overlayRectH);
    };
});

// Turn off the webcam
// Adapted from the stop() method in webcam-easy
// https://github.com/bensonruan/webcam-easy/blob/0ebfea62fec456c9b618d5f17c72386124e753b5/src/webcam-easy.js
function stopWebcam(element) {
  element.stop();
  element.elt.srcObject.getTracks().forEach(track => {
    track.stop();
  });
}

// Reopen the webcam
// Adapted from the stream() method in webcam-easy
// https://github.com/bensonruan/webcam-easy/blob/0ebfea62fec456c9b618d5f17c72386124e753b5/src/webcam-easy.js
async function reopenWebcam(element) {
  let constraints = { video: true, audio: false };

  return new Promise((resolve, reject) => {         
    navigator.mediaDevices.getUserMedia(constraints)
      .then(stream => {
          element.elt.srcObject = stream;
          element.elt.play();
      })
      .catch(error => {
          console.log(error);
          reject(error);
      });
  });
}

// Make element draggable ---------------------------------------------------------------------------------------
// Code from w3schools: https://www.w3schools.com/howto/howto_js_draggable.asp

makeElementDraggable(webcamWindowDiv);

function makeElementDraggable(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "Header")) {
    /* if present, the header is where you move the DIV from:*/
    document.getElementById(elmnt.id + "Header").onmousedown = dragMouseDown;
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