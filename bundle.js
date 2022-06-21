(function () {
    'use strict';

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var VecInterface = /** @class */ (function () {
        function VecInterface() {
        }
        return VecInterface;
    }());
    var Vec = {
        euclidean: function (v) {
            if (v instanceof VecInterface) {
                return v.euclidean();
            }
            else {
                return v;
            }
        },
        add: function (v1, v2) {
            var v1_ = Vec.euclidean(v1);
            var v2_ = Vec.euclidean(v2);
            if (v1_.length != v2_.length) {
                throw new Error("Cannot add vectors of different dimension (" + v1_.length + " and " + v2_.length + ")");
            }
            return v1_.map(function (val, i) { return val + v2_[i]; });
        },
        mul: function (a, v) {
            return Vec.euclidean(v).map(function (x) { return x * a; });
        },
        dot: function (v1, v2) {
            var v2_ = Vec.euclidean(v2);
            return Vec.euclidean(v1).reduce(function (sum, val, idx) { return sum + val * v2_[idx]; }, 0);
        },
        unit: function (v) {
            var v_ = Vec.euclidean(v);
            var size = Math.sqrt(v_.reduce(function (sum, val) { return sum + val * val; }, 0));
            return v_.map(function (x) { return x / size; });
        }
    };

    var Polynomial = /** @class */ (function () {
        function Polynomial(a, roots) {
            this.roots = roots;
            this.a = a;
        }
        Polynomial.prototype.evaluate = function (x) {
            var n = this.a;
            for (var _i = 0, _a = this.roots; _i < _a.length; _i++) {
                var root = _a[_i];
                n *= (x - root);
            }
            return n;
        };
        return Polynomial;
    }());
    var Derivative = /** @class */ (function () {
        function Derivative(func) {
            this.func = func;
        }
        Derivative.prototype.evaluate = function (x) {
            return (this.func.evaluate(x + 0.00001) - this.func.evaluate(x)) / 0.00001;
        };
        return Derivative;
    }());
    var Body = /** @class */ (function () {
        function Body(coord) {
            this.coord = coord;
        }
        return Body;
    }());
    /** Polynomial 2D object */
    var Curve = /** @class */ (function (_super) {
        __extends(Curve, _super);
        function Curve(func, domain) {
            var _this = _super.call(this, new Coord([0, 0])) || this;
            _this.color = "black";
            _this.func = func;
            _this.domain = domain;
            return _this;
        }
        Curve.prototype.draw = function (ctx, scale) {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 4;
            ctx.beginPath();
            var first = true;
            for (var x = this.domain[0]; x <= this.domain[1]; x += 0.01) {
                var y = this.func.evaluate(x);
                var raw = scale.transformedToRaw(new Coord(Vec.add(this.coord, [x, y])));
                if (first) {
                    ctx.moveTo(raw.xraw, raw.yraw);
                    first = false;
                }
                else {
                    ctx.lineTo(raw.xraw, raw.yraw);
                }
            }
            ctx.stroke();
        };
        return Curve;
    }(Body));
    var Axes = /** @class */ (function (_super) {
        __extends(Axes, _super);
        function Axes(xrange, yrange) {
            var _this = _super.call(this, new Coord([0, 0])) || this;
            _this.tickSize = 1;
            _this.xint = 1;
            _this.yint = 1;
            _this.xrange = xrange;
            _this.yrange = yrange;
            return _this;
        }
        Axes.prototype.draw = function (ctx, scale) {
            ctx.strokeStyle = "gray";
            ctx.lineWidth = 4;
            // draw x axis
            ctx.beginPath();
            var start = scale.transformedToRaw(new Coord(Vec.add(this.coord, [this.xrange[0], 0])));
            var end = scale.transformedToRaw(new Coord(Vec.add(this.coord, [this.xrange[1], 0])));
            ctx.moveTo(start.xraw, start.yraw);
            ctx.lineTo(end.xraw, end.yraw);
            ctx.stroke();
            // draw y axis
            ctx.beginPath();
            start = scale.transformedToRaw(new Coord(Vec.add(this.coord, [0, this.yrange[0]])));
            end = scale.transformedToRaw(new Coord(Vec.add(this.coord, [0, this.yrange[1]])));
            ctx.moveTo(start.xraw, start.yraw);
            ctx.lineTo(end.xraw, end.yraw);
            ctx.stroke();
            // draw x ticks
            for (var x = Math.ceil(this.xrange[0] / this.xint) * this.xint; x < this.xrange[1]; x += this.xint) {
                ctx.beginPath();
                var start_1 = scale.transformedToRaw(new Coord(Vec.add(this.coord, [x, -this.tickSize / 2])));
                var end_1 = scale.transformedToRaw(new Coord(Vec.add(this.coord, [x, this.tickSize / 2])));
                ctx.moveTo(start_1.xraw, start_1.yraw);
                ctx.lineTo(end_1.xraw, end_1.yraw);
                ctx.stroke();
            }
            // draw y ticks
            for (var y = Math.ceil(this.yrange[0] / this.yint) * this.yint; y < this.yrange[1]; y += this.yint) {
                ctx.beginPath();
                var start_2 = scale.transformedToRaw(new Coord(Vec.add(this.coord, [-this.tickSize / 2, y])));
                var end_2 = scale.transformedToRaw(new Coord(Vec.add(this.coord, [this.tickSize / 2, y])));
                ctx.moveTo(start_2.xraw, start_2.yraw);
                ctx.lineTo(end_2.xraw, end_2.yraw);
                ctx.stroke();
            }
        };
        return Axes;
    }(Body));
    var Car = /** @class */ (function (_super) {
        __extends(Car, _super);
        function Car(coord, curve) {
            var _this = _super.call(this, coord) || this;
            _this.vel = [0, 0];
            _this.r = 0.5;
            _this.time = null;
            _this.curve = curve;
            return _this;
        }
        Car.prototype.draw = function (ctx, scale) {
            var rawCoords = scale.transformedToRaw(this.coord);
            ctx.strokeStyle = "olivedrab";
            ctx.fillStyle = "olivedrab";
            ctx.beginPath();
            ctx.ellipse(rawCoords.xraw, rawCoords.yraw, scale.transformedToRawXSize(this.r), scale.transformedToRawYSize(this.r), 0, 0, Math.PI * 2);
            ctx.fill();
        };
        Car.prototype.step = function () {
            if (this.time == null) {
                this.time = Date.now();
            }
            var nowTime = Date.now();
            var dtSec = (nowTime - this.time) / 1000;
            this.time = nowTime;
            // collision detection :)
            var curve_y = this.curve.func.evaluate(this.coord.x - this.curve.coord.x);
            var acc = [0, -3];
            var collision = this.coord.y - this.r - this.curve.coord.y < curve_y && curve_y < this.coord.y + this.r - this.curve.coord.y;
            if (collision) {
                var deriv = (this.curve.func.evaluate(this.coord.x - this.curve.coord.x + 0.001) - this.curve.func.evaluate(this.coord.x - this.curve.coord.x)) / 0.001;
                Vec.unit([1, -1 / deriv]);
                var par_basis = Vec.unit([1, deriv]);
                // because perpendicular forces
                // cancel out,
                // only parallel gravity
                var par_grav = Vec.dot(par_basis, acc);
                acc = Vec.mul(par_grav, par_basis);
                if (this.coord.y - this.r - this.curve.coord.y < curve_y) {
                    this.coord.y = curve_y + this.curve.coord.y + this.r; // move thing above
                    // erase perpendicular velocitys
                    var par_vel = Vec.dot(par_basis, this.vel);
                    this.vel = Vec.mul(par_vel, par_basis);
                }
            }
            this.vel = Vec.add(this.vel, Vec.mul(dtSec, acc));
            this.coord.x += dtSec * this.vel[0];
            this.coord.y += dtSec * this.vel[1];
        };
        Car.prototype.collides = function (door) {
            if (door.coord.x - 1 < this.coord.x && this.coord.x < door.coord.x + 1 &&
                door.coord.y < this.coord.y && this.coord.y < door.coord.y + 4) {
                return true;
            }
            return false;
        };
        Car.prototype.collidesOffice = function (office) {
            if (office.coord.x - 1 < this.coord.x && this.coord.x < office.coord.x + 1 &&
                office.coord.y - 1 < this.coord.y && this.coord.y < office.coord.y + 1) {
                return true;
            }
            return false;
        };
        return Car;
    }(Body));
    var Door = /** @class */ (function (_super) {
        __extends(Door, _super);
        function Door(coord) {
            return _super.call(this, coord) || this;
        }
        Door.prototype.draw = function (ctx, scale) {
            ctx.fillStyle = "brown";
            ctx.fillRect(scale.transformedToRaw(this.coord).xraw - scale.transformedToRawXSize(2) / 2, scale.transformedToRaw(this.coord).yraw - scale.transformedToRawYSize(4), scale.transformedToRawXSize(2), scale.transformedToRawYSize(4));
            ctx.fillStyle = "white";
            ctx.font = '14px sans-serif';
            ctx.fillText("H206", scale.transformedToRaw(this.coord).xraw - scale.transformedToRawXSize(0.7), scale.transformedToRaw(this.coord).yraw - scale.transformedToRawYSize(4) / 2);
        };
        return Door;
    }(Body));
    var Office = /** @class */ (function (_super) {
        __extends(Office, _super);
        function Office(coord, text) {
            var _this = _super.call(this, coord) || this;
            _this.reached = false;
            _this.text = text;
            return _this;
        }
        Office.prototype.draw = function (ctx, scale) {
            ctx.fillStyle = this.reached ? "blue" : "lightslategrey";
            ctx.fillRect(scale.transformedToRaw(this.coord).xraw - scale.transformedToRawXSize(1), scale.transformedToRaw(this.coord).yraw - scale.transformedToRawYSize(1), scale.transformedToRawXSize(2), scale.transformedToRawYSize(2));
            ctx.fillStyle = "white";
            ctx.font = '14px sans-serif';
            ctx.fillText(this.text, scale.transformedToRaw(this.coord).xraw - scale.transformedToRawXSize(1), scale.transformedToRaw(this.coord).yraw + scale.transformedToRawYSize(0.2));
        };
        return Office;
    }(Body));
    var RawCoord = /** @class */ (function (_super) {
        __extends(RawCoord, _super);
        function RawCoord(coords) {
            var _this = _super.call(this) || this;
            _this.xraw = coords[0];
            _this.yraw = coords[1];
            return _this;
        }
        RawCoord.prototype.euclidean = function () {
            return [this.xraw, this.yraw];
        };
        return RawCoord;
    }(VecInterface));
    var Coord = /** @class */ (function (_super) {
        __extends(Coord, _super);
        function Coord(coords) {
            var _this = _super.call(this) || this;
            _this.x = coords[0];
            _this.y = coords[1];
            return _this;
        }
        Coord.prototype.euclidean = function () {
            return [this.x, this.y];
        };
        Coord.prototype.clone = function () {
            return new Coord(this.euclidean());
        };
        return Coord;
    }(VecInterface));
    /** Transforms `RawCoord`s into `Coord`s and vice versa */
    var Scale = /** @class */ (function () {
        function Scale(xscale, yscale, xoff, yoff) {
            /** raw x pixels / transformed y pixels */
            this.xscale = 8;
            /** raw x pixels / transforemd y pixels */
            this.yscale = 8;
            /** raw x pixel where transformed = 0 */
            this.xoff = 0;
            /** raw y pixel where transformed = 0 */
            this.yoff = 0;
            this.xscale = xscale;
            this.yscale = yscale;
            this.xoff = xoff;
            this.yoff = yoff;
        }
        Scale.prototype.rawToTransformed = function (raw) {
            return new Coord([
                (raw.xraw - this.xoff) / this.xscale,
                (raw.yraw - this.yoff) / this.yscale,
            ]);
        };
        Scale.prototype.transformedToRaw = function (coord) {
            return new RawCoord([
                coord.x * this.xscale + this.xoff,
                coord.y * this.yscale + this.yoff,
            ]);
        };
        Scale.prototype.transformedToRawXSize = function (dx) {
            return Math.abs(this.xscale * dx);
        };
        Scale.prototype.transformedToRawYSize = function (dy) {
            return Math.abs(this.yscale * dy);
        };
        return Scale;
    }());
    var Scene = /** @class */ (function () {
        function Scene(scale) {
            this.bodies = [];
            this.scale = scale;
        }
        Scene.prototype.add = function (body) {
            this.bodies.push(body);
        };
        Scene.prototype.remove = function (body) {
            var idx = this.bodies.indexOf(body);
            if (idx != -1) {
                this.bodies.splice(idx, 1);
            }
        };
        Scene.prototype.draw = function (ctx) {
            ctx.clearRect(0, 0, 750, 750);
            for (var _i = 0, _a = this.bodies; _i < _a.length; _i++) {
                var body = _a[_i];
                body.draw(ctx, this.scale);
            }
        };
        return Scene;
    }());

    function getFunc1D() {
        var func = new Polynomial(0.1, [0]);
        document.getElementById("a").addEventListener("input", function () {
            func.a = Number(this.value);
        });
        document.getElementById("x").addEventListener("input", function () {
            func.roots = this.value.split(",").map(function (x) { return x.trim(); }).map(Number);
        });
        func.a = Number(document.getElementById('a').value);
        func.roots = document.getElementById('x').value.split(",").map(function (x) { return x.trim(); }).map(Number);
        return func;
    }
    function disableInput(disabled) {
        if (document.getElementById("a") != null) {
            document.getElementById("a").disabled = disabled;
        }
        if (document.getElementById("x") != null) {
            document.getElementById("x").disabled = disabled;
        }
    }
    function showWin() {
        document.getElementById("win").style.display = "block";
    }
    function run(level) {
        var axes = new Axes([0, 20], [-10, 10]);
        var func1D = getFunc1D();
        var playing = false;
        var curveCtx = null;
        var curveScene = null;
        var curve = null;
        if (level.curve1d) {
            curveCtx = document.getElementById("canvas-curve1d").getContext("2d");
            curveScene = new Scene(new Scale(24, -24, 25, 250));
            curve = new Curve(func1D, [0, 20]);
            curveScene.add(axes);
        }
        var derivCtx = null;
        var derivScene = null;
        var deriv = null;
        if (level.deriv1d) {
            derivCtx = document.getElementById("canvas-deriv1d").getContext("2d");
            derivScene = new Scene(new Scale(24, -24, 25, 250));
            deriv = new Curve(new Derivative(func1D), [0, 20]);
            derivScene.add(axes);
        }
        var mainScene = level.main == "curve1d" ? curveScene :
            level.main == "deriv1d" ? derivScene :
                null;
        var mainCurve = level.main == "curve1d" ? curve :
            level.main == "deriv1d" ? deriv :
                null;
        if (mainScene == null) {
            throw new Error("invalid main scene: " + level.main);
        }
        var car = new Car(level.car.clone(), mainCurve);
        var door = new Door(level.door.clone());
        mainScene.add(door);
        mainScene.add(car);
        var offices = [];
        if (level.offices) {
            for (var _i = 0, _a = level.offices; _i < _a.length; _i++) {
                var office = _a[_i];
                var o = new Office(office[0].clone(), office[1]);
                mainScene.add(o);
                offices.push(o);
            }
        }
        if (curveScene != null) {
            curveScene.add(curve);
        }
        if (derivScene != null) {
            derivScene.add(deriv);
        }
        window.requestAnimationFrame(function update() {
            if (playing)
                car.step();
            for (var _i = 0, offices_1 = offices; _i < offices_1.length; _i++) {
                var office = offices_1[_i];
                if (car.collidesOffice(office)) {
                    office.reached = true;
                }
            }
            if (car.collides(door)) {
                if (!offices.some(function (x) { return !x.reached; })) {
                    playing = false;
                    disableInput(true);
                    showWin();
                }
            }
            if (car.coord.y < -12) {
                playing = false;
                disableInput(false);
            }
            if (curveScene != null)
                curveScene.draw(curveCtx);
            if (derivScene != null)
                derivScene.draw(derivCtx);
            window.requestAnimationFrame(update);
        });
        document.getElementById("play").addEventListener("click", function () {
            for (var _i = 0, offices_2 = offices; _i < offices_2.length; _i++) {
                var office = offices_2[_i];
                office.reached = false;
            }
            mainScene.remove(car);
            car = new Car(level.car.clone(), mainCurve);
            mainScene.add(car);
            playing = true;
            disableInput(true);
        });
        document.getElementById("stop").addEventListener("click", function () {
            if (!playing) {
                for (var _i = 0, offices_3 = offices; _i < offices_3.length; _i++) {
                    var office = offices_3[_i];
                    office.reached = false;
                }
                mainScene.remove(car);
                car = new Car(level.car.clone(), mainCurve);
                mainScene.add(car);
            }
            playing = false;
            disableInput(false);
        });
    }
    var levels = [
        null,
        {
            curve1d: true,
            deriv1d: false,
            main: 'curve1d',
            car: new Coord([1, 5]),
            door: new Coord([18, 0])
        },
        {
            curve1d: true,
            deriv1d: true,
            main: 'deriv1d',
            car: new Coord([1, 5]),
            door: new Coord([18, 0])
        },
        {
            curve1d: true,
            deriv1d: false,
            main: 'curve1d',
            car: new Coord([1, 5]),
            door: new Coord([18, 0]),
            offices: [
                [new Coord([7, -5]), "H105"],
                [new Coord([13, -0]), "H204"],
            ]
        },
        {
            curve1d: true,
            deriv1d: true,
            main: 'deriv1d',
            car: new Coord([1, 5]),
            door: new Coord([18, 0]),
            offices: [
                [new Coord([5, -5]), "H103"],
                [new Coord([15, 2]), "H215"],
            ]
        },
    ];
    var idx = location.href.indexOf("level1") != -1 ? 1 :
        location.href.indexOf("level2") != -1 ? 2 :
            location.href.indexOf("level3") != -1 ? 3 :
                location.href.indexOf("level4") != -1 ? 4 : 0;
    run(levels[idx]);

})();
