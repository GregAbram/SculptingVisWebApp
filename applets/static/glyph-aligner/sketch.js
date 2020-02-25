/*
---- later ----
- adjust center point
  - need some UI to specify translation
- type in exact values
  - for translations, can apply right away
  - for forward and up vectors, use an apply button
*/


if ( THREE.WEBGL.isWebGLAvailable() === false ) {
  document.body.appendChild( WEBGL.getWebGLErrorMessage() );
}

var canvas;
var renderer;
var loader;
var fontLoader;
var editScene, dataScene;
var editCamera;
var glyphObj, axisGroup;
var dataGroup;
var scenes = [];
var isDragging = false;

var thumbnailURL;
var thumbnailNode;

var editWindowElement;

init();
animate();



function init() {
    
  canvas = document.getElementById( "c" );
  loader = new THREE.OBJLoader();
  fontLoader = new THREE.FontLoader();


  var template = document.getElementById( "template" ).text;
  var content = document.getElementById( "content" );
    
	// SETUP GLYPH EDITOR SCENE

  editScene = new THREE.Scene();
  editScene.background = new THREE.Color(0x111111);

  // make a list item
  var element = document.createElement( "div" );
  element.className = "list-item";
  element.innerHTML = template.replace( '$', "Glyph Align Window" );

  // Look up the element that represents the area
  // we want to render the scene
  editScene.userData.element = element.querySelector( ".scene" );
  content.appendChild( element );
  
  editWindowElement = editScene.userData.element;
  editWindowElement.addEventListener( 'mousedown', onDocumentMouseDown, false );

  
  var aspectRatio = 500/500; // todo: should be able to look up width/height
  editCamera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
  editCamera.up.set(1,0,0);
  //editCamera.position.set(1, 0, 3.5);
  editCamera.position.set(0, 0, 3.5);
  editScene.userData.camera = editCamera;

  
  var controls = new THREE.OrbitControls( editScene.userData.camera, editScene.userData.element );
  controls.minDistance = 1;
  controls.maxDistance = 20;
  controls.enablePan = false;
  controls.enableZoom = false;
  //var controls = new THREE.TrackballControls( editScene.userData.camera);
	//controls.rotateSpeed = 1.0;
  //controls.noZoom = true;
  //controls.noPan = true;
  //controls.dynamicDampingFactor = 1.0;
  editScene.userData.controls = controls;
  
  
  editScene.add( new THREE.HemisphereLight( 0xaaaaaa, 0x444444 ) );

  var light = new THREE.DirectionalLight( 0xffffff, 0.5 );
  light.position.set( 1, 1, 1 );
  editScene.add( light );

  axisGroup = new THREE.Group();
  editScene.add(axisGroup);
  
  var dashGeom = new THREE.CylinderBufferGeometry( 0.01, 0.01, 0.1, 12 );
  var dashMat = new THREE.MeshBasicMaterial( {color: 0xffffff} );
  var dash;
  for (var y=-1.5; y<1.5; y+= 0.2) {
    dash = new THREE.Mesh( dashGeom, dashMat );
    dash.position.set(0, y, 0);
    axisGroup.add(dash);
  }
  for (var x=0; x<1.5; x+= 0.2) {
    dash = new THREE.Mesh( dashGeom, dashMat );
    dash.position.set(x, 0, 0);
    dash.rotateZ(THREE.Math.degToRad(90));
    axisGroup.add(dash);
  }
  
  var geo = new THREE.EdgesGeometry( new THREE.BoxGeometry(2,2,2) ); // or WireframeGeometry( geometry )
  var mat = new THREE.LineBasicMaterial( { color: 0xffffff, linewidth: 2 } );
  var wireframe = new THREE.LineSegments( geo, mat );
  axisGroup.add( wireframe );
  
  fontLoader.load( 'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function ( font ) {
    var textMat = new THREE.MeshBasicMaterial( {color: 0xffffff} );
    
    var forwardGeom = new THREE.TextGeometry( 'forward', {
      font: font,
      size: 0.1,
      height: 0.01,
      curveSegments: 12,
      bevelEnabled: false
    } );
    var forwardMesh = new THREE.Mesh( forwardGeom, textMat );
    var box = new THREE.Box3().setFromObject( forwardMesh );
    forwardMesh.position.set(box.min.x - (box.max.x-box.min.x)/2, 1.7, 0);
		axisGroup.add(forwardMesh);
    
    var upGeom = new THREE.TextGeometry( 'up', {
      font: font,
      size: 0.1,
      height: 0.01,
      curveSegments: 12,
      bevelEnabled: false
    } );
    var upMesh = new THREE.Mesh( upGeom, textMat );
    box = new THREE.Box3().setFromObject( upMesh );
    upMesh.position.set(1.7, box.min.x + (box.max.x-box.min.x)/2, 0);
    upMesh.rotateZ(THREE.Math.degToRad(-90));
		axisGroup.add(upMesh);
  } );
  
  scenes.push(editScene);
  
	// SETUP DATA PREVIEW SCENE

  dataScene = new THREE.Scene();
  dataScene.background = new THREE.Color(0x111111);

  // make a list item
  element = document.createElement( "div" );
  element.className = "list-item";
  element.innerHTML = template.replace( '$', "Data-Driven Preview" );

  // Look up the element that represents the area
  // we want to render the scene
  dataScene.userData.element = element.querySelector( ".scene" );
  content.appendChild( element );

  aspect = dataScene.userData.element.clientHeight / dataScene.userData.element.clientWidth;
  camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
  camera.position.set(0, 7, 10);
  dataScene.userData.camera = camera;

  controls = new THREE.OrbitControls( dataScene.userData.camera, dataScene.userData.element );
  controls.minDistance = 1;
  controls.maxDistance = 20;
  controls.enablePan = false;
  controls.enableZoom = false;
  dataScene.userData.controls = controls;

  dataScene.add( new THREE.HemisphereLight( 0xaaaaaa, 0x444444 ) );  
  light = new THREE.DirectionalLight( 0xffffff, 0.5 );
  light.position.set( 1, 1, 1 );
  dataScene.add( light );
    
  scenes.push(dataScene);

  
  renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );
  renderer.setClearColor( 0xffffff, 1 );
  renderer.setPixelRatio( window.devicePixelRatio );
  
  //document.addEventListener( 'mousedown', onDocumentMouseDown, false );

  // Load a dummy object
  var glyphGeom = new THREE.CylinderBufferGeometry( 0.05, 0.25, 1.0, 50 );
  var material = new THREE.MeshStandardMaterial( {
    color: new THREE.Color().setHSL( 1, 0, 0.75 ),
    roughness: 0.5,
    metalness: 0
  } );
  var obj = new THREE.Mesh( glyphGeom, material );
	loadNewGlyph(obj);  
}

