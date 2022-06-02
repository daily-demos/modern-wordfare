# Code of Daily: Modern Wordfare

This demo shows one way to implement a social gaming application with video integration using [Daily's call object](https://docs.daily.co/guides/products/call-object).

This demo is still in development, with improvements and additional features still to come.

![Code of Daily: Modern Wordfare game board](./screenshot.png)

## Getting set up with Daily

To use this demo, you will need a Daily API key.

To get a Daily API key, [create a free Daily account](https://dashboard.daily.co/signup)

Once you have an account and are logged into the [Daily Dashboard](https://dashboard.daily.co/), copy your API key [here](https://dashboard.daily.co/developers). Your domain

Copy `.env.sample` in this repository's root to a file called `.env` and fill in the `DAILY_DOMAIN` and `DAILY_API_KEY` variables. Do not commit this file!

## How the demo works

This demo allows users to create and join Code of Daily: Modern Wordfare games with their friends. Video call participants join one of two teams as either a player or spymaster. The spymaster provides one-word clues tying one or more team words together. Players on that team then try to guess the correct words based on the spymaster's hint.

## Running locally

1. Install dependencies `npm i`
2. Run `npm run build`
3. Run `npm run start`

## Contributing and feedback

Let us know how experimenting with this demo goes! Feel free to reach out to us any time at `help@daily.co`.

## Audio file credits

- Game Start by plasterbrain: https://freesound.org/people/plasterbrain/sounds/243020/
- 1-tone chime by skowm001: https://freesound.org/people/skowm001/sounds/268075/
- Bell Chime Alert by plasterbrain: https://freesound.org/people/plasterbrain/sounds/419493/
- Failure 01 by rhodesmas: https://freesound.org/people/rhodesmas/sounds/342756/
- success_bell by MLaudio: https://freesound.org/people/MLaudio/sounds/511484/
- tada2 by jobro: https://freesound.org/people/jobro/sounds/60444/
