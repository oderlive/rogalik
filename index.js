$(document).ready(function() {
    window.game = new Game();
    game.init();
    $('.field').focus();

    $(document).keydown(function(e) {
        if (!game || !game.hero) return;

        let dx = 0, dy = 0;
        switch (e.key.toLowerCase()) {
            case 'w': dy = -1; break;
            case 's': dy = 1; break;
            case 'a': dx = -1; break;
            case 'd': dx = 1; break;
            case ' ':
                e.preventDefault();
                game.heroAttack();
                return;
            default: return;
        }
        game.moveHero(dx, dy);
    });
});

function Game() {
    this.map = null;
    this.hero = null;
    this.enemies = [];
    this.items = [];

    this.init = function() {
        this.map = new Map(40, 24);
        this.map.generateMap();
        let heroTile = this.map.getRandomEmptyTile();
        if (heroTile) {
            this.hero = new Hero(heroTile);
        } else {
            console.warn("No empty tile found for hero!");
        }

        for (let i = 0; i < 10; i++) {
            let enemyTile = this.map.getRandomEmptyTile();
            if (enemyTile) {
                this.enemies.push(new Enemy(enemyTile));
            } else {
                console.warn("No empty tile found for enemy!");
            }
        }

        for (let i = 0; i < 2; i++) {
            let itemTileSword = this.map.getRandomEmptyTile();
            if (itemTileSword) {
                this.items.push(new Item(itemTileSword, 'sword'));
            } else {
                console.warn("No empty tile found for sword!");
            }
        }

        for (let i = 0; i < 10; i++) {
            let itemTileHealth = this.map.getRandomEmptyTile();
            if (itemTileHealth) {
                this.items.push(new Item(itemTileHealth, 'health'));
            } else {
                console.warn("No empty tile found for health!");
            }
        }
        this.draw();
    };

    this.draw = function() {
        let field = $('.field');
        field.empty();

        for (let y = 0; y < this.map.height; y++) {
            for (let x = 0; x < this.map.width; x++) {
                let tile = this.map.tiles[y][x];
                let tileElement = $('<div class="tile"></div>');
                tileElement.css({
                    left: x * 50 + 'px',
                    top: y * 50 + 'px'
                });

                if (tile.type === 'wall') tileElement.addClass('tileW');
                if (this.hero && this.hero.x === x && this.hero.y === y) {
                    tileElement.addClass('tileP');
                    let healthBar = $('<div class="health"></div>');
                    healthBar.css('width', this.hero.hp + '%');
                    tileElement.append(healthBar);
                }

                for (let enemy of this.enemies) {
                    if (enemy.x === x && enemy.y === y) {
                        tileElement.addClass('tileE');
                        let healthBar = $('<div class="health"></div>');
                        healthBar.css('width', (enemy.hp / 30 * 100) + '%');
                        tileElement.append(healthBar);
                    }
                }

                for (let item of this.items) {
                    if (item.x === x && item.y === y) {
                        if (item.type === 'sword') tileElement.addClass('tileSW');
                        if (item.type === 'health') tileElement.addClass('tileHP');
                    }
                }

                field.append(tileElement);
            }
        }

        $('#status').text(`HP: ${this.hero.hp} | Атака: ${this.hero.attack} | Врагов: ${this.enemies.length}`);
    };

    this.moveHero = function(dx, dy) {
        let newX = this.hero.x + dx;
        let newY = this.hero.y + dy;

        if (newX < 0 || newX >= this.map.width || newY < 0 || newY >= this.map.height) return;

        let tile = this.map.tiles[newY][newX];
        if (tile.type === 'wall') return;

        for (let enemy of this.enemies) {
            if (enemy.x === newX && enemy.y === newY) {
                return;
            }
        }

        this.hero.x = newX;
        this.hero.y = newY;

        for (let i = 0; i < this.items.length; i++) {
            let item = this.items[i];
            if (item.x === newX && item.y === newY) {
                if (item.type === 'health') {
                    this.hero.hp = Math.min(this.hero.hp + 20, 100);
                } else if (item.type === 'sword') {
                    this.hero.attack += 10;
                }
                this.items.splice(i, 1);
                break;
            }
        }

        this.enemyTurn();
        this.draw();
        this.centerView();
    };

    this.heroAttack = function() {
        let dirs = [
            {dx: 0, dy: -1},
            {dx: 0, dy: 1},
            {dx: -1, dy: 0},
            {dx: 1, dy: 0}
        ];

        for (let dir of dirs) {
            let tx = this.hero.x + dir.dx;
            let ty = this.hero.y + dir.dy;

            for (let i = this.enemies.length - 1; i >= 0; i--) {
                let enemy = this.enemies[i];
                if (enemy.x === tx && enemy.y === ty) {
                    enemy.hp -= this.hero.attack;
                    if (enemy.hp <= 0) {
                        this.enemies.splice(i, 1);
                    }
                    break;
                }
            }
        }

        this.enemyTurn();
        this.draw();
    };

    this.enemyTurn = function() {
        for (let enemy of this.enemies) {
            if (Math.abs(enemy.x - this.hero.x) + Math.abs(enemy.y - this.hero.y) === 1) {
                this.hero.hp -= 10;
                if (this.hero.hp <= 0) {
                    alert("Game Over!");
                    location.reload();
                }
                continue;
            }
            let dirs = [];
            if (enemy.x < this.hero.x) dirs.push({dx: 1, dy: 0});
            if (enemy.x > this.hero.x) dirs.push({dx: -1, dy: 0});
            if (enemy.y < this.hero.y) dirs.push({dx: 0, dy: 1});
            if (enemy.y > this.hero.y) dirs.push({dx: 0, dy: -1});

            if (dirs.length === 0) {
                dirs = [
                    {dx: 0, dy: -1},
                    {dx: 0, dy: 1},
                    {dx: -1, dy: 0},
                    {dx: 1, dy: 0}
                ];
            }
            dirs = dirs.sort(() => Math.random() - 0.5);

            for (let dir of dirs) {
                let newX = enemy.x + dir.dx;
                let newY = enemy.y + dir.dy;

                if (newX < 0 || newX >= this.map.width || newY < 0 || newY >= this.map.height) continue;

                let tile = this.map.tiles[newY][newX];
                if (tile.type === 'wall') continue;

                let occupied = this.enemies.some(e => e !== enemy && e.x === newX && e.y === newY);
                if (occupied) continue;

                if (this.hero.x === newX && this.hero.y === newY) continue;

                enemy.x = newX;
                enemy.y = newY;
                break;
            }
        }
    };
    this.centerView = function() {
        let field = $('.field')[0];

        let scrollX = this.hero.x * 50 - field.clientWidth / 2 + 25;
        let scrollY = this.hero.y * 50 - field.clientHeight / 2 + 25;
        field.scrollLeft = scrollX;
        field.scrollTop = scrollY;
    };
}

