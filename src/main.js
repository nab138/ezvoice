const gtts = require('node-gtts')('en');
const {
	NoSubscriberBehavior,
	StreamType,
	createAudioPlayer,
	createAudioResource,
	entersState,
	AudioPlayerStatus,
	VoiceConnectionStatus,
	joinVoiceChannel,
    EndBehaviorType,
    getVoiceConnection,
    VoiceReceiver,
    AudioPlayer,
} = require('@discordjs/voice');
const { createWriteStream } = require('fs');
const { opus } = require('prism-media');
const { pipeline } = require('stream');

// Export functions for use with require()
module.exports = {
    startPlaying,
    connectToChannel,
    createPlayer,
    tts,
    pipeToGuild,
    recordToFile,
    play
}

/**
 * Start playing in the provided voice channel
 * @param {string} url - The url of the resource to play, local or http
 * @param {Object} channel - A discord.js channel object or an object with properties id and guild.voiceAdapterCreator
 * @param {Object} [options] - Options
 * @param {StreamType} [options.type=StreamType.Arbitrary] - The type of the stream provided, for use if you have a stream but no url
 * @param {bool} [options.autoDisconnect=true] - Disconnect after sound ends
 * @returns {Object} - an object with connection and player properties
 */
function play(url, channel, options){
    const player = createPlayer()
    const connection = connectToChannel(channel)
    startPlaying(url, player, options?.type ?? null)
    connection.subscribe(player)
    player.on('stateChange', (oldState, newState) => {if (!(options?.autoDisconnect == false) && newState.status === AudioPlayerStatus.Idle) {
        player.stop()
        connection.destroy()
    }});
    return {connection, player}
}
/**
 * Create a new audio player
 * @returns {AudioPlayer} a new player
 */
function createPlayer(){
    return new Promise((resolve, reject) => {
        try {
            let player = createAudioPlayer({
                behaviors: {
                    noSubscriber: NoSubscriberBehavior.Play,
                    maxMissedFrames: Math.round(5000 / 20),
                },
            });
            resolve(player)
        } catch(e) {
            reject(e)
        }
})
}
/**
 * Read given text using google translate tts
 * @param {string} text - Text to say
 * @param {AudioPlayer} player - Player to play to
 * @param {function} callback - method to call after tts finished
 */
async function tts(text, message, callback){
    const connection = await getVoiceConnection(message.guild.id)
    if(!connection) return message.reply("I'm not in the voice channel anymore!")
    const player = await createPlayer()
    const subscription = connection ? connection.subscribe(player) : null;
    if(connection) startPlaying(gtts.stream(text), player)
    if(connection) player.on('stateChange', (oldState, newState) => {try {if (newState.status === AudioPlayerStatus.Idle) {subscription.unsubscribe(); player.stop(); if(callback != null && callback != undefined){callback()}}}catch(e){void e; connection.destroy()}});
}


/**
 * Start playing a stream.
 * @param {string} url - Url (file or http) to play from
 * @param {AudioPlayer} player - Player to play to
 * @param {Object} [options] - Options to initialize playing
 * @param {StreamType} [options.type=StreamType.Arbitrary] - The type of the stream provided, for use if you have a stream but no url
 * @param {number} [options.volume] - The volume to initialize with, default 1
 */
 function startPlaying(url, player, options) {
    const resource = createAudioResource(url, {
        inputType: options?.type ?? StreamType.Arbitrary,
        inlineVolume: true,
    });
    resource.volume.setVolume(options?.volume ?? 1);

    player.play(resource);
}

/**
 * Join a voice channel
 * @param {Object} channel - Discord.js Voice channel object, or object with properties id and guild.voiceAdapterCreator
 * @returns {VoiceConnection} - connection created by joining channel
 */
async function connectToChannel(channel) {
	const connection = joinVoiceChannel({
		channelId: channel.id,
		guildId: channel.guild.id,
		adapterCreator: channel.guild.voiceAdapterCreator,
	});
	try {
		await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
		return connection;
	} catch (error) {
		connection.destroy();
		console.error(error)
	}
}

/**
 * Play one users voice in another voice channel.
 * @param {VoiceReceiver} receiver - Reciever to record from
 * @param {string} userID - User who's voice to pipe
 * @param {AudioPlayer} targetPlayer - Player to play to
 */
async function pipeToGuild(receiver, userID, targetPlayer){
    const opusStream = receiver.subscribe(userID)
    startPlaying(opusStream, targetPlayer, StreamType.Opus)
}

/**
 * Start playing a stream.
 * @param {VoiceReceiver} receiver - Reciever to record from
 * @param {string} userID - User to record
 * @param {string} filename - file to record to
 * @param {Object} [options] - Options to initialize recording
 * @param {StreamType} [options.type] - The type of the stream, default arbitrary
 * @param {number} [options.volume] - The volume to initialize with, default 1
 */
function recordToFile(receiver, userID, filename, options){
    return new Promise((resolve, reject) => {
    const opusStream = receiver.subscribe(userID, {
		end: {
			behavior: EndBehaviorType.AfterSilence,
			duration: options?.silenceTimout ?? 1000,
		},
	});
    const out = createWriteStream(filename);
	const oggStream = new opus.OggLogicalBitstream({
		opusHead: new opus.OpusHead({
			channelCount: 2,
			sampleRate: 48000,
		}),
		pageSizeControl: {
			maxPackets: 10,
		},
	});

	pipeline(opusStream, oggStream, out, (err) => {
		if (err) {
			console.error(err)
            reject(err)
		} else {
            resolve(filename)
		}
	});
})
}