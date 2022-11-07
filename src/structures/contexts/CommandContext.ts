import {
	APIApplicationCommandInteraction,
	APIApplicationCommandInteractionDataOption,
	APIChatInputApplicationCommandInteraction,
	APIChatInputApplicationCommandInteractionDataResolved,
	APIInteractionGuildMember,
	APIInteractionResponse,
	APIInteractionResponseCallbackData,
	APIUser,
	InteractionResponseType,
	RouteBases,
	Routes
} from 'discord-api-types/v10';
import { Context } from 'hono';
import config from '../../../files/config.toml';
import { Command } from '../Command';

export class CommandContext {
	public context: Context;
	public command?: Command;
	public interaction?: APIChatInputApplicationCommandInteraction;
	public user?: APIUser;
	public member?: APIInteractionGuildMember;
	public options?: APIApplicationCommandInteractionDataOption[];
	public resolved?: APIChatInputApplicationCommandInteractionDataResolved;

	public constructor(
		c: Context,
		command?: Command,
		interaction?: APIApplicationCommandInteraction
	) {
		this.context = c;
		this.command = command;

		if (interaction) {
			this.interaction = interaction as APIChatInputApplicationCommandInteraction;
			this.user = this.interaction.member.user;
			this.member = this.interaction.member;
			this.options = this.interaction.data.options;
			this.resolved = this.interaction.data.resolved;
		}
	}

	public respond(response: APIInteractionResponse | string) {
		if (typeof response === 'string') {
			return this.context.json({
				type: InteractionResponseType.ChannelMessageWithSource,
				data: {
					content: response
				}
			});
		}

		return this.context.json(response);
	}

	public async editResponse(response: APIInteractionResponseCallbackData | string) {
		if (typeof response === 'string') {
			response = {
				content: response
			};
		}

		fetch(
			`${RouteBases.api}${Routes.webhookMessage(
				this.interaction.application_id,
				this.interaction.token
			)}`,
			{
				method: 'PATCH',
				headers: {
					Authorization: `Bot ${config.client.token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(response)
			}
		);
	}
}
