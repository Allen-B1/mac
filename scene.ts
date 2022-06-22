import {Vec, VecInterface} from  "./vector";
import * as math from 'mathjs';

export interface Func1D {
    evaluate(x: number): number
    toString() : string
}

export interface Func2D {
    evaluate(x: number, y: number): number
    toString() : string
}

function gradient(f: Func2D, x: number, y: number): [number, number] {
    let d = 0.000001;
    let df_x = f.evaluate(x+d, y) - f.evaluate(x, y);
    let df_y = f.evaluate(x, y+d) - f.evaluate(x, y);
    return [df_x/d, df_y/d];
}

export class Polynomial {
    roots: number[]
    a: number

    evaluate(x: number) : number {
        let n = this.a;
        for (let root of this.roots) {
            n *= (x - root);
        }
        return n;
    }

    constructor(a: number, roots: number[]) {
        this.roots = roots;
        this.a = a
    }

    toString(): string {
        let s = "" + this.a;
        for (let x of this.roots) {
            s += "(x-" + x + ")";
        }
        return s;
    }
}

export class Derivative {
    func: Func1D

    constructor(func: Func1D) {
        this.func = func;
    }

    evaluate(x: number) {
        return (this.func.evaluate(x+0.000001) - this.func.evaluate(x)) / 0.000001;
    }

    toString() : string {
        return "d/dx[" + this.func.toString() + "]";
    }
}

export class Func2DExpr {
    func: math.EvalFunction
    _s: string
    
    constructor (expr: string) {
        this.recompile(expr);
    }

    recompile(expr: string): boolean {
        try {
            let f = math.compile(expr);
            f.evaluate({x:0.01,y:0.01}); //test that it works
            this.func = f;
            this._s = expr;    
            return true;
        } catch(e) {
            console.warn("invalid expression: " +expr);
            console.warn(e);
            if (!this.func) {
                this.func = math.compile('x+y');
                this._s = "x+y";
            }
            return false;
        }
    }

    evaluate(x: number, y: number) : number {
        return this.func.evaluate({x, y});
    }

    toString() : string {
        return this._s;
    }
}

export abstract class Body {
    coord: Coord

    constructor (coord: Coord) {
        this.coord = coord;
    }

    abstract draw(ctx: CanvasRenderingContext2D, scale: Scale): void;
}

/** Polynomial 2D object */
export class Curve extends Body {
    func: Func1D
    domain: [number, number]
    color: string = "black"
    
    constructor(func: Func1D, domain: [number, number]) {
        super(new Coord([0, 0]));
        this.func = func;
        this.domain = domain;
    }

    draw(ctx: CanvasRenderingContext2D, scale: Scale) {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        let first = true;
        for (let x = this.domain[0]; x <= this.domain[1]; x += 0.01) {
            let y = this.func.evaluate(x);
            let raw = scale.transformedToRaw(new Coord(Vec.add(this.coord, [x, y])));
            if (first) {
                ctx.moveTo(raw.xraw, raw.yraw);
                first = false;
            } else {
                ctx.lineTo(raw.xraw, raw.yraw);
            }
        }
        ctx.stroke();
    }
}

export class Axes extends Body {
    xrange: [number, number] 
    yrange: [number, number] 
    tickSize: number = 1
    xint: number = 1
    yint: number = 1

    constructor(xrange: [number, number], yrange: [number, number]) {
        super(new Coord([0, 0]));
        this.xrange = xrange;
        this.yrange=  yrange;
    }

    draw(ctx: CanvasRenderingContext2D, scale: Scale) {
        ctx.strokeStyle = "gray";
        ctx.lineWidth = 4;

        // draw x axis
        ctx.beginPath();
        let start = scale.transformedToRaw(new Coord(Vec.add(this.coord, [this.xrange[0], 0])));
        let end = scale.transformedToRaw(new Coord(Vec.add(this.coord, [this.xrange[1], 0])))
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
        for (let x = Math.ceil(this.xrange[0] / this.xint) * this.xint; x < this.xrange[1]; x += this.xint) {
            ctx.beginPath();
            let start = scale.transformedToRaw(
                new Coord(Vec.add(this.coord, [x, -this.tickSize/2])),
            );
            let end = scale.transformedToRaw(
                new Coord(Vec.add(this.coord, [x, this.tickSize/2])),
            );
            ctx.moveTo(start.xraw, start.yraw);
            ctx.lineTo(end.xraw, end.yraw);
            ctx.stroke();
        }

        // draw y ticks
        for (let y = Math.ceil(this.yrange[0] / this.yint) * this.yint; y < this.yrange[1]; y += this.yint) {
            ctx.beginPath();
            let start = scale.transformedToRaw(
                new Coord(Vec.add(this.coord, [-this.tickSize/2, y])),
            );
            let end = scale.transformedToRaw(
                new Coord(Vec.add(this.coord, [this.tickSize/2, y])),
            );
            ctx.moveTo(start.xraw, start.yraw);
            ctx.lineTo(end.xraw, end.yraw);
            ctx.stroke();
        }
    }
}

