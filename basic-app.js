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
}

// ----------- Universe Simulation ----------
class Universe {
    static G = 1e-9; // Gravity constant

    constructor() {
        this.bodies = [];
    }

    addBody(body) {
        this.bodies.push(body);
    }

    computeForces() {
        const G = Universe.G;
        for (let i = 0; i < this.bodies.length; i++) {
            this.bodies[i].resetAcceleration();
            for (let j = 0; j < this.bodies.length; j++) {
                if (i === j) continue;

                const diff = new Vector(
                    this.bodies[j].position.x - this.bodies[i].position.x,
                    this.bodies[j].position.y - this.bodies[i].position.y
                );

                const accel = new Vector(diff.x, diff.y);
                accel.scale(G * this.bodies[j].mass);
                this.bodies[i].applyAcceleration(accel);
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
    constructor(canvasId, timeSliderId, sizeSliderId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d");

        this.timeSlider = document.getElementById(timeSliderId);
        this.sizeSlider = document.getElementById(sizeSliderId);

        this.universe = new Universe();
        this.dt = parseFloat(this.timeSlider.value || 1);
        this.clickRadius = parseFloat(this.sizeSlider.value || 5);

        this.mouseSpeed = new Vector(0, 0);
        this.mouseDown = false;
        this.mouseX = 0;
        this.mouseY = 0;

        this.init();
    }

    init() {
        this.bindEvents();

        // Initial body
        const centerBody = new Body(25, new Vector(400, 400), new Vector(0, 0), "black");
        this.universe.addBody(centerBody);

        this.animate();
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
    new SimulationApp("myCanvas", "timeSlider", "sizeSlider");
};
