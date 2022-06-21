import {Axes, Car, Coord, Curve, Derivative, Polynomial, Scale, Scene, Func1D, Door, Office} from './scene';

interface Level {
    curve1d: boolean,
    deriv1d: boolean,
    main: 'deriv1d' | 'curve1d',
    door: Coord,
    car: Coord,
    offices?: [Coord, string][]
}

function getFunc1D() : Func1D {
    let func = new Polynomial(0.1, [0]);
    document.getElementById("a").addEventListener("input", function() {
        func.a = Number((this as HTMLInputElement).value);
    });
    document.getElementById("x").addEventListener("input", function() {
        func.roots = (this as HTMLInputElement).value.split(",").map(x => x.trim()).map(Number);
    });
    func.a = Number((document.getElementById('a') as HTMLInputElement).value);
    func.roots = (document.getElementById('x') as HTMLInputElement).value.split(",").map(x => x.trim()).map(Number);
    return func
}

function disableInput(disabled: boolean) {
    if (document.getElementById("a") != null) {
        (document.getElementById("a") as HTMLInputElement).disabled = disabled;
    }
    if (document.getElementById("x") != null) {
        (document.getElementById("x") as HTMLInputElement).disabled = disabled;
    }
}

function showWin() {
    document.getElementById("win").style.display = "block";
}

function run(level: Level, num: number) {
    let axes = new Axes(
        [0, 20],
        [-10, 10]
    );
    let func1D = getFunc1D();

    let playing = false;

    let curveCtx: CanvasRenderingContext2D | null = null;
    let curveScene: Scene | null = null;
    let curve: Curve | null = null;
    if (level.curve1d) {
        curveCtx = (document.getElementById("canvas-curve1d") as HTMLCanvasElement).getContext("2d");
        curveScene = new Scene(new Scale(24, -24, 25, 250));
        curve = new Curve(func1D, [0, 20]);
        curveScene.add(axes);
    }

    let derivCtx: CanvasRenderingContext2D | null = null;
    let derivScene: Scene | null = null;
    let deriv: Curve | null = null;
    if (level.deriv1d) {
        derivCtx = (document.getElementById("canvas-deriv1d") as HTMLCanvasElement).getContext("2d");
        derivScene = new Scene(new Scale(24, -24, 25, 250));
        deriv = new Curve(new Derivative(func1D), [0, 20]);
        derivScene.add(axes);
    }

    let mainScene = level.main == "curve1d" ? curveScene :
                level.main == "deriv1d" ? derivScene :
                null;
    let mainCurve = level.main == "curve1d" ? curve :
                level.main == "deriv1d" ? deriv :
                null;
    if (mainScene == null) {
        throw new Error("invalid main scene: "+  level.main);
    }
    let car = new Car(level.car.clone(), mainCurve);
    let door = new Door(level.door.clone());
    mainScene.add(door);
    mainScene.add(car);

    let offices: Office[] = [];
    if (level.offices) {
        for (let office of level.offices) {
            let  o =new Office(office[0].clone(), office[1]);
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

        for (let office of offices) {
            if (car.collidesOffice(office)) {
                office.reached = true;
            }
        }
        if (car.collides(door)) {
            if (!offices.some(x => !x.reached)) {
                playing = false;
                disableInput(true);
                showWin();    
                localStorage.setItem('s' + num, func1D.toString());
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

    document.getElementById("play").addEventListener("click", function() {
        for (let office of offices) {
            office.reached = false;
        }
        mainScene.remove(car);
        car = new Car(level.car.clone(), mainCurve);
        mainScene.add(car);

        playing = true;
        disableInput(true);
    });

    document.getElementById("stop").addEventListener("click", function() {
        if (!playing) {
            for (let office of offices) {
                office.reached = false;
            }
            mainScene.remove(car);
            car = new Car(level.car.clone(), mainCurve);
            mainScene.add(car);
        }

        playing = false;
        disableInput(false);        
    })
}


let levels: (Level| null)[] = [
    null,
    {
        curve1d: true,
        deriv1d: false,
        main: 'curve1d',

        car: new Coord([1, 5]),
        door: new Coord([18, 0]),
    },
    {
        curve1d: true,
        deriv1d: true,
        main: 'deriv1d',

        car: new Coord([1, 5]),
        door: new Coord([18, 0]),
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

let idx = location.href.indexOf("level1") != -1 ? 1 :
        location.href.indexOf("level2") != -1 ? 2 :
        location.href.indexOf("level3") != -1 ? 3 :
        location.href.indexOf("level4") != -1 ? 4 : 0;
run(levels[idx], idx);
