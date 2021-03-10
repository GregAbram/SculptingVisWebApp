import { wasm_pkg } from './loadWasm.js'
import { storage } from './storage.js'

const EXPORT_WIDTH = 1024;
const EXPORT_HEIGHT = 1024;
let CROP_CANVAS = document.createElement('canvas');
let NORM_CANVAS = document.createElement('canvas');
NORM_CANVAS.width = EXPORT_WIDTH;
NORM_CANVAS.height = EXPORT_HEIGHT;

export function updateCropMask() {
  if (document.getElementById('show-repeat-preview').checked) {
    $('.crop-mask').css('background-image', 'url(' + getCroppedImageToSave(0, 'image/png') + ')');
  } else {
    $('.crop-mask').css('background-image', 'none');
  }
}

// Set the image background based on its index
export function setCropBackground(index) {
  let imgs = storage.imgData;
  let currentImgData = imgs[index];
  $('#image-to-crop').attr('src', currentImgData);
}

export function setCropNormalMap() {
  let img = document.getElementById('image-to-crop');
  if (img.complete && img.naturalHeight !== 0) {
    loadNormalMapToImage(storage.currentImg);
  } else {
    $('#image-to-crop').on('load', () => {
      loadNormalMapToImage(storage.currentImg);
      $('#image-to-crop').off('load');
    });
  }
}

export function setCropContainment() {
  // $('#crop-area').draggable('option', 'containment', '#image-to-crop');
  $('#crop-area').draggable({ containment: '#image-to-crop' });
}

// Set the image background from a newly uploaded image
export function setImage(imgData) {
  // Store the base64 image data
  let currentImg;
  let normData;
  $('#drag-n-drop p').html('Loading...');
  // Delay a bit to allow the DOM to load
  setTimeout(() => {
    if (storage.currentImg) {
      let imgs = storage.imgData;
      imgs.push(imgData);
      storage.imgData = imgs;

      let imgNorms = storage.normalMaps;
      console.log('starting image norm calc...');
      normData = wasm_pkg.normal_map(imgData);
      console.log('finished');
      imgNorms.push(normData);
      storage.normalMaps = imgNorms;
      currentImg = imgs.length - 1;
    } else {
      let arr = [imgData];
      currentImg = 0;
      storage.imgData = arr;

      console.log('starting first calc...');
      normData = wasm_pkg.normal_map(imgData);
      let normArr = [normData];
      console.log('finished first calc...');
      storage.normalMaps = normArr;
    }
    $('#drag-n-drop').css('display', 'none');
    storage.currentImg = currentImg;
    setCropBackground(currentImg);
    setCropNormalMap();

    $('#texture-list').prepend(createThumbnailSelector(currentImg, imgData, normData));
    updateActiveThumbnail();
  }, 10);
}

// Returns data URL to updated cropped image
export function getCroppedImageData(gradIndex, imgType) {

  let exportCanvas = document.createElement('canvas');
  let ctx = exportCanvas.getContext('2d');

  // let imgs = storage[imgType];
  let imgs = storage.imgData;
  let cropImgData = imgs[gradIndex];
  let croppedImg = document.createElement('img');
  croppedImg.src = cropImgData;

  // document.body.appendChild(croppedImg); // Do I need this?

  let img = document.getElementById('image-to-crop');
  let scaleFactorX = img.naturalWidth / img.width;
  let scaleFactorY = img.naturalHeight / img.height;

  let cropAreaHeight = $('#crop-area').height();
  exportCanvas.width = EXPORT_WIDTH;
  exportCanvas.height = EXPORT_HEIGHT;

  let imgOffset = $('#image-to-crop').offset();
  let offset = $('#crop-area').offset();
  let sourceX = scaleFactorX * offset.left - imgOffset.left;
  let sourceY = scaleFactorY * offset.top - imgOffset.top;
  let sourceWidth = scaleFactorX * cropAreaHeight;
  let sourceHeight = scaleFactorY * cropAreaHeight;
  ctx.drawImage(
    croppedImg, 
    sourceX, sourceY, sourceWidth, sourceHeight, 
    0, 0, EXPORT_WIDTH, EXPORT_HEIGHT
  );

  return ctx.getImageData(0, 0, EXPORT_WIDTH, EXPORT_WIDTH);
}

// Returns data URL to updated cropped image
export function getCroppedImageURL(gradIndex, imgType) {
  return getCroppedImageData(gradIndex, imgType).toDataURL('image/png');
}

