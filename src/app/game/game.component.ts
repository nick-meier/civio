import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { PaperScope, Project, Path, Color, Point } from 'paper';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements AfterViewInit {
  @ViewChild("paperCanvas", { static: false }) canvasElement: ElementRef;

  private scope: PaperScope;
  private project: Project;

  constructor() { }

  ngAfterViewInit() {
    this.scope = new PaperScope();
    this.project = new Project(this.canvasElement.nativeElement);

    for (let i = 0; i < 64; i++) {
      for (let j = 0; j < 64; j++) {
        const hexagon = this.createHexagon(50);
        hexagon.position.x = 50 * i;
        hexagon.position.y = 50 * i;
        this.project.activeLayer.addChild(hexagon);
      }
    }
  }

  createHexagon(radius: number): Path {
    const hexagon = new Path();
    hexagon.strokeColor = new Color(0, 0, 0);
    const angle = ((2 * Math.PI) / 6);
    for (let i = 0; i <= 6; i++) {
      hexagon.add(new Point(radius * Math.cos(angle * i), radius * Math.sin(angle * i)))
    }
    return hexagon;
  }

}
