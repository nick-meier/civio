import { Player } from './player';
import { EngineerProduction } from './building';
import { GameComponent } from '../game/game.component';

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
        let tile = null;
        this.player.engineers.forEach(engineer => {
            if (!engineer.tile.hasBuilding()) {
                engineer.buildRoad(game.buildingGroup, game.roadGroup, engineer.tile);
            } else if (tile = engineer.tile.neighbors.find(neighbor => neighbor && !neighbor.hasUnit())) {
                engineer.move(tile);
            }
        });
    }
}
