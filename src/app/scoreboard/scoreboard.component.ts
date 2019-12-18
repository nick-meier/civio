import { Component, OnInit } from '@angular/core';
import { PlayerService } from '../player.service';
import { Player } from '../classes/player';

@Component({
  selector: 'app-scoreboard',
  templateUrl: './scoreboard.component.html',
  styleUrls: ['./scoreboard.component.scss']
})
export class ScoreboardComponent implements OnInit {
  private playerService: PlayerService;

  // private players: Player[];
  private scores: Map<Player, number>;

  constructor(playerService: PlayerService) {
    this.playerService = playerService;
    // this.players = this.playerService.players
    if (this.playerService.players.length > 0) {
      this.playerService.players.forEach(player => {
        player.scoreSubject.subscribe(score => {
          this.scores.set(player, score);
        });
      });
    }
    this.playerService.playerSubject.subscribe(player => {
      player.scoreSubject.subscribe((score) => {
        this.scores.set(player, score);
      });
    });

    this.scores = new Map<Player, number>();
  }

  // registerPlayer on scoreService
  // game registers players
  // Scoreboard listens for new players and then subscribes to their observables
  ngOnInit() {

  }
}
