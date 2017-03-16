/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


This is a sample Slack bot built with Botkit.

This bot demonstrates many of the core features of Botkit:

* Connect to Slack using the real time API
* Receive messages based on "spoken" patterns
* Reply to messages
* Use the conversation system to ask questions
* Use the built in storage system to store and retrieve information
  for a user.

# RUN THE BOT:

  Get a Bot token from Slack:

    -> http://my.slack.com/services/new/bot

  Run your bot from the command line:

    token=<MY TOKEN> node slack_bot.js

# USE THE BOT:

  Find your bot inside Slack to send it a direct message.

  Say: "Hello"

  The bot will reply "Hello!"

  Say: "who are you?"

  The bot will tell you its name, where it is running, and for how long.

  Say: "Call me <nickname>"

  Tell the bot your nickname. Now you are friends.

  Say: "who am I?"

  The bot will tell you your nickname, if it knows one for you.

  Say: "shutdown"

  The bot will ask if you are sure, and then shut itself down.

  Make sure to invite your bot into other channels using /invite @<my bot>!

# EXTEND THE BOT:

  Botkit has many features for building cool and useful bots!

  Read all about it here:

    -> http://howdy.ai/botkit

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/


if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

var Botkit = require('./lib/Botkit.js');
var os = require('os');

var controller = Botkit.slackbot({
    debug: true
});

var bot = controller.spawn({
    token: process.env.token
}).startRTM();

controller.hears(['残業', '疲れた', '炎上', 'つらい', '死', '殺', 'しんどい', 'だるい'], 'direct_message,direct_mention,mention,ambient', function(bot, message) {
    bot.reply(message,'~(=^･ω･^)_:tea:　お茶でもどうぞ');
});

controller.hears(['かわいい','好き','ちゅ','愛し','i love you','i love u','なで','ぺろ','ぽんぽん'], 'direct_message,direct_mention,mention,ambient', function(bot, message) {
    bot.reply(message,'えへへ〜');
});

controller.hears(['こんにちは', 'やあ', 'どうも', 'Hello', 'hi'], 'direct_message,direct_mention,mention,ambient', function(bot, message) {

/*    bot.api.reactions.add({
        timestamp: message.ts,
        channel: message.channel,
        name: 'cat',
    }, function(err, res) {
        if (err) {
            bot.botkit.log('Failed to add emoji reaction :(', err);
        }
    });
*/

    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'こんにちは ' + user.name + 'さん!!');
        } else {
            bot.reply(message, 'こんにちは！');
        }
    });
});

controller.hears(['call me (.*)', 'my name is (.*)'], 'direct_message,direct_mention,mention,ambient', function(bot, message) {
    var name = message.match[1];
    controller.storage.users.get(message.user, function(err, user) {
        if (!user) {
            user = {
                id: message.user,
            };
        }
        user.name = name;
        controller.storage.users.save(user, function(err, id) {
            bot.reply(message, 'わかったー！ あなたのことは ' + user.name + ' さんって呼ぶね！');
        });
    });
});

controller.hears(['what is my name', 'who am i'], 'direct_message,direct_mention,mention,ambient', function(bot, message) {

    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'あなたは ' + user.name + 'さんだよね！');
        } else {
            bot.startConversation(message, function(err, convo) {
                if (!err) {
                    convo.say('まだあなたの名前をしらないよ！');
                    convo.ask('なんて呼んでほしい？', function(response, convo) {
                        convo.ask('あなたは `' + response.text + '`って呼んでほしいの？（y/n）', [
                            {
                                pattern: 'y',
                                callback: function(response, convo) {
                                    // since no further messages are queued after this,
                                    // the conversation will end naturally with status == 'completed'
                                    convo.next();
                                }
                            },
                            {
                                pattern: 'n',
                                callback: function(response, convo) {
                                    // stop the conversation. this will cause it to end with status == 'stopped'
                                    convo.stop();
                                }
                            },
                            {
                                default: true,
                                callback: function(response, convo) {
                                    convo.repeat();
                                    convo.next();
                                }
                            }
                        ]);

                        convo.next();

                    }, {'key': 'nickname'}); // store the results in a field called nickname

                    convo.on('end', function(convo) {
                        if (convo.status == 'completed') {
                            bot.reply(message, 'OK! I will update my dossier...');

                            controller.storage.users.get(message.user, function(err, user) {
                                if (!user) {
                                    user = {
                                        id: message.user,
                                    };
                                }
                                user.name = convo.extractResponse('nickname');
                                controller.storage.users.save(user, function(err, id) {
                                    bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
                                });
                            });



                        } else {
                            // this happens if the conversation ended prematurely for some reason
                            bot.reply(message, 'はーい！おぼえたよ！');
                        }
                    });
                }
            });
        }
    });
});

