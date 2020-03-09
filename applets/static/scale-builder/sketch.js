/*
todo:
- add title and instructions
*/

// global vars
var mouseX;
var mouseY;
var width;
var height;
var imageWidth;
var lineLeft;
var lineWidth;
var lineHeight;
var dragRegionHeight;
var scaleType;
var controlPts;


// each artifact that gets dragged in creates an instance of this class
class ControlPt {
  constructor(uuid, x, y) {
    var _this = this;
    _this.uuid = uuid;

    // create a draggable div to hold the image
    _this.imageDiv = $('<div class="thumbnail-div"></div>')
      .draggable({
        containment: '#drag-region',
        drag: function(event, ui) {
          let midpoint = $(this).position().left + $(this).width()/2;
          _this.setValue(valueAt(midpoint));
          updateSpans();
        }
      })
      .appendTo('#workspace')
      .css({
        "position": "absolute",
        "outline": "1px solid transparent"
      })
      .hover(
        function() {
          _this.imageDiv
            .css("outline", "1px solid yellow");
          _this.spanDiv
            .css("z-index", "100")
            .css("border-left", "1px solid yellow")
            .css("border-right", "1px solid yellow")
            .css("border-bottom", "1px solid yellow");
          _this.dropLine
            .css("background-color", "yellow");

        }, function() {
          _this.imageDiv
            .css("outline", "1px solid transparent");
          _this.spanDiv
            .css("z-index", "1")
            .css("border-left", "1px solid black")
            .css("border-right", "1px solid black")
            .css("border-bottom", "1px solid black");
         _this.dropLine
            .css("background-color", "black");
        });


    // create a line that connects the image div to the number line at the bottom
    _this.dropLine = $('<div class="dropline"></div>')
      .appendTo("#workspace")
      .css({
        "position": "absolute",
        "width": 1 + "px",
        "background-color": "black"
      });

    // create the img itself
    let url = "http://sculptingvis.tacc.utexas.edu/static/Artifacts/" + uuid + "/thumbnail.png";
    _this.image = $('<img class="thumbnail-img" src="'+ url +'" width="100%" height="100%">')
      .appendTo(_this.imageDiv)
      .on('load', function() {
        // adjust image div now that we know the true size of the image
        // the width is a global property because it is the same for
        // all images on the line, but the height is set based on the aspect
        // ratio of the image.
        let imageLeft = x - imageWidth/2;
        let imageHeight = imageWidth * this.naturalHeight / this.naturalWidth;
        let imageTop = y - imageHeight/2;
        _this.imageDiv
          .css("left", imageLeft + "px")
          .css("top", imageTop + "px")
          .css("width", imageWidth + "px")
          .css("height", imageHeight + "px");
        // call set value to trigger update of all the other divs
        _this.setValue(valueAt(x));
        updateSpans();
      });

    // create a text label to go under the number line
    _this.valLabel = $('<div class="vallabel"></div>')
      .appendTo("#workspace")
      .css({
        "position": "absolute",
        "top": lineTop + 1.25*lineHeight + "px",
        "left": x + "px",
        "color": "rgb(255,255,255)",
        "transform": "translate(-50%,0%)"
      })
      .text(valueAt(x).toFixed(3));

    // create span marker
    _this.spanDiv = $('<div class="spanline"></div>')
      .appendTo("#workspace")
      .css({
        "position": "absolute",
        "top": lineTop - lineHeight + "px",
        "left": x + "px",
        "height": lineHeight + "px",
        "border-left": "1px solid black",
        "border-right": "1px solid black",
        "border-bottom": "1px solid black",
        "width": 1 + "px",
      });

      // create a text label for the left span mark
      _this.lSpanLabel = $('<div class="spanlabel"></div>')
        .appendTo("#workspace")
        .css({
          "position": "absolute",
          "top": lineTop - 2*lineHeight + "px",
          "left": x + "px",
          "color": "black",
          "transform": "translate(-50%,0%)"
        })
        .text(valueAt(x).toFixed(3));

      // create a text label for the left span mark
      _this.rSpanLabel = $('<div class="spanlabel"></div>')
        .appendTo("#workspace")
        .css({
          "position": "absolute",
          "top": lineTop - 2*lineHeight + "px",
          "left": x + "px",
          "color": "black",
          "transform": "translate(-50%,0%)"
        })
        .text(valueAt(x).toFixed(3));

      // create delete btn
      _this.deleteBtn = $('<div class="delete-btn"></div>')
        .appendTo(_this.imageDiv)
        .css({
          "position": "absolute",
          "top": 0 + "px",
          "right": 2 + "px",
          "height": 12 + "px",
          "width": 12 + "px",
          "color": "gray",
          "font-size": 10 + "px",
          "user-select": "none",
          "z-index": 10
        })
        .html("&#x2716;")
        .hover(
          function() {
            $(this).css("color", "red");
          }, function() {
            $(this).css("color", "gray");
          })
        .click(function() {
          console.log("delete");
          _this.imageDiv.remove();
          _this.dropLine.remove();
          _this.valLabel.remove();
          _this.spanDiv.remove();
          _this.lSpanLabel.remove();
          _this.rSpanLabel.remove();
          controlPts.splice(controlPts.indexOf(_this), 1);
          updateSpans();
        });

  }

