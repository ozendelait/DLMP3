/**************************************************************************
 * 
 *  DLMP3 Bot: A Discord bot that plays local mp3 audio tracks.
 *  (C) Copyright 2020
 *  Programmed by Andrew Lee 
 *  
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * 
 ***************************************************************************/
const Discord = require('discord.js');
const fs = require('fs');
const bot = new Discord.Client();
const config = require('./config.json');

// Create an enum so we don't mistype anything
const COMMANDS = Object.freeze({
    HELP: "help",
    PLAYING: "playing",
    ABOUT: "about",
    RESUME: "resume",
    PAUSE: "pause",
    SKIP: "skip",
    SHUFFLE: "shuffle",
    PLAYLIST: "playlist",
    JOIN: "join",
    LEAVE: "leave",
    STOP: "stop"
});

let playlist = null; // The file (sans extension) that contains the songs in the playlist
let dispatcher;
let audio;
let voiceChannel;
let fileData;
let connection; // The connection (not a fan of how it's a global variable, but anonymous functions get tricky with scope)
let songs = []; // The songs that wil be played
let currentTrack = 0; // The index of the song list that is playing in the playlist / shuffle, etc. right now

bot.login(config.token);

function incrementSong() { // Increments the track number and returns the new current track for convenience
    currentTrack = (currentTrack + 1) % songs.length;
    return currentTrack;
}


async function prepareSongs() {
    voiceChannel = bot.channels.cache.get(config.voiceChannel);
    if (!voiceChannel) return console.error('The voice channel does not exist!\n(Have you looked at your configuration?)');
    let files = null; // Stores the array of files to read from

    files = await voiceChannel.join().then(_connection => {
        connection = _connection;
        let readFailed = false; // Set to true if the read of the playlist fails
        const playlistPath = "./" + playlist + ".json"

        if (playlist !== null && fs.existsSync(playlistPath)) {
            let rawInput = fs.readFileSync(playlistPath, "utf8");
            files = JSON.parse(rawInput);
        }
        if (readFailed || playlist == null || !fs.existsSync(playlistPath)) {
            files = fs.readdirSync('./music');
        }
        console.log(files);
        files.sort((a, b) => Math.random() - 0.5); // 50-50 chance to be higher or lower (so it's a kind of shuffle, see https://dev.to/codebubb/how-to-shuffle-an-array-in-javascript-2ikj)

        files.filter(element => element.endsWith(".mp3")); // Remove everything that isn't an mp3
        return files;

    }).catch(e => {
        console.error(e);
    });

    return files; // Return the files to play
}




function playAudio() {
    let fileName = songs[currentTrack]; // Get the current file name
    dispatcher = connection.play('./music/' + fileName);


    dispatcher.on('start', () => {
        console.log('Now playing ' + fileName);
        fileData = "Now Playing: " + fileName;
        fs.writeFile("now-playing.txt", fileData, (err) => {
            if (err)
                console.log(err);
        });
        const statusEmbed = new Discord.MessageEmbed()
            .addField('Now Playing', `${fileName}`)
            .setColor('#0066ff')

        let statusChannel = bot.channels.cache.get(config.statusChannel);
        if (!statusChannel) return console.error('The status channel does not exist! Skipping.');
        statusChannel.send(statusEmbed);
    });

    dispatcher.on('error', console.error);

    dispatcher.on('finish', () => {
        console.log('Music has finished playing.');
        playAudio(songs, incrementSong()); // Cycle through the shuffled list over and over
    });
}

bot.on('ready', () => {
    console.log('Bot is ready!');
    console.log(`Logged in as ${bot.user.tag}!`);
    console.log(`Prefix: ${config.prefix}`);
    console.log(`Owner ID: ${config.botOwner}`);
    console.log(`Voice Channel: ${config.voiceChannel}`);
    console.log(`Status Channel: ${config.statusChannel}\n`);

    bot.user.setPresence({
        activity: {
            name: `Music | ${config.prefix}help`
        },
        status: 'online',
    }).then(presence => console.log(`Activity set to "${presence.activities[0].name}"`)).catch(console.error);

    const readyEmbed = new Discord.MessageEmbed()
        .setAuthor(`${bot.user.username}`, bot.user.avatarURL())
        .setDescription('Starting bot...')
        .setColor('#0066ff')

    let statusChannel = bot.channels.cache.get(config.statusChannel);
    if (!statusChannel) return console.error('The status channel does not exist! Skipping.');
    statusChannel.send(readyEmbed);
    console.log('Connected to the voice channel.');
});

