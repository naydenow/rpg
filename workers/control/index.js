self.importScripts('workers/../three.js');

function Controls(main) {
    this.main = main;
    this.position = new THREE.Vector3();
    this.map = 'test';
    this.worldserver = 'https://ww.sunnygames.net/terrain/';
    this.collisionMap = {};
    this.region = '9999=9999';
    this.jumpPower = 0;
    this.maxJumpPower = 25;
    this.jump = false;
    this.onFloor = false;
    this.velocity = new THREE.Vector3();
    this.step = 10;

    this.registerWorkerEvent();
}


Controls.prototype.registerWorkerEvent = function () {
    var then = this;

    this.main.on('onRegionChange', function (data) {
        this.region = data.region;
        this.fetchCollisionMap(data.region)
    }.bind(this));

    this.main.on('onControllUpdate', function (data) {
        this.calcNextPosition(data);
    }.bind(this));

    this.main.on('jump', function () {
        this.jump = true;
    }.bind(this));
};

Controls.prototype.renderCurrentCollisionMap = function () {
    if (this.collisionMap[this.region])
        this.main.emit('renderCurrentCollisionMap', {map: this.collisionMap[this.region], region: this.region});
};

Controls.prototype.fetchCollisionMap = function (region) {
    if (this.collisionMap[region])
        return;

    var url = this.worldserver + 'lib/modul/scan/php/getmap.php';
    const formData = new FormData();
    formData.append('cub', region);
    formData.append('map', this.map);


    fetch(url, {
        method: 'POST',
        body: formData
    }).then(res => res.json())
        .then(res => {
            if (res.result === 'error') {
                this.collisionMap[region] = {};
            } else {
                this.collisionMap[region] = res.data;
            }
        })
};


Controls.prototype.calcNextPosition = function (data) {
    var moveForward = data[0];
    var moveBackward = data[1];
    var moveLeft = data[3];
    var moveRight = data[2];
    var delta = data[4];
    var direction = data[5];
    var nextPosition = this.position.clone();
    var speed = 200.0;

    direction.y = 1;

    if (!moveForward && !moveBackward) {
        direction.x = 0;
        direction.z = 0;
    }

    // if (this.jump) {
    //     direction.y -= 10;
    //     if (this.jumpPower < this.maxJumpPower) {
    //         this.jumpPower = 1 + (this.jumpPower * 1.2);
    //         // nextPosition.y += Math.abs(this.jumpPower - this.maxJumpPower);
    //     } else {
    //         this.jumpPower = 0;
    //         this.jump = false;
    //     }
    // } else if (this.onFloor === false) {
    //
    // }

    // nextPosition.y += direction.y * speed * -delta;
    // direction.y = 0;

    if (moveForward) {
        nextPosition = nextPosition.addScaledVector(direction, speed * -delta);
    }

    if (moveBackward) {
        nextPosition = nextPosition.addScaledVector(direction, speed * delta);
    }


    const p = this.checkCollision(this.position.clone(), nextPosition, delta, speed, direction);

    this.position.copy(p);
    // if (moveBackward) {
    //     this.position.addScaledVector(direction, 4000.0 * -delta);
    // }


    this.main.emit('newPlayerPosition', this.position.toArray())
};
// TODO Сделаь нормальное сканирование

Controls.prototype.calcCollisionCoords = function (x, y, z) {
    var region = calcRegion([x, y, z]);
    var [c1, c2] = region.split('=');

    var x1 = Math.floor((x - c1 * 2000) / this.step);
    var y1 = Math.floor(y / this.step);
    var z1 = Math.floor((z - c2 * 2000) / this.step);


    return [x1, y1, z1, region];
};

Controls.prototype.getX = function ({x, y, z}) {
    var [x1, y1, z1, region] = this.calcCollisionCoords(x, y, z);

    if (this.collisionMap[region] === undefined)
        return false;

    if (this.collisionMap[region][x1] !== undefined)
        return true;

    return false;

};

Controls.prototype.getZ = function ({x, y, z}) {
    var [x1, y1, z1, region] = this.calcCollisionCoords(x, y, z);

    if (this.collisionMap[region] === undefined)
        return false;

    if (this.collisionMap[region][x1] !== undefined)
        return true;

    if (this.collisionMap[region][x1][z1] !== undefined)
        return true;

    return false;

};

