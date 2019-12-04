import { Color } from 'paper';
import { City } from './building';

export class Player {
    public color: Color;
    public cities: City[];

    constructor() {
        this.cities = [];
    }
}