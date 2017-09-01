"use strict";

const WorldSize = 4096;

var time = 0;
var player;
var enemies = [];
var spawner;
var world;
var grid;
var wormHole;
var wormHoleEmitter;
var gems;
var camera;
var bullets = [];
var cells;
var playerThrust;
var gemsMessage;
var timeMessage;
var healthMessage;
var gameOverMessage, gameOverMessage2;
var gameSummaryMessage;
var gameWonMessage;
var ga = ga(1024, 1024, load);

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

function makeShip(size, fillStyle, strokeStyle, lineWidth, x, y) {
	var o = {};
	ga.makeDisplayObject(o);
	o.mask = false;
	o.width = size || 32;
	o.height = size || 32;
	o.fillStyle = fillStyle || "cyan";
	o.strokeStyle = strokeStyle || "white";
	o.lineWidth = lineWidth || 2;
	o.x = x || 0;
	o.y = y || 0;
	var halfSize = size * 0.5;
	o.x1 = halfSize;
	o.y1 = 0;
	o.x2 = -halfSize;
	o.y2 = -halfSize;
	o.x3 = -halfSize * 0.5;
	o.y3 = 0;
	o.x4 = -halfSize;
	o.y4 =  halfSize;
	ga.stage.addChild(o);
	o.render = function(ctx) {
		ctx.strokeStyle = o.strokeStyle;
		ctx.fillStyle = o.fillStyle;
		ctx.lineWidth = o.lineWidth;
		ctx.beginPath();
		ctx.moveTo(o.x1, o.y1);
		ctx.lineTo(o.x2, o.y2);
		ctx.lineTo(o.x3, o.y3);
		ctx.lineTo(o.x4, o.y4);
		ctx.lineTo(o.x1, o.y1);
		if (o.mask === true) {
			ctx.clip();
		} else {
			if (o.strokeStyle !== "none") ctx.stroke();
			if (o.fillStyle !== "none") ctx.fill();
		}
	};
	return o;
}

function makeWormhole(diameter, fillStyle, strokeStyle, lineWidth, x, y) {
	var o = ga.circle(diameter, fillStyle, strokeStyle, lineWidth, x, y);
	var wormHoleEmitter = ga.emitter(200, function() {
		return ga.particleEffect(
			o.centerX,
			o.centerY,
			function() {
				var p = ga.circle(8, "grey", "white", 1);
				p.frames = [];
				world.addChild(p);
				return p;
			},
			16,
			0,
			false,
			0, Math.PI * 2,
			2, 4,
			-0.5, -1.25,
			undefined, undefined,
			undefined, undefined,
			undefined, undefined,
			o.radius, o.radius * 1.5
		);
	});
	wormHoleEmitter.play();
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

function makeEnemyExplodeSprite(width, height, rotation, lineWidth, x, y) {
	var o = {};
	ga.makeDisplayObject(o);
	o.mask = false;
	o.width = width || 32;
	o.height = height || 32;
	o.rotation = rotation || 0;
	o.lineWidth = lineWidth || 2;
	o.x = x || 0;
	o.y = y || 0;
	o.time0 = time;
	ga.stage.addChild(o);
	o.render = function(ctx) {
		var dt = time - this.time0;
		var r = parseInt(255 * (1 - dt * 0.75), 10);
		ctx.strokeStyle = `rgb(${r}, 0, 0)`;
		ctx.lineWidth = o.lineWidth;
		ctx.beginPath();
		var ds = dt * ga.fps * 0.5;
		// right wall
		ctx.moveTo(ds + this.halfWidth, -this.halfHeight);
		ctx.lineTo(ds + this.halfWidth,  this.halfHeight);
		// bottom wall
		ctx.moveTo( this.halfWidth, ds + this.halfHeight);
		ctx.lineTo(-this.halfWidth, ds + this.halfHeight);
		// left wall
		ctx.moveTo(-ds - this.halfWidth,  this.halfHeight);
		ctx.lineTo(-ds - this.halfWidth, -this.halfHeight);
		// top wall
		ctx.moveTo(-this.halfWidth, -ds - this.halfHeight);
		ctx.lineTo( this.halfWidth, -ds - this.halfHeight);
		if (o.mask === true) {
			ctx.clip();
		} else {
			if (o.strokeStyle !== "none") ctx.stroke();
			if (o.fillStyle !== "none") ctx.fill();
		}
	};
	return o;
}

function explodePlayerShip(x, y) {
	ga.particleEffect(
		x,
		y,
		function() {
			var p = ga.circle(10, "grey", "cyan", 1);
			p.frames = [];
			world.addChild(p);
			return p;
		},
		36,
		0,
		false,
		0, Math.PI * 2,
		10, 16,
		1, 2,
		0.001, 0.004,
	);
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
		playerThrust.play();
	};
	ga.key.upArrow.release = function() {
		player.isMoving = false;
		playerThrust.stop();
	};
}

