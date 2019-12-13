import { Player } from './player';
import { EngineerProduction } from './building';
import { GameComponent } from '../game/game.component';
import { Engineer } from './unit';

export class AI {
    public player: Player;
    // public game: GameComponent;

    constructor(player: Player) {
        this.player = player;
    }

    think(game: GameComponent) {
        this.player.cities.forEach(city => {
            if (!city.production) {
                city.startProduction(new EngineerProduction(city));
            }
        });
        let movableNeighbors = null;
        this.player.units.forEach(unit => {
            if (unit instanceof Engineer) {
                const engineer = unit as Engineer;
                if (!engineer.tile.hasBuilding()) {
                    engineer.buildRoad(game.roadHubGroup, game.roadInnerGroup, game.roadOuterGroup, engineer.tile);
                } else if ((movableNeighbors = engineer.tile.neighbors.filter(neighbor => neighbor && !neighbor.hasUnit())).length > 0) {
                    const randomMovableNeighbor = movableNeighbors[Math.floor(movableNeighbors.length * Math.random())];
                    engineer.move(randomMovableNeighbor);
                }
            }
        });
    }
}
