import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { GameComponent } from './game/game.component';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [
    AppComponent,
    GameComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot([
      {
        path: "game",
        component: GameComponent
      }
    ])
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
