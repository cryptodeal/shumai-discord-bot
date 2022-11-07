import type { LocaleString } from 'discord-api-types/v10';
import config from '../../files/config.toml';
import { Commands } from '../managers/CommandManager';
import { CommandContext } from './contexts/CommandContext';
import { Option, OptionOptions } from './Option';

export interface CommandOptions {
	name: string;
	nameLocalizations?: Record<LocaleString, string>;
	description?: string;
	descriptionLocalizations?: Record<LocaleString, string>;
	guildId?: string;
	defaultMemberPermissions?: string;
	options?: Option[] | OptionOptions[];
	run: (ctx: CommandContext) => Response | Promise<Response>;
	runEditResponse?: (ctx: CommandContext) => any;
}

export class Command {
	public name: string;
	public nameLocalizations?: Record<LocaleString, string>;
	public description?: string;
	public descriptionLocalizations?: Record<LocaleString, string>;
	public guildId?: string = config.commands.guild_id;
	public defaultMemberPermissions?: string;
	public options: Option[] | OptionOptions[];
	public run: (ctx: CommandContext) => Response | Promise<Response>;
	public runEditResponse: (ctx: CommandContext) => any;

	public constructor(options: CommandOptions) {
		this.name = options.name;
		this.nameLocalizations = options.nameLocalizations;

		this.description = options.description;
		this.descriptionLocalizations = options.descriptionLocalizations;

		this.guildId = options.guildId;
		this.defaultMemberPermissions = options.defaultMemberPermissions;

		this.options = options.options?.map((option) => {
			if (option instanceof Option) return option;
			else return new Option(option);
		});
		this.run = options.run;
		this.runEditResponse = options.runEditResponse;

		Commands.register(this);
	}

	public toJSON(): Record<string, any> {
		return {
			name: this.name,
			name_localizations: this.nameLocalizations,
			description: this.description,
			description_localizations: this.descriptionLocalizations,
			guild_id: this.guildId,
			default_member_permissions: this.defaultMemberPermissions,
			options: this.options?.map((option) => option.toJSON())
		};
	}
}
