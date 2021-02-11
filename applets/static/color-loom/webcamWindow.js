var webcamImage;

let myp5 = new p5(( sketch ) => {

    let videoH = 300;
    let videoW = videoH * 1.333;
    let videoMargin = 10;

    let webcamVideo;
    let webcamImageX = videoMargin;
    let webcamImageY = videoMargin;

    sketch.setup = () => {
        let myCanvas = sketch.createCanvas(videoW + videoMargin*2, videoH + videoMargin*2 + 30);
        sketch.background(120);

        // Attach the canvas to the draggable div
        myCanvas.parent("webcamWindow");

        // Get the webcam input
        webcamVideo = sketch.createCapture(VIDEO);
        webcamVideo.parent("webcamWindow");
        webcamVideo.size(videoW, videoH);
        webcamVideo.style(`position: absolute; top: ${webcamImageX}; left: ${webcamImageY};`);

        // White outline around the webcam image
        sketch.fill(0);
        sketch.rect(webcamImageX, webcamImageY, videoW, videoH);

        let snapButton = sketch.createButton("Snap!");
        snapButton.parent("webcamWindow");
        snapButton.position(webcamImageX, myCanvas.height - videoMargin - 30);
        snapButton.size(videoW, 30);
        snapButton.mousePressed(sketch.takeASnap);
    };

    sketch.takeASnap = () => {
        // droppedImg = webcamVideo.get();

        // console.log("webcamVideo");
        // console.log(webcamVideo);
        // console.log("webcamVideo.get()");
        // console.log(webcamVideo.get());
        
        sketch.image(webcamVideo, webcamImageX, webcamImageY, videoW, videoH);
        droppedImg = sketch.get(webcamImageX, webcamImageY, videoW, videoH);
        newInputLoaded();
    }

    // sketch.draw = () => {
    //     sketch.image(webcamVideo, webcamImageX, webcamImageY, videoW, videoH);
    // };
});


// Make element draggable ---------------------------------------------------------------------------------------
// Reference from w3schools: https://www.w3schools.com/howto/howto_js_draggable.asp

makeElementDraggable(document.getElementById("webcamWindow"));

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