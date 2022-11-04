DLMP3 Bot forked from https://github.com/GitAccountThatIMade/DLMP3 (which is forked from https://github.com/Alee14/DLMP3 ) focusing on easy deployment without permanent changes on Windows 10 systems.

# DLMP3 Bot (Discord.JS Local MP3) 

Windows 10 Setup:
1. call install_dlmp3.bat
2. copy config.json.init to config.json and change entries in json to your token/user_id/etc:
* Add a new application by clicking "New Application" at https://discord.com/developers/applications (login to your discord account if not done yet)
* For the selected new application click "Bot" on the left side menu and the "Add Bot" button; Unset the "Public Bot" option
* Click the "Copy" Button next to the Token on the Bot overview page and paste the value into the config.json "token" field
* Select "OAuth2" on the left side, enter https://discordapp.com/oauth2/authorize?&client_id=YOUR_CLIENT_ID&scope=bot in the Redirects text prompt; click "Save Changes"; open the url in a browser
* From the pull-down menu select the target Discord server; select "Authorize" and solve the CAPTCHA (a notification on Discord should indicate that the bot has access to the server)
* Activate "Developer Mode" in Discord (User Settings/Advanced/Developer Mode)
* At the target Discord server, right-click on your name (right-side menu) and click on "Copy ID"; paste value into config.json "botOwner" field
* At the target Discord server, right-click a text channel (left-side menu) and click on "Copy ID"; paste value into config.json "statusChannel" field
* At the target Discord server, right-click a voice channel (left-side menu) and click on "Copy ID"; paste value into config.json "voiceChannel" field
3. copy all mp3 files you want to use into the ./music folder

Windows 10 Usage: 
call start_dlmp3.bat

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
