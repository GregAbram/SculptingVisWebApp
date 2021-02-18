var webcamWindowDiv = document.getElementById("webcamWindow");
webcamWindowDiv.style.display = "none";

let myp5 = new p5(( sketch ) => {

    let videoH = 300;
    let videoW = videoH * 1.333;
    let videoMargin = 10;

    let webcamVideo;
    let webcamImageX = videoMargin;
    let webcamImageY = videoMargin + 30;

    let inputImgW = 110;
    let inputImgH = videoH;
    let inputImgX = webcamImageX + videoW/2 - inputImgW/2;
    let inputImgY = webcamImageY;

    sketch.setup = () => {
        // Attach the canvas to the draggable div
        let myCanvas = sketch.createCanvas(videoW + videoMargin*2, videoH + videoMargin*2 + 60);
        myCanvas.parent("webcamWindow");

        sketch.background(120);

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

        sketch.textAlign(CENTER);
        sketch.textSize(16);
        sketch.fill(255);
        let webcamText = sketch.text("Webcam", myCanvas.width/2, 26);

        let closeButtonSize = 20;
        let closeButton = sketch.createImg("/static/color-loom/closeButton.png");
        closeButton.parent("webcamWindow");
        closeButton.position(myCanvas.width - videoMargin - closeButtonSize, 10);
        closeButton.size(closeButtonSize, closeButtonSize);
        closeButton.style(`
          border-radius: 50%;
          padding: 3px;
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

        // inputImg and newInputLoaded() are variables in Infinite Line
        inputImg = sketch.get(inputImgX, inputImgY, inputImgW, inputImgH);
        newInputLoaded();
    }

    let overlayRectW = (videoW - inputImgW)/2;
    let overlayRectH = videoH;

    sketch.draw = () => {
      sketch.image(webcamVideo, webcamImageX, webcamImageY, videoW, videoH);
      sketch.fill("rgba(0, 0, 0, 0.75)");
      sketch.noStroke();
      sketch.rect(webcamImageX, webcamImageY, overlayRectW, videoH);
      sketch.rect(webcamImageX + overlayRectW + inputImgW, webcamImageY, overlayRectW, videoH);
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