"use strict";

const WorldSize = 4096;

var player;
var enemies = [];
var world;
var grid;
var wormHole;
var gems;
var camera;
var bullets = [];
var cells;
var ga = ga(1024, 1024, load);

ga.shoot = function(shooter, angle, offsetFromCenter, bulletSpeed, bulletArray, bulletSprite) {
	var bullet = bulletSprite();
	bullet.x
		= shooter.centerX - bullet.halfWidth
		+ (offsetFromCenter * Math.cos(angle));
	bullet.y
		= shooter.centerY - bullet.halfHeight
		+ (offsetFromCenter * Math.sin(angle));
	bullet.vx = Math.cos(angle) * bulletSpeed;
	bullet.vy = Math.sin(angle) * bulletSpeed;
	bulletArray.push(bullet);
	return bullet;
};

ga.start();
ga.scaleToWindow();
ga.fps = 60;

function makeGrid(width, height, dx, dy, strokeStyle, lineWidth, x, y) {
	var o = {};
	ga.makeDisplayObject(o);
	o.mask = false;
	o.width = width || 256;
	o.height = height || 256;
	o.strokeStyle = strokeStyle || "grey";
	o.lineWidth = lineWidth || 1;
	o.x = x || 0;
	o.y = y || 0;
	ga.stage.addChild(o);
	o.render = function(ctx) {
		ctx.strokeStyle = o.strokeStyle;
		ctx.lineWidth = o.lineWidth;
		ctx.beginPath();
		for (var x = 0, xmax = this.height; x <= xmax; x += dx) {
				ctx.moveTo(-o.width * o.pivotX + x, -o.height * o.pivotY);
				ctx.lineTo(-o.width * o.pivotX + x,  o.height * (1.0 - o.pivotY));
		}
		for (var y = 0, ymax = this.height; y <= ymax; y += dy) {
				ctx.moveTo(-o.width * o.pivotX, -o.height * o.pivotY + y);
				ctx.lineTo( o.width * (1.0 - o.pivotX), -o.height * o.pivotY + y);
		}
		if (o.mask === true) {
			ctx.clip();
		} else {
			if (o.strokeStyle !== "none") ctx.stroke();
		}
	};
	return o;
}

function makeWormhole(diameter, fillStyle, strokeStyle, lineWidth, x, y) {
	var o = ga.circle(diameter, fillStyle, strokeStyle, lineWidth, x, y);
	return o;
}

function makeGem(radius, fillStyle, strokeStyle, lineWidth, x, y) {
	var o = {};
	var size = 2 * radius;
	ga.makeDisplayObject(o);
	o.mask = false;
	o.width = size || 32;
	o.height = size || 32;
	o.fillStyle = fillStyle || "white";
	o.strokeStyle = strokeStyle || "red";
	o.lineWidth = lineWidth || 2;
	o.x = x || 0;
	o.y = y || 0;
	var angle = Math.PI * 2 / 3;
	o.x1 = 0;
	o.y1 = radius;
	o.x2 = o.x1 * Math.cos( angle) - o.y1 * Math.sin( angle);
	o.y2 = o.x1 * Math.sin( angle) + o.y1 * Math.cos( angle);
	o.x3 = o.x1 * Math.cos(-angle) - o.y1 * Math.sin(-angle);
	o.y3 = o.x1 * Math.sin(-angle) + o.y1 * Math.cos(-angle);
	ga.stage.addChild(o);
	o.render = function(ctx) {
		ctx.strokeStyle = o.strokeStyle;
		ctx.fillStyle = o.fillStyle;
		ctx.lineWidth = o.lineWidth;
		ctx.beginPath();
		ctx.arc(
			radius + (-size * o.pivotX),
			radius + (-size * o.pivotY),
			radius,
			0, 2 * Math.PI, false
		);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(o.x1, o.y1);
		ctx.lineTo(o.x2, o.y2);
		ctx.lineTo(o.x3, o.y3);
		if (o.mask === true) {
			ctx.clip();
		} else {
			if (o.strokeStyle !== "none") ctx.stroke();
			if (o.fillStyle !== "none") ctx.fill();
		}
	};
	return o;
}

function createWorld() {
	world = ga.group();
	world.width = WorldSize;
	world.height = WorldSize;
	world.calculateSize = function() {
		// do nothing
	};
}

