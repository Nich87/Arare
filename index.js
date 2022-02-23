const prefix = '#/';
const Discord = require("discord.js");
const { Intents, Client, MessageEmbed, MessageActionRow, MessageSelectMenu } = require("discord.js");
const options = {
  intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS", "GUILD_MEMBERS"],
};
const client = new Client(options);
const fetch = require("node-fetch");
const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');

client.on('ready', async () => {
  client.user.setActivity(`#/help | ${client.guilds.cache.map(guild => guild.memberCount).reduce((p, c) => p + c)}人`, { type: 'PLAYING' });
  const server_id = client.guilds.cache.get();
  console.log(`${client.user.tag}にログインしました。`);
    const data = [{
      name: "add-role-to-everyone",
      description: "サーバーにいるメンバー全員にロールを付与します。",
      options: [{
      type: "ROLE",
      name: "ロール",
      description: "付与するロールを指定してください。",
      required: true,
    }],
  }];
  await client.application.commands.set(data);
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) {
        return;
    }
    if (interaction.commandName === 'add-role-to-everyone') {
      const role = interaction.options.getRole('ロール');
      interaction.guild.members.fetch()
      .then(members => Promise.all(members.map(member => member.roles.add(`${role.id}`))))
      .catch(console.error)
      await interaction.reply(`${role.name}を全員に付与しました。`)
    }
});

//時間
require('date-utils');

//集計中メッセージの登録用
let messageUrlList = new Set();
let messageAuthorList = new Set();
let messageDateList = new Set();

client.on('messageCreate', async message => {
  if (!message.content.startsWith(prefix)) return
  const [command, ...args] = message.content.slice(prefix.length).split(' ')
  if (command === 'ping') {
        const pingem = {
          "fields": [
            {
              "name": "📡Bot反応時間",
              "value": "現在のPing値は" + client.ws.ping + "msです。"
            }
          ]
        };
        await message.reply({ embeds: [pingem] })
    }
    if (command === 'cnt') {
      const [a, b] = args.map(str => Number(str))


      //リアクション数・ロール指定がないまたは順番が逆な場合
      if (!a || message.mentions.roles.size == 0) return message.channel.send("構文エラー:無効なコマンドが送信されました。\n原因として以下の可能性があります。\n> ・カウント数やロールが指定されていなかった\n> ・カウント数とロールの順番が逆である。");

          //メッセージを送る
          const role = message.mentions.roles.first();
          const newMessage = await message.reply(`__リアクション集計中__\n> 目標回数：${a} \n> 対象ロール：${role.name}\n> このBOTのメッセージにリアクションしてください。`);

          //ロールチェック
          const filter = async (reaction, user) => {
            return (await message.guild ?.members.fetch(user.id).then((member) => member.roles.cache.has(role.id))) ?? false;
          };

          const collector = newMessage.createReactionCollector({ filter, max: `${a}`});
          //集計完了
          collector.on("end", collected => collectEnd(collected, collector));
          //集計中のメッセージをリストに登録しておく
          messageUrlList.add(newMessage.url);
          messageAuthorList.add(message.author.id);
          messageDateList.add(message.createdAt.toFormat("YYYY/MM/DD - HH24/MI"));
          //集計完了後の動作定義
          function collectEnd(collected, collector) {
                //集計中のメッセージリストから除去
                messageUrlList.delete(collector.message.url);
                messageAuthorList.delete(message.author.id);
                messageDateList.delete(message.createdAt.toFormat("YYYY/MM/DD - HH24/MI"));
                //埋め込み
                const date = new Date().toFormat('YYYY/MM/DD HH24:MI-SS')
                const Embed = {
                  title: 'リアクション集計完了',
                  fields: [
                    {
                      name: '集計したリンク',
                      value: `[link](${message.url})`,
                    },
                    {
                      name: '終了時刻',
                      value: `${date}`,
                    },
                  ],
                  footer: {
                    text: `対象ロール：${role.name}`,
                    icon_url: '',
                  },
                };
                message.reply({ content: "リアクションの集計が完了しました。", embeds: [Embed] }) && newMessage.delete();
              }
            }
    if (command === 'list') {
        const listurl = messageUrlList.values();
        const listauthor = messageAuthorList.values();
        const listdate = messageDateList.values();
        if(!listurl) return message.channel.send('現在受け付けている集計はありません。');
        const embed = {
          "title": "現在受け付けているカウント集計",
          "description": `[link](${listurl.next().value})\nUser:<@!${listauthor.next().value}>\nDate:${listdate.next().value}`
  };
      message.reply({ embeds: [embed] })
    return;
  };
    if (command === 'help') {
    const helpem = {
      "title": "ヘルプ一覧",
      "description": "このBOTで使用できるコマンドの一覧です。",
      "author": {
        "name": `${message.author.username}`,
        "icon_url": `${message.author.displayAvatarURL({ format: 'png' })}`
      },
      "fields": [
        {
          "name": "#/help",
          "value": "このヘルプを表示します。"
        },
        {
          "name": "#/ping",
          "value": "ping値を取得します。"
        },
        {
          "name": "#/cnt 回数 @ロール",
          "value": "指定した回数のリアクションを集計します。\nただし、指定したロール以外がリアクションをしてもカウントされません。"
        },
        {
          "name": "スレッド関連",
          "value": "以下の条件で自動的に通知します。\n> スレッド作成\n> アーカイブと解除\n> スレッド削除"
        },
        {
          "name": "メッセージURL取得",
          "value": "URL先のメッセージの内容を取得します。"
        },
        {
          "name": "#/ban @ユーザー",
          "value": "指定したメンバーをBANします。\n権限が必要です。"
        },
        {
          "name": "#/kick @ユーザー",
          "value": "指定したメンバーをKICKします。\n権限が必要です。"
        }
      ]
    };
    message.reply({ embeds: [helpem] })
  }
});

