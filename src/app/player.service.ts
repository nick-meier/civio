import { Injectable } from '@angular/core';
import { Player } from './classes/player';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  public players: Player[];

  public playerSubject: Subject<Player>;

  constructor() {
    this.players = [];

    this.playerSubject = new Subject<Player>();
  }

  registerPlayer(player: Player) {
    console.log('registerPlayer');
    this.players.push(player);
    this.playerSubject.next(player);
  }
}
