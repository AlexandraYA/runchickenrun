var game;
var gameWidth = 640;
var gameHeight = 450;
var bgColors = [0xA6A225, 0x8653AB, 0x6C4F80, 0x4C1B6F, 0x801D5D, 0xC5599F, 0x799C23];
var cloudSpeed = -40;
var groundSpeed = -120;
var cloudGap = 240;
var score = 0;
var bestScore = 0;

window.onload = function(){
	game = new Phaser.Game(gameWidth, gameHeight, Phaser.AUTO, '');
	game.state.add("Boot", boot);
	game.state.add("Preload", preload);
	game.state.add("TitleScreen", titleScreen);
	game.state.add("HowToPlay", howToPlay);
	game.state.add("PlayGame", playGame);
	game.state.add("GameOverScreen", gameOverScreen)
	game.state.start("Boot");
}

var boot = function(game){};
boot.prototype = {
	preload: function(){
		game.load.image("loading","assets/images/loading.png");
	},
	create: function(){
		game.scale.pageAlignHorizontally = true;
		game.scale.pageAlignVertically = true;
		game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
		this.game.state.start("Preload");
	}
}

var preload = function(game){};
preload.prototype = {
	preload: function(){
		var loadingBar = game.add.sprite(game.width / 2, game.height / 2, "loading");
		loadingBar.anchor.setTo(0.5);
		game.load.setPreloadSprite(loadingBar);
		game.load.image("playbutton", "assets/images/buttonPlay.png");
	},
	create: function(){
		game.state.start("TitleScreen");
	}
}

var titleScreen = function(game){};
titleScreen.prototype = {
	create: function(){
		game.stage.backgroundColor = bgColors[game.rnd.between(0, bgColors.length - 1)];
		
		this.style = { font: "32px Arial", fill: "#fff", tabs: 100 };
		game.add.text(game.width/2 - 128, 60, "Run Chicken Run", this.style);

		// Game start by press Enter
		this.enter = game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
        this.enter.onDown.add(this.howToPlay, this);

		var playButton = game.add.button(game.width/2, game.height/2, "playbutton", this.howToPlay);
		playButton.anchor.set(0.5);
		var tween = game.add.tween(playButton).to({
		width: 280,
		height:100
		}, 1000, "Linear", true, 500, -1);
		tween.yoyo(true);
	},
	howToPlay: function(){
		game.state.start("HowToPlay");
	}
}

var howToPlay = function(game){};
howToPlay.prototype = {
	preload: function(){
		game.load.image('kaktus', 'assets/images/kaktus.png');
		game.load.spritesheet('chicken', 'assets/images/chicken3.png', 70, 90, 3);
	},
	create: function(){
		game.stage.backgroundColor = bgColors[game.rnd.between(0, bgColors.length - 1)];
		
		this.style = { font: "36px Arial", fill: "#fff", tabs: 100 };
		this.title = game.add.text(game.width/2, 30, "CONTROLS", this.style);
		this.title.anchor.set(0.5);
		
		this.style = { font: "16px Arial", fill: "#fff", tabs: 60 };
		this.descr = game.add.text(game.width/2, 70, "SPACEBAR or mouse click to jump", this.style);
		this.descr.anchor.set(0.5);
		
		
		this.ground = 220;
		this.chicken = game.add.sprite(game.width/2, this.ground, 'chicken');
		this.chicken.scale.set(0.6);
		this.chicken.anchor.set(0.5, 1);
		this.chicken.animations.add('walk', [0,1]);
		this.chicken.animations.add('jump', [2]);
		this.chicken.animations.play('walk', 5, true);		
		
		this.kaktus = game.add.sprite(game.width/2 + 100, this.ground, 'kaktus');
		this.kaktus.scale.set(0.4);
		this.kaktus.anchor.set(0, 1);		
		var horizontalKaktusTween = game.add.tween(this.kaktus).to({
               x: game.width/2 - 100
          }, 2000, "Linear", true, 0, -1);
		
		this.chickenUp = false;
		this.chickenDown = false;
		this.chickenTimes = 11;
		this.chickenTimesCnt = 1;		
		
		this.chickenJump = game.time.events.loop(60, function(){			
			if ( this.kaktus.x <= (game.width/2 + 50) && (this.kaktus.x > game.width/2) && !this.chickenUp && !this.chickenDown ) {				
				this.chickenUp = true;
				this.chicken.animations.stop();
				this.chicken.animations.play('jump');
			} 
			
			if (this.chickenUp) {				
				if ( this.chickenTimesCnt < this.chickenTimes ) {
					this.chicken.y -= 5;					
					this.chickenTimesCnt++;					
				} else {
					this.chickenUp = false;
					this.chickenDown = true;
				}				
			} else if (this.chickenDown) {			
				if ( this.chickenTimesCnt > 1 ) {
					this.chicken.y += 5;
					this.chickenTimesCnt--;					
				} else {
					this.chickenDown = false;
					this.chicken.animations.stop();
					this.chicken.animations.play('walk');
				}				
			}			
		}, this);

		// Game start by press Enter
		this.enter = game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
        this.enter.onDown.add(this.startGame, this);

		var playButton = game.add.button(game.width/2, game.height - 100, "playbutton", this.startGame);
		playButton.anchor.set(0.5);
	},
	startGame: function(){
		game.state.start("PlayGame");
	}
}