  updateSpan(left, right) {
    let width = right - left + 1 - 2; // -2 for 1px border on left and right
    this.spanDiv
      .css("left", left + "px")
      .css("width", width + "px")
      .css("visibility", "visible");
    this.lSpanLabel
      .text(valueAt(left).toFixed(3))
      .css("left", left + "px")
      .css("visibility", "visible");
    this.rSpanLabel
      .text(valueAt(right).toFixed(3))
      .css("left", right + "px")
      .css("visibility", "visible");
  }

  hideSpan() {
      this.spanDiv
        .css("visibility", "hidden");
      this.lSpanLabel
        .css("visibility", "hidden");
      this.rSpanLabel
        .css("visibility", "hidden");
  }

  // returns the current numeric value
  value() {
    let midpoint = this.imageDiv.position().left + this.imageDiv.width()/2;
    return valueAt(midpoint);
  }


  // sets the value to some number 0..1 and updates all the divs appropriately
  setValue(val) {
    let midpoint = posAt(val);
    let imageLeft = midpoint - imageWidth/2;
    let imageHeight = imageWidth * this.imageDiv.height() / this.imageDiv.width();
    let imageBottom = this.imageDiv.position().top + imageHeight;

    this.imageDiv
    .css("left", imageLeft + "px");

    this.dropLine
      .css("left", midpoint + "px")
      .css("top", imageBottom + "px")
      .css("height", lineTop - imageBottom + "px");

    this.valLabel
      .text(this.value().toFixed(3))
      .css("left", midpoint + "px");
  }

  getUuid() {
    return this.uuid;
  }

} // end ControlPt class


// returns what the value would be if the image were centered on xPos
function valueAt(xPos) {
  let val = (xPos - lineLeft) / (lineWidth-1);
  if (val <= 0.0) {
    return 0.0;
  }
  else if (val >= 1.0) {
    return 1.0;
  }
  else {
    return val;
  }
}


// returns the position in pixels along the number line for a value 0..1
function posAt(val) {
  let pos = lineLeft + val*(lineWidth-1);
  if (pos <= lineLeft) {
    return lineLeft;
  }
  else if (pos >= lineLeft + (lineWidth-1)) {
    return lineLeft + (lineWidth-1);
  }
  else {
    return pos;
  }
}


function addControlPt(uuid, x, y) {
  controlPts.push(new ControlPt(uuid, x, y));
  updateSpans();
}


function updateSpans() {
  controlPts.sort(function(a,b) { return a.value() - b.value(); });
  for (let i=0; i<controlPts.length; i++) {
    if (scaleType == "discrete") {
      let min = 0.0;
      let max = 1.0;
      if (i > 0) {
        min = (controlPts[i-1].value() + controlPts[i].value()) / 2;
      }
      let maxVal = 1.0;
      if (i < controlPts.length-1) {
        max = (controlPts[i+1].value() + controlPts[i].value()) / 2;
      }
      let left = posAt(min);
      let right = posAt(max);
      controlPts[i].updateSpan(left, right);
    }
    else {
      controlPts[i].hideSpan();
    }
  }
}


function distributeEvenly() {
  controlPts.sort(function(a,b) { return a.value() - b.value(); });
  if (controlPts.length == 1) {
    controlPts[0].setValue(0.5);
  }
  else {
    for (let i=0; i<controlPts.length; i++) {
      controlPts[i].setValue(i/(controlPts.length-1));
    }
  }
  updateSpans();
}


