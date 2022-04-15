# canvas
A r/place clone powered by websockets

That's pretty much it. https://canvas.rto.run

To build, run `npm install` and then `node main.js` to start the websocket. You'll need to host the frontend somehow as well.

Run `node main.js -h` for help with flags.


## Stuff this uses

- [ws](https://www.npmjs.com/package/ws) for the backend websocket
- [commander](https://www.npmjs.com/package/commander) for a nice cli
- [Gifenc](https://github.com/mattdesl/gifenc) for fast gif encoding
- [this slider thing from w3schools](https://www.w3schools.com/howto/howto_css_switch.asp) - it's one of the few actually useful things there

Thanks to [Radvylf](https://github.com/Radvylf) for hosting this, and [Unrelated String](https://github.com/unrelatedstring) and [pxeger](https://github.com/pxeger) among others for providing constant feedback.