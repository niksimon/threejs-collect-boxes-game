var player, renderer, gameWindow, camera, scene, plane, wallLeft, wallRight,
	started = 0,
	boxes = [],
	boxWidth = [],
	pillars = [],
	nBoxes = 100,
	playFieldWidth = 60,
	playFieldHeight = 120,
	ballRadius = 0.5,
	playerStaticSpeed = 0.6,
	playerSpeed = [playerStaticSpeed, playerStaticSpeed],
	counter = [0,0],
	playerAcceleration = 0.01,
	playerDeceleration = 0.01,
	sceneSpeed = 1.4,
	superSpeed = 2.3,
	sceneAcceleration = 0.01,
	leftKey = false,
	rightKey = false,
	upKey = false,
	startedLeft = false,
	startedRight = false,
	leftLimit = -playFieldWidth/2 + ballRadius,
	rightLimit = -leftLimit,
	score = 0,
	scoreText = document.getElementById("score"),
	bestScoreText = document.getElementById("bestScore"),
	bestScore = localStorage.getItem("best"),
	audio = new Audio("sound/pickup.wav"),
	audioToggle = document.getElementById("audioToggle"),
	bestHTML = document.getElementById("best"),
	overlayHTML = document.getElementById("overlay"),
	seconds = document.getElementById("seconds"),
	scoreContainer = document.getElementById("scoreContainer"),
	audioSwitch = -1,
	zoom = 6,
	maxZoom = 12,
	addPlayerToScene = false,
	gameTime = 30,
	newTime = gameTime,
	oldTime = 0,
	collided = false;;

var clock = new THREE.Clock();

console.log(bestScore);
if(bestScore == undefined)
	localStorage.setItem("best", 0);
else
	bestScoreText.innerHTML = bestScore;

init();

