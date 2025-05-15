// ----------- Utility Classes ----------
class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(other) {
        this.x += other.x;
        this.y += other.y;
    }

    sub(other) {
        this.x -= other.x;
        this.y -= other.y;
    }

    mult(scalar) {
        this.x *= scalar;
        this.y *= scalar;
    }

    div(scalar) {
        this.x /= scalar;
        this.y /= scalar;
    }

    mag() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }

    static addition(v1, v2) {
        return new Vector(v1.x + v2.x, v1.y + v2.y);
    }

    static subtract(v1, v2) {
        return new Vector(v1.x - v2.x, v1.y - v2.y);
    }

    static multiply(vec, scalar) {
        return new Vector(vec.x * scalar, vec.y * scalar);
    }

    static divide(vec, scalar) {
        return new Vector(vec.x / scalar, vec.y / scalar);
    }

    static vecMult(v1, v2) {
        return new Vector(v1.x * v2.x, v1.y * v2.y); 
    }

    static rotateVector(vec, angleRad) {
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    return new Vector(
        vec.x * cos - vec.y * sin,
        vec.x * sin + vec.y * cos
    );
}

}

// ----------- Physics Body Class ----------
class Body {
    constructor(radius, position, velocity, color = "black") {
        this.radius = radius;
        this.position = position;
        this.velocity = velocity;
        this.acceleration = new Vector(0, 0);
        this.color = color;
        this.mass = (1 / 3) * Math.PI * radius ** 3;
        this.controller;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI);
        ctx.fillStyle = this.color;
        ctx.fill();

        if (this.controller) {
            this.controller.draw(ctx);
        }
    }

    update(dt) {
        const deltaV = Vector.multiply(this.acceleration, dt);
        this.velocity.add(deltaV);

        const deltaX = Vector.multiply(this.velocity, dt);
        this.position.add(deltaX);
    }

    resetAcceleration() {
        this.acceleration = new Vector(0, 0);
    }

    applyAcceleration(accel) {
        this.acceleration.add(accel);
    }

    attachController(ctrl) {
        this.controller = ctrl;
        this.controller.body = this;
        this.color = this.controller.color;
    }

    static combine(bodyA, bodyB) {
        const totalMass = bodyA.mass + bodyB.mass;

        const newPos = new Vector(
            (bodyA.position.x * bodyA.mass + bodyB.position.x * bodyB.mass) / totalMass,
            (bodyA.position.y * bodyA.mass + bodyB.position.y * bodyB.mass) / totalMass
        );

        const newVel = new Vector(
            (bodyA.velocity.x * bodyA.mass + bodyB.velocity.x * bodyB.mass) / totalMass,
            (bodyA.velocity.y * bodyA.mass + bodyB.velocity.y * bodyB.mass) / totalMass
        );

        const newRadius = ((3 * totalMass) / Math.PI) ** (1 / 3);
        return new Body(newRadius, newPos, newVel, bodyA.color);
    }
}

class Controller {
    constructor(body) {
        this.body = body;
        body.controller = this;

        this.color = "green";
        this.body.color = this.color;

        this.direction = new Vector(1, 0);
        this.delacc = 0.1;

        this.activeThrusters
    }

    moveUp() {
        this.body.applyAcceleration(new Vector(0, -this.delacc));
    }

    moveDown() {
        this.body.applyAcceleration(new Vector(0, this.delacc));
    }

    moveLeft() {
        this.body.applyAcceleration(new Vector(-this.delacc, 0));
    }

    moveRight() {
        this.body.applyAcceleration(new Vector(this.delacc, 0));
    }

    draw(ctx) {
        const pos = this.body.position;
        const r = this.body.radius;
        const flameLength = r * 0.6;
        const flameColor = "orange";

        ctx.strokeStyle = flameColor;
        ctx.lineWidth = 2;

        if (this.activeThrusters?.up) {
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y + r);
            ctx.lineTo(pos.x, pos.y + r + flameLength);
            ctx.stroke();
        }
        if (this.activeThrusters?.down) {
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y - r);
            ctx.lineTo(pos.x, pos.y - r - flameLength);
            ctx.stroke();
        }
        if (this.activeThrusters?.left) {
            ctx.beginPath();
            ctx.moveTo(pos.x + r, pos.y);
            ctx.lineTo(pos.x + r + flameLength, pos.y);
            ctx.stroke();
        }
        if (this.activeThrusters?.right) {
            ctx.beginPath();
            ctx.moveTo(pos.x - r, pos.y);
            ctx.lineTo(pos.x - r - flameLength, pos.y);
            ctx.stroke();
        }
    }



}

