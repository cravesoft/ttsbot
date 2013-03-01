#!/usr/bin/env node

var fs = require('fs'),
    url = require('url');

function main(config) {
    var irc = require('irc'),
        net = require('net'),
        util = require('util'),
        request = require('request'),
        exec  = require('child_process').exec,
        credentials = false,
        sopr_url = 'http://' + config.sopr_host + ':%d/synth?text=%s&path=%s',
        sox_command = 'sox -t raw -r 16000 -e signed -b 16 -c 1 %s %s channels 2', 
        users = {};
    if(config.secure) {
        var crypto = require("crypto"),
            key = fs.readFileSync(config.ssl_key, 'ascii'),
            cert = fs.readFileSync(config.ssl_certificate, 'ascii'); 
        credentials = crypto.createCredentials({
            key: key,
            cert: cert
        });
    }
    var bot = new irc.Client(config.irc_host, config.irc_bot_name, {
        port: config.irc_port,
        secure: credentials,
        selfSigned: true,
        certExpired: true,
        debug: true,
        channels: [config.irc_channel_name]
    });
    bot.addListener('error', function(message) {
        console.error('ERROR: %s: %s', message.command, message.args.join(' '));
    });
    bot.addListener('message', function(from, to, message) {
        if(config.irc_bot_name == to) {
            // Ignore messages sent to bot
            return;
        }
        var user = users[from];
        if(message.match(/^!tts [a-z]{2}-[A-Z]{2}$/i)) {
            // Change user language
            lang = message.match(/[a-z]{2}-[A-Z]{2}/i)[0];
            if(lang in config.sopr_ports) {
                user['lang'] = lang;
                console.log('%s is given voice %s', from, user['lang']);
            }
        } else if(message.match(/^!tts pitch \d+$/i)) {
            // Change user pitch
            pitch = message.match(/\d+/i)[0];
            user['pitch'] = pitch;
            console.log('%s is given speed %d', from, user['pitch']);
        } else if(message.match(/^!tts speed \d+$/i)) {
            // Change user speed
            speed = message.match(/\d+/i)[0];
            user['speed'] = speed;
            console.log('%s is given speed %d', from, user['speed']);
        } else if(message.match(/^!tts volume \d+$/i)) {
            // Change user volume
            volume = message.match(/\d+/i)[0];
            user['volume'] = volume;
            console.log('%s is given volume %d', from, user['volume']);
        } else {
            var ts = Date.now() / 1000,
                pcmPath = config.playlist_path + '/' + ts + '.pcm',
                wavPath = config.playlist_path + '/' + ts + '.wav',
                port = config.sopr_ports[user['lang']],
                text = urlify(message);
                text = addMarkup(text, user);
            // Synthesize text
            request.post(
                util.format(sopr_url, port, text, pcmPath),
                function(error, response, body) {
                    if(!error && response.statusCode == 200) {
                        console.log('%s was synthesized in %s', text, pcmPath);
                        // Convert PCM to WAV
                        exec(util.format(sox_command, pcmPath, wavPath), 
                        function(error, stdout, stderr) {
                            console.log('%s was converted to %s', wavPath, pcmPath);
                            if(error !== null) {
                                console.log('ERROR: %s', error);
                            } else {
                                // Push file into queue
                                var client = net.connect( {
                                    port: config.ls_telnet_port,
                                    host: config.ls_telnet_host
                                }, function() {
                                    console.log('Connected to telnet client');
                                    client.write('request.push ' + wavPath + '\n', function() {
                                        client.end();
                                    });
                                });
                                client.on('data', function(data) {
                                    //console.log('Received %s from telnet server', data.toString());
                                    client.end();
                                });
                                client.on('end', function() {
                                    console.log('Disconnected from telnet client');
                                });
                            }
                        });
                    }
                }
            );
        }
    });
    bot.addListener('pm', function(nick, message) {
        console.log('Got private message from %s: %s', nick, message);
    });
    bot.addListener('join', function(channel, nick) {
        console.log('%s has joined %s', nick, channel);
        if(!(nick in users) && nick != config.irc_bot_name) {
            addUser(nick);
        }
    });
    bot.addListener('part', function(channel, nick, reason) {
        console.log('%s has left %s: %s', nick, channel, reason);
    });
    bot.addListener('kick', function(channel, nick, by, reason) {
        console.log('%s was kicked from %s by %s: %s', nick, channel, by, reason);
    });
    bot.addListener('names', function(channel, nicks) {
        Object.keys(nicks).forEach(function(nick) {
            if(nick != config.irc_bot_name) {
                addUser(nick);
            }
        });
    });
    function addUser(nick) {
        var user = {
            'lang': getDefaultLanguage(),
            'pitch': config.user_default_pitch,
            'speed': config.user_default_speed,
            'volume': config.user_default_volume
        };
        console.log('%s is given voice %s', nick, user['lang']);
        console.log('%s is given pitch %s', nick, user['pitch']);
        console.log('%s is given speed %s', nick, user['speed']);
        console.log('%s is given volume %s', nick, user['volume']);
        users[nick] = user;
    }
    function getDefaultLanguage() {
        if(config.user_default_language) {
            return config.user_default_language;
        } else {
            var k = Math.floor(Math.random()*Object.keys(config.sopr_ports).length);
            return Object.keys(config.sopr_ports)[k];
        }
    }
    function addMarkup(text, user) {
        text = util.format('<pitch level="%d">%s</pitch>', user['pitch'], text);
        text = util.format('<volume level="%d">%s</volume>', user['volume'], text);
        text = util.format('<speed level="%d">%s</speed>', user['speed'], text);
        return text;
    }
}

function urlify(text) {
    var urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function(address) {
        var host = url.parse(address).host;
        return host;
    });
}

function getConfigFile(path, callback) {
    fs.readFile(path, 'utf8', function(err, json_string) {
        if(err) {
            console.error("Could not open config file:", err.path);
            callback(null);
        } else {
            callback(JSON.parse(json_string));
        }
    });
}

var configPath = './server/config.json';

getConfigFile(configPath, function(config) {
    if(config) {
        main(config);
    } else {
        console.error("Server cannot start without any configuration file.");
        process.exit(1);
    }
});
