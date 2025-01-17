import { CommandInteraction, SlashCommandBuilder, MessageFlags, ChatInputApplicationCommandData, ChatInputCommandInteraction } from "discord.js";
import { getDBInstance } from "../db";

const db = getDBInstance();

interface LeaderboardEntry {
    user_id: string;
    total_time_seconds: number;
}

export const data = new SlashCommandBuilder()
    .setName('voiceleaderboard')
    .setDescription('Show the leaderboard of users with the most time spent in voice channels')
    .addIntegerOption(option =>
        option.setName('limit')
            .setDescription('The number of users to display on the leaderboard (default: 10)')
            .setMinValue(1)
            .setMaxValue(50) // Set a reasonable max value to prevent large queries
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    const limit = interaction.options.getInteger('limit') || 10; // Default to 10 if no input is provided

    // Prepare the query with a dynamic limit
    const getLeaderboardQuery = db.prepare(`
        SELECT user_id, SUM(duration_seconds) AS total_time_seconds
        FROM voice_sessions
        WHERE session_end IS NOT NULL
        GROUP BY user_id
        ORDER BY total_time_seconds DESC
        LIMIT ?
    `);

    const results = getLeaderboardQuery.all(limit) as LeaderboardEntry[];

    if (results.length === 0) {
        await interaction.reply({
            content: "No data available for the leaderboard yet.",
            flags: MessageFlags.Ephemeral
        });
        return;
    }

    let leaderboardMessage = "**Voice Channel Leaderboard**\n\n";

    for (const [index, entry] of results.entries()) {
        let user;
        try {
            user = await interaction.client.users.fetch(entry.user_id);
        } catch {
            user = null;
        }
    
        const username = user?.tag || `Unknown User (${entry.user_id})`;
    
        // Escape Markdown characters in the username
        const escapedUsername = username.replace(/([_*~`|])/g, '\\$1');
    
        const hours = Math.floor(entry.total_time_seconds / 3600);
        const minutes = Math.floor((entry.total_time_seconds % 3600) / 60);
        const seconds = entry.total_time_seconds % 60;
    
        const timeFormatted = `${hours}h ${minutes}m ${seconds}s`;
        leaderboardMessage += `**#${index + 1}**: ${escapedUsername} - ${timeFormatted}\n`;
    }
    
    await interaction.reply({
        content: leaderboardMessage
    });
}