function RenderThumbnail()
{
  var thumbnailCanvas = document.getElementById('thumbnail_canvas');
  var thumbnailRenderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true, canvas: thumbnailCanvas, antialias: true });
  thumbnailRenderer.setSize(100, 100);

  var thumbnailCamera = editCamera.clone();
  thumbnailCamera.position.set(editCamera.position.x / 3.0, editCamera.position.y / 3.0, editCamera.position.z / 3.0);

  var thumbnailScene = new THREE.Scene();
  thumbnailScene.background = new THREE.Color(0x111111);

  thumbnailScene.add( new THREE.HemisphereLight( 0xaaaaaa, 0x444444 ) );
  var light = new THREE.DirectionalLight( 0xffffff, 0.5 );
  light.position.set( 1, 1, 1 );
  thumbnailScene.add( light );

  thumbnailScene.add(glyphObj.clone());

  thumbnailRenderer.render(thumbnailScene, thumbnailCamera);

  thumbnailURL = thumbnailRenderer.domElement.toDataURL();

  if (! thumbnailNode)
  {
    thumbnailNode = document.createElement("img");
    document.body.appendChild(thumbnailNode);
  }

  thumbnailNode.src = thumbnailURL;
}

function updateSize() {
  var width = canvas.clientWidth;
  var height = canvas.clientHeight;
  if ( canvas.width !== width || canvas.height !== height ) {
    renderer.setSize( width, height, false );
  }
}

function animate() {
  //editScene.userData.controls.update();
  render();
  requestAnimationFrame( animate );
}

