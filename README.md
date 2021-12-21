# ezvoice

### A lightweight package designed to make it just a bit easier to play and record sound with @discordjs/voice

##### Discord: nab138#2035

### Examples

#### Connect to channel and play a song, then disconnect after it's done

```js
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const voice = require('ezvoice')
const prefix = '!'

client.once('ready', () => {
	console.log('Ready!');
});
client.on('messageCreate', (message) => {
    if(!message.content.startsWith(prefix)) return
    let command = string.slice(prefix.length)
    if(command == 'play'){
        if(!message.member.voice.channel) return message.reply("I'm not in a voice channel!")
        voice.play('./song.mp3', message.member.voice.channel) 
    }
})

client.login(token);
```
#### Record a user's voice to a file

```js
const { MessageAttachment, Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const voice = require('ezvoice')
const prefix = '!'

client.once('ready', () => {
	console.log('Ready!');
});
client.on('messageCreate', (message) => {
    if(!message.content.startsWith(prefix)) return
    let command = string.slice(prefix.length)
    if(command == 'record'){
        if(!message.member.voice.channel) return message.reply("I'm not in a voice channel!")
        const connection = voice.connectToChannel(message.member.voice.channel)
        voice.recordToFile(connection.receiver, message.author.id, `${message.author.id}-recording.ogg`).then(() => {
            connection.destroy()
            const file = new MessageAttachment('./${message.author.id}-recording.ogg');
            message.channel.send({content: `Here's your recording:` files:[file]})
        })
    }
})
client.login(token)
```