function save() {
  controlPts.sort(function(a,b) { return a.value() - b.value(); });
  let json = '';
  json += '[\n';
  json += '  {\n';

  json += '    "ScaleType" : "' + scaleType + '"\n';

  json += '    "Values" : [\n';
  for (let i=0; i<controlPts.length; i++) {
    json += '      ' + controlPts[i].value();
    if (i < controlPts.length-1) {
      json += ',\n';
    }
    else {
      json += '\n';
    }
  }
  json += '    ]\n';

  json += '    "UUIDs" : [\n';
  for (let i=0; i<controlPts.length; i++) {
    json += '      ' + controlPts[i].getUuid();
    if (i < controlPts.length-1) {
      json += ',\n';
    }
    else {
      json += '\n';
    }
  }
  json += '    ]\n';

  json += '  }\n';
  json += ']\n';


  // TODO: Save this thing to the library...
  console.log(json);
}



// Setup
$(function() {
  mouseX = -1;
  mouseY = -1;
  width = $(window).width();
  height = $(window).height();
  scaleType = "discrete";

  // sizing parameters
  imageWidth = Math.round(0.1*width);
  lineLeft = Math.round(0.75*imageWidth);
  lineTop = Math.round(0.8*height);
  lineWidth = width - (2*lineLeft);
  lineHeight = Math.round(0.02*height);
  dragRegionHeight = Math.round(0.5*height);

  // global control point array
  controlPts = [];

  $(document.body).append('<div id="workspace"></div>');

  $('#workspace').css({
    "width": width + "px",
    "height": height + "px",
    "background-color": "rgb(100,100,100)"
  });

  $('#workspace').append('<div id="drag-region"></div>');
  $('#drag-region').css({
    "position": "absolute",
    "width": width + "px",
    "height": dragRegionHeight + "px",
    "top": lineTop - dragRegionHeight + "px",
  });

  $('#workspace').append('<div id="dataline"></div>');
  $('#dataline').css({
    "position": "absolute",
    "left": lineLeft + "px",
    "top": lineTop + "px",
    "width": lineWidth + "px",
    "height": lineHeight + "px",
    "background-color": "rgb(0,0,0)"
  });


  $('<div class="spanlabel"></div>')
    .appendTo("#workspace")
    .css({
      "position": "absolute",
      "top": lineTop - 2*lineHeight + "px",
      "left": posAt(0.0) + "px",
      "color": "black",
      "transform": "translate(-50%,0%)"
    })
    .text("0.000");

  $('<div class="spanlabel"></div>')
    .appendTo("#workspace")
    .css({
      "position": "absolute",
      "top": lineTop - 2*lineHeight + "px",
      "left": posAt(1.0) + "px",
      "color": "black",
      "transform": "translate(-50%,0%)"
    })
    .text("1.000");


  $('<h1>Scale Builder</h1>').css({
    "color": "white",
    "position": "absolute",
    "left": 20 + "px",
    "top": 0 + "px",
  }).appendTo('#workspace');

  $('<p>Drag glyph or texture thumbnails from the artifact library and position them along the number line.</p>').css({
    "color": "white",
    "position": "absolute",
    "left": 20 + "px",
    "top": 44 + "px",
    "font-family": "Verdana, Geneva, sans-serif",
    "font-size": "small"
  }).appendTo('#workspace');

  $('#scaletypediv').css({
      "position": "absolute",
      "left": 20 + "px",
      "top": 100 + "px",
      "color": "white",
      "font-family": "Verdana, Geneva, sans-serif",
      "font-size": "small"
  });
  $('input:radio[name="scale-type"]').change(function() {
    scaleType = $(this).val();
    updateSpans();
  });

  $('#distrib-btn').css({
    "position": "absolute",
    "left": 20 + "px",
    "top": 160 + "px",
    "width": 140 + "px"
  });

  $('#save-btn').css({
    "position": "absolute",
    "left": 20 + "px",
    "top": 190 + "px",
    "width": 140 + "px"
  });

}); // end setup



// event handlers
$(document).mousemove(function(event) {
    mouseX = event.pageX;
    mouseY = event.pageY;
});

$(document).on('dragover', (evt) => {
  mouseX = event.pageX;
  mouseY = event.pageY;
  evt.preventDefault();
});

$(document).on('drop', (evt) => {
  evt.preventDefault();
  evt.originalEvent.dataTransfer.items[0].getAsString((url) => {
    let uuidRegex = /[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}/;
    let matches = uuidRegex.exec(url);
    if (matches[0]) {
      addControlPt(matches[0], mouseX, mouseY);
    }
  });
});