Controls.prototype.getY = function ({x, y, z}) {
    var [x1, y1, z1, region] = this.calcCollisionCoords(x, y, z);

    if (this.collisionMap[region] !== undefined)
        if (this.collisionMap[region][x1] !== undefined)
            if (this.collisionMap[region][x1][z1] !== undefined)
                if (this.collisionMap[region][x1][z1][y1] !== undefined)
                    return {x1, y1, z1, region, res: true};


    return {x1, y1, z1, region, res: false};

};

Controls.prototype.checkCollision = function (currentPosition, nextPos, delta, speed, direction) {
    var distance = currentPosition.distanceTo(nextPos);
    if (distance === 0)
        return currentPosition;

    var stepLenght = distance / this.step;
    var iteration = Math.round(stepLenght + 0.5);
    var res = currentPosition.clone();

    // узнаем сколько необходимо сделать итераций до достежения конечной точки и проверяем каждую на пересечение с препядствием, если в какой то точки идёт снитчение уровня земли то опускаем вниз
    // так же учитываем что начальная позиция и конечная могут находиться в разных регионах, для этого выделили отдельные ф-ии для получаеения пересечения по каждой плоскости
    for (var i = 0; i < iteration; i++) {
        var nextStepPosition = currentPosition.clone().addScaledVector(direction, distance / -iteration);

        var cc = this.getY(nextStepPosition);

        if (cc.res) {
           // nextStepPosition.y = res.y;

            // if (this.collisionMap[cc.region][cc.x1][cc.z1][cc.y1 - 1] !== undefined)

            res = nextStepPosition;
        } else {
           // if (this.collisionMap[cc.region][cc.x1][cc.z1][cc.y1 - 1] !== undefined)
                res = nextStepPosition;
        }
    }

    return res;

}

;

// Controls.prototype.checkCollision = function (currentPosition, nextPos, delta, speed, direction) {
//     var distance = currentPosition.distanceTo(nextPos);
//     console.log('distance', distance);
//
//     var step = 10;
//     var [c1, c2] = this.region.split('=');
//
//     var x1 = Math.floor((nextPos.x - c1 * 2000) / step);
//     var y1 = Math.floor((nextPos.y) / 10 + 0.5);
//     var z1 = Math.floor((nextPos.z - c2 * 2000) / step);
//
//     if (this.collisionMap[this.region])
//         if (this.collisionMap[this.region][x1] !== undefined)
//             if (this.collisionMap[this.region][x1][z1] !== undefined) {
//                 if (this.collisionMap[this.region][x1][z1][y1] !== undefined) {
//                     if (this.collisionMap[this.region][x1][z1][y1 + 1] === undefined) {
//                         //Вверх
//                         var yd = (y1 - 1) * 10;
//
//                         nextPos.y += (nextPos.y - yd) * .5;
//                         //nextPos.y = this.position.y + (nextPos.y - this.position.y) * 30;
//                     } else {
//                         return currentPosition;
//
//                         nextPos.z = this.position.z - (nextPos.z - this.position.z) * 10;
//                         nextPos.x = this.position.x - (nextPos.x - this.position.x) * 10;
//                     }
//                 } else {
//                     this.onFloor = false;
//
//                     if (this.collisionMap[this.region][x1][z1][y1 - 1] === undefined) {
//
//                         nextPos.x -= direction.x * delta * speed * 1.5;
//                         nextPos.y -= 2.8 * speed * delta;
//                         nextPos.z -= direction.z * delta * speed * 1.5;
//                     } else {
//                         this.onFloor = true;
//                         nextPos.y = (y1) * 10;
//                     }
//                 }
//             }
//
//     return nextPos;
//
// };

var calcRegion = function (positionArr) {
    return ~~(((positionArr[0] > 0 ? 1000 : -1000) + positionArr[0]) / 2000) + "=" + ~~(((positionArr[2] > 0 ? 1000 : -1000) + positionArr[2]) / 2000);
};

var calcNearRegion = function (region, length = 3) {
    var _r = region.split('=').map(function (r) {
        return +r;
    });

    var all = length;
    var res = [];
    var h = all * -1;
    var i = 0;

    while (h <= all) {
        var w = all * -1;

        while (w <= all) {
            res.push([_r[0] + w, _r[1] + h].join('='));
            w++;
        }
        h++;
    }

    return res;
};

