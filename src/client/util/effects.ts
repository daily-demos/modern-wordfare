import { rand } from "./math";

const happyEmojis = ["🎉", "🎊", "🎈", "🥳", "✨"];

const sadEmojis = ["😿", "😢", "😭", "💀"];

export enum Mood {
  Happy,
  Sad,
}

// Slightly modified version of implementation from our post
// about adding flying emoji reactions to a Daily call:
// https://www.daily.co/blog/add-flying-emoji-reactions-to-a-custom-daily-video-call/
export function flyEmojis(mood: Mood) {
  const emoji = pickEmoji(mood);
  if (!emoji) return;

  const count = 30;
  for (let i = 0; i < count; i += 1) {
    const emojiDiv = document.createElement("div");
    emojiDiv.appendChild(document.createTextNode(emoji));
    emojiDiv.classList.add("emoji");

    const emergeSpeed = rand(200, 400) / 100;
    emojiDiv.style.setProperty("animation", `emerge ${emergeSpeed}s forwards`);
    emojiDiv.style.transform = `rotate(${-30 + Math.random() * 60}deg)`;
    console.log("transform:", emojiDiv.style.transform);
    emojiDiv.style.left = `${Math.random() * 100}%`;

    const body = document.getElementsByTagName("body")[0];
    body.appendChild(emojiDiv);

    emojiDiv.addEventListener("animationend", (e) => {
      const target = <HTMLDivElement>e.target;
      target.remove();
    });
  }
}

function pickEmoji(mood: Mood): string {
  switch (mood) {
    case Mood.Happy: {
      const idx = rand(0, happyEmojis.length - 1);
      return happyEmojis[idx];
    }
    case Mood.Sad: {
      const idx = rand(0, sadEmojis.length - 1);
      return sadEmojis[idx];
    }
    default: {
      return null;
    }
  }
}
