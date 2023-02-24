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
const { SSL_OP_TLS_BLOCK_PADDING_BUG } = require('constants');
const { Client, Discord, GatewayIntentBits, InteractionType, EmbedBuilder, ActivityType } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection, createAudioPlayer, createAudioResource, NoSubscriberBehavior, AudioPlayerStatus } = require('@discordjs/voice');
const { repeat } = require('ffmpeg-static');
const fs = require('fs');
const bot = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates] });
const config = require('./config.json');
//const { setTimeout: setTimeoutPromise } = require('node:timers/promises');

require('events').EventEmitter.defaultMaxListeners = 24;

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
    STOP: "stop",
    REPEAT: "repeat",
    ISREPEAT: "isrepeat",
    FILE: "file",
    EXPORT: "export",
    LIST: "list",
    CLEAR: "clear",
    QUEUE: "queue"
});

let playlist = null; // The file (sans extension) that contains the songs in the playlist
let audio;
let voiceChannel;
let fileData;
let connection; // The connection (not a fan of how it's a global variable, but anonymous functions get tricky with scope)
let songs = []; // The songs that wil be played
let currentTrack = 0; // The index of the song list that is playing in the playlist / shuffle, etc. right now
let doRepeat = false; // If this is true, the song will be repeated (not incremented)
let resource_fn = null;
let player = null;
let last_play = 0;

bot.login(config.token);

function incrementSong() {
    // Increments the track number and returns the new current track for convenience
    // Unless repeat is on
    if (songs.length !== 0) {
        currentTrack = doRepeat ? currentTrack : (currentTrack + 1) % songs.length;
    } else {
        currentTrack = 0; // If there are no elements, make it default to 0 so when omething starts playing it is at the start  (not sure if this will be a problem but it can't hurt ot be sure)
    }
    return currentTrack;
}

function toggleRepeat() {
    doRepeat = !doRepeat;
}

async function prepareSongs() {
    voiceChannel = bot.channels.cache.get(config.voiceChannel);
    if (!voiceChannel) return console.error('The voice channel does not exist!\n(Have you looked at your configuration?)');
    let files = null; // Stores the array of files to read from
    if(player) {
        player.stop();
        player = null;
    }
    player = createAudioPlayer({
            behaviors: {
            noSubscriber: NoSubscriberBehavior.Play,
            maxMissedFrames: Math.round(config.maxTransmissionGap / 20),
        },
    });

    connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guild.id,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    }).subscribe(player);

	let readFailed = false; // Set to true if the read of the playlist fails
	const playlistPath = "./playlists/" + playlist + ".json"

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

    return files; // Return the files to play
}

function playAudio() {
    audio = songs[currentTrack];
    if(audio.indexOf('..')>=0) {
       console.log("Ignoring bad relative path "+fileName);
       audio = '.InValId.mp3';
    }
    let fileName = './music/' + audio; // Get the current file name
    
    if(!fs.existsSync(fileName)) {
        songs.splice(currentTrack, 1);
        console.log("Dropping invalid file "+fileName);
        audio = " no song.";
        return;
    }
    let curr_play = Date.now()
    if(curr_play-last_play < 500) {
        console.log("Detected invalid skipping. Restarting... ("+(curr_play-last_play).toString()+" ms)");
        fs.writeFileSync("_init_file.txt", audio);
        process.exit(1);
    }
    last_play = curr_play
    resource_fn = createAudioResource(fileName)
    player.play(resource_fn);

    console.log('Now playing ' + fileName);
    fileData = "Now Playing: " + fileName;
    fs.writeFile("now-playing.txt", fileData, (err) => {
            if (err)
                console.log(err);
     });
     audio = fileName;
     player.once(AudioPlayerStatus.Idle, () => {
      setTimeout(() => {
      console.log('Music has finished playing after '+((Date.now()-last_play)/1000).toString()+ ' sec.');
      player.stop();
      playAudio(songs, incrementSong()); // Cycle through the shuffled list over and over
     }, 1000);
  })
}

bot.once('ready', async() => {
    if(fs.existsSync('./avatar.jpg')) {
        bot.user.setAvatar(fs.readFileSync('./avatar.jpg'));
    }
    console.log('Bot is ready!');
    console.log(`Logged in as ${bot.user.tag}!`);
    console.log(`Prefix: ${config.prefix}`);
    console.log(`Owner ID: ${config.botOwner}`);
    console.log(`Voice Channel: ${config.voiceChannel}`);
    console.log(`Status Channel: ${config.statusChannel}\n`);

    bot.user.setPresence({
        activities: [{
            name: `Music | ${config.prefix}help`,
            type: ActivityType.Playing
        }],
        status: 'online',
    })
    console.log(`Activity set to "${bot.presence.activities[0]}"`);
    // const readyEmbed = new EmbedBuilder()
    //     .setAuthor(`${bot.user.username}`, bot.user.avatarURL())
    //     .setDescription('Starting bot...')
    //     .setColor('#0066ff')

    let statusChannel = bot.channels.cache.get(config.statusChannel);
    if (!statusChannel) return console.error('The status channel does not exist! Skipping.');
    //statusChannel.send("Music Bot Restarted...");
    console.log('Connected to the voice channel.');
    if(fs.existsSync('_init_file.txt')) {
        let init_restart = fs.readFileSync('_init_file.txt', 'utf8');
        if( init_restart.length ) {
            console.log(`Playing ${init_restart} after bot restarted`);
            await prepareSongs();
            songs.splice(currentTrack, 0, init_restart);
            playAudio();
        }
    }
});