function init(){
	renderer = new THREE.WebGLRenderer({antialias: true});
	gameWindow = document.getElementById("gameWindow");
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(gameWindow.clientWidth, gameWindow.clientHeight);
	renderer.shadowMapEnabled = true;
	renderer.shadowMapType = THREE.PCFSoftShadowMap;
	gameWindow.appendChild(renderer.domElement);
	scoreText.innerHTML = "Score: 0";

	document.getElementById("audioToggle").checked = false;
	
	scene = new THREE.Scene(),
	camera = new THREE.PerspectiveCamera(45, gameWindow.clientWidth / gameWindow.clientHeight, 0.1, 150);
	
	var light = new THREE.DirectionalLight(0x000000, 0.5),

		playerGeometry = new THREE.SphereGeometry(ballRadius,50,50),
		playerTexture = THREE.ImageUtils.loadTexture("textures/ball.jpg"),
		playerMaterial = new THREE.MeshBasicMaterial( { map: playerTexture} ),
		
		boxGeometrySmall = new THREE.BoxGeometry(1,1,1),
		boxGeometryLarge = new THREE.BoxGeometry(2,2,2),
		boxTexture = THREE.ImageUtils.loadTexture('textures/box.jpg'),
		boxMaterial = new THREE.MeshBasicMaterial({map: boxTexture}),
	
		planeGeometry = new THREE.PlaneBufferGeometry(playFieldWidth ,playFieldHeight*2),
		planeTexture = THREE.ImageUtils.loadTexture("textures/floor.jpg"),
		planeMaterial = new THREE.MeshBasicMaterial({map: planeTexture}),
	
		pillarGeometry = new THREE.BoxGeometry(3,9,3),
		pillarTexture = THREE.ImageUtils.loadTexture("textures/wall.jpg"),
		pillarMaterial = new THREE.MeshBasicMaterial({map: pillarTexture}),

		wallGeometry = new THREE.PlaneBufferGeometry(playFieldHeight*2 ,50),
		wallTexture = THREE.ImageUtils.loadTexture("textures/wall.jpg"),
		wallMaterial = new THREE.MeshBasicMaterial({map: wallTexture});

	light.position.set(50,100,-70);
	light.castShadow = true;
	light.shadowDarkness = 0.2;
	light.shadowCameraLeft = -150;
	light.shadowCameraTop = 150;
	light.shadowCameraBottom = -150;
	light.shadowCameraRight = 150;
	light.shadowMapWidth = 1024;
	light.shadowMapHeight = 1024;
	scene.add(light);

	player = new THREE.Mesh(playerGeometry, playerMaterial);
	wallLeft = new THREE.Mesh(wallGeometry, wallMaterial);
	wallRight = new THREE.Mesh(wallGeometry, wallMaterial);
	plane = new THREE.Mesh(planeGeometry, planeMaterial);

	// texture repeat
	planeTexture.wrapS = planeTexture.wrapT = THREE.RepeatWrapping;
	planeTexture.repeat.set(playFieldWidth/2+5, playFieldHeight/2+5);
	wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
	wallTexture.repeat.set(playFieldWidth, 25);
	pillarTexture.wrapS = pillarTexture.wrapT = THREE.RepeatWrapping;
	pillarTexture.repeat.set(2,6);	
	
	

	// add to scene
	scene.fog = new THREE.Fog(0x000000,10,150);
	
	scene.add(plane);
	scene.add(wallLeft);
	scene.add(wallRight);
	for(var i=0;i<nBoxes;i++){
		var randomSize = Math.floor(Math.random()*20+1);
		if(randomSize === 7 || randomSize === 14){
			boxes[i] = new THREE.Mesh(boxGeometryLarge, boxMaterial);
			boxWidth[i] = 2;
			boxes[i].position.set((playFieldWidth-2)*Math.random() - (playFieldWidth-2)/2, 
		0.5, playFieldHeight*Math.random() - playFieldHeight/2);
		}
		else{
			boxes[i] = new THREE.Mesh(boxGeometrySmall, boxMaterial);
			boxWidth[i] = 1;
			boxes[i].position.set((playFieldWidth-1)*Math.random() - (playFieldWidth-1)/2, 
		0, playFieldHeight*Math.random() - playFieldHeight/2);
		}
		scene.add(boxes[i]);
		boxes[i].castShadow = true;
	}

	plane.receiveShadow = true;
	player.castShadow = true;

	player.position.z = 150;
	plane.rotation.x -= Math.PI/2;
	plane.position.y -= ballRadius;
	camera.position.set(0,8,40);
	camera.up = new THREE.Vector3(0,1,0);
	camera.lookAt(new THREE.Vector3(0,0,20));
	wallLeft.position.x = leftLimit-ballRadius;
	wallLeft.rotation.y += Math.PI/2;
	wallRight.position.x = rightLimit+ballRadius;
	wallRight.rotation.y -= Math.PI/2;
	
	audioToggle.addEventListener("click", function(){
		if(audioSwitch === -1){
			audioToggle.getElementsByTagName("img")[0].className = "hideSpeaker";
			audioToggle.getElementsByTagName("img")[1].className = "";
		}
		else{
			audioToggle.getElementsByTagName("img")[0].className = "";
			audioToggle.getElementsByTagName("img")[1].className = "hideSpeaker";
		}
		audioSwitch *= -1;
	});

	if(started === 0){
		document.getElementById("play").addEventListener("click", start, false);
	}

	// press play button
	function start(){
		started = 1;
		
		clock.start();
		gameWindow.addEventListener('DOMMouseScroll', zoomInOut, false);
		gameWindow.addEventListener('mousewheel', zoomInOut, false);
		document.querySelector(".overlay").style.display = "none";
		document.getElementById("play").style.display = "none";
		document.getElementById("ready").className = "ready";
		document.getElementById("go").className = "go";
		scene.add(player);
		for(var i=0;i<2;i++){
			pillars[i] = new THREE.Mesh(pillarGeometry, pillarMaterial);
			if(i==0){
				pillars[i].position.set((playFieldWidth-12)*Math.random() - (playFieldWidth-12)/2,
					4, -playFieldHeight);
			}
			else{
				pillars[i].position.set((playFieldWidth-12)*Math.random() - (playFieldWidth-12)/2,
					4, -playFieldHeight-60);
			}
			scene.add(pillars[i]);
			pillars[i].castShadow = true;
		}
	}

}



