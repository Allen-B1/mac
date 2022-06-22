import {Axes, Car, Coord, Curve, Derivative, Polynomial, Scale, Scene, Func1D, Door, Office, ColorPlot, Func2DExpr, Func2D} from './scene';

interface Level {
    curve1d: boolean,
    deriv1d: boolean,
    color2d: boolean,
    main: 'deriv1d' | 'curve1d' | 'color2d',
    door: Coord,
    car: Coord,
    offices?: [Coord, string][]
}

function getFunc1D() : Func1D| null {
    if (document.getElementById("a") == null) 
        return null;

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

function getFunc2D() : Func2D | null {
    let elem = document.getElementById("formula") as HTMLInputElement;
    if (elem == null) return null;
    let func = new Func2DExpr(elem.value);
    elem.addEventListener("input", function() {
        if (!func.recompile(this.value)) {
            this.classList.add("invalid");
        } else {
            this.classList.remove("invalid");
        }
    })

    return func;
}

function disableInput(disabled: boolean) {
    if (document.getElementById("a") != null) {
        (document.getElementById("a") as HTMLInputElement).disabled = disabled;
    }
    if (document.getElementById("x") != null) {
        (document.getElementById("x") as HTMLInputElement).disabled = disabled;
    }
    if (document.getElementById('formula') != null) {
        (document.getElementById('formula') as HTMLInputElement).disabled = disabled;
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
    let func2D = getFunc2D();

    let playing = false;
    let startTime = -1;

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

    let colorCtx: CanvasRenderingContext2D | null = null;
    let colorScene: Scene | null = null;
    let colorPlot: ColorPlot | null = null;
    if (level.color2d) {
        colorCtx = (document.getElementById("canvas-color2d") as HTMLCanvasElement).getContext("2d");
        colorScene = new Scene(new Scale(24, -24, 250, 250));
        colorPlot = new ColorPlot(func2D, [-10, 10], [-10, 10]);
        colorScene.add(colorPlot);
        colorScene.add(new Axes(
            [-10, 10],
            [-10, 10]
        ));
    }

    let mainScene = level.main == "curve1d" ? curveScene :
                level.main == "deriv1d" ? derivScene :
                level.main == "color2d" ? colorScene :
                null;
    let mainCurve = level.main == "curve1d" ? curve :
                level.main == "deriv1d" ? deriv :
                null;
    if (mainScene == null) {
        throw new Error("invalid main scene: "+  level.main);
    }

    let car = new Car(level.car.clone());
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
        if (playing) {
            if (mainCurve != null) {
                car.step1d(mainCurve);
            } else {
                car.step2d(colorPlot);
            }
        }

        for (let office of offices) {
            if (car.collidesOffice(office)) {
                office.reached = true;
            }
        }
        if (car.collides(door)) {
            if (!offices.some(x => !x.reached) && playing) {
                playing = false;
                disableInput(true);
                showWin();    

                // save record
                let time = Date.now() - startTime;
                let s = mainCurve != null ? func1D.toString() : func2D.toString();
                if (localStorage.getItem('s' + num) == null) {
                    localStorage.setItem('s' + num, s);
                    localStorage.setItem('t' + num, time.toString());
                } else {
                    let formulas = localStorage.getItem('s' + num).split("||");
                    let times = localStorage.getItem('t' + num).split("||").map(Number);
                    let idx = formulas.indexOf(s);
                    if (idx != -1) {
                        formulas.splice(idx, 1);
                        times.splice(idx, 1);
                    }
                    formulas.push(s);
                    times.push(time);

                    localStorage.setItem('s' + num, formulas.join("||"));
                    localStorage.setItem('t' + num, times.map(String).join("||"));
                }
            }
        }

        if (mainCurve && car.coord.y < -12) {
            playing = false;
            disableInput(false);
        }

        if (curveScene != null)
            curveScene.draw(curveCtx);
        if (derivScene != null)
            derivScene.draw(derivCtx);
        if (colorScene != null)
            colorScene.draw(colorCtx);

        window.requestAnimationFrame(update);
    });

    document.getElementById("play").addEventListener("click", function() {
        for (let office of offices) {
            office.reached = false;
        }
        mainScene.remove(car);
        car = new Car(level.car.clone());
        mainScene.add(car);

        playing = true;
        startTime = Date.now();
        disableInput(true);
    });

    document.getElementById("stop").addEventListener("click", function() {
        if (!playing) {
            for (let office of offices) {
                office.reached = false;
            }
            mainScene.remove(car);
            car = new Car(level.car.clone());
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
        color2d: false,
        main: 'curve1d',

        car: new Coord([1, 5]),
        door: new Coord([18, 0]),
    },
    {
        curve1d: true,
        deriv1d: true,
        color2d: false,
        main: 'deriv1d',

        car: new Coord([1, 5]),
        door: new Coord([18, 0]),
    },
    {
        curve1d: true,
        deriv1d: false,
        color2d: false,
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
        color2d: false,
        main: 'deriv1d',

        car: new Coord([1, 5]),
        door: new Coord([18, 0]),

        offices: [
            [new Coord([5, -5]), "H103"],
            [new Coord([15, 2]), "H215"],
        ]
    },

    // 5
    {
        curve1d: false,
        deriv1d: false,
        color2d: true,
        main: 'color2d',

        car: new Coord([-5, -5]),
        door: new Coord([0, 0]),
    },
    {
        curve1d: false,
        deriv1d: false,
        color2d: true,
        main: 'color2d',

        car: new Coord([-5, -5]),
        door: new Coord([0, 0]),

        offices: [
            [new Coord([5, -3.5]), "H206"]
        ]
    },
    {
        curve1d: false,
        deriv1d: false,
        color2d: true,
        main: 'color2d',

        car: new Coord([-5, -5]),
        door: new Coord([0, 0]),

        offices: [
            [new Coord([-3, -3]), "H106"],
            [new Coord([1, 6]), "M101"],
            [new Coord([8, -7]), "H204"],
        ]
    }
];

let idx = location.href.indexOf("level1") != -1 ? 1 :
        location.href.indexOf("level2") != -1 ? 2 :
        location.href.indexOf("level3") != -1 ? 3 :
        location.href.indexOf("level4") != -1 ? 4 :
        location.href.indexOf("level5") != -1 ? 5 :
        location.href.indexOf("level6") != -1 ? 6 :
        location.href.indexOf("level7") != -1 ? 7 :
        0;
run(levels[idx], idx);
