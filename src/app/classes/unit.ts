import { Player } from './player';
import { Item, Project, Group } from 'paper';
import { Tile } from './tile';
import { RoadHub } from './building';

export abstract class Unit {
    private owner: Player;
    public get Owner() { return this.owner; }
    public set Owner(value) {
        this.owner = value;
        this.owner.units.push(this);
    }
    public icon: Item;
    public tile: Tile;
    public upkeepCost: number;

    move(tile: Tile) {
        if (this.tile) this.tile.removeUnit(this);
        tile.addUnit(this);
    }

    destroy() {
        if (this.tile) this.tile.removeUnit(this);
        if (this.owner) {
            const index = this.owner.units.indexOf(this);
            this.owner.units.splice(index, 1);
        }
        // this.icon.parent = null;
    }
}

export class Engineer extends Unit {
    constructor(project: Project, unitGroup: Group) {
        super();
        this.upkeepCost = 10;

        console.error('Not implemented');
        /*
        project.importSVG('assets/svg/unlicensed/Engineering.svg', (item: Item) => {
            this.icon = item;
            item.scale(2.5);
            // item.strokeColor = new Color(1, 1, 1);
            item.strokeColor = this.Owner.color;
            item.position = this.tile.group.position;
            unitGroup.addChild(item);
        });
        */
    }

    buildRoad(roadHubInnerGroup: Group, roadHubOuterGroup: Group, roadInnerGroup: Group, roadOuterGroup: Group, tile: Tile) {
        if (tile.biome === 'Ocean') {
            console.error('Can\'t build a road on an ocean tile.');
            return;
        }
        const road = new RoadHub(this.Owner, tile.group.position, roadHubInnerGroup, roadHubOuterGroup);
        tile.addBuilding(road, roadInnerGroup, roadOuterGroup);
    }
}