bot.on('message', async msg => {
    if (msg.author.bot) return;
    if (!msg.guild) return;
    if (!msg.content.startsWith(config.prefix)) return;
    let command = msg.content.split(' ')[0];
    command = command.slice(config.prefix.length);

    // Public allowed commands

    if (command == COMMANDS.HELP) {
        if (!msg.guild.member(bot.user).hasPermission('EMBED_LINKS')) return msg.reply('**ERROR: This bot doesn\'t have the permission to send embed links please enable them to use the full help.**');
        const helpEmbed = new Discord.MessageEmbed()
            .setAuthor(`${bot.user.username} Help`, bot.user.avatarURL())
            .setDescription(`Currently playing \`${audio}\`.`)
            .addField('Public Commands', `${config.prefix}help\n${config.prefix}ping\n${config.prefix}git\n${config.prefix}playing\n${config.prefix}about\n${config.prefix}resume\n${config.prefix}pause\n${config.prefix}skip\n`, true)
            .addField('Bot Owner Only', `${config.prefix}join\n${config.prefix}leave\n${config.prefix}stop\n`, true)
            .setFooter('© Copyright 2020 Andrew Lee. Licensed with GPL-3.0.')
            .setColor('#0066ff')

        msg.channel.send(helpEmbed);
    }

    if (command == COMMANDS.PLAYING) {
        msg.channel.send('Currently playing `' + audio + '`.');
    }

    if (command == COMMANDS.ABOUT) {
        msg.channel.send('The bot code was forked from Andrew Lee (Alee#4277). Written in Discord.JS and licensed with GPL-3.0.');
    }

    if (command == COMMANDS.RESUME) {
        msg.reply('Resuming music.');
        dispatcher.resume();
    }

    if (command == COMMANDS.PAUSE) {
        msg.reply('Pausing music.');
        dispatcher.pause();
    }

    if (command == COMMANDS.SKIP) {
        msg.reply('Skipping `' + audio + '`...');
        dispatcher.pause();
        dispatcher = null;
        incrementSong();
        playAudio();
    }

    if (command == COMMANDS.SHUFFLE) { // Play from all the songs in ./music
        playlist = null;
        songs = await prepareSongs();
        playAudio();
    }

    if (command.startsWith(COMMANDS.PLAYLIST)) { // Play from the playlist json
        let noCommand = msg.content.split(" ").slice(1, msg.content.length); // Remove the command from the input
        playlist = noCommand.join(' '); // Get all of the message (other than the command), and put any spaces back in that were removed from the split
        songs = await prepareSongs();
        playAudio();
    }


    if (![config.botOwner].includes(msg.author.id)) return;

    // Bot owner exclusive

    if (command == COMMANDS.JOIN) {
        msg.reply('Joining voice channel.');
        console.log('Connected to the voice channel.');
    }

    if (command == COMMANDS.LEAVE) {
        voiceChannel = bot.channels.cache.get(config.voiceChannel);
        if (!voiceChannel) return console.error('The voice channel does not exist!\n(Have you looked at your configuration?)');
        msg.reply('Leaving voice channel.');
        console.log('Leaving voice channel.');
        fileData = "Now Playing: Nothing";
        fs.writeFile("now-playing.txt", fileData, (err) => {
            if (err)
                console.log(err);
        });
        audio = "Not Playing";
        dispatcher.destroy();
        voiceChannel.leave();
    }

    if (command == COMMANDS.STOP) {
        await msg.reply('Powering off...');
        fileData = "Now Playing: Nothing";
        await fs.writeFile("now-playing.txt", fileData, (err) => {
            if (err)
                console.log(err);
        });
        const statusEmbed = new Discord.MessageEmbed()
            .setAuthor(`${bot.user.username}`, bot.user.avatarURL())
            .setDescription(`That\'s all folks! Powering down ${bot.user.username}...`)
            .setColor('#0066ff')
        let statusChannel = bot.channels.cache.get(config.statusChannel);
        if (!statusChannel) return console.error('The status channel does not exist! Skipping.');
        await statusChannel.send(statusEmbed);
        console.log('Powering off...');
        dispatcher.destroy();
        bot.destroy();
        process.exit(0);
    }

});