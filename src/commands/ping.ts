import { CommandInteraction, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with the bot\'s latency!');

export async function execute(interaction: CommandInteraction) {
    const sent = await interaction.reply({
        content: 'Calculating ping...',
        fetchReply: true
    });

    if (sent && 'createdTimestamp' in sent) {
        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(interaction.client.ws.ping);

        await interaction.editReply(`🏓 Pong!\nLatency: ${latency}ms\nAPI Latency: ${apiLatency}ms`);
    } else {
        await interaction.editReply('🏓 Pong! Could not calculate latency.');
    }
}
