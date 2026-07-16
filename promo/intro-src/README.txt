Sorgenti del video promo/pisozone-intro.mp4.

Rigenerare:
1. npm i ffmpeg-static opentype.js (in questa cartella)
2. node audio.js && node video.js
3. ffmpeg -y -framerate 30 -i frames/f%04d.png -i audio.wav -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart -shortest pisozone-intro.mp4
   (ffmpeg = require("ffmpeg-static"); sharp si importa da ../node_modules)
