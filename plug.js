"use strict";

GA = GA || {};
GA.plugins = function(ga) {

	ga.move = function(sprite) {
		sprite.x += sprite.vx | 0;
		sprite.y += sprite.vy | 0;
	};

	ga.randomInt = function(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	};

	ga.randomFloat = function(min, max) {
		return min + Math.random()*(max-min);
	}

	ga.wait = function(duration, callBack) {
		return setTimeout(callBack, duration);
	};

	ga.worldCamera = function(world, canvas) {
		var camera = {
			width: canvas.width,
			height: canvas.height,
			_x: 0,
			_y: 0,
			get x() {
				return this._x;
			},
			set x(value) {
				this._x = value;
				world.x = -this._x;
				world._previousX = world.x;
			},
			get y() {
				return this._y;
			},
			set y(value) {
				this._y = value;
				world.y = -this._y;
				world._previousY = world.y;
			},
			get centerX() {
				return this.x + (this.width / 2);
			},
			get centerY() {
				return this.y + (this.height / 2);
			},
			get rightInnerBoundary() {
				return this.x + (this.width / 2) + (this.width / 4);
			},
			get leftInnerBoundary() {
				return this.x + (this.width / 2) - (this.width / 4);
			},
			get topInnerBoundary() {
				return this.y + (this.height / 2) - (this.height / 4);
			},
			get bottomInnerBoundary() {
				return this.y + (this.height / 2) + (this.height / 4);
			},
			follow: function(sprite) {
				if(sprite.x < this.leftInnerBoundary) {
					this.x = sprite.x - (this.width / 4);
				}
				if(sprite.y < this.topInnerBoundary) {
					this.y = sprite.y - (this.height / 4);
				}
				if(sprite.x + sprite.width > this.rightInnerBoundary) {
					this.x = sprite.x + sprite.width - (this.width / 4 * 3);
				}
				if(sprite.y + sprite.height > this.bottomInnerBoundary) {
					this.y = sprite.y + sprite.height - (this.height / 4 * 3);
				}
				if(this.x < 0) {
					this.x = 0;
				}
				if(this.y < 0) {
					this.y = 0;
				}
				if(this.x + this.width > world.width) {
					this.x = world.width - this.width;
				}
				if(this.y + this.height > world.height) {
					this.y = world.height - this.height;
				}
			},
			centerOver: function(sprite) {
				this.x = (sprite.x + sprite.halfWidth) - (this.width / 2);
				this.y = (sprite.y + sprite.halfHeight) - (this.height / 2);
			}
		};
		return camera;
	};

	ga.scaleToWindow = function(backgroundColor) {
		backgroundColor = backgroundColor || "#2C3539";
		var scaleX, scaleY, scale, center;
		scaleX = window.innerWidth / ga.canvas.width;
		scaleY = window.innerHeight / ga.canvas.height;
		scale = Math.min(scaleX, scaleY);
		ga.canvas.style.transformOrigin = "0 0";
		ga.canvas.style.transform = "scale(" + scale + ")";
		if (ga.canvas.width > ga.canvas.height) {
			if (ga.canvas.width * scale < window.innerWidth) {
				center = "horizontally";
			} else { 
				center = "vertically";
			}
		} else {
			if (ga.canvas.height * scale < window.innerHeight) {
				center = "vertically";
			} else { 
				center = "horizontally";
			}
		}
		var margin;
		if (center === "horizontally") {
			margin = (window.innerWidth - ga.canvas.width * scale) / 2;
			ga.canvas.style.marginLeft = margin + "px";
			ga.canvas.style.marginRight = margin + "px";
		}
		if (center === "vertically") {
			margin = (window.innerHeight - ga.canvas.height * scale) / 2;
			ga.canvas.style.marginTop = margin + "px";
			ga.canvas.style.marginBottom = margin + "px";
		}
		ga.canvas.style.paddingLeft = 0;
		ga.canvas.style.paddingRight = 0;
		ga.canvas.style.paddingTop = 0;
		ga.canvas.style.paddingBottom = 0;
		ga.canvas.style.display = "block";
		document.body.style.backgroundColor = backgroundColor;
		ga.pointer.scale = scale;
		ga.scale = scale;
		ga.canvas.scaled = true;
		var ua = navigator.userAgent.toLowerCase(); 
		if (ua.indexOf("safari") != -1) { 
			if (ua.indexOf("chrome") > -1) {
				// Chrome
			} else {
				// Safari
				ga.canvas.style.maxHeight = "100%";
				ga.canvas.style.minHeight = "100%";
			}
		}
	};

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

	ga.particles = [];

	ga.particleEffect = function(
		x, 
		y, 
		spriteFunction,
		numberOfParticles,
		gravity,
		randomSpacing,
		minAngle, maxAngle,
		minSize, maxSize, 
		minSpeed, maxSpeed,
		minScaleSpeed, maxScaleSpeed,
		minAlphaSpeed, maxAlphaSpeed,
		minRotationSpeed, maxRotationSpeed
	) {
		if (x === undefined) x = 0;
		if (y === undefined) y = 0; 
		if (spriteFunction === undefined) spriteFunction = function(){return ga.circle(10, "red")};
		if (numberOfParticles === undefined) numberOfParticles = 10;
		if (gravity === undefined) gravity = 0;
		if (randomSpacing === undefined) randomSpacing = true;
		if (minAngle === undefined) minAngle = 0; 
		if (maxAngle === undefined) maxAngle = 6.28;
		if (minSize === undefined) minSize = 4; 
		if (maxSize === undefined) maxSize = 16; 
		if (minSpeed === undefined) minSpeed = 0.1; 
		if (maxSpeed === undefined) maxSpeed = 1; 
		if (minScaleSpeed === undefined) minScaleSpeed = 0.01; 
		if (maxScaleSpeed === undefined) maxScaleSpeed = 0.05;
		if (minAlphaSpeed === undefined) minAlphaSpeed = 0.02; 
		if (maxAlphaSpeed === undefined) maxAlphaSpeed = 0.02;
		if (minRotationSpeed === undefined) minRotationSpeed = 0.01; 
		if (maxRotationSpeed === undefined) maxRotationSpeed = 0.03;
		var randomFloat = function(min, max){return min + Math.random() * (max - min)},
			randomInt = function(min, max){return Math.floor(Math.random() * (max - min + 1)) + min};
		var angles = [];
		var angle;
		var spacing = (maxAngle - minAngle) / (numberOfParticles - 1);
		for(var i = 0; i < numberOfParticles; i++) {
			if (randomSpacing) {
				angle = randomFloat(minAngle, maxAngle);
				angles.push(angle);
			} 
			else {
				if (angle === undefined) angle = minAngle;
				angles.push(angle);
				angle += spacing;
			}
		}
		angles.forEach(function(angle){
			makeParticle(angle)
		});
		function makeParticle(angle) {
			var particle = spriteFunction();
			if (particle.frames.length > 0) {
				particle.gotoAndStop(randomInt(0, particle.frames.length - 1));
			}
			particle.x = x - particle.halfWidth;
			particle.y = y - particle.halfHeight;
			var size = randomInt(minSize, maxSize);
			particle.width = size;
			particle.height = size;
			particle.scaleSpeed = randomFloat(minScaleSpeed, maxScaleSpeed);
			particle.alphaSpeed = randomFloat(minAlphaSpeed, maxAlphaSpeed);
			particle.rotationSpeed = randomFloat(minRotationSpeed, maxRotationSpeed);
			var speed = randomFloat(minSpeed, maxSpeed);
			particle.vx = speed * Math.cos(angle);
			particle.vy = speed * Math.sin(angle);
			particle.updateParticle = function() {
				particle.vy += gravity;
				particle.x += particle.vx;
				particle.y += particle.vy;
				if (particle.scaleX - particle.scaleSpeed > 0) {
					particle.scaleX -= particle.scaleSpeed;
				}
				if (particle.scaleY - particle.scaleSpeed > 0) {
					particle.scaleY -= particle.scaleSpeed;
				}
				particle.rotation += particle.rotationSpeed;
				particle.alpha -= particle.alphaSpeed;
				if (particle.alpha <= 0) {
					ga.remove(particle);
					ga.particles.splice(ga.particles.indexOf(particle), 1);
				}
			};
			ga.particles.push(particle);
		}
	}

	ga.updateParticles = function() {
		if (ga.particles.length > 0) {
			for(var i = ga.particles.length - 1; i >= 0; i--) {
				var particle = ga.particles[i];
				particle.updateParticle();
			}
		}
	}

	ga.updateFunctions.push(ga.updateParticles);

	ga.emitter = function(interval, particleFunction) {
		var emitter = {},
			timerInterval = undefined;
		emitter.playing = false;
		function play() {
			if (!emitter.playing) {
				particleFunction();
				timerInterval = setInterval(emitParticle.bind(this), interval);
				emitter.playing = true;
			}
		}
		function stop() {
			if (emitter.playing) {
				clearInterval(timerInterval);
				emitter.playing = false;
			}
		}
		function emitParticle() {
			particleFunction();
		}
		emitter.play = play;
		emitter.stop = stop;
		return emitter;
	}

	ga.outsideBounds = function(s, bounds, extra){
		var x = bounds.x,
			y = bounds.y,
			width = bounds.width,
			height = bounds.height;
		var collision;
		//Left
		if (s.x < x - s.width) {
			collision = "left";
		}
		//Top
		if (s.y < y - s.height) {
			collision = "top";
		}
		//Right
		if (s.x > width) {
			collision = "right";
		}
		//Bottom
		if (s.y > height) {
			collision = "bottom";
		}
		if (collision && extra) extra(collision);
		return collision;
	};

	ga.hitTestCircle = function(c1, c2, global) {
		var vx, vy, magnitude, totalRadii, hit;
		if(global === undefined) global = false;
		if(global) {
			vx = (c2.gx + c2.radius) - (c1.gx + c1.radius);
			vy = (c2.gy + c2.radius) - (c1.gy + c1.radius);
		} else {
			vx = c2.centerX - c1.centerX;
			vy = c2.centerY - c1.centerY;
		}
		magnitude = Math.sqrt(vx * vx + vy * vy);
		totalRadii = c1.radius + c2.radius;
		hit = magnitude < totalRadii;
		return hit;
	};

	ga.hitTestRectangle = function(r1, r2, global) {
		var hit, combinedHalfWidths, combinedHalfHeights, vx, vy;
		if(global === undefined) global = false;
		hit = false;
		if (global) {
			vx = (r1.gx + r1.halfWidth) - (r2.gx + r2.halfWidth);
			vy = (r1.gy + r1.halfHeight) - (r2.gy + r2.halfHeight);
		} else {
			vx = r1.centerX - r2.centerX;
			vy = r1.centerY - r2.centerY;
		}
		combinedHalfWidths = r1.halfWidth + r2.halfWidth;
		combinedHalfHeights = r1.halfHeight + r2.halfHeight;
		if (Math.abs(vx) < combinedHalfWidths) {
			if (Math.abs(vy) < combinedHalfHeights) {
				hit = true;
			} else {
				hit = false;
			}
		} else {
			hit = false;
		}
		return hit;
	};

	ga.hitTestCircleRectangle = function(c1, r1, global) {
		var region, collision, c1x, c1y, r1x, r1y;
		if(global === undefined) global = false;
		if (global) {
			c1x = c1.gx;
			c1y = c1.gy
			r1x = r1.gx;
			r1y = r1.gy;
		} else {
			c1x = c1.x;
			c1y = c1.y
			r1x = r1.x;
			r1y = r1.y;
		}
		if (c1y < r1y - r1.halfHeight) {
			if(c1x < r1x - 1 - r1.halfWidth) {
				region = "topLeft";
			}
			else if (c1x > r1x + 1 + r1.halfWidth) {
				region = "topRight";
			}
			else {
				region = "topMiddle";
			}
		}
		else if (c1y > r1y + r1.halfHeight) {
			if (c1x < r1x - 1 - r1.halfWidth) {
				region = "bottomLeft";
			}
			else if (c1x > r1x + 1 + r1.halfWidth) {
				region = "bottomRight";
			}
			else {
				region = "bottomMiddle";
			}
		}
		else {
			if (c1x < r1x - r1.halfWidth) {
				region = "leftMiddle";
			}
			else {
				region = "rightMiddle";
			}
		}
		if (region === "topMiddle"
			|| region === "bottomMiddle"
			|| region === "leftMiddle"
			|| region === "rightMiddle") {
			collision = ga.hitTestRectangle(c1, r1, global);  
		} else {
			var point = {};
			switch (region) {
				case "topLeft": 
					point.x = r1x;
					point.y = r1y;
					break;
				case "topRight":
					point.x = r1x + r1.width;
					point.y = r1y;
					break;
				case "bottomLeft":
					point.x = r1x;
					point.y = r1y + r1.height;
					break;
				case "bottomRight":
					point.x = r1x + r1.width;
					point.y = r1y + r1.height;
			}
			collision = ga.hitTestCirclePoint(c1, point, global);
		}
		if (collision) {
			return region;
		} else {
			return collision;
		}
	};

	ga.hitTestCirclePoint = function(c1, point, global) {
		if(global === undefined) global = false;
		point.diameter = 1;
		point.radius = 0.5;
		point.centerX = point.x;
		point.centerY = point.y;
		point.gx = point.x;
		point.gy = point.y;
		return ga.hitTestCircle(c1, point, global); 
	};

}
