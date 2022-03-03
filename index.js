const prefix = '#/';
const { Client, Intents, MessageEmbed, Permissions, MessageActionRow, MessageButton, MessageSelectMenu, } = require("discord.js");
const client = new Client({
    intents: Object.values(Intents.FLAGS),
});

//集計中メッセージの登録用
let messageUrlList = new Set();
let messageAuthorList = new Set();
let messageDateList = new Set();


client.on('ready', () => {
    client.user.setActivity(`#/help | ${client.guilds.cache.size}個のサーバー | ${client.guilds.cache.map(guild => guild.memberCount).reduce((p, c) => p + c)}人`, { type: 'PLAYING' });
    console.log(`${client.user.tag}にログインしました。`);
});

client.on('messageCreate', async message => {
    if (message.author.bot || message.content.indexOf(prefix) !== 0) return;
    const [command, ...args] = message.content.slice(prefix.length).split(' ');

    switch (command) {
        case 'ban':
            if (!message.member.permissions.has(Permissions.FLAGS.BAN_MEMBERS)) return message.channel.send("❌ 権限が不足しています。");

            const ban_member = await fetchData(message);
            ban_member.ban()
                .then((banned_user) => {
                return message.channel.send({ content: `${banned_user.user.tag} をBanしました` });
            })
                .catch(reason => {
                    console.warn(reason);
                    return message.channel.send({ content: "エラーが発生しました" });
                });
            break;

        case 'kick':
            if (!message.member.permissions.has(Permissions.FLAGS.KICK_MEMBERS)) return message.channel.send("❌ 権限が不足しています。");

            const kick_member = await fetchData(message);
            kick_member.kick()
                .then((kicked_user) => {
                    return message.channel.send({ content: `${kicked_user.user.tag} をKickしました` });
                })
                .catch(reason => {
                    console.warn(reason);
                    return message.channel.send({ content: "エラーが発生しました" });
                });
            break;

        case 'ping':
            message.channel.send({ content: ` Ping を確認しています...` })
                .then((pingcheck) => pingcheck.edit(`botの速度|${pingcheck.createdTimestamp - message.createdTimestamp} ms`));
            break;

        case 'add-role': {
            const role = message.mentions.roles.first();
            message.guild.members.fetch()
                .then(members => Promise.all(members.map(member => member.roles.add(`${role.id}`))))
                .catch(console.error)
            await message.reply(`ロール:${role.name}を全員に付与しました。`)
            break;
        }


        case 'add-role-noroles': {
            const role = message.mentions.roles.first();
            message.guild.members.fetch()
                .then(members => Promise.all(members.map(member => member.roles.cache.size === 1 ? member.roles.add(`${role.id}`) : member.roles.remove(`${role.id}`))))
                .catch(console.error)
            await message.reply(`ロール:${role}をロールがついていない人に付与しました。`)
            break;

        }

        case 'cnt':
            const [a, b] = args.map(str => Number(str));

            //リアクション数・ロール指定がないまたは順番が逆な場合
            if (!a || message.mentions.roles.size == 0) return message.channel.send("構文エラー:無効なコマンドが送信されました。\n原因として以下の可能性があります。\n> ・カウント数やロールが指定されていなかった\n> ・カウント数とロールの順番が逆である。");

            //メッセージを送る
            const role = message.mentions.roles.first();
            const newMessage = await message.reply(`__リアクション集計中__\n> 目標回数：${a} \n> 対象ロール：${role.name}\n> このBOTのメッセージにリアクションしてください。`);
            //ロールチェック
            const filter = async (reaction, user) => await message.guild?.members.fetch(user.id).then((member) => member.roles.cache.has(role.id)) ?? false;

            const collector = newMessage.createReactionCollector({ filter, max: `${a}` });
            //集計完了
            collector.on("end", collected => collectEnd(collected, collector));
            //集計中のメッセージをリストに登録しておく
            messageUrlList.add(newMessage.url);
            messageAuthorList.add(message.author.id);
            messageDateList.add(message.createdAt);
            //集計完了後の動作定義
            function collectEnd(collected, collector) {
                //集計中のメッセージリストから除去
                messageUrlList.delete(collector.message.url);
                messageAuthorList.delete(message.author.id);
                messageDateList.delete(message.createdAt);
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
                            value: new Date(),
                        },
                    ],
                    footer: {
                        text: `対象ロール:${role.name}`,
                        icon_url: '',
                    },
                };
                message.reply({ content: "リアクションの集計が完了しました。", embeds: [Embed] }) && newMessage.delete();
            }
            break;

        case 'list':
            const listurl = messageUrlList.values();
            const listauthor = messageAuthorList.values();
            const listdate = messageDateList.values();
            if (!listurl) return message.channel.send('現在受け付けている集計はありません。');
            const embed = {
                "title": "現在受け付けているカウント集計",
                "description": `[link](${listurl.next().value})\nUser:<@!${listauthor.next().value}>\nDate:${listdate.next().value}`
            };
            return message.reply({ embeds: [embed] });
            break;

        case 'user':
            const member = await fetchData(message);
            const status_ja = (status) => {
                switch (status) {
                    case 'online': return 'オンライン';
                    case 'offline': return 'オフライン';
                    case 'dnd': return '取り込み中';
                    case 'idle': return '取り込み中';
                }
            }
            const panel = new MessageEmbed()
                .setTitle(`───${member.user.username}さんの情報───`)
                .setDescription(`${member.user.username}さんの情報を表示しています`)
                .setTimestamp(new Date())
                .setFooter({ text: `実行者 : ${message.author.username}` })
                .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                .addFields([
                    { name: "ユーザータグ", value: member.user.discriminator },
                    { name: "ユーザーメンション", value: `<@${member.user.id}>` },
                    { name: "ユーザーID", value: member.user.id },
                    { name: "アカウントの種類", value: member.user.bot ? "BOT" : "USER", inline: true },
                    { name: "現在のステータス", value: status_ja(member.presence.status), inline: true },
                    { name: "サーバー名", value: message.guild.name }
                ])
            message.channel.send({ embeds: [panel] });
            break;
    }
});

