const { Command, config: { apis } } = require("../../index");
const { Canvas } = require("canvas-constructor");
const fs = require("fs-nextra");
const { join } = require("path");

Canvas.registerFont(join(__dirname, "..", "..", "..", "assets", "fonts", "Roboto-Regular.ttf"), "Roboto");
Canvas.registerFont(join(__dirname, "..", "..", "..", "assets", "fonts", "RobotoCondensed-Regular.ttf"), "Roboto Condensed");
Canvas.registerFont(join(__dirname, "..", "..", "..", "assets", "fonts", "RobotoMono-Light.ttf"), "Roboto Mono");

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            runIn: ["text", "dm"],
            aliases: ["w", "☁", "⛅", "⛈", "🌤", "🌥", "🌦", "🌧", "🌨", "🌩", "🌪"],
            cooldown: 30,
            requiredPermissions: ["EMBED_LINKS", "ATTACH_FILES"],
            description: language => language.get("COMMAND_WEATHER_DESCRIPTION"),
            usage: "<location:...string>",
            extendedHelp: "No extended help available."
        });
    }

    async run(msg, [location]) {
        try {
            const response = await this.fetchURL("https://maps.googleapis.com/maps/api/geocode/json", { query: { address: location.replace(/ /g, "+"), key: apis.google } })
                .catch(() => { throw "I'm is having some troubles receiving the data for your location. Try again later"; });
            if (!response.results.length) return msg.reply("<:penguError:435712890884849664> I Could not find that location! Please try again with a different one.");

            const geocodelocation = response.results[0].formatted_address;

            const locality = response.results[0].address_components.find(loc => loc.types.includes("locality"));
            const governing = response.results[0].address_components.find(gov => gov.types.includes("administrative_area_level_1")); // eslint-disable-line max-len
            const country = response.results[0].address_components.find(cou => cou.types.includes("country"));
            const continent = response.results[0].address_components.find(con => con.types.includes("continent"));

            const city = locality || governing || country || continent || {};
            const state = locality && governing ? governing : locality ? country : {};

            const params = `${response.results[0].geometry.location.lat},${response.results[0].geometry.location.lng}`;
            const res = await this.fetchURL(`https://api.darksky.net/forecast/${apis.darksky}/${params}`)
                .catch(() => { throw "I'm is having some troubles receiving the data for your location. Try again later"; });


            const condition = res.currently.summary;
            const { icon } = res.currently;
            const chanceofrain = Math.round((res.currently.precipProbability * 100) / 5) * 5;
            const temperature = Math.round(res.currently.temperature);
            const humidity = Math.round(res.currently.humidity * 100);

            let theme = "light";
            let fontColor = "#FFFFFF";
            if (icon === "snow" || icon === "sleet" || icon === "fog") {
                theme = "dark";
                fontColor = "#444444";
            }

            const bg = await this.getBase(icon);
            const cond = await fs.readFile(`../assets/weather/icons/${theme}/${icon}.png`);
            const hum = await fs.readFile(`../assets/weather/icons/${theme}/humidity.png`);
            const precip = await fs.readFile(`../assets/weather/icons/${theme}/precip.png`);

            const img = await new Canvas(400, 180)
                .addImage(bg, 0, 0, 400, 180)
                .setColor(fontColor)
                .setTextFont("20px Roboto")
                .addText(city.long_name ? city.long_name : "Unknown", 35, 50)
                .setTextFont("16px Roboto")
                .addText(state.long_name ? state.long_name : "", 35, 72.5)
                .setTextFont("48px Roboto Mono")
                .addText(`${temperature}°`, 35, 140)
                .addImage(cond, 325, 31, 48, 48)
                .addImage(hum, 358, 88, 13, 13)
                .addImage(precip, 358, 108, 13, 13)
                .setTextAlign("right")
                .setTextFont("16px Roboto")
                .addText(condition, 370, 142)
                .setTextFont("16px 'Roboto Condensed'")
                .addText(`${humidity}%`, 353, 100)
                .addText(`${chanceofrain}%`, 353, 121)
                .toBufferAsync();
            return msg.sendMessage({ files: [{ attachment: img, name: `${geocodelocation}.png` }] });
        } catch (e) {
            console.error(e);
            return msg.sendMessage(`<:penguError:435712890884849664> ***Oopsies, an error occoured, please try again!***`);
        }
    }

    async getBase(icon) {
        if (icon === "clear-day" || icon === "partly-cloudy-day") {
            return `../assets/weather/base/day.png`;
        } else if (icon === "clear-night" || icon === "partly-cloudy-night") {
            return `../assets/weather/base/night.png`;
        } else if (icon === "rain") {
            return `../assets/weather/base/rain.png`;
        } else if (icon === "thunderstorm") {
            return `../assets/weather/base/thunderstorm.png`;
        } else if (icon === "snow" || icon === "sleet" || icon === "fog") {
            return `../assets/weather/base/snow.png`;
        } else if (icon === "wind" || icon === "tornado") {
            return `../assets/weather/base/windy.png`;
        } else if (icon === "cloudy") {
            return `../assets/weather/base/cloudy.png`;
        } else {
            return `../assets/weather/base/cloudy.png`;
        }
    }

};
