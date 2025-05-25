import { Vector, getRand }       from "./utils.js";

// ----------- Physics Body Class ----------
export class Body {
    constructor(radius, position, velocity, color = "black") {
        this.radius = radius;
        this.position = position;
        this.velocity = velocity;
        this.acceleration = new Vector(0, 0);
        this.color = color;
        this.mass = (1 / 3) * Math.PI * radius ** 3;
        this.controller = null;
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
        if (this.controller) {
            this.controller = null;
            this.color = "black";
        }
        if (ctrl) { ctrl.attachBody(this) }
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

        const color = bodyA.mass > bodyB.mass ? bodyA.color : bodyB.color;

        let newBody = new Body(newRadius, newPos, newVel, color);

        Controller.combine(bodyA, bodyB, newBody);

        return newBody; 
    }

    static radius2mass(radius) {
        return (1 / 3) * Math.PI * radius ** 3;
    }

    static mass2radius (mass) {
        return 3 / Math.PI * mass ** (1/3);
    }
}

// ----------- Controller Class ----------
export class Controller {
    constructor(body) {
        this.body = body;
        this.body.controller = this;

        this.color = "green";
        this.body.color = this.color;

        this.direction = new Vector(1, 0);
        this.delacc = 0.05;

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

    attachBody(bodyIn) {
        if (this.body) {
            this.body.controller = null;
            this.body.color = "black";
        }
        this.body = bodyIn;
        this.body.controller = this;
        this.body.color = this.color;

        this.delacc = 0.075///this.body.radius;//*(this.body.radius/5);
    }

    static combine(bodyA, bodyB, newBody) {
        if (bodyA.mass > bodyB.mass) {
            newBody.attachController(bodyA.controller);
        } else {
            newBody.attachController(bodyB.controller)
        }
    }

}

// ----------- Universe Simulation ----------
export class Universe {
    static G = 0.1; // Gravity constant
    #numBodies = 0;
    #mostMassive = new Body(0, new Vector(0,0), new Vector(0,0)); 

    constructor() {
        this.bodies = new Map();
        this.init();
    }

    getMassive() {
        return this.#mostMassive;
    }

    addBody(body) {
        this.#numBodies++;
        this.bodies.set(this.#numBodies, body);
        if (body.mass > this.#mostMassive.mass) {
            this.#mostMassive = this.bodies.get(this.#numBodies);
        }
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

                // if (idA != 1) {
                //     if (diff.mag() > 10000) continue;
                // }

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

                // if (diff.mag() > 50) continue;

                if (diff.mag() <= (bodyA.radius + bodyB.radius * (4 / 7))) {
                    const newBody = Body.combine(bodyA, bodyB);
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

    updateWorld(center, size, loadRadius, unloadRadius, loadBuffer = 1000, maxBodies = 300) {
        // Unload bodies that are too far away
        for (const [id, body] of this.bodies.entries()) {
            const dist = Vector.subtract(body.position, center).mag();
            if (dist > unloadRadius) {
                this.bodies.delete(id);
            }
        }

        // Add new bodies if needed
        while (this.bodies.size < maxBodies) {
            const angle = Math.random() * 2 * Math.PI;
            const distanceFromCenter = loadRadius + Math.random() * loadBuffer;

            const offset = new Vector(Math.cos(angle), Math.sin(angle));
            const position = Vector.addition(center, Vector.multiply(offset, distanceFromCenter));

            // const velocity = new Vector(
            //     (Math.random() - 0.5) * 2, // Range: -1 to 1
            //     (Math.random() - 0.5) * 2
            // );

            // const velocity = new Vector(
            //     (position.y)/position.mag(), // Range: -1 to 1
            //     (-position.x)/position.mag()
            // );

            // (y, -x)

            const radius = (Math.random() * (size) + 1); // Range: 1 to 4
            const color = "black"; // You can randomize this too if desired

            const velocity = new Vector(
                (position.y)/position.mag()*(radius/5), // Range: -1 to 1
                (-position.x)/position.mag()*(radius/5)
            );

            const newBody = new Body(radius, position, velocity, color);
            const id = crypto.randomUUID();

            this.bodies.set(id, newBody);
        }
    }

    init(){
        const mainBody = new Body(350, new Vector(0, 0), new Vector(0, 0), "black");
        this.addBody(mainBody);
        // for (let i = 1; i < 100; i++) {
        //     let size = Math.floor(Math.random()*4)+1;
        //     let pos = new Vector(400+getRand()*(1000), 400+getRand()*(1000));
        //     let vel = new Vector(getRand()*0.2, getRand()*0.2);
        //     let body = new Body(size, pos, vel, "black");
        //     this.addBody(body);
        // }
        for (let i = 1; i < 500; i++){
            const angle = Math.random() * 2 * Math.PI;
            let velocity = 25 + getRand()*5;
            let radius = (Universe.G * mainBody.mass / (velocity ** 2));
            let ur = new Vector(Math.cos(angle), Math.sin(angle));
            let uv = new Vector(-Math.sin(angle), Math.cos(angle));

            const sat = new Body(15 + getRand()*5, Vector.multiply(ur,radius), Vector.multiply(uv,velocity), "black");
            this.addBody(sat)
        }
        // let vel_circ = 30;
        // let vel_pos = (Universe.G * mainBody.mass / (vel_circ ** 2));

        // const sat = new Body(25, new Vector(vel_pos, 0), new Vector(0, vel_circ), "black");
        // this.addBody(sat)
    }


}