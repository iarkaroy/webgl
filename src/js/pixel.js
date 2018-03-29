
export default class Pixel {

    constructor(x, y, data) {
        this.x = x;
        this.y = y;
        this.data = data;
        this.a = this.data >> 24 & 255;
        this.r = this.data >> 16 & 255;
        this.g = this.data >> 8 & 255;
        this.b = this.data >> 0 & 255;
    }

}