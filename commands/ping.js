module.exports = {
    data: {
        name: "ping",
        description: "現在のPing値を取得します。",
    },
    async execute(interaction) {
      const pingem = {
        "color": 16737977,
        "fields": [
          {
            "name": "📡Bot反応時間",
            "value": "現在のPing値は" + client.ws.ping + "msです。"
          }
        ]
      };
      await interaction.reply({ embeds: [pingem] })
    }
}
