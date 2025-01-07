import { token, clientId, guildId } from '../config.json';
import { Client, Events, GatewayIntentBits, VoiceState } from 'discord.js';
import { deployCommands } from './deploy-commands';
import { commands } from './commands';
import path from 'path';
import Database from 'better-sqlite3';

const dbPath = path.resolve(__dirname, "../data/voice_channel_usage.db");
const db = new Database(dbPath);

// Prepare SQL statements
const insertSession = db.prepare(`
    INSERT INTO voice_sessions (user_id, channel_id, session_start)
    VALUES (?, ?, ?)
`);

const updateSession = db.prepare(`
    UPDATE voice_sessions
    SET session_end = ?, duration_seconds = ?
    WHERE user_id = ? AND channel_id = ? AND session_end IS NULL
`);

interface VoiceSession {
    session_start: string;  // Use appropriate types (e.g., string or Date)
    session_end?: string;
    duration_seconds?: number;
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});
client.once(Events.ClientReady, async () => {
    await deployCommands({ guildId });
    console.log(`Logged in as ${client.user?.tag}!`);
});

client.on(Events.GuildCreate, async (guild) => {
    console.log(`Joined guild: ${guild.name}`);
    await deployCommands({ guildId: guild.id });
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commands[commandName as keyof typeof commands]) {
        await commands[commandName as keyof typeof commands].execute(interaction);
    }
});

client.on(Events.VoiceStateUpdate, (oldState: VoiceState, newState: VoiceState) => {
    const userId = newState.id; // User ID
    const username = newState.member?.user.tag || "Unknown User";

    const currentTimestamp = new Date().toISOString();

    // Check if the user joined a voice channel
    if (!oldState.channelId && newState.channelId) {
        const channelId = newState.channelId;
        const channelName = newState.channel?.name || "Unknown Channel";

        console.log(`${username} joined voice channel: ${channelName}`);

        // Insert a new session into the database
        try {
            insertSession.run(userId, channelId, currentTimestamp);
            console.log(`Session started for ${username} in channel: ${channelName}`);
        } catch (err) {
            if (err instanceof Error) {
                console.error("Error inserting session:", err.message);
            } else {
                console.error("Error inserting session:", err);
            }
        }
    }

    // Check if the user left a voice channel
    if (oldState.channelId && !newState.channelId) {
        const channelId = oldState.channelId;
        const channelName = oldState.channel?.name || "Unknown Channel";

        console.log(`${username} left voice channel: ${channelName}`);

        // Calculate session duration and update the session in the database
        try {
            const sessionEnd = currentTimestamp;
            const sessionStart = db.prepare(`
                SELECT session_start FROM voice_sessions
                WHERE user_id = ? AND channel_id = ? AND session_end IS NULL
            `).get(userId, channelId) as VoiceSession | undefined;

            if (sessionStart) {
                const durationSeconds = Math.floor(
                    (new Date(sessionEnd).getTime() - new Date(sessionStart.session_start).getTime()) / 1000
                );

                updateSession.run(sessionEnd, durationSeconds, userId, channelId);
                console.log(`Session ended for ${username} in channel: ${channelName}`);
            } else {
                console.warn(`No open session found for ${username} in channel: ${channelName}`);
            }
        } catch (err) {
            if (err instanceof Error) {
                console.error("Error updating session:", err.message);
            } else {
                console.error("Error updating session:", err);
            }
        }
    }

    // Check if the user moved between voice channels
    if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        const oldChannelName = oldState.channel?.name || "Unknown Channel";
        const newChannelName = newState.channel?.name || "Unknown Channel";

        console.log(
            `${username} moved from voice channel: ${oldChannelName} to: ${newChannelName}`
        );

        // End the session in the old channel
        try {
            const sessionEnd = currentTimestamp;
            const sessionStart = db.prepare(`
                SELECT session_start FROM voice_sessions
                WHERE user_id = ? AND channel_id = ? AND session_end IS NULL
            `).get(userId, oldState.channelId) as VoiceSession | undefined;

            if (sessionStart) {
                const durationSeconds = Math.floor(
                    (new Date(sessionEnd).getTime() - new Date(sessionStart.session_start).getTime()) / 1000
                );

                updateSession.run(sessionEnd, durationSeconds, userId, oldState.channelId);
                console.log(`Session ended for ${username} in channel: ${oldChannelName}`);
            } else {
                console.warn(`No open session found for ${username} in channel: ${oldChannelName}`);
            }
        } catch (err) {
            if (err instanceof Error) {
                console.error("Error updating session:", err.message);
            } else {
                console.error("Error updating session:", err);
            }
        }

        // Start a new session in the new channel
        try {
            insertSession.run(userId, newState.channelId, currentTimestamp);
            console.log(`Session started for ${username} in channel: ${newChannelName}`);
        } catch (err) {
            if (err instanceof Error) {
                console.error("Error inserting session:", err.message);
            } else {
                console.error("Error inserting session:", err);
            }
        }
    }
});

client.login(token);
