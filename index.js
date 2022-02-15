const prefix = '/';
const Discord = require("discord.js");
const { Intents, Client, MessageEmbed, MessageActionRow, MessageSelectMenu } = require("discord.js");
const options = {
  intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS", "GUILD_MEMBERS"],
};
const client = new Client(options);

client.on('ready', async () => {
  client.user.setActivity('LOVEaim', { type: 'PLAYING' });
  console.log(`${client.user.tag}にログインしました。`);
});

//時間
require('date-utils');

//ping
client.on('messageCreate', message => {
  if (message.content.includes("ping") && message.mentions.users.has(client.user.id)) {
    if (message.author.bot) return;
    const pingem = {
      "color": 16737977,
      "fields": [
        {
          "name": "📡Bot反応時間",
          "value": "現在のPing値は" + client.ws.ping + "msです。"
        }
      ]
    };
    message.reply({ embeds: [pingem] })
  }
  else {
    return;
  }
});

//集計中メッセージのリンクを登録
let messageUrlList = new Set();
let messageAuthorList = new Set();
let messageDateList = new Set();

//カウント集計
client.on('messageCreate', async message => {
  if (!message.content.startsWith(prefix)) return
  const [command, ...args] = message.content.slice(prefix.length).split(' ')
  if (command === 'cnt') {
    const [a, b] = args.map(str => Number(str))

    //最後のメンション用
    const owner = message.guild.members.cache.get(message.author.id);

    //リアクション数・ロール指定がない場合
    if (a == undefined) {
      return message.channel.send('集計したいリアクション数を指定してください。')
    }
    else {
      if (message.mentions.roles.size == 0) {
        return message.channel.send('ロールを指定してください。')
      }
      else {

        //メッセージを送る
        const role = message.mentions.roles.first();
        const newMessage = await message.reply(`__リアクション集計中__\n> 目標回数：${a} \n> 対象ロール：${role.name}\n> このBOTのメッセージにリアクションしてください。`)

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
              console.log("reactionCollector End");
              //集計中のメッセージリストから除去
              messageUrlList.delete(collector.message.url);
              messageAuthorList.delete(message.author.id);
              messageDateList.delete(message.createdAt.toFormat("YYYY/MM/DD - HH24-MI-SS"));
              //時間取得
              const dt = new Date;
              const date = dt.toFormat("YYYY/MM/DD HH24時MI分")
              //埋め込み
              const Embed = {
                title: 'リアクション集計完了',
                fields: [
                  {
                    name: '集計したリンク',
                    value: `[link](${message.url})`,
                  },
                  {
                    name: '終了時刻',
                    value: `${timestamp}`,
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
    }
  }
  if (command === 'list') {
      const listurl = messageUrlList.values();
      const listauthor = messageAuthorList.values();
      const listdate = messageDateList.values();
      const embed = {
        "title": "現在受け付けているカウント集計",
        "description": `[link](${listurl.next().value})\nUser:<@!${listauthor.next().value}>\nDate:${listdate.next().value}`,
        "color": 16491101
};
    message.reply({ embeds: [embed] })
  return;
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
        color: 16727276,
        footer: {
          icon_url: `${msg.guild.iconURL() === null ? `https://cdn.discordapp.com/attachments/866870931141296138/942606993313660978/SCC.png` : msg.guild.iconURL()}`,
          text: `${msg.guild.channels.cache.find((channel) => channel.name)}|${msg.createdAt.toFormat("YYYY-MM/DD")}`
        },
        author: {
          name: `${msg.author.username}`,
          icon_url: `${msg.author.displayAvatarURL({ format: 'png' })}`
        },
        description: `${msg.embeds[0] == undefined ? msg.content : msg.embeds[0].description }`
      }]
    }))
    .catch(console.error);
});

//kickコマンド
client.on('messageCreate', async message => {
  if (message.content.startsWith('/lkick') && message.guild) {
    if (message.mentions.members.size !== 1)
      return message.channel.send('Kickするメンバーを1人指定してください')
    const member = message.mentions.members.first()
    if (!member.bannable) return message.channel.send('このユーザーをKickすることができません')
    if (!message.member.permissions.has("KICK_MEMBERS")) return message.channel.send('あなたにはユーザーをKickする権限がありません');
    await member.kick()
    await message.channel.send(`${member.displayname}をKickしました`)
  }
});

//banコマンド
client.on('messageCreate', async message => {
  if (message.content.startsWith('/lban') && message.guild) {
    if (message.mentions.members.size !== 1)
      return message.channel.send('Banするメンバーを1人指定してください')
    const member = message.mentions.members.first('')
    if (!member.bannable) return message.channel.send('このユーザーをBanすることができません')
    if (!message.member.permissions.has("BAN_MEMBERS")) return message.channel.send('あなたにはユーザーをBANする権限がありません');
    await member.ban()
    await message.channel.send(`${member.displayname}をBanしました`)
  }
});

//help
client.on('messageCreate', message => {
  if (message.content.includes("help") && message.mentions.users.has(client.user.id)) {
    if (message.author.bot) return;
    const helpem = {
  "title": "ヘルプ一覧",
  "description": "このBOTで使用できるコマンドの一覧です。",
  "color": 16723932,
  "author": {
    "name": `${message.author.username}`,
    "icon_url": `${message.author.displayAvatarURL({ format: 'png' })}`
  },
  "fields": [
    {
      "name": "@LOVEaim - Manager#9735 help",
      "value": "このヘルプを表示します。"
    },
    {
      "name": "@LOVEaim - Manager#9735 ping",
      "value": "ping値を取得します。"
    },
    {
      "name": "/cnt 回数 @ロール",
      "value": "指定した回数のリアクションを集計します。\nただし、指定したロール以外がリアクションをしてもカウントされません。"
    },
    {
      "name": "スレッド関連",
      "value": "以下の条件で自動的に運営とnoshAさんに通知します。\n> スレッド作成\n> アーカイブと解除\n> スレッド削除"
    },
    {
      "name": "メッセージURL取得",
      "value": "URL先のメッセージの内容を取得します。"
    },
    {
      "name": "/lban @ユーザー",
      "value": "指定したメンバーをBANします。\n権限が必要です。"
    },
    {
      "name": "/lkick @ユーザー",
      "value": "指定したメンバーをKICKします。\n権限が必要です。"
    }
  ]
    };
    message.reply({ embeds: [helpem] })
  }
  else {
    return;
  }
})

//ボタン
client.on('messageCreate', async message => {
    if (message.content.startsWith("/button")) {
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

//スレッド周り
//スレッド作成
client.on("threadCreate", async thread => {
  await thread.send(`スレッドが作成されました。\n <@&927377284653002772> <@&889029317139517461> <@!594370135230251028>`);
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

client.login(process.env.token);
