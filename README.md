DLMP3 Bot forked from https://github.com/GitAccountThatIMade/DLMP3 (which is forked from https://github.com/Alee14/DLMP3 )
# DLMP3 Bot (Discord.JS Local MP3)

Windows 10 Setup:
1. call install_dlmp3.bat
2. copy config.json.init to config.json and change entries in json to your token/user_id/etc:
* Add a new application by clicking "New Application" at https://discord.com/developers/applications 
* For the selected new application click "Bot" on the left side menu and the "Add Bot" button; Unset the "Public Bot" option
* Click the "Copy" Button next to the Token on the Bot overview page and paste the value into the config.json "token" field
3. copy all mp3 files you want to use into the ./music folder

Windows 10 Usage: call start_dlmp3.bat

Launch the bot using `node bot.js` in terminal.

# Help Command
```
Public Only
-----------
help - Displays commands.
playing - Tells you what it's playing at the moment.
about - About the bot.
resume - Resumes music.
pause - Pauses music.
skip - Skips the audio track.

Bot Owner Only
--------------
join - Joins voice chat.
leave - Leaves voice chat.
stop - Stops bot.
```