var playGame = function(game){
	this.clouds;
	this.grounds;
	this.groundStatic;
	this.chicken;
	this.kaktus;
	this.walk;
	this.frames = 0;
	this.isJumping = false;
};
playGame.prototype = {
	preload: function(){
		game.load.image('cloud', 'assets/images/cloud.png');
		game.load.image('groundStatic', 'assets/images/ground_static.png');
		game.load.image('groundDinamic', 'assets/images/ground_static.png');		
	},
	create: function(){
		game.physics.startSystem(Phaser.Physics.ARCADE);
		game.stage.backgroundColor = "#FFFB73";
		
		this.cloudsGroup = game.add.group();
		this.addCloud(this.cloudsGroup);
		
		score = 0;
		this.style = { font: "20px Courier", fill: "#999", tabs: 80 };
		textScore = game.add.text(game.width - 200, 10, "SCORE: " + score, this.style);
		
		this.groundStatic = game.add.sprite(0, 400, 'groundStatic');
		game.physics.arcade.enable(this.groundStatic);
		this.groundStatic.body.immovable = true;		
		
		this.grounds = game.add.group();
		this.grounds.enableBody = true;
		
		var ground = this.grounds.create(0, 400, 'groundDinamic');
		ground.body.immovable = true;
		ground.body.velocity.x = groundSpeed;

		ground = this.grounds.create(600, 400, 'groundDinamic');
		ground.body.immovable = true;
		ground.body.velocity.x = groundSpeed;

		this.chicken = game.add.sprite(200, 300, 'chicken');

		game.physics.arcade.enable(this.chicken);
		this.chicken.body.gravity.y = 300;
		this.chicken.body.collideWorldBounds = true;

		this.chicken.animations.add('walk', [0,1]);
		this.chicken.animations.add('jump', [2]);
		
		this.kaktusGroup = game.add.group();
		this.addKaktus(this.kaktusGroup);
		
		this.chicken.animations.play('walk', 5, true);
		this.chicken.jump = false;
		
		// Click mouse or SPACEBAR to jump
		game.input.onDown.add(this.actionJump, this);		
		this.spacebar = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        this.spacebar.onDown.add(this.actionJump, this);
	},
	update: function(){
		game.physics.arcade.collide(this.chicken, this.groundStatic);
		game.physics.arcade.collide(this.kaktusGroup, this.grounds);
		
		this.grounds.forEach(this.runAnimGround, this);
		
		if ( this.chicken.jump ) {
			this.chicken.animations.play('jump');
			// когда персонаж коснулся земли, опять запускаем анимацию
			if (this.chicken.body.y == (400 - this.chicken.height)) {
				this.chicken.jump = false;
			}
		} else {
			this.chicken.animations.play('walk');
		}
		
		game.physics.arcade.collide(this.kaktusGroup, this.chicken, function(s, b){
			var destroyTween = game.add.tween(s).to({
				x: s.x + 300,
				y: s.y - 300,
				rotation: 15
			}, 1000, Phaser.Easing.Linear.None, true);
            destroyTween.onComplete.add(function(){
				game.state.start("GameOverScreen");
            }, this);
        });
		  
		score++;
		textScore.text = "SCORE: " + score;
	},
	actionJump: function(){
		if (this.chicken.body.touching.down){
			this.chicken.body.velocity.y = -300;
			this.chicken.animations.stop();
			this.chicken.jump = true;
		}
	},
	runAnimGround: function(ground){
		if (ground.x < -game.world.width) {
			ground.x = game.world.width;
		}
	},
	addCloud: function(group){
		var cloud = new Cloud(game, cloudSpeed);
        game.add.existing(cloud);
        group.add(cloud); 
	},
	addKaktus: function(group){
		var kaktus = new Kaktus(game);
        game.add.existing(kaktus);
        group.add(kaktus); 
	}
}

var gameOverScreen = function(game){};
gameOverScreen.prototype = {
	preload:function(){
		game.load.image('restart', 'assets/images/buttonRestart.png')
	},
     create:function(){
		if (bestScore < score) {
			bestScore = score;
		}
		this.style = { font: "20px Arial", fill: "#000", tabs: 80 };
		game.add.text(game.width/2 - 100, game.height/2 - 100, "GAME OVER", this.style);
		game.add.text(game.width/2 - 100, game.height/2 - 70, "your score: " + score, this.style);
		game.add.text(game.width/2 - 100, game.height/2 - 40, "the best score: " + bestScore, this.style);
		var startButton = game.add.button(game.width/2 - 140, game.height/2,
		"restart", this.startGame);
     },
	startGame: function(){
		game.state.start("PlayGame");
	}  
}

Cloud = function (game, speed){
     var positions = [60, 100, 160];
     var position = game.rnd.between(0, positions.length-1);
	 Phaser.Sprite.call(this, game, game.width + 45, positions[position], "cloud");     
	 game.physics.enable(this, Phaser.Physics.ARCADE);
     this.anchor.set(0.5);    
     this.body.velocity.x = speed;
	 this.placeCloud = true;
};

Cloud.prototype = Object.create(Phaser.Sprite.prototype);
Cloud.prototype.constructor = Cloud;

Cloud.prototype.update = function(){
     if (this.placeCloud && this.x < (game.width - cloudGap)){
          this.placeCloud = false;
          playGame.prototype.addCloud(this.parent);
     }   
     if (this.x < -45){
          this.destroy();
     }
}

Kaktus = function (game){
	 Phaser.Sprite.call(this, game, game.width + 20, 300, "kaktus");     
	 game.physics.enable(this, Phaser.Physics.ARCADE);
	 this.body.gravity.y = 300;
};

Kaktus.prototype = Object.create(Phaser.Sprite.prototype);
Kaktus.prototype.constructor = Kaktus;

Kaktus.prototype.update = function(){
     if (this.x < -20){
          playGame.prototype.addKaktus(this.parent);
		  this.destroy();
     }
}