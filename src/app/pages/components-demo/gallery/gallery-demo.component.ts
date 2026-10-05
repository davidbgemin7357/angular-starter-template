import { Component } from '@angular/core';
import { DbComponentCardComponent, DbGalleryComponent, ObjectFit } from 'db-ui-kit';

/** Vitrina de db-gallery: carrusel por defecto, objectFit contain, sin controles y sin bucle
 * con retardo propio. El componente toma el alto de su contenedor (h-full). */
@Component({
  selector: 'app-gallery-demo',
  imports: [DbGalleryComponent, DbComponentCardComponent],
  templateUrl: './gallery-demo.component.html',
  styles: ``,
})
export class GalleryDemoComponent {
  public readonly images: string[] = [
    'https://picsum.photos/id/1015/1200/600',
    'https://picsum.photos/id/1016/1200/600',
    'https://picsum.photos/id/1018/1200/600',
    'https://picsum.photos/id/1020/1200/600',
    'https://picsum.photos/id/1024/1200/600',
  ];

  // Imagenes verticales: con contain se ven completas y quedan franjas laterales.
  public readonly portraitImages: string[] = [
    'https://picsum.photos/id/1025/600/900',
    'https://picsum.photos/id/1027/600/900',
    'https://picsum.photos/id/1035/600/900',
  ];

  public readonly containFit: ObjectFit = 'contain';
  public readonly customDelay: number = 2000;
}
