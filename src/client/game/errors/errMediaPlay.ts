import { GameError } from "./error";

const msg = "It's okay. Click here to (hopefully) fix it!";
export default class ErrMediaAutoplay extends Error implements GameError {
  name = "media-autoplay-blocked";

  unrecoverable: boolean = false;

  constructor() {
    super(msg);

    Object.setPrototypeOf(this, ErrMediaAutoplay.prototype);
  }

  // eslint-disable-next-line class-methods-use-this
  getButton(additionalOnClick: () => void): HTMLButtonElement {
    // Create Button element
    const button = document.createElement("button");
    button.innerText = "Play!";

    // Set up onclick handler
    button.onclick = () => {
      // Try to replay all participant media elements
      const t1 = document.getElementById("team1");
      const t2 = document.getElementById("team2");
      const ob = document.getElementById("observers");
      if (t1) playVideoTags(t1);
      if (t2) playVideoTags(t2);
      if (ob) playVideoTags(ob);

      additionalOnClick();
    };
    return button;
  }

  toJSON() {
    return {
      error: {
        name: this.name,
        message: msg,
      },
    };
  }
}

function playVideoTags(parent: HTMLElement) {
  const videos = parent.getElementsByTagName("video");
  for (let i = 0; i < videos.length; i += 1) {
    const v = videos[i];
    v.play();
  }
}