// zooming in and out, up to 2 times
function zoomInOut(e){
	// zoom in
	if(e.detail < 0 && zoom > 0 || e.wheelDelta > 0 && zoom > 0){
		camera.position.z -= 1;
		camera.position.y -= 0.5;
		zoom--;
	}
	// zoom out
	else if(e.detail > 0 && zoom < maxZoom || e.wheelDelta < 0 && zoom < maxZoom){
		camera.position.z += 1;
		camera.position.y += 0.5;
		zoom++;
	}
}

// player control
function keyIsDown(e){
	switch(e.keyCode){
		case 87: // w
		case 38: // up arrow
			upKey = true;
			break;
		case 65: // a
		case 37: // left arrow
			leftKey = true;
			break;
		case 68: // d
		case 39: // right arrow
			rightKey = true;
			break;
	}
}
function keyIsUp(e){
	switch(e.keyCode){
		case 87:
		case 38:
			upKey = false;
			break;
		case 65:
		case 37:
			leftKey = false;
			counter[0] = playerSpeed[0];
			break;
		case 68:
		case 39:
			rightKey = false;
			counter[1] = playerSpeed[1];
			break;
	}
}

// move box forward
function moveBox(i, yPos){
	boxes[i].position.set((playFieldWidth-2)*Math.random()-(playFieldWidth-2)/2, yPos, -playFieldHeight/2);
}

// player acceleration and deceleration
function accelerate(n){
	counter[n]+=playerAcceleration;
	playerSpeed[n] = counter[n];
}
function decelerate(n){
	counter[n]-=playerDeceleration;
	playerSpeed[n] = counter[n];
}

// check collision with boxes
function checkCollision(i, multiplier){
	return (player.position.z > boxes[i].position.z - multiplier*ballRadius && player.position.z < boxes[i].position.z + multiplier*ballRadius) && (player.position.x > boxes[i].position.x - multiplier*ballRadius && player.position.x < boxes[i].position.x + multiplier*ballRadius);
}
function pillarCollision(i){
	return (player.position.z > pillars[i].position.z - 4*ballRadius && 
		player.position.z < pillars[i].position.z + 4*ballRadius) && 
	(player.position.x > pillars[i].position.x - 4*ballRadius && 
		player.position.x < pillars[i].position.x + 4*ballRadius);
}