function render() {
  updateSize();
  canvas.style.transform = `translateY(${window.scrollY}px)`;

  renderer.setClearColor( 0xffffff );
  renderer.setScissorTest( false );
  renderer.clear();

  renderer.setClearColor( 0xe0e0e0 );
  renderer.setScissorTest( true );

  renderScene(editScene);
  if (document.getElementById( "renderData" ).checked) {
	  renderScene(dataScene);
  }
}


function renderScene( scene ) {
  // so something moves
  //scene.children[ 0 ].rotation.y = Date.now() * 0.001;

  // get the element that is a place holder for where we want to
  // draw the scene
  var element = scene.userData.element;

  // get its position relative to the page's viewport
  var rect = element.getBoundingClientRect();

  // check if it's offscreen. If so skip it
  if ( rect.bottom < 0 || rect.top > renderer.domElement.clientHeight ||
     rect.right < 0 || rect.left > renderer.domElement.clientWidth ) 
  {
    return; // it's off screen
  }

  // set the viewport
  var width = rect.right - rect.left;
  var height = rect.bottom - rect.top;
  var left = rect.left;
  var bottom = renderer.domElement.clientHeight - rect.bottom;

  renderer.setViewport( left, bottom, width, height );
  renderer.setScissor( left, bottom, width, height );

  var camera = scene.userData.camera;

  //camera.aspect = width / height; // not changing in this example
  //camera.updateProjectionMatrix();

  //scene.userData.controls.update();

  renderer.render( scene, camera );
}


var lastMouse3D;
var raycaster = new THREE.Raycaster(); // create once

function mouseToNearPlane( mouseNDC ) {
  raycaster.setFromCamera( mouseNDC, editCamera );

  var normal = new THREE.Vector3();
  editCamera.getWorldDirection(normal);
  normal.negate();

  var p = editCamera.position.clone();
	p.addScaledVector(normal, -editCamera.near);
  
  var plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, p);
  
  var mouse3D = new THREE.Vector3();
  raycaster.ray.intersectPlane(plane, mouse3D);
	console.log(mouse3D.toArray().toString());  

  return mouse3D;
}


function mouseToSphere( mouseNDC, rad ) {
  raycaster.setFromCamera( mouseNDC, editCamera );

  var sphere = new THREE.Sphere(new THREE.Vector3(), rad);
    
  var mouse3D = new THREE.Vector3();
  raycaster.ray.intersectSphere(sphere, mouse3D);
	  
  //console.log(mouse3D.toArray().toString());  

  return mouse3D;
}


function onDocumentMouseDown( event ) {
  if (event.button == 2) {
    event.preventDefault();
    editWindowElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
    editWindowElement.addEventListener( 'mouseup', onDocumentMouseUp, false );
    editWindowElement.addEventListener( 'mouseout', onDocumentMouseOut, false );
    
    var rect = event.target.getBoundingClientRect();
    var xPixels = event.clientX - rect.left; //x position within the element.
    var yPixels = event.clientY - rect.top;  //y position within the element.
    var mouseNDC = new THREE.Vector2(); // create once
    mouseNDC.x = ( xPixels/500 ) * 2 - 1;
    mouseNDC.y = - ( yPixels/700 ) * 2 + 1;

  	//lastMouse3D = mouseToNearPlane( mouseNDC );
  	lastMouse3D = mouseToSphere( mouseNDC, 2.0 );
  }
}

function onDocumentMouseMove( event ) {
	var rect = event.target.getBoundingClientRect();
  var xPixels = event.clientX - rect.left; //x position within the element.
  var yPixels = event.clientY - rect.top;  //y position within the element.
  var mouseNDC = new THREE.Vector2(); // create once
	mouseNDC.x = ( xPixels/500 ) * 2 - 1;
  mouseNDC.y = - ( yPixels/700 ) * 2 + 1;

  //var mouse3D = mouseToNearPlane( mouseNDC );
	var mouse3D = mouseToSphere( mouseNDC, 2.0 );

  var zeroVec = new THREE.Vector3();
  if ((!mouse3D.equals(zeroVec)) && (!lastMouse3D.equals(zeroVec))) {

    var vNow = mouse3D.normalize(); // vector = mouse3D - (0,0,0)
    var vLast = lastMouse3D.normalize();  

    var axis = new THREE.Vector3().normalize();
    axis.crossVectors(vLast, vNow).normalize();

    var angle = Math.acos(vLast.dot(vNow)); 

    if (angle > 0) {   
      var origR = axisGroup.quaternion;
      var deltaR = new THREE.Quaternion().setFromAxisAngle(axis, angle);
      var combo = new THREE.Quaternion().multiplyQuaternions(deltaR, origR);
      axisGroup.setRotationFromQuaternion(combo);
    }
  
  }

  
  lastMouse3D = mouse3D;
  
  // regenerate the data view, but keeping the current glyph
  loadNewGlyph(glyphObj);
}

