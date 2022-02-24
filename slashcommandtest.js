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

//  const server_id = client.guilds.server.id();
//  const data = [{
//    name: "sumcode",
//    description: "フレンドコードを検索します。",
//    options: [{
//    type: "USER",
//    name: "ユーザー",
//    description: "検索するユーザーを指定してください。",
//    required: true,
//}],
//  }];
//  await client.application.commands.set(data, `${server_id}`);
if (interaction.commandName === 'add-code') {
  const code = interaction.options.getString('コード');
  await DB.set(`${interaction.user}`, `${code}`);
  const key = await DB.get(`${interaction.author.username}`);
  const embed = {
    "title": "コードを登録しました。",
    "description": `ユーザーネーム：${interaction.user}\nフレンドコード：${key}`
  }
  await interaction.reply({ embeds: [embed] })
}
if (interaction.commandName === 'sum-code') {
  const username = interaction.options.getString('ユーザー名');
  const key = await DB.get(`${username}`);
  const embed = {
    "title": "検索結果",
    "description": `ユーザーネーム：${username}\nフレンドコード：${key}`
  }
  await interaction.reply({ embeds: [embed] })
}
