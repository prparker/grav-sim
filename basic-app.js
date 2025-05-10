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

    mag() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }

    multiply(scalar) {
        return new Vector(this.x * scalar, this.y * scalar);
    }

    scale(scalar) {
        this.x *= scalar;
        this.y *= scalar;
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
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    update(dt) {
        const deltaV = this.acceleration.multiply(dt);
        this.velocity.add(deltaV);

        const deltaX = this.velocity.multiply(dt);
        this.position.add(deltaX);
    }

    resetAcceleration() {
        this.acceleration = new Vector(0, 0);
    }

    applyAcceleration(accel) {
        this.acceleration.add(accel);
    }

    static combine(bodyA, bodyB) {
        const totalMass = bodyA.mass + bodyB.mass;

        // Mass-weighted position and velocity
        const newPos = new Vector(
            (bodyA.position.x * bodyA.mass + bodyB.position.x * bodyB.mass) / totalMass,
            (bodyA.position.y * bodyA.mass + bodyB.position.y * bodyB.mass) / totalMass
        );

        const newVel = new Vector(
            (bodyA.velocity.x * bodyA.mass + bodyB.velocity.x * bodyB.mass) / totalMass,
            (bodyA.velocity.y * bodyA.mass + bodyB.velocity.y * bodyB.mass) / totalMass
        );

        const newRadius = ((3 * totalMass) / Math.PI) ** (1 / 3);
        const newColor = bodyA.color; // Arbitrary or blend it

        return new Body(newRadius, newPos, newVel, newColor);
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
        const bodyID = this.#numBodies;
        this.bodies.set(bodyID, body);
    }

    rmBody(bodyID) {
        this.bodies.delete(bodyID);
    }

    computeForces() {
        const G = Universe.G;
    
        // Reset acceleration for all bodies
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

                const accelOnA = new Vector(diff.x, diff.y);
                accelOnA.scale(G * bodyB.mass / (diff.mag()**3));
                bodyA.applyAcceleration(accelOnA);

                const accelOnB = new Vector(-diff.x, -diff.y);
                accelOnB.scale(G * bodyA.mass / (diff.mag()**3));
                bodyB.applyAcceleration(accelOnB);

            }
        }
    }

    computeContact(contact) {
        if (contact) {
            outer:
            for (const [idA, bodyA] of this.bodies.entries()) {
                for (const [idB, bodyB] of this.bodies.entries()) {
                    if (idA === idB) continue; // Skip self
        
                    const diff = new Vector(
                        bodyB.position.x - bodyA.position.x,
                        bodyB.position.y - bodyA.position.y
                    );
        
                    if (diff.mag() <= (bodyA.radius + bodyB.radius*(4/7))) {
                        const newBody = Body.combine(bodyA, bodyB);
                        this.addBody(newBody);
                        this.rmBody(idA);
                        this.rmBody(idB);
                        continue outer;
                    }
                }
            }
        }
    }

    step(dt) {
        this.computeForces();
        this.bodies.forEach(body => body.update(dt));
    }

    draw(ctx) {
        this.bodies.forEach(body => body.draw(ctx));
    }
}

// ----------- Main Simulation App ----------
class SimulationApp {
    constructor(canvasId, timeSliderId, sizeSliderId, contactBoxId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d");

        this.timeSlider = document.getElementById(timeSliderId);
        this.sizeSlider = document.getElementById(sizeSliderId);
        this.contactBox = document.getElementById(contactBoxId);

        this.universe = new Universe();
        this.dt = parseFloat(this.timeSlider.value || 1);
        this.clickRadius = parseFloat(this.sizeSlider.value || 5);
        this.contact = true;

        this.mouseSpeed = new Vector(0, 0);
        this.mouseDown = false;
        this.mouseX = 0;
        this.mouseY = 0;

        this.init();
    }

    init() {
        this.bindEvents();

        // Initial body
        // const centerBody = new Body(25, new Vector(400, 400), new Vector(0, 0), "black");
        // this.universe.addBody(centerBody);

        for (let i = 1; i < 500; i++) {
            let size = Math.floor(Math.random()*3)+1;
            let pos = new Vector(400+this.getRand()*(800), 400+this.getRand()*(800));
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
        this.canvas.addEventListener("mousedown", () => this.mouseDown = true);
        this.canvas.addEventListener("mouseup", () => this.mouseDown = false);

        this.timeSlider.addEventListener("input", () => {
            this.dt = parseFloat(this.timeSlider.value);
        });

        this.sizeSlider.addEventListener("input", () => {
            this.clickRadius = parseFloat(this.sizeSlider.value);
        });

        this.contactBox.addEventListener("change", () => {
            this.contact = this.contactBox.checked
        })
    }

    handleClick(event) {
        const { x, y } = this.getMousePos(event);
        const pos = new Vector(x, y);
        const vel = this.mouseSpeed.multiply(0.25);

        const newBody = new Body(this.clickRadius, pos, vel, "blue");
        this.universe.addBody(newBody);
    }

    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = event.clientX - rect.left;
        this.mouseY = event.clientY - rect.top;

        this.mouseSpeed = new Vector(event.movementX, event.movementY);
        if (this.mouseSpeed.mag() <= 1.414) {
            this.mouseSpeed.scale(0);
        }
    }

    getMousePos(event) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.universe.step(this.dt);
        this.universe.computeContact(this.contact);
        this.universe.draw(this.ctx);

        if (this.mouseDown) {
            this.drawPreviewCircle();
        }

        requestAnimationFrame(() => this.animate());
    }

    drawPreviewCircle() {
        this.ctx.beginPath();
        this.ctx.arc(this.mouseX, this.mouseY, this.clickRadius, 0, 2 * Math.PI);
        this.ctx.fillStyle = "blue";
        this.ctx.fill();
    }
}

// ----------- Initialize App ----------
window.onload = () => {
    new SimulationApp("myCanvas", "timeSlider", "sizeSlider", "contactBox");
};
