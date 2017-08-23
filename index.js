"use strict";

const WorldSize = 4096;

var player;
var enemies = [];
var world;
var camera;
var bullets = [];
var ga = ga(1024, 1024, load);

ga.start();
ga.scaleToWindow();
ga.fps = 30;

function createWorld() {
	world = ga.group();
	world.width = WorldSize;
	world.height = WorldSize;
	world.calculateSize = function() {
		// do nothing
	};
}

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
	player.maxSpeed = 10;
	player.isMoving = false;
	player.rotationSpeed = 0;
	player.acceleration = 0.36;
	player.friction = 0.98;
	player.health = 5;
	player.hit = function() {
		this.health--;
	}
	world.addChild(player);
	setupPlayerControls();
}

function spawnEnemy(x, y) {
	var enemy = ga.rectangle(32, 32, "red", "yellow", 4, x, y);
	enemy.vx = 1;
	enemy.vy = 1;
	enemy.rotation = ga.randomFloat(0, Math.PI);
	enemy.rotationSpeed = ga.randomFloat(0.01, 0.02);
	enemy.shootDelaySeconds = ga.randomFloat(4, 6);
	enemy.timeToShoot = enemy.shootDelaySeconds * ga.fps;
	enemies.push(enemy);
	world.addChild(enemy);
}

function startSpawningEnemies() {
	var enemySpawnCorner = 0;
	var enemySpawnPositions = {
		0: [0, 0],
		1: [WorldSize - 32, 0],
		2: [WorldSize - 32, WorldSize - 32],
		3: [0, WorldSize - 32],
	};
	ga.emitter(1000, function() {
		var pos = enemySpawnPositions[enemySpawnCorner++ % 4];
		spawnEnemy(pos[0], pos[1]);
	}).play();
}

function clamp(number, max) {
	return Math.min(Math.max(number, -max), max);
}

function load() {
	createWorld();
	var bounds = ga.rectangle(WorldSize, WorldSize, "black", "grey", 2, 0, 0);
	world.addChild(bounds);
	world.putCenter(bounds);
	createPlayer(WorldSize / 2, WorldSize / 2);
	startSpawningEnemies();
	camera = ga.worldCamera(world, ga.canvas);
	camera.centerOver(player);
	ga.state = play;
}

function movePlayer() {
	player.rotation += player.rotationSpeed;
	if (player.isMoving) {
		player.vx = clamp(player.vx + player.acceleration * Math.cos(player.rotation), player.maxSpeed);
		player.vy = clamp(player.vy + player.acceleration * Math.sin(player.rotation), player.maxSpeed);
	} else {
		player.vx *= player.friction;
		player.vy *= player.friction;
	}
	ga.move(player);
}

function shouldEnemyShoot(enemy) {
	enemy.timeToShoot--;
	return enemy.timeToShoot <= 0;
}

function enemyShoot(enemy) {
	enemy.timeToShoot = enemy.shootDelaySeconds * ga.fps;
	for (var i = 0; i < 4; i++) {
		var angle = enemy.rotation + Math.PI / 4 + i * (Math.PI / 2)
		ga.shoot(
			enemy,
			angle,
			36,
			3,
			bullets,
			function() {
				var bullet = ga.circle(16, "white", "red", 2);
				world.addChild(bullet);
				return bullet;
			}
		)
	}
}

function updateBullets() {
	var isPlayerHit = false;
	bullets = bullets.filter(function(bullet) {
		ga.move(bullet);
		var isOutsideWorld = ga.outsideBounds(bullet, world.localBounds);
		var isOverlappingPlayer = ga.hitTestRectangle(player, bullet);
		isPlayerHit = isPlayerHit || isOverlappingPlayer;
		if (isOutsideWorld || isOverlappingPlayer) {
			ga.remove(bullet);
			return false;
		}
		return true;
	});
	if (isPlayerHit) {
		player.hit();
	}
}

function play() {
	updateBullets();
	movePlayer();
	for (var k in enemies) {
		var enemy = enemies[k];
		enemy.rotation += enemy.rotationSpeed;
		ga.move(enemy);
		if (shouldEnemyShoot(enemy)) {
			enemyShoot(enemy);
		}
	}
	camera.centerOver(player);
}