// ----------- Universe Simulation ----------
class Universe {
    static G = 0.1; // Gravity constant
    #numBodies = 0;

    constructor() {
        this.bodies = new Map();
    }

    addBody(body) {
        this.#numBodies++;
        this.bodies.set(this.#numBodies, body);
    }

    rmBody(bodyID) {
        this.bodies.delete(bodyID);
    }

    computeForces() {
        const G = Universe.G;
        for (const body of this.bodies.values()) {
            body.resetAcceleration();
        }

        const entries = Array.from(this.bodies.entries());
        for (let i = 0; i < entries.length; i++) {
            const [idA, bodyA] = entries[i];
            for (let j = i + 1; j < entries.length; j++) {
                const [idB, bodyB] = entries[j];

                const diff = new Vector(
                    bodyB.position.x - bodyA.position.x,
                    bodyB.position.y - bodyA.position.y
                );

                //if (diff.mag() > 500) continue;

                const r3 = Math.pow(diff.mag(), 3);
                if (r3 === 0) continue;

                const accelOnA = new Vector(diff.x, diff.y);
                accelOnA.mult(G * bodyB.mass / r3);
                bodyA.applyAcceleration(accelOnA);

                const accelOnB = new Vector(-diff.x, -diff.y);
                accelOnB.mult(G * bodyA.mass / r3);
                bodyB.applyAcceleration(accelOnB);
            }
        }
    }

    computeContact(contact) {
        if (!contact) return;
        outer: for (const [idA, bodyA] of this.bodies.entries()) {
            for (const [idB, bodyB] of this.bodies.entries()) {
                if (idA === idB) continue;
                const diff = new Vector(
                    bodyB.position.x - bodyA.position.x,
                    bodyB.position.y - bodyA.position.y
                );

                //if (diff.mag() > 100) continue;

                if (diff.mag() <= (bodyA.radius + bodyB.radius * (4 / 7))) {
                    const newBody = Body.combine(bodyA, bodyB);
                    if (bodyA.controller){
                        newBody.attachController(bodyA.controller);
                    } else if (bodyB.controller){
                        newBody.attachController(bodyB.controller);
                    }
                    this.addBody(newBody);
                    this.rmBody(idA);
                    this.rmBody(idB);
                    continue outer;
                }
            }
        }
    }

    step(dt) {
        this.bodies.forEach(body => body.update(dt));
        this.computeForces();
    }

    draw(ctx) {
        this.bodies.forEach(body => body.draw(ctx));
    }
}

// ----------- View Frame ----------
class ViewFrame {
    constructor(ctx) {
        this.ctx = ctx;
        this.scale = 1;
        this.origin = new Vector(0, 0);
    }

    delScale(delta, centerX, centerY) {
        const worldCenterBefore = this.screenToWorld(centerX, centerY);
        this.scale *= Math.exp(-delta * 0.001);
        this.scale = Math.max(this.scale, 0.01);
        const newOffset = Vector.multiply(worldCenterBefore, this.scale);
        this.origin = new Vector(centerX - newOffset.x, centerY - newOffset.y);
    }

    screenToWorld(screenX, screenY) {
        return new Vector(
            (screenX - this.origin.x) / this.scale,
            (screenY - this.origin.y) / this.scale
        );
    }

    worldToScreen(worldX, worldY) {
        return new Vector(
            worldX * this.scale + this.origin.x,
            worldY * this.scale + this.origin.y
        );
    }

    applyTransform() {
        this.ctx.setTransform(this.scale, 0, 0, this.scale, this.origin.x, this.origin.y);
    }
}

// ----------- Main Simulation App ----------
class SimulationApp {
    constructor(canvasId, timeSliderId, sizeSliderId, contactBoxId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d");
        this.vframe = new ViewFrame(this.ctx);

        this.timeSlider = document.getElementById(timeSliderId);
        this.sizeSlider = document.getElementById(sizeSliderId);
        this.contactBox = document.getElementById(contactBoxId);

        this.universe = new Universe();
        this.dt = parseFloat(this.timeSlider.value || 1);
        this.clickRadius = parseFloat(this.sizeSlider.value || 5);
        this.contact = true;

        this.mouseWorldSpeed = new Vector(0, 0);
        this.mouseWorld = new Vector(0, 0);
        this.mouseDown = false;

        this.controller; 
        this.keysDown = new Set();

        this.init();
    }