function onDocumentMouseUp( event ) {
  editWindowElement.removeEventListener( 'mousemove', onDocumentMouseMove, false );
  editWindowElement.removeEventListener( 'mouseup', onDocumentMouseUp, false );
  editWindowElement.removeEventListener( 'mouseout', onDocumentMouseOut, false );
}

function onDocumentMouseOut( event ) {
  editWindowElement.removeEventListener( 'mousemove', onDocumentMouseMove, false );
  editWindowElement.removeEventListener( 'mouseup', onDocumentMouseUp, false );
  editWindowElement.removeEventListener( 'mouseout', onDocumentMouseOut, false );
}





function loadNewGlyph(obj) {
  //console.log(obj); 
  if (glyphObj) {
	  editScene.remove(glyphObj);
  }
  
  if (obj.type == 'Group') {
    // loaded a group obj, pull out the first mesh object
    glyphObj = obj.children[0]; 
  }
  else {
    // assume this obj is a mesh
	  glyphObj = obj;
  }
  
  // Adjust scale and translation to place within a unit cube
  var bbox = new THREE.Box3().setFromObject(glyphObj);
	var center = new THREE.Vector3();
  bbox.getCenter(center);
  var size = bbox.max.sub(bbox.min);
  var maxSize = Math.max(size.x, size.y, size.z);  
	if (glyphObj.geometry.isBufferGeometry) {
		glyphObj.geometry.translate(-center.x, -center.y, -center.z);
    glyphObj.geometry.scale(1/maxSize, 1/maxSize, 1/maxSize);
  }
  else if (glyphObj.geometry.vertices) {
	  for (var i = 0; i < glyphObj.geometry.vertices.length; i++) {
  	  glyphObj.geometry.vertices[i].sub(center);
			glyphObj.geometry.vertices[i].multiplyScalar(1/maxSize);
  	}
  	glyphObj.geomety.verticesNeedUpdate = true;
  }
  
  editScene.add(glyphObj);
  
    
  if (dataGroup) {
    dataScene.remove(dataGroup); 
  }
  dataGroup = new THREE.Group();
  dataScene.add(dataGroup);
  
  var glyphXform = axisGroup.matrix.clone();
  var forward = new THREE.Vector3();
  var up = new THREE.Vector3();
  var z = new THREE.Vector3();
  glyphXform.extractBasis(up, forward, z);
  //console.log("forward = " + forward.toArray());
  //console.log("up = " + up.toArray());
  
  glyphXform = new THREE.Matrix4().getInverse(glyphXform);
  
  document.getElementById( "forward_vec_x" ).value = forward.x;
  document.getElementById( "forward_vec_y" ).value = forward.y;
  document.getElementById( "forward_vec_z" ).value = forward.z;

  document.getElementById( "up_vec_x" ).value = up.x;
  document.getElementById( "up_vec_y" ).value = up.y;
  document.getElementById( "up_vec_z" ).value = up.z;


  var instanceColors = [];
	var instancePositions = [];
	var instanceRotations = [];
	
	for (var a=0.0; a<2*Math.PI; a+=Math.PI/8.0) {
    var R = new THREE.Matrix4();
		R.makeRotationAxis( new THREE.Vector3( 0, 1, 0 ), a );
        
    for (var t=0; t<1.0; t += 0.12) {
      var col = new THREE.Color().setHSL(a/(2*Math.PI), t, 0.7);
      instanceColors.push(col.r, col.g, col.b);
    
      var y1 = -5 + 10*t;
      var y2 = -5 + 10*(t+0.1);
      var x1 = 1+(-2.5 + 5*t)*(-2.5 + 5*t);
      var x2 = 1+(-2.5 + 5*(t+0.1))*(-2.5 + 5*(t+0.1));
      
			// data frame      
      var yAxis = new THREE.Vector3(x2-x1, y2-y1, 0).normalize();
      var xAxis = new THREE.Vector3(1, 0, 0).normalize();
      var zAxis = new THREE.Vector3().crossVectors(xAxis, yAxis).normalize();
      xAxis = xAxis.crossVectors(yAxis, zAxis);
      var dataR = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
      var dataT = new THREE.Matrix4().makeTranslation(x1, y1, 0);
      var dataXform = new THREE.Matrix4().multiplyMatrices(dataT, dataR);
      
			// orient glyph first based on the glyphXform set in the glyph window
      // then based on the local data frame
      var M = new THREE.Matrix4();
      M.multiplyMatrices(dataXform, glyphXform);
      M.multiplyMatrices(R, M);
      var pos = new THREE.Vector3();
      var quat = new THREE.Quaternion();
      var s = 0.0;
      M.decompose(pos, quat, s);
      
      instancePositions.push(pos.x, pos.y, pos.z);
      instanceRotations.push(quat.x, quat.y, quat.z, quat.w);      
    }
  }
  
  instancedGeometry = new THREE.InstancedBufferGeometry().copy(glyphObj.geometry);

  instancedGeometry.addAttribute('instanceColor', new THREE.InstancedBufferAttribute(new Float32Array(instanceColors), 3));
  instancedGeometry.addAttribute('instancePos', new THREE.InstancedBufferAttribute(new Float32Array(instancePositions), 3));
  instancedGeometry.addAttribute('instanceRot', new THREE.InstancedBufferAttribute(new Float32Array(instanceRotations), 4));
 
  var material = new THREE.MeshStandardMaterial( { vertexColors: THREE.VertexColors, roughness: 0.5, metalness: 0 } );

  material.onBeforeCompile = function ( shader )
  {
    shader.vertexShader = 'attribute vec3 instanceColor;\n  attribute vec3 instancePos;\n  attribute vec4 instanceRot;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      [
        'vec3 transformed = position + 2.0 * cross( instanceRot.xyz, cross( instanceRot.xyz, position ) + instanceRot.w * position ) + instancePos;',
      ].join( '\n' )
    );
        
    shader.vertexShader = shader.vertexShader.replace(
    '#include <color_vertex>',
      [
        'vColor = instanceColor;'
      ].join( '\n' )
    );
        
    shader.fragmentShader = shader.fragmentShader.replace(
      'vec4 diffuseColor = vec4( diffuse, opacity );',
      'vec4 diffuseColor = vec4(vColor, 1.0);'
    );
        
    materialShader = shader;
  }
    
  var instancedMesh = new THREE.Mesh( instancedGeometry, material );
  instancedMesh.position.x = 0.1;
  dataGroup.add( instancedMesh );
  
  
  /**
  // A non-instanced earlier version...
  for (var a=0.0; a<2*Math.PI; a+=Math.PI/8.0) {
    var aGroup = new THREE.Group();
    aGroup.rotateY(a);
    
    for (var t=0; t<1.0; t += 0.12) {
      var gObj = glyphObj.clone();
      gObj.material = gObj.material.clone();
      gObj.material.color.setHSL(a/(2*Math.PI), t, 0.7);
      
      
      //var y1 = -5 + 10*t;
      //var x1 = 7.5 - 7*Math.pow((1-t), 0.3);
      //var y2 = -5 + 10*(t+0.1);
      //var x2 = 7.5 - 7*Math.pow((1-(t+0.1)), 0.32);
    
      var y1 = -5 + 10*t;
      var y2 = -5 + 10*(t+0.1);
      var x1 = 1+(-2.5 + 5*t)*(-2.5 + 5*t);
      var x2 = 1+(-2.5 + 5*(t+0.1))*(-2.5 + 5*(t+0.1));
      
			// data frame      
      var yAxis = new THREE.Vector3(x2-x1, y2-y1, 0).normalize();
      var xAxis = new THREE.Vector3(1, 0, 0).normalize();
      var zAxis = new THREE.Vector3().crossVectors(xAxis, yAxis).normalize();
      xAxis = xAxis.crossVectors(yAxis, zAxis);
      var dataR = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
      var dataT = new THREE.Matrix4().makeTranslation(x1, y1, 0);
      var dataXform = new THREE.Matrix4().multiplyMatrices(dataT, dataR);
      
			// orient glyph first based on the glyphXform set in the glyph window
      // then based on the local data frame
      gObj.applyMatrix(new THREE.Matrix4().multiplyMatrices(dataXform, glyphXform));
      
      aGroup.add(gObj);
    }
    dataGroup.add(aGroup);
  }
  **/
}

