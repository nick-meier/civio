import { Player } from './player';
import { Item, Project, Group } from 'paper';
import { Tile } from './tile';
import { RoadHub } from './building';

export abstract class Unit {
    public owner: Player;
    public icon: Item;
    public tile: Tile;
    public upkeepCost: number;

    move(tile: Tile) {
        if (this.tile) this.tile.removeUnit(this);
        tile.addUnit(this);
    }

    destroy() {
        console.log('DESTROYYYY');

        if (this.tile) this.tile.removeUnit(this);
        const index = this.owner.units.indexOf(this);
        if (this.owner) {
            this.owner.units.splice(index, 1);
        }
        // this.icon.parent = null;
    }
}

export class Engineer extends Unit {
    constructor(project: Project, unitGroup: Group) {
        super();
        this.upkeepCost = 10;

        project.importSVG('assets/svg/unlicensed/Engineering.svg', (item: Item) => {
            this.icon = item;
            item.scale(2.5);
            // item.strokeColor = new Color(1, 1, 1);
            item.strokeColor = this.owner.color;
            item.position = this.tile.group.position;
            unitGroup.addChild(item);
        });
    }

    buildRoad(roadHubInnerGroup: Group, roadHubOuterGroup: Group, roadInnerGroup: Group, roadOuterGroup: Group, tile: Tile) {
        const road = new RoadHub(this.owner, tile.group.position, roadHubInnerGroup, roadHubOuterGroup);
        tile.addBuilding(road, roadInnerGroup, roadOuterGroup);
    }
}