function partitionWorld(size) {
	cells = {
		size: size,
		count: WorldSize / size,
		data: {},
		addEnemy: function(enemy) {
			var pos = enemy.position;
			var index = this.index(pos.x, pos.y);
			this.data[index] = this.data[index] || {};
			this.data[index].enemies = this.data[index].enemies || [];
			this.data[index].enemies.push(enemy);
			enemy.cell = index;
		},
		addBullet: function(bullet) {
			var pos = bullet.position;
			var index = this.index(pos.x, pos.y);
			this.data[index] = this.data[index] || {};
			this.data[index].bullets = this.data[index].bullets || [];
			this.data[index].bullets.push(bullet);
			bullet.cell = index;
		},
		removeEnemy: function(enemy) {
			var pos = enemy.position;
			var index = this.index(pos.x, pos.y);
			var i = this.data[enemy.cell].enemies.indexOf(enemy);
			if (i != -1) {
				this.data[enemy.cell].enemies.splice(i, 1);
			} else {
				throw `invalid enemy index ${i}`;
			}
		},
		removeBullet: function(bullet) {
			var pos = bullet.position;
			var index = this.index(pos.x, pos.y);
			var i = this.data[bullet.cell].bullets.indexOf(bullet);
			if (i != -1) {
				this.data[bullet.cell].bullets.splice(i, 1);
			} else {
				throw `invalid bullet index ${i}`;
			}
		},
		moveEnemy: function(enemy) {
			var pos = enemy.position;
			var index = this.index(pos.x, pos.y);
			if (enemy.cell != index) {
				this.removeEnemy(enemy);
				this.addEnemy(enemy);
			}
		},
		moveBullet: function(bullet) {
			var pos = bullet.position;
			var index = this.index(pos.x, pos.y);
			if (bullet.cell != index) {
				this.removeBullet(bullet);
				this.addBullet(bullet);
			}
		},
		getEnemies: function(x, y) {
			try {
				var index = this.index(x, y);
				return this.data[index].enemies;
			} catch (e) {
				return [];
			}
		},
		getBullets: function(x, y) {
			try {
				var index = this.index(x, y);
				return this.data[index].bullets;
			} catch (e) {
				return [];
			}
		},
		index: function(x, y) {
			var cellx = parseInt(x / this.size, 10);
			var celly = parseInt(y / this.size, 10);
			return celly * this.count + cellx;
		},
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

function createPlayer() {
	player = ga.rectangle(40, 40, "cyan", "white", 4);
	player.maxRotationSpeed = 0.1;
	player.maxSpeed = 10;
	player.isMoving = false;
	player.rotationSpeed = 0;
	player.acceleration = 0.36;
	player.friction = 0.98;
	player.maxHealth = 5;
	player.health = player.maxHealth;;
	player.hit = function() {
		this.health--;
		this.updateColor();
	}
	player.updateColor = function() {
		var fill = parseInt(this.health / this.maxHealth * 255, 10);
		var stroke = parseInt((this.health + this.maxHealth) / (this.maxHealth * 2) * 255, 10);
		this.fillStyle = `rgb(0, ${fill}, ${fill})`;
		this.strokeStyle = `rgb(${stroke}, ${stroke}, ${stroke})`;
	}
	world.addChild(player);
	world.putCenter(player);
	setupPlayerControls();
}

function spawnEnemy(x, y) {
	var enemy = ga.rectangle(32, 32, "red", "yellow", 4, x, y);
	enemy.vx = 0;
	enemy.vy = 0;
	enemy.rotation = ga.randomFloat(0, Math.PI);
	enemy.rotationSpeed = ga.randomFloat(0.01, 0.02);
	enemy.shootDelaySeconds = ga.randomFloat(4, 6);
	enemy.timeToShoot = enemy.shootDelaySeconds * ga.fps;
	enemy.hit = false;
	enemy.update = function() {
		var dx = player.x - this.x;
		var dy = player.y - this.y;
		var len = Math.sqrt(dx * dx + dy * dy);
		this.vx = dx / len * 2.1;
		this.vy = dy / len * 2.1;
		this.rotation += this.rotationSpeed;
	}
	enemies.push(enemy);
	cells.addEnemy(enemy);
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
	ga.emitter(455, function() {
		var pos = enemySpawnPositions[enemySpawnCorner++ % 4];
		spawnEnemy(pos[0], pos[1]);
	}).play();
}

function clamp(number, max) {
	return Math.min(Math.max(number, -max), max);
}

function clamp2(number, min, max) {
	return Math.min(Math.max(number, min), max);
}

function load() {
	createWorld();
	var cellSize = 128;
	partitionWorld(cellSize);
	grid = makeGrid(WorldSize, WorldSize, cellSize, cellSize, "#333", 2, 0, 0);
	wormHole = makeWormhole(64, "#111", "#888", 4);
	var gemRadius = 21;
	gems = [
		makeGem(gemRadius, "cyan", "white", 2, cellSize - gemRadius, cellSize - gemRadius),
		makeGem(gemRadius, "cyan", "white", 2, WorldSize - cellSize - gemRadius, cellSize - gemRadius),
		makeGem(gemRadius, "cyan", "white", 2, WorldSize - cellSize - gemRadius, WorldSize - cellSize - gemRadius),
		makeGem(gemRadius, "cyan", "white", 2, cellSize - gemRadius, WorldSize - cellSize - gemRadius),
	];
	world.addChild(grid);
	world.putCenter(grid);
	world.addChild(wormHole);
	world.putCenter(wormHole);
	gems.forEach(function(gem){
		world.addChild(gem);
	});
	createPlayer();
	startSpawningEnemies();
	camera = ga.worldCamera(world, ga.canvas);
	camera.centerOver(player);
	ga.state = play;
}

function move(object) {
	ga.move(object);
	object.x = clamp2(object.x + object.halfWidth, 0, WorldSize) - object.halfWidth;
	object.y = clamp2(object.y + object.halfHeight, 0, WorldSize) - object.halfHeight;
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
	move(player);
}

function shouldEnemyShoot(enemy) {
	enemy.timeToShoot--;
	return enemy.timeToShoot <= 0;
}

function enemyShoot(enemy) {
	enemy.timeToShoot = enemy.shootDelaySeconds * ga.fps;
	for (var i = 0; i < 4; i++) {
		var angle = enemy.rotation + Math.PI / 4 + i * (Math.PI / 2)
		var bullet = ga.shoot(
			enemy,
			angle,
			36,
			3.6,
			bullets,
			function() {
				var bullet = ga.rectangle(12, 12, "white", "red", 2);
				bullet.rotation = ga.randomFloat(0, Math.PI);
				world.addChild(bullet);
				return bullet;
			}
		)
		cells.addBullet(bullet);
	}
}

function updateGrid() {
	var x = Math.abs(player.x - WorldSize / 2);
	var y = Math.abs(player.y - WorldSize / 2);
	var distance = x + y;
	var maxDistance = WorldSize;
	var r = (distance  / maxDistance) * (255 - 51) + 51;
	var gb = 51 - (distance / maxDistance) * 51;
	grid.strokeStyle = `rgb(${r}, ${gb}, ${gb})`;
}

function getEnemyHit(object) {
	var p = object.position;
	var enemiesToCheck = cells.getEnemies(p.x, p.y);
	for (var k in enemiesToCheck) {
		var enemy = enemiesToCheck[k];
		var isHit = ga.hitTestRectangle(enemy, object);
		if (isHit) {
			return enemy;
		}
	}
	return false;
}

function updateBullets() {
	var isPlayerHit = false;
	bullets = bullets.filter(function(bullet) {
		ga.move(bullet);
		cells.moveBullet(bullet);
		var isOutsideWorld = ga.outsideBounds(bullet, world.localBounds);
		var isOverlappingPlayer = ga.hitTestRectangle(player, bullet);
		var enemyHit = getEnemyHit(bullet);
		isPlayerHit = isPlayerHit || isOverlappingPlayer;
		if (enemyHit) {
			enemyHit.hit = true;
		}
		if (isOutsideWorld || isOverlappingPlayer || enemyHit) {
			ga.remove(bullet);
			cells.removeBullet(bullet);
			return false;
		}
		bullet.rotation += 0.21;
		return true;
	});
	if (isPlayerHit) {
		player.hit();
	}
}

function updateEnemies() {
	for (var k in enemies) {
		var enemy = enemies[k];
		updateEnemy(enemy);
	}
	// check collisions with player
	var enemyHit = getEnemyHit(player);
	if (enemyHit) {
		enemyHit.hit = true;
		player.hit();
	}
	// remove hit enemies
	enemies = enemies.filter(function(enemy) {
		if (enemy.hit) {
			ga.remove(enemy);
			cells.removeEnemy(enemy);
			return false;
		}
		return true;
	});
}

function updateEnemy(enemy) {
	enemy.update();
	move(enemy);
	cells.moveEnemy(enemy);
	if (shouldEnemyShoot(enemy)) {
		enemyShoot(enemy);
	}
}

function play() {
	updateGrid();
	updateBullets();
	updateEnemies();
	movePlayer();
	camera.centerOver(player);
}