function render(){
	requestAnimationFrame(render);
	plane.position.z += sceneSpeed;
	wallLeft.position.z += sceneSpeed;
	wallRight.position.z += sceneSpeed;
	player.rotation.x -= 1;

	// camera.position.set(0,4.5,30);

	if(addPlayerToScene && collided === false){
		camera.lookAt(player.position);
		for(var i = 0;i < 2; i++){
			pillars[i].position.z += sceneSpeed;
		}
		oldTime = parseInt(clock.getElapsedTime()) - 3;
		if(newTime != oldTime && newTime > 0){
			newTime = gameTime - oldTime;
			seconds.innerHTML = newTime + "s";
			if(newTime < 11)
				seconds.style.color = "#FF2200";
		}
	}

	if(started && addPlayerToScene === false){
		camera.lookAt(new THREE.Vector3(0,0,20));
		if(camera.position.z > 30){
			camera.position.z -= 0.08;
		}
		if(camera.position.y > 4.5){
			camera.position.y -= 0.028;
		}
		if(parseInt(clock.getElapsedTime()) >= 3 && addPlayerToScene === false){
			player.position.z = 20;
			addPlayerToScene = true;
			document.addEventListener("keydown", keyIsDown, false);
			document.addEventListener("keyup", keyIsUp, false);
			document.getElementById("ready").className = "";
			document.getElementById("go").className = "";
			scoreText.style.visibility = "visible";
			seconds.style.visibility = "visible";
		}
	}

	// player movement
	if(leftKey){
		if(counter[0] <= playerStaticSpeed){
			accelerate(0);
		}
		player.position.x -= playerSpeed[0];
		player.rotation.z -= playerSpeed[0];			
		startedLeft = true;
	}
	if(rightKey){
		if(counter[1] <= playerStaticSpeed){
			accelerate(1);
		}
		player.position.x += playerSpeed[1];
		player.rotation.z += playerSpeed[1];			
		startedRight = true;
	}

	if(upKey){
		if(sceneSpeed < superSpeed){
			sceneSpeed += sceneAcceleration;
		}
	}
	else{
		if(sceneSpeed > 1.5){
			sceneSpeed -= sceneAcceleration;
		}
	}

	// player deceleration
	if(startedLeft && leftKey === false){
		if(counter[0]>0){
			decelerate(0);
			player.position.x -= playerSpeed[0];
		}
		else{
			if(counter[0]>0){
				counter[0]=0;
			}
		}
	}
	if(startedRight && rightKey === false){
		if(counter[1] > 0){
			decelerate(1);
			player.position.x += playerSpeed[1];
		}
		else{
			if(counter[1] > 0){
				counter[1] = 0;
			}
		}
	}

	// hitting left or right wall
	if(player.position.x < leftLimit){
		player.position.x = leftLimit;
		counter[0] = counter[1] = 0;
	}
	if(player.position.x > rightLimit){
		player.position.x = rightLimit;
		counter[0] = counter[1] = 0;
	}

	for(var i=0;i<nBoxes;i++){
		boxes[i].position.z += sceneSpeed;
		// bring boxes forward when they disappear
		if(boxes[i].position.z >= playFieldHeight/2)
		{
			if(boxes[i].position.y === 0)
				moveBox(i, 0.0);
			else
				moveBox(i, 0.5);
		}
		// pick up
		if(boxes[i].position.y === 0){
			if(checkCollision(i, 2)){
				if(audioSwitch === 1)
					audio.play();
				moveBox(i, 0.0);
				if(newTime)
				{
					score++;
					scoreText.innerHTML = "Score: " + score.toString();
				}
			}
		}
		else{
			if(checkCollision(i, 3)){
				if(audioSwitch === 1)
					audio.play();
				moveBox(i, 0.5);
				if(newTime)
				{
					score++;
					scoreText.innerHTML = "Score: " + score.toString();
				}
			}
		}
	}

	if(addPlayerToScene){
		for(var i = 0;i < 2; i++)
		{
			if(pillars[i].position.z >= playFieldHeight/2){
				pillars[i].position.set((playFieldWidth-12)*Math.random() - (playFieldWidth-12)/2,
						4, -playFieldHeight);
			}

			if(pillarCollision(i)){
				collided = true;
				sceneSpeed = 0;
				scoreText.className = "score scoreEnd";
				document.removeEventListener("keydown", keyIsDown, false);
				document.removeEventListener("keyup", keyIsUp, false);
				upKey = false;
				leftKey = false;
				rightKey = false;
				
			}
		}
	}

	if(collided === true){
		player.position.z += 1;
		player.position.y += 0.25;
	}

	camera.position.x = player.position.x;

	if(plane.position.z >= playFieldHeight/2)
		plane.position.z = -playFieldHeight/2;

	if(wallLeft.position.z >= playFieldHeight/2)
		wallLeft.position.z = -playFieldHeight/2;
	if(wallRight.position.z >= playFieldHeight/2)
		wallRight.position.z = -playFieldHeight/2;

	if(score > bestScore) 
		localStorage.setItem("best", score);

	if(newTime === 0)
		scoreText.className = "score scoreEnd";

	renderer.render(scene, camera);
}

render();