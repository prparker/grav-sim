const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

canvas.addEventListener("click", handleClick)
slider.addEventListener("input", updateTs)
canvas.addEventListener("mousemove", handleMovement)

// -------- Functions ---------
function drawCircle(ctx, x, y, radius, color = "black") {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
}

function handleMovement(event) {
    mouseSpeed = new Vector(event.movementX, event.movementY);
}

function handleClick(event) {
    const rect = canvas.getBoundingClientRect(); // Access the canvas element
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    let radius = 25;
    let pos = new Vector(x, y)
    let vel = new Vector(mouseSpeed.x, mouseSpeed.y); //Vector(Math.random()-0.5, Math.random()-0.5);
    let color = "blue";

    bodies.push(new Body(radius, pos, vel, color));
}

// --------- Classes ---------
class Vector {
    constructor(x,y) {
        this.x = x;
        this.y = y;
    }
    
    add(other){
        //return new Vector(this.x + other.x, this.y + other.y);
        this.x += other.x;
        this.y += other.y;
    }

    sub(other){
        //return new Vector(this.x + other.x, this.y + other.y);
        this.x -= other.x;
        this.y -= other.y;
    }

    mag() {
        return Math.sqrt(this.x**2 + this.y**2);
    }

    multiply(scalar){
        return new Vector(this.x*scalar, this.y*scalar);
    }

    scale(scalar){
        this.x *= scalar;
        this.y *= scalar;
    }
}

class Body {
    constructor(radius, pos, vel, color) {
        this.pos = pos;
        this.vel = vel;
        this.acc = new Vector(0,0);
        this.radius = radius;
        this.color = color;
        this.mass = 1/3*Math.PI*radius**3;
    }

    draw() {
        drawCircle(ctx, this.pos.x, this.pos.y, this.radius, this.color)
    }

    step() {
        let dv = this.acc.multiply(dt);
        this.vel.add(dv);

        let dx = this.vel.multiply(dt);
        this.pos.add(dx);
    }
}

class Universe {
    constructor(){
        bodies = []
    }

    addBody(body) {
        bodies.push(body);
    }

    step() {
        for (let i = 0; i < bodies.length; i++) {
            bodies[i].step(); // Pos & Vel, Euler Method
        }

        for (let i = 0; i < bodies.length; i++) {
            bodies[i].acc = new Vector(0,0);
            for (let j = 0; j < bodies.length; j++) { 
                if (i != j) {
                    let daccel = new Vector(0,0);
                    let dpos = new Vector(0,0);

                    dpos.add(bodies[j].pos)
                    dpos.sub(bodies[i].pos)

                    daccel.add(dpos)
                    daccel.scale(G*bodies[j].mass)

                    bodies[i].acc.add(daccel)
                }
            }
        }
    }

    draw() {
        for (let i = 0; i < bodies.length; i++) {
            bodies[i].draw()
        }
    }

}

// -------- App Logic --------
function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

    universe.step()
    universe.draw()

    requestAnimationFrame(update)
}

function updateTs() {
    dt = slider.value;
}

let mouseSpeed = new Vector(0,0);


let dt = 1;
let G = 0.000000001;
let bodies = [];
let universe = new Universe();

body1 = new Body(50, new Vector(500, 400), new Vector(0, -1), "black");
body2 = new Body(50, new Vector(300, 400), new Vector(0, 1), "black");

universe.addBody(body1);
universe.addBody(body2);

update()