    init() {
        
        this.bindEvents();
        this.universe.addBody(new Body(5, new Vector(400, 400), new Vector(0, 0), "black"));      
        this.controller = new Controller(this.universe.bodies.get(1));

        for (let i = 1; i < 300; i++) {
            let size = Math.floor(Math.random()*3)+1;
            let pos = new Vector(400+this.getRand()*(600), 400+this.getRand()*(600));
            let vel = new Vector(this.getRand()*0.2, this.getRand()*0.2);

            let body = new Body(size, pos, vel, "black");
            this.universe.addBody(body);
        }

        this.animate();
    }

    getRand() { 
        return (Math.random() - 0.5)*2;
    }

    bindEvents() {
        this.canvas.addEventListener("click", this.handleClick.bind(this));
        this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this));
        this.canvas.addEventListener("wheel", this.handleMouseWheel.bind(this));
        window.addEventListener("keydown", this.updateController.bind(this));
        this.canvas.addEventListener("mousedown", () => this.mouseDown = true);
        this.canvas.addEventListener("mouseup", () => this.mouseDown = false);

        this.timeSlider.addEventListener("input", () => {
            this.dt = parseFloat(this.timeSlider.value);
        });

        this.sizeSlider.addEventListener("input", () => {
            this.clickRadius = parseFloat(this.sizeSlider.value);
        });

        this.contactBox.addEventListener("change", () => {
            this.contact = this.contactBox.checked;
        });

        window.addEventListener("keydown", (e) => {
            this.keysDown.add(e.key);
        });

        window.addEventListener("keyup", (e) => {
            this.keysDown.delete(e.key);
        });

    }

    handleClick(event) {
        const velocity = Vector.multiply(this.mouseWorldSpeed, 0.25); // TODO: Zero out.
        const newBody = new Body(this.clickRadius, this.mouseWorld, velocity, "blue");
        this.universe.addBody(newBody);
    }

    handleMouseMove(event) {
        const { x, y } = this.getMouseWorld(event);
        const mouseWorldNew = new Vector(x, y);
        this.mouseWorldSpeed = Vector.subtract(mouseWorldNew, this.mouseWorld);
        this.mouseWorld = mouseWorldNew;
    }

    handleMouseWheel(event) {
        event.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const centerX = event.clientX - rect.left;
        const centerY = event.clientY - rect.top;
        this.vframe.delScale(event.deltaY, centerX, centerY);
    }

    updateController() {
        const ctrl = this.controller;

        if (this.keysDown.has("ArrowUp")) ctrl.moveUp();
        if (this.keysDown.has("ArrowDown")) ctrl.moveDown();
        if (this.keysDown.has("ArrowLeft")) ctrl.moveLeft();
        if (this.keysDown.has("ArrowRight")) ctrl.moveRight();

        ctrl.activeThrusters = {
            up: this.keysDown.has("ArrowUp"),
            down: this.keysDown.has("ArrowDown"),
            left: this.keysDown.has("ArrowLeft"),
            right: this.keysDown.has("ArrowRight")
        };
    }


    getMouseWorld(event) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = event.clientX - rect.left;
        const screenY = event.clientY - rect.top;
        const world = this.vframe.screenToWorld(screenX, screenY);
        return { x: world.x, y: world.y };
    }

    animate() {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.vframe.applyTransform();

        this.universe.step(this.dt);
        this.universe.computeContact(this.contact);
        this.universe.draw(this.ctx);

        if (this.mouseDown) this.drawPreviewCircle();

        requestAnimationFrame(() => this.animate());
    }

    drawPreviewCircle() {
        this.ctx.beginPath();
        this.ctx.arc(this.mouseWorld.x, this.mouseWorld.y, this.clickRadius, 0, 2 * Math.PI);
        this.ctx.fillStyle = "blue";
        this.ctx.fill();
    }
}

// ----------- Initialize App ----------
window.onload = () => {
    new SimulationApp("myCanvas", "timeSlider", "sizeSlider", "contactBox");
};