export class Car extends Body {
    vel: number[] = [0, 0]
    r: number = 0.5

    constructor (coord: Coord) {
        super(coord);
    }

    draw(ctx: CanvasRenderingContext2D, scale: Scale) {
        let rawCoords = scale.transformedToRaw(this.coord);

        ctx.strokeStyle = "olivedrab";
        ctx.fillStyle = "olivedrab";
        ctx.beginPath();
        ctx.ellipse(rawCoords.xraw, rawCoords.yraw, scale.transformedToRawXSize(this.r), scale.transformedToRawYSize(this.r), 0, 0, Math.PI * 2);
        ctx.fill();
    }

    time: number | null = null
    step1d(curve: Curve) {
        if (this.time == null) {
            this.time = Date.now();
        }

        var nowTime = Date.now();
        var dtSec = (nowTime - this.time) / 1000;
        this.time = nowTime;

        // collision detection :)
        var curve_y = curve.func.evaluate(this.coord.x - curve.coord.x);
        var acc = [0, -3];
        var collision = this.coord.y - this.r - curve.coord.y < curve_y && curve_y < this.coord.y + this.r - curve.coord.y;
        if (collision) {
            var deriv = (curve.func.evaluate(this.coord.x - curve.coord.x + 0.001) -curve.func.evaluate(this.coord.x - curve.coord.x)) / 0.001;
            var perp_basis = Vec.unit([1, -1/deriv]);
            var par_basis = Vec.unit([1, deriv]);

            // because perpendicular forces
            // cancel out,
            // only parallel gravity
            let par_grav = Vec.dot(par_basis, acc);
            acc = Vec.mul(par_grav, par_basis);
            if (this.coord.y - this.r - curve.coord.y  < curve_y) {
                this.coord.y = curve_y + curve.coord.y + this.r; // move thing above
                
                // erase perpendicular velocitys
                var par_vel = Vec.dot(par_basis, this.vel);
                this.vel = Vec.mul(par_vel, par_basis);
            }
        }

        this.vel = Vec.add(this.vel, Vec.mul(dtSec, acc));
        this.coord.x += dtSec * this.vel[0];
        this.coord.y += dtSec * this.vel[1];
    }

    step2d(plot: ColorPlot) {
        if (this.time == null) {
            this.time = Date.now();
        }
        var nowTime = Date.now();
        var dtSec = (nowTime - this.time) / 1000;
        this.time = nowTime;

        let acc = Vec.mul(-1, gradient(plot.func, this.coord.x - plot.coord.x, this.coord.y - plot.coord.y));
        
        this.vel = Vec.add(this.vel, Vec.mul(dtSec, acc));
        this.coord.x += dtSec * this.vel[0];
        this.coord.y += dtSec * this.vel[1];
    }

    collides(door: Door): boolean {
        if (door.coord.x - 1 < this.coord.x && this.coord.x < door.coord.x + 1 &&
            door.coord.y < this.coord.y && this.coord.y < door.coord.y + 4) {
                return true;
            }
        return false;
    }

    collidesOffice(office: Office): boolean {
        if (office.coord.x - 1 < this.coord.x && this.coord.x < office.coord.x + 1 &&
            office.coord.y - 1 < this.coord.y && this.coord.y < office.coord.y + 1) {
                return true;
            }
        return false;
    }
}

export class Door extends Body {
    constructor (coord: Coord) {
        super(coord);
    }

    draw(ctx: CanvasRenderingContext2D, scale: Scale) {
        ctx.fillStyle = "brown";
        ctx.fillRect(scale.transformedToRaw(this.coord).xraw - scale.transformedToRawXSize(2) / 2, scale.transformedToRaw(this.coord).yraw - scale.transformedToRawYSize(4), 
            scale.transformedToRawXSize(2), scale.transformedToRawYSize(4));
        ctx.fillStyle = "white";
        ctx.font = '14px sans-serif';
        ctx.fillText("H206", scale.transformedToRaw(this.coord).xraw - scale.transformedToRawXSize(0.7), scale.transformedToRaw(this.coord).yraw - scale.transformedToRawYSize(4)/2);
    }
}

