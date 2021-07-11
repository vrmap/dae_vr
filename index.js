const Telegraf = require("telegraf");
const fetch = require("node-fetch");

const API_TOKEN = "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";

const bot = new Telegraf(API_TOKEN);

bot.start(message => {
  console.log("started:", message.from.id);
  return message.reply(
    "Ciao, invia la tua posizione con la graffetta per avere informazioni sui defibrillatori nelle vicinanze (2 Km)!!"
  );
});

bot.on("location", message => {
  console.log(message.message.location);

  var lat = message.message.location.latitude;
  var lon = message.message.location.longitude;
  var distance = 2000;
  var query = `https://overpass-api.de/api/interpreter?data=[out:json][timeout:25];(node["emergency"="defibrillator"](around:${distance},${lat},${lon}););out;>;out skel qt;`;

  fetch(encodeURI(query))
    .then(function (response) {
      return response.json();
    })
    .then(res => {
      var r = "";
      r += `Trovati ${res.elements.length} defibrillatori nell'area:\n\n`;

      def = [];

      for (var i in res.elements) {
        var p = {};
        var defibrillatori = res.elements[i];
        var count = i - -1;
        var distanza = (
          TrovaDistanza(lat, lon, defibrillatori.lat, defibrillatori.lon) * 1000
        ).toFixed(0);
        var nome =
          defibrillatori.tags.name === undefined
            ? "Nessun nome"
            : defibrillatori.tags.name;
        var pos =
          defibrillatori.tags["defibrillator:location"] === undefined
            ? ""
            : `(${defibrillatori.tags["defibrillator:location"]})`;
        p.text = `${nome} (${distanza}m) ${pos}: \n`;
        p.text += `https://www.google.com/maps/dir/${lat},${lon}/${defibrillatori.lat},${defibrillatori.lon}\n`;
        p.dist = distanza;
        def.push(p);
      }
      def.sort(function (a, b) { return a.dist - b.dist });
      for (var i in def) {
        r += `${parseInt(i) + 1} ${def[i].text}\n`;
      }
      message.reply(r);
    })
    .catch(error => {
      message.reply(`Errore ${error}`);
    });
});

function TrovaDistanza(latp, lonp, latd, lond) {
  var latp = parseFloat(latp).toFixed(10);
  var lonp = parseFloat(lonp).toFixed(10);
  var latd = parseFloat(latd).toFixed(10);
  var lond = parseFloat(lond).toFixed(10);
  var theta = lonp - lond;
  var dist =
    Math.sin(latp * (Math.PI / 180)) * Math.sin(latd * (Math.PI / 180)) +
    Math.cos(latp * (Math.PI / 180)) *
    Math.cos(latd * (Math.PI / 180)) *
    Math.cos(theta * (Math.PI / 180));
  dist = Math.acos(dist);
  dist = dist * (180 / Math.PI);
  var distanza = dist * 60 * 1.1515 * 1.609344;
  return distanza;
}

bot.startPolling();
console.log("BOT avviato")
