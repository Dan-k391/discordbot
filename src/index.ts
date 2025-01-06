import { token, clientId, guildId } from '../config.json';
import { Client } from 'discord.js';

const client = new Client({
    intents: ['Guilds'],
});

client.on('ready', (c) => {
    console.log(`${c.user.username} is online.`);
});

client.login(token);