function Map(width, height) {
    this.width = width;
    this.height = height;
    this.tiles = [];
    this.generateMap = function() {
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x] = new Tile(x, y, 'wall');
            }
        }

        let numRooms = Math.floor(Math.random() * 6) + 5;
        let rooms = [];

        for (let i = 0; i < numRooms; i++) {
            let roomWidth = Math.floor(Math.random() * 6) + 3;
            let roomHeight = Math.floor(Math.random() * 6) + 3;
            let roomX = Math.floor(Math.random() * (this.width - roomWidth - 1)) + 1;
            let roomY = Math.floor(Math.random() * (this.height - roomHeight - 1)) + 1;

            this.createRoom(roomX, roomY, roomWidth, roomHeight);
            rooms.push({x: roomX, y: roomY, w: roomWidth, h: roomHeight});
        }

        for (let i = 1; i < rooms.length; i++) {
            let prev = rooms[i - 1];
            let curr = rooms[i];

            let x1 = Math.floor(prev.x + prev.w / 2);
            let y1 = Math.floor(prev.y + prev.h / 2);
            let x2 = Math.floor(curr.x + curr.w / 2);
            let y2 = Math.floor(curr.y + curr.h / 2);

            if (Math.random() < 0.5) {
                this.createHTunnel(x1, x2, y1);
                this.createVTunnel(y1, y2, x2);
            } else {
                this.createVTunnel(y1, y2, x1);
                this.createHTunnel(x1, x2, y2);
            }
        }
        let numHTunnels = Math.floor(Math.random() * 3) + 3;
        let numVTunnels = Math.floor(Math.random() * 3) + 3;

        for (let i = 0; i < numHTunnels; i++) {
            let y = Math.floor(Math.random() * (this.height - 2)) + 1;
            let x1 = Math.floor(Math.random() * (this.width / 2));
            let x2 = Math.floor(Math.random() * (this.width / 2)) + this.width / 2;
            this.createHTunnel(x1, x2, y);
        }

        for (let i = 0; i < numVTunnels; i++) {
            let x = Math.floor(Math.random() * (this.width - 2)) + 1;
            let y1 = Math.floor(Math.random() * (this.height / 2));
            let y2 = Math.floor(Math.random() * (this.height / 2)) + this.height / 2;
            this.createVTunnel(y1, y2, x);
        }
    };

    this.createRoom = function(x, y, width, height) {
        for (let j = y; j < y + height; j++) {
            for (let i = x; i < x + width; i++) {
                if (i > 0 && i < this.width - 1 && j > 0 && j < this.height - 1) {
                    this.tiles[j][i] = new Tile(i, j, 'floor');
                }
            }
        }
    };

    this.createHTunnel = function(x1, x2, y) {
        for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
            this.tiles[y][x] = new Tile(x, y, 'floor');
        }
    };

    this.createVTunnel = function(y1, y2, x) {
        for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
            this.tiles[y][x] = new Tile(x, y, 'floor');
        }
    };
    this.getRandomEmptyTile = function() {
        let emptyTiles = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.tiles[y][x].type !== 'wall') {
                    emptyTiles.push(this.tiles[y][x]);
                }
            }
        }
        if (emptyTiles.length > 0) {
            let randomIndex = Math.floor(Math.random() * emptyTiles.length);
            return emptyTiles[randomIndex];
        }
        return null;
    };
}

function Tile(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
}
function Hero(tile) {
    this.x = tile.x;
    this.y = tile.y;
    this.hp = 100;
    this.attack = 10;
}
function Enemy(tile) {
    this.x = tile.x;
    this.y = tile.y;
    this.hp = 30;
    this.attack = 10;
}
function Item(tile, type) {
    this.x = tile.x;
    this.y = tile.y;
    this.type = type;
}