function rotateAxisPos() {
  rotateAxis(1); 
}

function rotateAxisNeg() {
  rotateAxis(-1); 
}

function rotateAxis(dir) {
  var glyphXform = axisGroup.matrix.clone();
  var forward = new THREE.Vector3();
  var up = new THREE.Vector3();
  var z = new THREE.Vector3();
  glyphXform.extractBasis(up, forward, z);

  var angle = dir * 0.01;
  var R = new THREE.Matrix4().makeRotationAxis(forward, angle);
  
  axisGroup.quaternion = new THREE.Quaternion();
  axisGroup.position = new THREE.Vector3();
  axisGroup.matrix = new THREE.Matrix4();
  axisGroup.applyMatrix(glyphXform.premultiply(R));

  axisGroup.matrix.extractBasis(up, forward, z);
  document.getElementById( "forward_vec_x" ).value = forward.x;
  document.getElementById( "forward_vec_y" ).value = forward.y;
  document.getElementById( "forward_vec_z" ).value = forward.z;

  document.getElementById( "up_vec_x" ).value = up.x;
  document.getElementById( "up_vec_y" ).value = up.y;
  document.getElementById( "up_vec_z" ).value = up.z;

  // regenerate the data view, but keeping the current glyph
  loadNewGlyph(glyphObj);
}


