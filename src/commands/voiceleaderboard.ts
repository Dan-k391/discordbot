import { CommandInteraction, SlashCommandBuilder, MessageFlags } from "discord.js";
import { getDBInstance } from "../db";

const db = getDBInstance();

interface LeaderboardEntry {
    user_id: string;
    total_time_seconds: number;
}

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
    const results = getLeaderboardQuery.all() as LeaderboardEntry[];

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

        const hours = Math.floor(entry.total_time_seconds / 3600);
        const minutes = Math.floor((entry.total_time_seconds % 3600) / 60);
        const seconds = entry.total_time_seconds % 60;

        const timeFormatted = `${hours}h ${minutes}m ${seconds}s`;
        leaderboardMessage += `**#${index + 1}**: ${username} - ${timeFormatted}\n`;
    }

    await interaction.reply({
        content: leaderboardMessage
    });
}
