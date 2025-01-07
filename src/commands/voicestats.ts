import { CommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import { getDBInstance } from "../db";

const db = getDBInstance();

interface TotalTimeResult {
    total_time_seconds: number | null;  // 'null' if no data is found
}

// Prepare the query for fetching total time spent by a user
const getTotalTimeSpentQuery = db.prepare(`
    SELECT SUM(duration_seconds) AS total_time_seconds
    FROM voice_sessions
    WHERE user_id = ? AND session_end IS NOT NULL
`);

export const data = new SlashCommandBuilder()
    .setName('voicestats')
    .setDescription('Get the total time spent by the user in voice channels')
    .addUserOption(option => 
        option.setName('user')
            .setDescription('The user to query stats for')
            .setRequired(true)
    );

export async function execute(interaction: CommandInteraction) {
    // Get the user to query stats for
    const user = interaction.options.get('user')?.user!;
    const userId = user?.id;

    // Query the database for total time spent by the user
    const result = getTotalTimeSpentQuery.get(userId) as TotalTimeResult;

    let totalTime = 0;
    if (result && result.total_time_seconds !== null) {
        totalTime = result.total_time_seconds;
    }

    // Convert total time from seconds to a more readable format (hours:minutes:seconds)
    const hours = Math.floor(totalTime / 3600);
    const minutes = Math.floor((totalTime % 3600) / 60);
    const seconds = totalTime % 60;

    const timeSpentFormatted = `${hours} hours, ${minutes} minutes, and ${seconds} seconds`;

    // Send the result back to the user
    await interaction.reply({
        content: `${user.tag} has spent a total of ${timeSpentFormatted} in voice channels.`,
        flags: MessageFlags.Ephemeral
    });
}
