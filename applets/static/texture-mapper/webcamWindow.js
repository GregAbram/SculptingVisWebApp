import { setImage } from './crop.js'
import { initCropArea } from './index.js'

var webcamVideo;

const webcamWindowDiv = document.getElementById("webcamWindow");
const webcamWindowDivStyles = {
  display: 'none',
  position: 'absolute',
  zIndex: 100,
  top: '20%', 
  left: '30%', 
  boxShadow: '1px 2px 25px -5px rgba(0,0,0,0.74)',
  webkitBoxShadow: '1px 2px 25px -5px rgba(0,0,0,0.74)',
  mozBoxShadow: '1px 2px 25px -5px rgba(0,0,0,0.74)'
};
Object.assign(webcamWindowDiv.style, webcamWindowDivStyles);

const webcamButton = document.getElementById("webcamButton");
webcamButton.addEventListener("click", () => {
  webcamWindowDiv.style.display = "block";
  reopenWebcam(webcamVideo);
});

function loadImageToApplet(imageToLoad) {
  let reader = new FileReader();

  $(reader).on('load', (evt) => {
    setImage(evt.target.result);
    setTimeout(initCropArea, 10);
  });

  imageToLoad.canvas.toBlob(blob => {
    reader.readAsDataURL(blob);
  });
}

let myp5 = new p5(( sketch ) => {

    let backgroundColor = 'rgb(120, 120, 120)';

    let videoH = 720;
    let videoW = videoH * 1.333;
    let videoMargin = 10;

    let closeButtonSize = 27;
    let webcamTextSize = 16;

    let webcamImageX = videoMargin;
    let webcamImageY = videoMargin*2 + closeButtonSize;

    let inputImgW = videoW;
    let inputImgH = videoH;
    let inputImgX = webcamImageX;
    let inputImgY = webcamImageY;

    let snapButtonX = videoMargin;
    let snapButtonY = webcamImageY + videoH;

    let myCanvas;
    
    sketch.setup = () => {
        // Attach the canvas to the draggable div
        myCanvas = sketch.createCanvas(videoW + videoMargin*2, videoH + videoMargin*2 + 100);
        myCanvas.parent("webcamWindow");
        myCanvas.style(`
          transform: rotateY(180deg);
          -webkit-transform:rotateY(180deg);
          -moz-transform:rotateY(180deg);
        `);

        sketch.background(backgroundColor);

        // Get the webcam input
        webcamVideo = sketch.createCapture(sketch.VIDEO, (stream) => {
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

      // Load image into the texture mapper applet
      let imageToLoad = sketch.get(inputImgX, inputImgY, inputImgW, inputImgH);
      loadImageToApplet(imageToLoad);
    };

    sketch.draw = () => {
      sketch.image(webcamVideo, webcamImageX, webcamImageY, videoW, videoH);
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