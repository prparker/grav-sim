export class Vector {
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