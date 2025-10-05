import { Injectable } from '@angular/core';

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

@Injectable({
  providedIn: 'root'
})
export class YoutubeService {
  private apiLoaded = false;

  loadApi(): Promise<void> {
    return new Promise((resolve) => {
      if (this.apiLoaded) {
        resolve();
        return;
      }

      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        this.apiLoaded = true;
        resolve();
      };
    });
  }

  createPlayer(elementId: string, videoId: string): Promise<any> {
    return new Promise((resolve) => {
      const player = new window.YT.Player(elementId, {
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          mute: 1,
          playsinline: 1
        },
        events: {
          onReady: (event: any) => {
            resolve(event.target);
          }
        }
      });
    });
  }

  getVideoIdFromUrl(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }
} 