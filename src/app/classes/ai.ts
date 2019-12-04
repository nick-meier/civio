import { Player } from './player';
import { EngineerProduction } from './building';

export class AI {
    public player: Player;
    // public game: GameComponent;

    constructor(player: Player) {
        this.player = player;
    }

    think() {
        this.player.cities.forEach(city => {
            if (!city.production) {
                city.startProduction(new EngineerProduction(city));
            }
        })
    }
}