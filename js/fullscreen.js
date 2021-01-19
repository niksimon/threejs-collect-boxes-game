// // FULLSCREEN ON/OFF
// BigScreen.js from https://brad.is/coding/BigScreen/

document.getElementById("fullscreenToggle").addEventListener("click",function(){
	if(BigScreen.enabled){
       	BigScreen.toggle();
    }
});

BigScreen.onenter = function() {
    // called when all elements have exited full screen
    onFullscreen();
}
BigScreen.onexit = function() {
    // called when all elements have exited full screen
    offFullscreen();
}

function onFullscreen(){
	document.body.appendChild(gameWindow);
	container.style.display = "none";
	bestHTML.style.display = "none";
	document.body.style.overflow = "hidden";
	scoreText.className += " scoreFullscreen";
	seconds.className += " secondsFullscreen";
	gameWindow.style.width = screen.width + "px";
	gameWindow.style.height = screen.height + "px";
	gameWindow.className += " gameFullscreen";
	overlayHTML.style.width = gameWindow.clientWidth + "px";
	overlayHTML.style.height = gameWindow.clientHeight + "px";

	camera.aspect = gameWindow.clientWidth / gameWindow.clientHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(gameWindow.clientWidth, gameWindow.clientHeight);
}
function offFullscreen(){
	container.style.display = "block";
	bestHTML.style.display = "inline";
	document.body.style.overflow = "auto";
	scoreText.className = "score";
	seconds.className = "seconds";
	gameWindow.style.width = "960px";
	gameWindow.style.height = "640px";
	gameWindow.className = "gameWindow";
	container.appendChild(gameWindow);
	container.insertBefore(bestHTML, gameWindow);
	gameWindow.parentNode.insertBefore(document.getElementById("download"),gameWindow.nextSibling);

	camera.aspect = gameWindow.clientWidth / gameWindow.clientHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(gameWindow.clientWidth, gameWindow.clientHeight);
}