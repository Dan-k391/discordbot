import { CommandInteraction, SlashCommandBuilder, MessageFlags } from "discord.js";
import { getDBInstance } from "../db";

const db = getDBInstance();

interface LeaderboardEntry {
    user_id: string;
    total_time_seconds: number;
}

// Prepare the query for fetching the leaderboard
const getLeaderboardQuery = db.prepare(`
    SELECT user_id, SUM(duration_seconds) AS total_time_seconds
    FROM voice_sessions
    WHERE session_end IS NOT NULL
    GROUP BY user_id
    ORDER BY total_time_seconds DESC
    LIMIT 10
`);

export const data = new SlashCommandBuilder()
    .setName('voiceleaderboard')
    .setDescription('Show the leaderboard of users with the most time spent in voice channels');

export async function execute(interaction: CommandInteraction) {
    // Query the database for the leaderboard
    const results = getLeaderboardQuery.all() as LeaderboardEntry[];

    if (results.length === 0) {
        await interaction.reply({
            content: "No data available for the leaderboard yet.",
            flags: MessageFlags.Ephemeral
        });
        return;
    }

    // Build the leaderboard message
    let leaderboardMessage = "**Voice Channel Leaderboard**\n\n";
    results.forEach((entry, index) => {
        const user = interaction.client.users.cache.get(entry.user_id);
        const username = user?.tag || `Unknown User (${entry.user_id})`;

        const hours = Math.floor(entry.total_time_seconds / 3600);
        const minutes = Math.floor((entry.total_time_seconds % 3600) / 60);
        const seconds = entry.total_time_seconds % 60;

        const timeFormatted = `${hours}h ${minutes}m ${seconds}s`;
        leaderboardMessage += `**#${index + 1}**: ${username} - ${timeFormatted}\n`;
    });

    // Send the leaderboard to the channel
    await interaction.reply({
        content: leaderboardMessage,
    });
}