export class Office extends Body {
    text: string
    reached: boolean = false
    constructor(coord: Coord, text: string) {
        super(coord);
        this.text = text;
    }

    draw(ctx: CanvasRenderingContext2D, scale: Scale) {
        ctx.fillStyle = this.reached ? "blue" : "lightslategrey";
        ctx.fillRect(scale.transformedToRaw(this.coord).xraw - scale.transformedToRawXSize(1),
            scale.transformedToRaw(this.coord).yraw - scale.transformedToRawYSize(1),
            scale.transformedToRawXSize(2),
            scale.transformedToRawYSize(2)
            );
        ctx.fillStyle = "white";
        ctx.font = '14px sans-serif';
        ctx.fillText(this.text, scale.transformedToRaw(this.coord).xraw - scale.transformedToRawXSize(1), scale.transformedToRaw(this.coord).yraw + scale.transformedToRawYSize(0.2));
    }
}

export class ColorPlot extends Body {
    func: Func2D
    xrange:  [number, number]
    yrange: [number, number]
    d: number = 0.25

    constructor(func: Func2D, xrange: [number, number], yrange: [number, number]) {
        super(new Coord([0, 0]));
        this.func = func;
        this.xrange = xrange;
        this.yrange = yrange;
    }

    draw(ctx: CanvasRenderingContext2D, scale: Scale) {
        for (let x = this.xrange[0]; x <= this.xrange[1]; x += this.d) {
            for (let y = this.yrange[0]; y <= this.yrange[1]; y += this.d) {
                let res = this.func.evaluate(x, y);
                let hue = ((-math.tanh(res/50) + 1) / 2) * 280;
                ctx.fillStyle = 'hsl(' + hue + ',90%,60%)';
                let raw = scale.transformedToRaw(new Coord(Vec.add(this.coord, [x, y])));
                ctx.fillRect(raw.xraw, raw.yraw, scale.transformedToRawXSize(this.d), scale.transformedToRawYSize(this.d));
            }
        }
        console.log("redrawn!");
    }
}

export class RawCoord extends VecInterface {
    xraw: number
    yraw: number

    euclidean(): number[] {
        return [this.xraw, this.yraw];
    }

    constructor(coords: number[]) {
        super();
        this.xraw =coords[0];
        this.yraw =coords[1];
    }
}

export class Coord extends VecInterface {
    x: number
    y: number

    constructor(coords: number[]) {
        super();
        this.x = coords[0];
        this.y = coords[1];
    }

    euclidean(): number[] {
        return [this.x, this.y];
    }

    clone() {
        return new Coord(this.euclidean());
    }
}

/** Transforms `RawCoord`s into `Coord`s and vice versa */
export class Scale {
    /** raw x pixels / transformed y pixels */
    xscale: number = 8
    /** raw x pixels / transforemd y pixels */
    yscale: number = 8

    /** raw x pixel where transformed = 0 */
    xoff: number = 0
    /** raw y pixel where transformed = 0 */
    yoff: number = 0

    constructor(xscale: number, yscale: number, xoff: number, yoff: number) {
        this.xscale = xscale;
        this.yscale = yscale;
        this.xoff = xoff;
        this.yoff = yoff;
    }

    rawToTransformed(raw: RawCoord): Coord {
        return new Coord([
            (raw.xraw - this.xoff) / this.xscale,
            (raw.yraw - this.yoff) / this.yscale,
        ])
    }

    transformedToRaw(coord: Coord): RawCoord {
        return new RawCoord([
            coord.x*this.xscale + this.xoff,
            coord.y*this.yscale + this.yoff,
        ])
    }

    transformedToRawXSize(dx: number) :number {
        return Math.abs(this.xscale * dx);
    }

    transformedToRawYSize(dy: number) :number {
        return Math.abs(this.yscale * dy);
    }
}

export class Scene {
    scale: Scale
    bodies: Body[] = []

    constructor(scale: Scale) {
        this.scale = scale;
    }

    add(body: Body) {
        this.bodies.push(body);
    }

    remove(body: Body) {
        let idx = this.bodies.indexOf(body);
        if (idx != -1) {
            this.bodies.splice(idx, 1);
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.clearRect(0, 0, 750, 750);
        for (let body of this.bodies) {
            body.draw(ctx, this.scale);
        }
    }
}