//メッセージ取得
client.on('messageCreate', async message => {
  const re = new RegExp('https://discord.com/channels/([0-9]{18})/([0-9]{18})/([0-9]{18})')
  const results = message.content.match(re)
  if (!results) {
    return
  };
  const guild_id = results[1]
  const channel_id = results[2]
  const message_id = results[3]

  const channelch = client.channels.cache.get(channel_id);
  if (!channelch) {
    return;
  }

  channelch.messages.fetch(message_id)
    .then(msg => message.reply({
      embeds: [{
        footer: {
          icon_url: `${msg.guild.iconURL() === null ? `https://cdn.discordapp.com/attachments/866870931141296138/942606993313660978/SCC.png` : msg.guild.iconURL()}`,
          text: `${msg.channel.name}`
        },
        author: {
          name: `${msg.author.username}`,
          icon_url: `${msg.author.displayAvatarURL({ format: 'png' })}`
        },
        description: `${msg.embeds[0] == undefined ? msg.content : msg.embeds[0].description }`,
        timestamp: msg.createdAt
      }]
    }))
    .catch(console.error);
});

//kickコマンド
client.on('messageCreate', async message => {
  if (message.content.startsWith('#/kick') && message.guild) {
    if (message.mentions.members.size !== 1)
      return message.channel.send('Kickするメンバーを1人指定してください')
    const member = message.mentions.members.first()
    if (!member.bannable) return message.channel.send('このユーザーをKickすることができません')
    if (!message.member.permissions.has("KICK_MEMBERS")) return message.channel.send('あなたにはユーザーをKickする権限がありません');
    await member.kick()
    await message.channel.send(`${member.user.tag}をKickしました`)
  }
});

//banコマンド
client.on('messageCreate', async message => {
  if (message.content.startsWith('#/ban') && message.guild) {
    if (message.mentions.members.size !== 1)
      return message.channel.send('Banするメンバーを1人指定してください')
    const member = message.mentions.members.first('')
    if (!member.bannable) return message.channel.send('このユーザーをBanすることができません')
    if (!message.member.permissions.has("BAN_MEMBERS")) return message.channel.send('あなたにはユーザーをBANする権限がありません');
    await member.ban()
    await message.channel.send(`${member.user.tag}をBanしました`)
  }
});

//ボタン
client.on('messageCreate', async message => {
    if (message.content.startsWith("#/button")) {
        const tic1 = new Discord.MessageButton()
            .setURL("https://discord.gg/9YDWYkdTuE")
            .setStyle("LINK")
            .setLabel("招待を受ける")
        await message.channel.send({
            content: "新しいサーバーに参加するには以下のボタンをクリックしてください。",
            components: [new Discord.MessageActionRow().addComponents(tic1)]
        });
    }
});

//スレッド周り===========================================
//スレッド作成
client.on("threadCreate", async thread => {
  if(thread.guildId === '888981896594350132'){
    await thread.send(`スレッドが作成されました。\n <@&927377284653002772> <@&889029317139517461> <@!594370135230251028>`)
  } else if(thread.guildId === '917221958242947072'){
    await thread.send(`スレッドが作成されました。\n <@&917221958280687624> <@&940148040445067264> <@&917221958297477191>`)
  };
});

//スレッド削除
client.on("threadDelete", async thread => {
    thread.parent.send(`スレッド${thread.name}は削除されました。`)
});

//スレッドアーカイブ
//スレッド名前変更
client.on("threadUpdate", async (oldThread, newThread) => {
  const status = oldThread.archived == newThread.archived;
  if (status == true) {
    newThread.parent.send(`スレッド${oldThread.name}は${newThread.name}に変更されました。`)
  };
  if (status == false) {
    newThread.parent.send(`スレッド${newThread.name}${newThread.archived ? "はアーカイブされました。" : "のアーカイブが解除されました。"}`)
  };
});
//=====================================================

//イベント関連==========================================
client.on('guildScheduledEventCreate', async (event) => {
  const server = event.guild();
  console.log('確認')
  if(server.id === '917221958242947072'){
    const embed = {
      "title": `${event.name}`,
      "description": `\n${event.description}\n\n[参加リンク](${event.createInviteURL})\n\n作成者：${event.creator}\n\n開始日：${event.scheduledStartAt}`
    };
    client.channels.cache.get('917221958603653149').send({ embeds: [embed]})
  } else if(server.id === '866870907841806376'){
    const embed = {
      "title": `${event.name}`,
      "description": `\n${event.description}\n\n[参加リンク](${event.createInviteURL})\n\n作成者：${event.creator}\n\n開始日：${event.scheduledStartAt}`
    };
    client.channels.cache.get('866870907841806380').send({ embeds: [embed]})
  } else {
    return;
  }
})
//=====================================================

client.login(process.env.token);