// Sets the image preview for the normal map
function loadNormalMapToImage(imgIndex) {
  let ctx = NORM_CANVAS.getContext('2d');
  ctx.clearRect(0, 0, NORM_CANVAS.width, NORM_CANVAS.height);

  let normMaps = storage.normalMaps;
  let currentNormalMapData = normMaps[storage.currentImg];
  let normImg = document.createElement('img');

  $(normImg).on('load', () => {
    $(normImg).off('load');
    let img = document.getElementById('image-to-crop');
    let scaleFactorX = img.naturalWidth / img.width;
    let scaleFactorY = img.naturalHeight / img.height;

    let cropAreaHeight = $('#crop-area').height();

    // let offset = $('#crop-area').offset();
    // ctx.drawImage(
    //   normImg, scaleFactorX * offset.left, scaleFactorY * offset.top,
    //   scaleFactorX * cropAreaHeight, scaleFactorY * cropAreaHeight, 0, 0,
    //   EXPORT_WIDTH, EXPORT_HEIGHT
    // );

    let imgOffset = $('#image-to-crop').offset();
    let offset = $('#crop-area').offset();
    let sourceX = scaleFactorX * offset.left - imgOffset.left;
    let sourceY = scaleFactorY * offset.top - imgOffset.top;
    let sourceWidth = scaleFactorX * cropAreaHeight;
    let sourceHeight = scaleFactorY * cropAreaHeight;
    ctx.drawImage(
      normImg, 
      sourceX, sourceY, sourceWidth, sourceHeight, 
      0, 0, EXPORT_WIDTH, EXPORT_HEIGHT
    );

    let data = NORM_CANVAS.toDataURL('image/png');
    document.getElementById('normal-map-preview').src = data;
  });

  normImg.src = currentNormalMapData;
}

// Returns data URL to canvas with size EXPORT_WIDTH, EXPORT_HEIGHT
export function getCroppedImageToSave(gradIndex, imgType) {
  let exportCanvas = document.createElement('canvas');
  let ctx = exportCanvas.getContext('2d');

  let imgs = storage.imgData;
  let cropImgData = imgs[gradIndex];
  let croppedImg = document.createElement('img');
  croppedImg.src = cropImgData;
  // document.body.appendChild(croppedImg);

  let img = document.getElementById('image-to-crop');
  let scaleFactorX = img.naturalWidth / img.width;
  let scaleFactorY = img.naturalHeight / img.height;

  let cropAreaHeight = $('#crop-area').height();
  exportCanvas.width = EXPORT_WIDTH;
  exportCanvas.height = EXPORT_HEIGHT;

  // let offset = $('#crop-area').offset();
  // ctx.drawImage(
  //   croppedImg, scaleFactorX * offset.left, scaleFactorY * offset.top,
  //   scaleFactorX * cropAreaHeight, scaleFactorY * cropAreaHeight, 0, 0,
  //   EXPORT_WIDTH, EXPORT_HEIGHT
  // );

  let imgOffset = $('#image-to-crop').offset();
  let offset = $('#crop-area').offset();
  let sourceX = scaleFactorX * offset.left - imgOffset.left;
  let sourceY = scaleFactorY * offset.top - imgOffset.top;
  let sourceWidth = scaleFactorX * cropAreaHeight;
  let sourceHeight = scaleFactorY * cropAreaHeight;
  ctx.drawImage(
    croppedImg, 
    sourceX, sourceY, sourceWidth, sourceHeight, 
    0, 0, EXPORT_WIDTH, EXPORT_HEIGHT
  );

  // document.body.removeChild(croppedImg);
  return exportCanvas.toDataURL('image/png');
}

function thumnailClickable(el) {
  $(el).on('click', (evt) => {
    let texThumbId = $(evt.target).parents('.texture-thumb').attr('id') || evt.target.id;
    let sliceIndex = texThumbId.lastIndexOf('-'); // Should be texture-thumb-<NUMBER>
    let imageIndex = texThumbId.substring(sliceIndex + 1);
    storage.currentImg = imageIndex;
    updateActiveThumbnail();

    setCropBackground(imageIndex);
    setCropNormalMap();

    updateCropMask();
  });
}

export function createThumbnailSelector(index, imgData, normData) {
  let el = $('<li/>', {
    class: 'texture-thumb',
    id: 'texture-thumb-' + index,
  }).append($('<div/>')
    .append($('<img/>', {class: 'thumb-preview', src: imgData}))
    .append($('<img/>', {class: 'thumb-preview', src: normData}))
  )
    .append($('<p/>', {text: 'GRAD-' + index}));

  thumnailClickable(el);
  return el;
}

export function updateActiveThumbnail() {
  $('.texture-thumb').removeClass('active');
  $('.texture-thumb').each((index, el) => {
    if (el.id.includes(storage.currentImg)) {
      $(el).addClass('active');
    }
  });
}
