const channels = require("./channels.json");

module.exports = channels.filter((channel) => !channel.hidden);
