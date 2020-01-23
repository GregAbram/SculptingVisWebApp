function resetHandles() {
  let cropArea = $('#crop-area');
  $('.resize-handle.low.right').offset({left: cropArea.offset().left + cropArea.width() - 10, top: cropArea.offset().top + cropArea.height() - 10});
  $('.resize-handle.up.left').offset({left: cropArea.offset().left - 10, top: cropArea.offset().top - 10});
  $('.resize-handle.up.right').offset({left: cropArea.offset().left + cropArea.width() - 10, top: cropArea.offset().top - 10});
  $('.resize-handle.low.left').offset({left: cropArea.offset().left - 10, top: cropArea.offset().top + cropArea.height() - 10});
  $('.resize-handle').draggable('option', 'containment', '#image-to-crop');
}

export default function initHandles() {
  $('#crop-area').append($('<div/>', {class: 'resize-handle up left'}))
  $('#crop-area').append($('<div/>', {class: 'resize-handle up right'}))
  $('#crop-area').append($('<div/>', {class: 'resize-handle low left'}))
  $('#crop-area').append($('<div/>', {class: 'resize-handle low right'}))

  $('.resize-handle').draggable({scroll: false});
  resetHandles();

  // Resize the crop area based on current dragging
  $('.resize-handle.low.right').on('drag', (evt, ui) => {
    let newSize = evt.clientY - $('#crop-area').offset().top;
    $('#crop-area').css({
      height: newSize,
      width: newSize,
    });
    ui.position.left = newSize - 10;
    resetHandles();
    $('#crop-area').draggable('option', 'containment', '#image-to-crop');
  });
  $('.resize-handle.up.left').on('drag', (evt, ui) => {
    let originalPosition = $('#crop-area').offset();
    let newSize = $('#crop-area').height() - (evt.clientY - $('#crop-area').offset().top);
    $('#crop-area').css({
      height: newSize,
      width: newSize,
      left: (evt.clientY - originalPosition.top) + originalPosition.left,
      top: evt.clientY,
    });
    ui.position.left = -10;
    ui.position.top = -10;
    resetHandles();
    $('#crop-area').draggable('option', 'containment', '#image-to-crop');
  });
  $('.resize-handle.up.right').on('drag', (evt, ui) => {
    let originalPosition = $('#crop-area').offset();
    let newSize = $('#crop-area').height() - (evt.clientY - $('#crop-area').offset().top);
    $('#crop-area').css({
      height: newSize,
      width: newSize,
      left: originalPosition.left,
      top: evt.clientY,
    });
    ui.position.left = newSize - 10;
    ui.position.top = -10;
    resetHandles();
    $('#crop-area').draggable('option', 'containment', '#image-to-crop');
  });
  $('.resize-handle.low.left').on('drag', (evt, ui) => {
    let originalPosition = $('#crop-area').offset();
    let newSize = evt.clientY - $('#crop-area').offset().top;
    $('#crop-area').css({
      height: newSize,
      width: newSize,
      left: ((originalPosition.top + $('#crop-area').height()) - evt.clientY) + originalPosition.left,
    });
    ui.position.left = -10;
    ui.position.top = newSize - 10;
    resetHandles();
    $('#crop-area').draggable('option', 'containment', '#image-to-crop');
  });
}