function teardownPlayerControls() {
	ga.key.leftArrow.press = function() {
		// do nothing
	};
	ga.key.leftArrow.release = function() {
		// do nothing
	};
	ga.key.rightArrow.press = function() {
		// do nothing
	};
	ga.key.rightArrow.release = function() {
		// do nothing
	};
	ga.key.upArrow.press = function() {
		// do nothing
	};
	ga.key.upArrow.release = function() {
		// do nothing
	};
}

function createPlayer() {
	player = makeShip(40, "cyan", "white", 4);
	player.maxRotationSpeed = 0.1;
	player.maxSpeed = 10;
	player.isMoving = false;
	player.rotationSpeed = 0;
	player.acceleration = 0.36;
	player.friction = 0.98;
	player.maxHealth = 5;
	player.health = player.maxHealth;;
	player.gems = 0;
	player.collect = function() {
		this.gems++;
	};
	player.hit = function() {
		this.health--;
		this.updateColor();
		if (this.health <= 0) {
			endGame();
		}
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
	playerThrust = ga.emitter(100, function() {
		var px = (player.x - player.centerX) * Math.cos(player.rotation) - (player.centerY - player.centerY) * Math.sin(player.rotation) + player.centerX;
		var py = (player.x - player.centerX) * Math.sin(player.rotation) + (player.centerY - player.centerY) * Math.cos(player.rotation) + player.centerY;
		return ga.particleEffect(
			px,
			py,
			function() {
				var p = ga.circle(8, "grey", "white", 1);
				p.frames = [];
				world.addChild(p);
				return p;
			},
			12,
			0,
			false,
			2 / 3 * Math.PI + player.rotation,
			4 / 3 * Math.PI + player.rotation,
			8, 12,
			2, 4
		)
	});
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
	spawner = ga.emitter(455, function() {
		var pos = enemySpawnPositions[enemySpawnCorner++ % 4];
		spawnEnemy(pos[0], pos[1]);
	});
	spawner.play();
}

function createUi() {
	gemsMessage = ga.text("", "30px sans-serif", "grey", 10, 10);
	timeMessage = ga.text("", "30px sans-serif", "grey", 1000, 10);
	healthMessage = ga.text("", "30px sans-serif", "grey", 450, 10);
	gameOverMessage = ga.text("", "75px sans-serif", "grey", -1, 420);
	gameOverMessage2 = ga.text("", "75px sans-serif", "grey", -1, 550);
	gameSummaryMessage = ga.text("", "75px sans-serif", "grey", -1, 650);
	gameOverMessage.visible = false;
	gameOverMessage2.visible = false;
	gameSummaryMessage.visible = false;
}

function clamp(number, max) {
	return Math.min(Math.max(number, -max), max);
}

function clamp2(number, min, max) {
	return Math.min(Math.max(number, min), max);
}

function load() {
	prepareGame();
	ga.state = play;
}

function prepareGame() {
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
	createUi();
}

function endGame() {
	spawner.stop();
	explodePlayerShip(player.centerX, player.centerY);
	ga.remove(player);
	playerThrust.stop();
	teardownPlayerControls();
	updateUi();
	ga.canvas.ctx.font = gameOverMessage.font;
	var t = time.toFixed(1);
	gameOverMessage.content = 'GAME OVER';
	gameOverMessage2.content = 'You died :(';
	gameSummaryMessage.content = `You survived ${t}s`;
	gameOverMessage.x = (ga.canvas.width - gameOverMessage.width) * 0.5;
	gameOverMessage2.x = (ga.canvas.width - gameOverMessage2.width) * 0.5;
	gameSummaryMessage.x = (ga.canvas.width - gameSummaryMessage.width) * 0.5;
	gameOverMessage.visible = true;
	gameOverMessage2.visible = true;
	gameSummaryMessage.visible = true;
	ga.state = gameOver;
}

function winGame() {
	spawner.stop();
	playerThrust.stop();
	teardownPlayerControls();
	updateUi();
	ga.canvas.ctx.font = gameOverMessage.font;
	var t = time.toFixed(1);
	gameOverMessage.content = 'GAME COMPLETED';
	gameOverMessage2.content = 'You succeeded!';
	gameSummaryMessage.content = `It took you ${t}s`;
	gameOverMessage.x = (ga.canvas.width - gameOverMessage.width) * 0.5;
	gameOverMessage2.x = (ga.canvas.width - gameOverMessage2.width) * 0.5;
	gameSummaryMessage.x = (ga.canvas.width - gameSummaryMessage.width) * 0.5;
	gameOverMessage.visible = true;
	gameOverMessage2.visible = true;
	gameSummaryMessage.visible = true;
	ga.state = gameWon;
}

function move(object) {
	ga.move(object);
	object.x = clamp2(object.x + object.halfWidth, 0, WorldSize) - object.halfWidth;
	object.y = clamp2(object.y + object.halfHeight, 0, WorldSize) - object.halfHeight;
}

function updatePlayer() {
	player.rotation += player.rotationSpeed;
	if (player.isMoving) {
		player.vx = clamp(player.vx + player.acceleration * Math.cos(player.rotation), player.maxSpeed);
		player.vy = clamp(player.vy + player.acceleration * Math.sin(player.rotation), player.maxSpeed);
	} else {
		player.vx *= player.friction;
		player.vy *= player.friction;
	}
	move(player);
	gems = gems.filter(function(gem) {
		var collected = ga.hitTestCircleRectangle(gem, player);
		if (collected) {
			ga.remove(gem);
			player.collect();
		}
		return !collected;
	});
	if (player.gems >= 4 && ga.hitTestCircleRectangle(wormHole, player)) {
		winGame();
	}
}

function updateGems() {
	gems.forEach(function(gem) {
		gem.rotation += 0.04;
	});
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
	var rmax = (distance  / maxDistance) * (255 - 51) + 51;
	var gbmax = 51 - (distance / maxDistance) * 51;
	var s = Math.sin(time) * 0.25 + 0.75;
	var r = parseInt(s * rmax, 10);
	var gb = parseInt(s * gbmax, 10);
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
			var explosion = makeEnemyExplodeSprite(enemy.width, enemy.height, enemy.rotation, enemy.lineWidth + 1, enemy.x, enemy.y);
			world.addChild(explosion);
			ga.wait(1000, function() {
				ga.remove(explosion);
			});
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

function updateUi() {
	ga.canvas.ctx.font = timeMessage.font;
	timeMessage.content = "time: " + time.toFixed(1);
	timeMessage.x = 1000 - timeMessage.width;
	gemsMessage.content = "gems: " + player.gems + "/4";
	healthMessage.content = "health: " + player.health;
}

function play() {
	time += 1 / ga.fps;
	updateGrid();
	updateBullets();
	updateEnemies();
	updatePlayer();
	updateGems();
	camera.centerOver(player);
	updateUi();
}

function gameOver() {
	time += 1 / ga.fps;
	updateGrid();
	bullets.forEach(function(bullet) {
		bullet.rotation += 0.21;
	});
	enemies.forEach(function(enemy) {
		enemy.update();
	});
	updateGems();
}

function gameWon() {
	time += 1 / ga.fps;
	updateGrid();
	bullets.forEach(function(bullet) {
		bullet.rotation += 0.21;
	});
	enemies.forEach(function(enemy) {
		enemy.update();
	});
}