//スレッド作成
client.on("threadCreate", async thread => {
    if (thread.guildId === '888981896594350132') {
        await thread.send(`スレッドが作成されました。\n <@&927377284653002772> <@&889029317139517461> <@!594370135230251028>`);
    } else if (thread.guildId === '917221958242947072') {
        await thread.send(`スレッドが作成されました。\n <@&917221958280687624> <@&940148040445067264> <@&917221958297477191>`);
    };
});

//スレッド削除
client.on("threadDelete", async thread => {
    thread.parent.send(`スレッド${thread.name}は削除されました。`);
});

//スレッドアーカイブ
//スレッド名前変更
client.on("threadUpdate", async (oldThread, newThread) => {
    const status = oldThread.archived === newThread.archived;
    if (status === true) {
        newThread.parent.send(`スレッド${oldThread.name}は${newThread.name}に変更されました。`);
    };
    if (status === false) {
        newThread.parent.send(`スレッド${newThread.name}${newThread.archived ? "はアーカイブされました。" : "のアーカイブが解除されました。"}`);
    };
});
//=====================================================

async function fetchData(message) {
    const [command, ...args] = message.content.slice(prefix.length).split(' ');
    const user_id = (message.mentions.members.size > 0) ? message.mentions.members.first().id : args[0];
    if (!user_id) return message.channel.send({ content: "エラー: メンバーが指定されていません\nIDかメンションで指定してください" });
    const member = await message.guild.members.fetch(user_id);
    if (!member) return message.channel.send({ content: "エラー: 指定されたIDが見つかりません" });
    return member;
}

//メッセージURL展開(snowflakesについてよく知らないので正規表現)
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
        timestamp: new Date()
      }]
    }))
    .catch(console.error);
}); 

client.login(process.env.token);
