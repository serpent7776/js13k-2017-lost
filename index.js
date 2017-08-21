"use strict";

const WorldSize = 4096;

var player;
var enemies = [];
var world;
var camera;
var ga = ga(1024, 1024, load);

ga.start();
ga.scaleToWindow();
ga.fps = 30;

function setupPlayerControls() {
	ga.key.leftArrow.press = function() {
		player.rotationSpeed = -player.maxRotationSpeed;
	};
	ga.key.leftArrow.release = function() {
		if (!ga.key.rightArrow.isDown) {
			player.rotationSpeed = 0;
		}
	};
	ga.key.rightArrow.press = function() {
		player.rotationSpeed = player.maxRotationSpeed;
	};
	ga.key.rightArrow.release = function() {
		if (!ga.key.leftArrow.isDown) {
			player.rotationSpeed = 0;
		}
	};
	ga.key.upArrow.press = function() {
		player.isMoving = true;
	};
	ga.key.upArrow.release = function() {
		player.isMoving = false;
	};
}

function createPlayer(x, y) {
	player = ga.rectangle(40, 40, "cyan", "white", 4, x, y);
	player.maxRotationSpeed = 0.1;
	player.isMoving = false;
	player.rotationSpeed = 0;
	player.acceleration = 0.36;
	player.friction = 0.98;
	world.addChild(player);
	setupPlayerControls();
}

function spawnEnemy(x, y) {
	var enemy = ga.rectangle(32, 32, "red", "yellow", 4, x, y);
	enemy.vx = 1;
	enemy.vy = 1;
	enemy.rotation = ga.randomFloat(0, Math.PI);
	enemy.rotationSpeed = ga.randomFloat(0.01, 0.02);
	enemies.push(enemy);
	world.addChild(enemy);
}

function load() {
	world = ga.group();
	world.width = WorldSize;
	world.height = WorldSize;
	var bounds = ga.rectangle(WorldSize, WorldSize, "black", "grey", 2, 0, 0);
	world.addChild(bounds);
	world.putCenter(bounds);
	createPlayer(WorldSize / 2, WorldSize / 2);
	spawnEnemy(0, 0);
	camera = ga.worldCamera(world, ga.canvas);
	camera.centerOver(player);
	ga.state = play;
}

function movePlayer() {
	player.rotation += player.rotationSpeed;
	if (player.isMoving) {
		player.vx += player.acceleration * Math.cos(player.rotation);
		player.vy += player.acceleration * Math.sin(player.rotation);
	} else {
		player.vx *= player.friction;
		player.vy *= player.friction;
	}
	ga.move(player);
}

function play() {
	movePlayer();
	for (var k in enemies) {
		var enemy = enemies[k];
		enemy.rotation += enemy.rotationSpeed;
		ga.move(enemy);
	}
	camera.centerOver(player);
}