controller.hears(['おみくじ'], 'direct_message,direct_mention,mention', function(bot, message) {
  var rand = Math.floor(Math.random()*5);
  if (rand == 0) msg = "やったあ！大吉";
  if (rand == 1) msg = "まあまあかな。。中吉";
  if (rand == 2) msg = "にゃー！吉";
  if (rand == 3) msg = "むむ。。凶";
  if (rand == 4) msg = "にゃー。。。大凶";
  bot.reply(message,'あなたの運勢は……'+ msg +'だよ〜！');
});

controller.hears(['食べよう？','食べる？','what my lunch'], 'direct_message,direct_mention,mention', function(bot, message) {
  var rand = Math.floor(Math.random()*5);
  if (rand == 0) msg = "和食";
  if (rand == 1) msg = "中華";
  if (rand == 2) msg = "イタリアン";
  if (rand == 3) msg = "アジア料理";
  if (rand == 4) msg = "喫茶店";
  bot.reply(message,'きょうのごはん:heart:！'+ msg +'なんてどうですか？');
});

controller.hears(['にゃ', 'meow'], 'direct_message,direct_mention,mention,ambient', function(bot, message) {
    bot.reply(message,'にゃーん！');
});

/*controller.hears(['shutdown'], 'direct_message,direct_mention,mention,ambient', function(bot, message) {

    bot.startConversation(message, function(err, convo) {

        convo.ask('Are you sure you want me to shutdown?', [
            {
                pattern: bot.utterances.yes,
                callback: function(response, convo) {
                    convo.say('Bye!');
                    convo.next();
                    setTimeout(function() {
                        process.exit();
                    }, 3000);
                }
            },
        {
            pattern: bot.utterances.no,
            default: true,
            callback: function(response, convo) {
                convo.say('*Phew!*');
                convo.next();
            }
        }
        ]);
    });
});*/

//これ実装したい: http://bit.ly/2jD14ri

controller.hears(['説明', 'usage', '使い方'], 'direct_message,direct_mention,mention', function(bot, message) {
  bot.reply(message, 'せつめいしょです：https://gist.github.com/tmtkg/0729134a2532cff9c70b70b2c3ff8c4e');
});

controller.hears(['作り方', 'How to make'], 'direct_message,direct_mention,mention', function(bot, message) {
  bot.reply(message, 'botのつくりかたです：https://gist.github.com/tmtkg/962f555de1bb72fab09f5d0b14cbdba9');
});

controller.hears(['居酒屋', '飲み会', '飲み屋'], 'direct_message,direct_mention,mention', function(bot, message) {
  bot.reply(message, '使えそうな飲み屋さんリストです：https://gist.github.com/tmtkg/2c0ffe3e747c531068d9cc42a50fa8e9');
});

controller.hears(['uptime', 'identify yourself', 'who are you', 'what is your name'],
    'direct_message,direct_mention,mention,ambient', function(bot, message) {

        var hostname = os.hostname();
        var uptime = formatUptime(process.uptime());

        bot.reply(message,
            ':heart_eyes_cat: わたしの名前は <@' + bot.identity.name +
             '>です！ 稼働時間は ' + uptime + ' で、 ' + hostname + 'で動いていますよ！');
});

function formatUptime(uptime) {
    var unit = 'second';
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'minute';
    }
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'hour';
    }
    if (uptime != 1) {
        unit = unit + 's';
    }

    uptime = uptime + ' ' + unit;
    return uptime;
}
