import { Vector }       from "./utils.js";

import { Body }         from "./physics.js";
import { Universe }     from "./physics.js";
import { Controller }   from "./physics.js";

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
        this.scale = Math.max(this.scale, 0.001);
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
        this.dt = parseFloat(1);
        this.clickRadius = parseFloat(this.sizeSlider.value || 5);
        this.contact = true;

        this.mouseWorldSpeed = new Vector(0, 0);
        this.mouseWorld = new Vector(0, 0);
        this.mouseDown = false;

        this.controller;
        this.keysDown = new Set();
        this.followController = true;

        this.init();
    }

    init() {
        this.bindEvents();

        // const mainBody = new Body(5, new Vector(400, 400), new Vector(0, 0), "black");
        // this.universe.addBody(mainBody);
        // this.controller = new Controller(mainBody);
        // for (let i = 1; i < 100; i++) {
        //     let size = Math.floor(Math.random()*4)+1;
        //     let pos = new Vector(400+this.getRand()*(1000), 400+this.getRand()*(1000));
        //     let vel = new Vector(this.getRand()*0.2, this.getRand()*0.2);
        //     let body = new Body(size, pos, vel, "black");
        //     this.universe.addBody(body);
        // }

        //this.universe.init();

        this.controller = new Controller(this.universe.bodies.get(10));

        this.animate();
    }

    bindEvents() {
        this.canvas.addEventListener("click", this.handleClick.bind(this));
        this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this));
        this.canvas.addEventListener("wheel", this.handleMouseWheel.bind(this));
        this.canvas.addEventListener("mousedown", () => this.mouseDown = true);
        this.canvas.addEventListener("mouseup", () => this.mouseDown = false);

        this.timeSlider.addEventListener("input", () => {
            const sliderValue = parseFloat(this.timeSlider.value);
            this.dt = Math.pow(1.5, sliderValue - 10);
        });

        this.sizeSlider.addEventListener("input", () => {
            this.clickRadius = parseFloat(this.sizeSlider.value);
        });

        this.contactBox.addEventListener("change", () => {
            this.followController = this.contactBox.checked;
        });

        window.addEventListener("keydown", (e) => {
            this.keysDown.add(e.key);
        });

        window.addEventListener("keyup", (e) => {
            this.keysDown.delete(e.key);
        });
    }

    // -------- Event Handlers --------
    handleClick(event) {
        const velocity = Vector.multiply(this.mouseWorldSpeed, 0.25); // TODO: Zero-out
        const newBody = new Body(this.clickRadius, this.mouseWorld, velocity, "blue");
        if (this.controller) {
            this.controller.attachBody(newBody);
        } else {
            this.controller = new Controller(newBody);
        }
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

    getMouseWorld(event) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = event.clientX - rect.left;
        const screenY = event.clientY - rect.top;
        const world = this.vframe.screenToWorld(screenX, screenY);
        return { x: world.x, y: world.y };
    }

    // -------- Controls --------
    updateController() {
        if (!this.controller) {return};
        const ctrl = this.controller;

        if (this.keysDown.has("ArrowUp") || this.keysDown.has("w")) ctrl.moveUp();
        if (this.keysDown.has("ArrowDown") || this.keysDown.has("s")) ctrl.moveDown();
        if (this.keysDown.has("ArrowLeft") || this.keysDown.has("a")) ctrl.moveLeft();
        if (this.keysDown.has("ArrowRight") || this.keysDown.has("d")) ctrl.moveRight();

        ctrl.activeThrusters = {
            up: this.keysDown.has("ArrowUp") || this.keysDown.has("w"),
            down: this.keysDown.has("ArrowDown") || this.keysDown.has("s"),
            left: this.keysDown.has("ArrowLeft") || this.keysDown.has("a"),
            right: this.keysDown.has("ArrowRight") || this.keysDown.has("d")
        };
    }

    // -------- Camera / View --------
    updateCamera() {
        if (this.followController && this.controller?.body) {
            const bodyPos = this.controller.body.position;
            const canvasCenter = new Vector(this.canvas.width / 2, this.canvas.height / 2);
            this.vframe.origin = Vector.subtract(canvasCenter, Vector.multiply(bodyPos, this.vframe.scale));
        }
    }

    drawPreviewCircle() {
        this.ctx.beginPath();
        this.ctx.arc(this.mouseWorld.x, this.mouseWorld.y, this.clickRadius, 0, 2 * Math.PI);
        this.ctx.fillStyle = "blue";
        this.ctx.fill();
    }

    // drawHUD() {
    //     if (!this.controller?.body) return;

    //     const radius = this.controller.body.radius.toFixed(2);

    //     this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    //     this.ctx.font = "16px Arial";
    //     this.ctx.fillStyle = "black";
    //     this.ctx.textAlign = "right";
    //     this.ctx.fillText(`Size: ${radius}`, this.canvas.width - 10, 20);
    // }

    drawHUD() {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.font = "16px Arial";
        this.ctx.fillStyle = "black";
        this.ctx.textAlign = "right";

        // Print size
        if (this.controller?.body) {
            const radius = this.controller.body.radius.toFixed(2);
            this.ctx.fillText(`Size: ${radius}`, this.canvas.width - 10, 20)
        };

        // Track center mass
        let tracked_body = this.universe.getMassive();
        const bodyScreenPos = this.vframe.worldToScreen(
            tracked_body.position.x,
            tracked_body.position.y
        );

        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;

        // If body is off-screen
        const isOffscreen =
            bodyScreenPos.x < 0 || bodyScreenPos.x > canvasWidth ||
            bodyScreenPos.y < 0 || bodyScreenPos.y > canvasHeight;

        if (isOffscreen) {
            const center = new Vector(canvasWidth / 2, canvasHeight / 2);
            const dir = Vector.subtract(bodyScreenPos, center).normalize();

            // Find intersection with canvas edge
            const margin = 10;
            const edgePoint = this.getEdgeIntersection(center, dir, canvasWidth, canvasHeight, margin);

            // Draw arrow toward body
            const arrowTip = edgePoint;
            const arrowTail = Vector.subtract(arrowTip, Vector.multiply(dir, 20)); // 20px long

            this.drawArrow(arrowTail, arrowTip);
        }

    }

    getEdgeIntersection(center, dir, width, height, margin = 10) {
        const edges = {
            left: margin,
            right: width - margin,
            top: margin,
            bottom: height - margin,
        };

        let tMin = Infinity;
        let intersection = null;

        // Check each canvas boundary
        // Vertical edges
        if (dir.x !== 0) {
            for (let xEdge of [edges.left, edges.right]) {
                const t = (xEdge - center.x) / dir.x;
                if (t > 0) {
                    const y = center.y + t * dir.y;
                    if (y >= edges.top && y <= edges.bottom && t < tMin) {
                        tMin = t;
                        intersection = new Vector(xEdge, y);
                    }
                }
            }
        }

        // Horizontal edges
        if (dir.y !== 0) {
            for (let yEdge of [edges.top, edges.bottom]) {
                const t = (yEdge - center.y) / dir.y;
                if (t > 0) {
                    const x = center.x + t * dir.x;
                    if (x >= edges.left && x <= edges.right && t < tMin) {
                        tMin = t;
                        intersection = new Vector(x, yEdge);
                    }
                }
            }
        }

        return intersection ?? center;
    }

    drawArrow(from, to, color = "black") {
        const ctx = this.ctx;
        const headLength = 10;

        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const angle = Math.atan2(dy, dx);

        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Arrowhead
        ctx.beginPath();
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(to.x - headLength * Math.cos(angle - Math.PI / 6),
                    to.y - headLength * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(to.x - headLength * Math.cos(angle + Math.PI / 6),
                    to.y - headLength * Math.sin(angle + Math.PI / 6));
        ctx.lineTo(to.x, to.y);
        ctx.fillStyle = color;
        ctx.fill();
    }



    // -------- Main Loop --------
    animate() {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.updateController();
        this.updateCamera();
        this.vframe.applyTransform();

        // if (this.controller?.body) {
        //     const center = this.controller.body.position;
        //     const size = this.controller.body.radius;
        //     const scaleFactor = (size / 5) ** (2 / 3);
        //     this.universe.updateWorld(center, size, 1500 * scaleFactor, 10000 * scaleFactor, 1500 * scaleFactor);
        // }

        this.universe.step(this.dt);
        this.universe.computeContact(this.contact);
        this.universe.draw(this.ctx);

        if (this.mouseDown) this.drawPreviewCircle();
        this.drawHUD();

        requestAnimationFrame(() => this.animate());
    }
}


// ----------- Initialize App ----------
window.onload = () => {
    new SimulationApp("myCanvas", "timeSlider", "sizeSlider", "contactBox");
};
