import { Player } from './player';
import { Item, Project, Group, Color, Path } from 'paper';
import { Tile } from './tile';
import { Building, Road, RoadHub } from './building';

export abstract class Unit {
    public owner: Player;
    public icon: Item;
    public tile: Tile;
}

export class Engineer extends Unit {
    constructor(project: Project, unitGroup: Group) {
        super();
        project.importSVG('assets/svg/unlicensed/Engineering.svg', (item: Item) => {
            this.icon = item;
            item.scale(2.5);
            // item.strokeColor = new Color(1, 1, 1);
            item.strokeColor = this.owner.color;
            item.position = this.tile.group.position;
            unitGroup.addChild(item);
        });
    }

    buildRoad(buildingGroup: Group, roadGroup: Group, tile: Tile) {
        const road = new RoadHub(tile.group.position, buildingGroup);
        tile.addBuilding(road, roadGroup);
    }
}

