import { importWasm } from './loadWasm.js'
import { initHandles, resetHandles } from './handles.js'
import { updateActiveThumbnail, setCropBackground, setCropContainment,
  setImage, getCroppedImageData, getCroppedImageToSave, updateCropMask,
  createThumbnailSelector, setCropNormalMap } from './crop.js'
import { storage } from './storage.js'

function initCropAreaSize() {
  let imgWidth = $('#image-to-crop').width();
  let imgHeight = $('#image-to-crop').height();
  let cropWidth = Math.min(imgWidth, imgHeight);
  $('#crop-area').width(cropWidth);
  $('#crop-area').height(cropWidth);
  resetHandles();
}

function initCropAreaPosition() {
  let imagePos = $('#image-to-crop').offset();
  $('#crop-area').css({ top: imagePos.top, left: imagePos.left });
  resetHandles();
}

export function initCropArea() {
  initCropAreaSize();
  initCropAreaPosition();
}

function setup() {
  // Try to load the image url from storage (don't lose data over refresh)
  if (storage.currentImg) {
    let imgs = storage.imgData;
    setCropBackground(storage.currentImg);

    let norms = storage.normalMaps;

    for (let i in imgs) {
      $('#texture-list').prepend(createThumbnailSelector(i, imgs[i], norms[i]));
    }

    updateActiveThumbnail();
    setCropNormalMap();
    $('#drag-n-drop').css('display', 'none');
  }

  // $('#file-upload').on('change', (evt) => {
  //   if (!evt.target.files || !evt.target.files[0]) {
  //     alert('No files uploaded!');
  //     return;
  //   }

  //   let reader = new FileReader();
  //   $(reader).on('load', (evt) => setImage(evt.target.result));
  //   reader.readAsDataURL(evt.target.files[0]);
  // });

  $('#crop-area').draggable({scroll: false, containment: '#image-to-crop'});
  $('#crop-area').append($('<div/>', {class: 'crop-mask left'}));
  $('#crop-area').append($('<div/>', {class: 'crop-mask right'}));
  $('#crop-area').append($('<div/>', {class: 'crop-mask top'}));
  $('#crop-area').append($('<div/>', {class: 'crop-mask bottom'}));

  $('#crop-area').on('dragstart', (evt) => {
    $('.crop-mask').css('background-image', 'none');
  });
  $('#crop-area').on('dragstop', (evt) => {
    updateCropMask();
    setCropNormalMap();
  });

  // Set up the repeat preview checkbox
  $('#show-repeat-preview').on('change', (evt) => {
    updateCropMask();
  });

  $('button#export').on('click', (evt) => {
    let form = document.getElementById('upload_form');
    let fd = new FormData(form);
    let names = [];

    let imgs = storage.imgData;
    for (let i in imgs)
    {
      let imageData = getCroppedImageData(i, 'imgData');

      let name = 'texturemap_' + i;
      names.push(name);

      fd.append(name + '_size', new Blob([JSON.stringify({'width': imageData.width, 'height': imageData.height})], {type: "text"}));
      fd.append(name + '_pixels', new Blob([imageData.data], {'type': 'image/png'}));
    }

    let normalMaps = storage.normalMaps;
    for (let i in normalMaps)
    {
      let imageData = getCroppedImageData(i, 'normalMaps');

      let name = 'normalmap_' + i;
      names.push(name);

      fd.append(name + '_size', new Blob([JSON.stringify({'width': imageData.width, 'height': imageData.height})], {type: "text"}));
      fd.append(name + '_pixels', new Blob([imageData.data], {'type': 'image/png'}));
    }

    fd.append('names', new Blob([JSON.stringify(names)]));

    var msg = $.ajax({
      headers: { "X-CSRFToken": csrftoken },
      url: '/applets/upload_texture_looper/',
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
  });

  // Setup the resizing handles
  initHandles();

  // Setup file drag/drop
  $('body').on('drop', (evt) => {
    evt.preventDefault();
    let e = evt.originalEvent;
    if (!e.dataTransfer.files || !e.dataTransfer.files[0]) {
      alert('No files uploaded!');
      return;
    }

    let reader = new FileReader();
    $(reader).on('load', (evt) => {
      console.log(evt.target.result);
      setImage(evt.target.result);
      setTimeout(initCropArea, 10);
    });
    reader.readAsDataURL(e.dataTransfer.files[0]);
  });
  $('body').on('dragover', (evt) => {
    evt.preventDefault();
    $('#drag-n-drop').css('display', 'block');
    $('#drag-n-drop').css('background-color', 'white');
    $('#drag-n-drop p').html('Drop image...');
  });

  // Set up saving for project name
  storage.projectName = $('#project-name').attr('value');
  
  $('#project-name').on('keyup', (evt) => {
    evt.target.style.borderColor = 'black';
    storage.projectName = evt.target.value;
    setTimeout(() => {
      evt.target.style.borderColor = '#9ea';
    }, 500);
  });

  // $('#new-project').on('click', (evt) => {
  //   storage = {};
  //   storage.projectName = 'TEXTURE';
  //   document.getElementById('project-name').value = 'TEXTURE';
  //   window.location.reload();
  // });
}

window.onload = () => {
  importWasm().then(setup);
}