function allowDrop(ev) {
  ev.preventDefault();
}

function drag(ev) {
  ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
  ev.preventDefault();
  var file = ev.dataTransfer.files[0];
  reader = new FileReader();
  reader.onload = function(event) { loader.loadtext(event.target.result, loadNewGlyph); };
  reader.readAsText(file);
}


function exportToObj() {

  var fam = (document).getElementById('family')
  if (!fam || fam.value == "")
  {
    alert("Family is required");
    return;
  }
  
  var clss = (document).getElementById('clss')
  if (!clss || clss.value == "")
  {
    alert("Class is required");
    return;
  }
  
  // make a copy of the geometry
  var geomCopy = new THREE.BufferGeometry().copy(glyphObj.geometry);
  
  // bake matrix into the geometry
  var invmat = new THREE.Matrix4().getInverse(axisGroup.matrix);
  geomCopy.applyMatrix(invmat);

  geomCopy = THREE.BufferGeometryUtils.mergeVertices(geomCopy, 0.0001);
  
  // create a mesh from the geometry since the obj exporter expects a mesh
  var material = new THREE.MeshStandardMaterial();
  var mesh = new THREE.Mesh( geomCopy, material );
  
  var exporter = new THREE.OBJExporter();
  var result = exporter.parse(mesh, data => alert('done'), {binary: true});

  fd = new FormData()

  metadata = {'family': fam.value, 'class': clss.value};
  s = JSON.stringify(metadata);

  b = new Blob([s], {type: 'text'});
  fd.append('metadata', b);

  b = new Blob([result], {'type': 'binary'});
  fd.append('obj', b);

  function sendForm(blob)
  {
    fd.append('thumbnail', blob);

    var msg = $.ajax({
      headers: { "X-CSRFToken": csrftoken },
      url: '/applets/upload_glyph/',
      type: 'POST',
      data: fd,
      async: false,
      contentType: false,
      processData: false,
      enctype: 'multipart/form-data',
      error: function (error) { console.log(error); },
      complete: function() { 
	  document.getElementById('spinner').style.display = 'none';
      }
    });
  }

  document.getElementById('spinner').style.display = 'block';
  document.getElementById('thumbnail_canvas').toBlob(sendForm, 'image/png');
}