bot.on('messageCreate', async msg => {
    if (msg.author.bot) return;
    if (!msg.guild) return;
    if (!msg.content.startsWith(config.prefix)) return;
    let command = msg.content.split(' ')[0];
    command = command.slice(config.prefix.length);

    // Public allowed commands

    if (command == COMMANDS.HELP) {
        //const user_perm = msg.guild.members.cache.get(bot.user);
        //if (!user_perm.hasPermission('EMBED_LINKS')) return msg.reply('**ERROR: This bot doesn\'t have the permission to send embed links please enable them to use the full help.**');
        const helpEmbed = new EmbedBuilder();
        helpEmbed.setAuthor({name: `${bot.user.username} Help`, iconURL: bot.user.avatarURL()});
        helpEmbed.setDescription(`Currently playing \`${audio}\`.`);
        helpEmbed.addFields({name: 'Public Commands',
                value: ` ${config.prefix}help\n
                  ${config.prefix}list\n
                  ${config.prefix}playing\n
                  ${config.prefix}about\n
                  ${config.prefix}resume\n
                  ${config.prefix}clear\n
                  ${config.prefix}pause\n
                  ${config.prefix}skip\n
                  ${config.prefix}repeat\n
                  ${config.prefix}isrepeat\n
                  ${config.prefix}file <song name without extension>\n
                  ${config.prefix}shuffle\n
                  ${config.prefix}playlist <playlist name without extension>\n
                  ${config.prefix}export <file name without extension>\n`, 
                  inline: true});
        helpEmbed.addFields({name: 'Bot Owner Only', value:`${config.prefix}join\n${config.prefix}leave\n${config.prefix}stop\n`, inline:true});
        helpEmbed.setFooter({text:'© Copyright 2020 Andrew Lee/ 2022 Oliver Zendel. Licensed with GPL-3.0.'});
        helpEmbed.setColor('#0066ff');

        msg.channel.send({ embeds: [helpEmbed] });
    }

    if (command == COMMANDS.PLAYING) {
        msg.channel.send('Currently playing `' + audio + '`.');
    }

    if (command == COMMANDS.ABOUT) {
        msg.channel.send('The bot code was forked from Andrew Lee (Alee#4277) by Oliver Zendel. Written in Discord.JS and licensed with GPL-3.0.');
    }

    if (command == COMMANDS.RESUME) {
        msg.reply('Resuming music.');
        player.unpause();
    }

    if (command == COMMANDS.PAUSE) {
        msg.reply('Pausing music.');
        player.pause();
    }

    if (command == COMMANDS.CLEAR) {
        msg.reply('Clearing playlist.');
        player.pause();
        songs = [];
    }
    
    if (command == COMMANDS.QUEUE) {
        let allInputs = msg.content.split(' '); // Todo: refactor this out at the start when it's first split
        let filePath = allInputs.slice(1, allInputs.length).join(' '); // Get everything but the command, putting the space back
        let mp3pos = filePath.indexOf(".mp3");
        if (mp3pos < 0) {filePath = filePath + ".mp3";}
        songs.splice(currentTrack, 0, filePath);
    }
    
    if (command == COMMANDS.SKIP) {
        // msg.reply('Skipping `' + audio + '`...');
        player.pause();
        incrementSong();
        playAudio();
    }

    if (command == COMMANDS.SHUFFLE) { // Play from all the songs in ./music
        playlist = null;
        songs = await prepareSongs();
        playAudio();
    }

    if (command == COMMANDS.REPEAT) { // Toggle repeat on and off
        toggleRepeat();
    }

    if (command == COMMANDS.ISREPEAT) { // show if repeat is toggled on
        msg.reply(`${doRepeat}`);
    }

    if (command == COMMANDS.FILE) { // play a specific file
        let allInputs = msg.content.split(' '); // Todo: refactor this out at the start when it's first split
        let filePath = allInputs.slice(1, allInputs.length).join(' '); // Get everything but the command, putting the space back

        if (player === undefined || connection === undefined) { // if dispatcher is undefined, connection should be too, but in case later change makes this not the case, include both checks
            await prepareSongs(); // This initialises all the connections, so if it hasn't been called yet, call this now
        } else {
            player.pause();
        }
        incrementSong();
        let mp3pos = filePath.indexOf(".mp3");
        if (mp3pos < 0) {filePath = filePath + ".mp3";}
        songs.splice(currentTrack, 0, filePath);
        playAudio();
    }

    if (command == COMMANDS.EXPORT) {
        if (songs.length > 0) {
            let allInputs = msg.content.split(' '); // Todo: refactor this out at the start when it's first split
            let outputPath = allInputs.slice(1, allInputs.length).join(' '); // Get everything but the command, putting the space back
            try {
                fs.appendFileSync("./playlists/" + outputPath + ".json", "[\"" + songs.join("\", \"") + "\"]"); // Write the current playlist to file.  Synchronous doesn't super matter here because it is really fast.  I will swap to async if it is causing delay
            } catch {
                msg.reply("Error exporting!");
            }
            msg.reply("File exported as ./playlists/" + outputPath + ".json");
        } else {
            msg.reply("There are no songs currently playing!");
        }
    }
    
    if (command == COMMANDS.LIST) {
        files = fs.readdirSync('./music');
        msg.reply("Listing of all music&playlist files:\n`"+files.join("; ")+"\n`");
    }
    /* 
    TODO: 

        * Repeat for x times
        * Repeat for x minutes
        * Reduce / Increase volume via post request / command

    */


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
        const statusEmbed = new EmbedBuilder()
            .setAuthor({name: `${bot.user.username}`, iconURL: bot.user.avatarURL()})
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
