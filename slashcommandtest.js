//スラッシュコマンドテスト
client.once("ready", async () => {
    const data = [{
        name: "ping",
        description: "現在のping値を取得します。",
    }];
    await client.application.commands.set(data, '866870907841806376');
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) {
        return;
    }
    if (interaction.commandName === 'ping') {
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
});
