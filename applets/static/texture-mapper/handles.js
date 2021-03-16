export function resetHandles() {
  let topPageMargin = 51;
  let cropArea = $('#crop-area');
  $('.resize-handle.low.right').offset({left: cropArea.offset().left + cropArea.width() - 10, top: cropArea.offset().top + cropArea.height() - 10});
  $('.resize-handle.up.left').offset({left: cropArea.offset().left - 10, top: cropArea.offset().top - 10});
  $('.resize-handle.up.right').offset({left: cropArea.offset().left + cropArea.width() - 10, top: cropArea.offset().top - 10});
  $('.resize-handle.low.left').offset({left: cropArea.offset().left - 10, top: cropArea.offset().top + cropArea.height() - 10});
  $('.resize-handle').draggable('option', 'containment', '#image-to-crop');
}

export function initHandles() {
  $('#crop-area').append($('<div/>', {class: 'resize-handle up left'}))
  $('#crop-area').append($('<div/>', {class: 'resize-handle up right'}))
  $('#crop-area').append($('<div/>', {class: 'resize-handle low left'}))
  $('#crop-area').append($('<div/>', {class: 'resize-handle low right'}))

  $('.resize-handle').draggable({scroll: false, containment: '#image-to-crop'});
  // resetHandles();

  // Resize the crop area based on current dragging

  // $('.resize-handle.low.right').on('drag', (evt, ui) => {
  //   let newSize = ui.offset.top - $('#crop-area').offset().top;
  //   if (newSize < 30) {
  //     newSize = 30;
  //   }
  //   $('#crop-area').css({
  //     height: newSize,
  //     width: newSize,
  //   });
  //   ui.position.left = newSize - 10;
  //   ui.position.top = newSize - 10;
  //   resetHandles();
  //   $('#crop-area').draggable('option', 'containment', '#image-to-crop');
  // });

  // $('.resize-handle.up.left').on('drag', (evt, ui) => {
  //   let originalPosition = $('#crop-area').offset();
  //   let newSize = $('#crop-area').height() - (evt.clientY - $('#crop-area').offset().top);
  //   $('#crop-area').css({
  //     height: newSize,
  //     width: newSize,
  //     left: (evt.clientY - originalPosition.top) + originalPosition.left,
  //     top: evt.clientY,
  //   });
  //   ui.position.left = -10;
  //   ui.position.top = -10;
  //   resetHandles();
  //   $('#crop-area').draggable('option', 'containment', '#image-to-crop');
  // });

  // $('.resize-handle.up.right').on('drag', (evt, ui) => {
  //   let originalPosition = $('#crop-area').offset();
  //   let newSize = $('#crop-area').height() - (evt.clientY - $('#crop-area').offset().top);
  //   $('#crop-area').css({
  //     height: 12,
  //     width: 12,
  //     left: originalPosition.left,
  //     top: evt.clientY,
  //   });
  //   ui.position.left = newSize - 10;
  //   ui.position.top = -10;
  //   resetHandles();
  //   $('#crop-area').draggable('option', 'containment', '#image-to-crop');
  // });

  // $('.resize-handle.low.left').on('drag', (evt, ui) => {
  //   let originalPosition = $('#crop-area').offset();
  //   let newSize = evt.clientY - $('#crop-area').offset().top;
  //   $('#crop-area').css({
  //     height: newSize,
  //     width: newSize,
  //     left: ((originalPosition.top + $('#crop-area').height()) - evt.clientY) + originalPosition.left,
  //   });
  //   ui.position.left = -10;
  //   ui.position.top = newSize - 10;
  //   resetHandles();
  //   $('#crop-area').draggable('option', 'containment', '#image-to-crop');
  // });

  makeResizableDiv('#crop-area');
}

// Make resizable div by Hung Nguyen
// https://medium.com/the-z/making-a-resizable-div-in-js-is-not-easy-as-you-think-bda19a1bc53d
function makeResizableDiv(div) {
  const element = document.querySelector(div);
  const resizers = document.querySelectorAll('.resize-handle');

  const minimum_size = 30;
  let original_width = 0;
  let original_height = 0;
  let original_x = 0;
  let original_y = 0;
  let original_mouse_x = 0;
  let original_mouse_y = 0;

  for (let i = 0;i < resizers.length; i++) {
    const currentResizer = resizers[i];
    currentResizer.addEventListener('mousedown', function(e) {
      e.preventDefault();
      original_width = parseFloat(getComputedStyle(element, null).getPropertyValue('width').replace('px', ''));
      original_height = parseFloat(getComputedStyle(element, null).getPropertyValue('height').replace('px', ''));
      original_x = element.getBoundingClientRect().left;
      original_y = element.getBoundingClientRect().top;
      original_mouse_x = e.pageX;
      original_mouse_y = e.pageY;
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', stopResize);
    })

    function onMouseMove(e) {
      resize(e);
      resetHandles();
    }
    
    function resize(e) {
      if (currentResizer.classList.contains('low') && currentResizer.classList.contains('right')) {
        const width = original_width + (e.pageX - original_mouse_x);
        const height = original_height + (e.pageY - original_mouse_y);
        if (width > minimum_size) {
          element.style.width = width + 'px';
          element.style.height = width + 'px';
        }
        if (height > minimum_size) {
          element.style.height = height + 'px';
          element.style.width = height + 'px';
        }
      }
      else if (currentResizer.classList.contains('low') && currentResizer.classList.contains('left')) {
        const height = original_height + (e.pageY - original_mouse_y);
        const width = original_width - (e.pageX - original_mouse_x);
        if (height > minimum_size) {
          element.style.height = height + 'px';
          element.style.width = height + 'px';
        }
        if (width > minimum_size) {
          element.style.width = width + 'px';
          element.style.height = width + 'px';
          element.style.left = original_x + (e.pageX - original_mouse_x) + 'px';
        }
      }
      else if (currentResizer.classList.contains('up') && currentResizer.classList.contains('right')) {
        const width = original_width + (e.pageX - original_mouse_x);
        const height = original_height - (e.pageY - original_mouse_y);
        if (width > minimum_size) {
          element.style.width = width + 'px';
          element.style.height = width + 'px';
        }
        if (height > minimum_size) {
          element.style.height = height + 'px';
          element.style.width = height + 'px';
          element.style.top = original_y + (e.pageY - original_mouse_y) + 'px';
        }
      }
      else { // up left
        const width = original_width - (e.pageX - original_mouse_x);
        const height = original_height - (e.pageY - original_mouse_y);
        if (width > minimum_size) {
          element.style.width = width + 'px';
          element.style.height = width + 'px';
          element.style.left = original_x + (e.pageX - original_mouse_x) + 'px';
        }
        if (height > minimum_size) {
          element.style.height = height + 'px';
          element.style.width = height + 'px';
          element.style.top = original_y + (e.pageY - original_mouse_y) + 'px';
        }
      }
    }
    
    function stopResize() {
      window.removeEventListener('mousemove', onMouseMove);
    }
  }
}
