import { Color } from 'paper';
import { City } from './building';
import { Engineer } from './unit';

export class Player {
    public color: Color;
    public cities: City[];
    public engineers: Engineer[];

    constructor() {
        this.cities = [];
        this.engineers = [];
    }
}
