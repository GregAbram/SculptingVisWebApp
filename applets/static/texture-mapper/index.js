import { importWasm } from './loadWasm.js'
import initHandles from './handles.js'
import { updateActiveThumbnail, setCropBackground, setCropContainment,
  setImage, getCroppedImageData, getCroppedImageToSave, updateCropMask,
  createThumbnailSelector, setCropNormalMap } from './crop.js'

function setup() {
  // Try to load the image url from storage (don't lose data over refresh)
  if (sessionStorage['currentImg']) {
    let imgs = JSON.parse(sessionStorage['imgData']);
    setCropBackground(sessionStorage['currentImg']);

    let norms = JSON.parse(sessionStorage['normalMaps']);

    for (let i in imgs) {
      $('#texture-list').prepend(createThumbnailSelector(i, imgs[i], norms[i]));
    }

    updateActiveThumbnail();
    setCropNormalMap();
    $('#drag-n-drop').css('display', 'none');
  }

  $('#file-upload').on('change', (evt) => {
    if (!evt.target.files || !evt.target.files[0]) {
      alert('No files uploaded!');
      return;
    }

    let reader = new FileReader();
    $(reader).on('load', (evt) => setImage(evt.target.result));
    reader.readAsDataURL(evt.target.files[0]);
  });

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
    let names = []

    let imgs = JSON.parse(sessionStorage['imgData']);
    for (let i in imgs)
    {
      let imageData = getCroppedImageData(i, 'imgData');

      name = 'texturemap_' + i;
      names.push(name);

      fd.append(name + '_size', new Blob([JSON.stringify({'width': imageData.width, 'height': imageData.height})], {type: "text"}));
      fd.append(name + '_pixels', new Blob([imageData.data], {'type': 'image/png'}));

      if (i == 0)
      {
        fd.append('thumbnail_size', new Blob([JSON.stringify({'width': imageData.width, 'height': imageData.height})], {type: "text"}));
        fd.append('thumbnail_pixels', new Blob([imageData.data], {'type': 'image/png'}));
      }
    }

    let normalMaps = JSON.parse(sessionStorage['normalMaps']);
    for (let i in normalMaps)
    {
      let imageData = getCroppedImageData(i, 'normalMaps');

      name = 'normalmap_' + i;
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
  sessionStorage.setItem('projectName', $('#project-name').attr('value'));
  $('#project-name').on('keyup', (evt) => {
    evt.target.style.borderColor = 'black';
    sessionStorage.setItem('projectName', evt.target.value);
    setTimeout(() => {
      evt.target.style.borderColor = '#9ea';
    }, 500);
  });

  $('#new-project').on('click', (evt) => {
    sessionStorage.clear();
    sessionStorage.setItem('projectName', 'TEXTURE');
    document.getElementById('project-name').value = 'TEXTURE';
    window.location.reload();
  });
}

window.onload = () => {
  importWasm().then(setup);
}
