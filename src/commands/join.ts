import { joinVoiceChannel } from "@discordjs/voice";
import { channel } from "diagnostics_channel";
import { Client, CommandInteraction, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
	.setName('join')
	.setDescription('Testing Command to join VC');

export async function execute(interaction: CommandInteraction) {
	const connection = joinVoiceChannel({
		channelId: interaction.channel?.id!,
		guildId: interaction.guildId!,
		adapterCreator: interaction.guild?.voiceAdapterCreator!,
	});

	await interaction.reply("Joined VC!");
}
