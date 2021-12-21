# ezvoice

### A lightweight package designed to make it just a bit easier to play and record sound with @discordjs/voice

##### Discord: nab138#2035

### Examples

#### Connect to channel and play a song, then disconnect after it's done

```js
const voice = require('ezvoice')
client.on('messageCreate', (message) => {
    if(!message.content.startsWith(prefix)) return
    let command = string.slice(prefix.length)
    if(command == 'play'){
        if(!message.member.voice.channel) return message.reply("I'm not in a voice channel!")
        voice.play('./song.mp3', message.member.voice.channel) 
    }
})
```