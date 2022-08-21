import { CommandOptionType } from '@app/enums/CommandOptionType';
import { ICommand } from '@app/interfaces/ICommand';
import { Region } from '@app/enums/Region';
import { log } from '@app/utils/Logger';
import { DiscordRequest } from '@app/utils/DiscordRequest';
import { APP_ID, GUILD_ID } from '@app/config';
import { ApiEndpoint, ApiRequest } from '@app/utils/ApiRequest';
import DiscordInteraction from '@app/classes/DiscordInteraction';
import { InteractionResponseType } from 'discord-interactions';
import { LiveMarketItem } from '@app/types/API/LiveMarketItem';
import moment from 'moment';

export const command: ICommand = {
  name: 'prices',
  description: 'Get the current prices of Lost Ark Market Online',
  type: CommandOptionType.SUB_COMMAND,
  options: [
    {
      name: 'region',
      description: 'The region to get prices from',
      type: CommandOptionType.STRING,
      required: true,
      choices: Object.entries(Region).map(([value, name]) => ({
        name,
        value: value as string,
      })),
    },
    {
      name: 'item',
      description: 'The item to get prices from',
      type: CommandOptionType.STRING,
      required: true,
    },
  ],
};

export const interact = async (
  interaction: DiscordInteraction,
): Promise<any> => {
  log.debug('Interact called', interaction);
  const region = interaction.getOptionValue('region');
  const itemId = interaction.getOptionValue('item');
  try {
    const {
      data: [item],
    } = await ApiRequest<LiveMarketItem[]>(
      ApiEndpoint.EXPORT_MARKET_LIVE,
      Region[region],
      {
        params: {
          items: itemId,
        },
      },
    );

    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [
          {
            description: `**${item.name}**`,
            color: 12691833,
            fields: [
              {
                name: 'Recent Price',
                value: `${item.recentPrice} <:gold:976615153485352960>`,
                inline: true,
              },
              {
                name: 'Lowest Price',
                value: `${item.lowPrice} <:gold:976615153485352960>`,
                inline: true,
              },
              {
                name: 'Cheapest Rem.',
                value: item.cheapestRemaining,
                inline: true,
              },
              {
                name: 'Region',
                value: Region[region],
                inline: true,
              },
              {
                name: 'Last update',
                value: moment
                  .duration(moment(item.updatedAt).diff(moment()))
                  .humanize(true),
                inline: true,
              },
            ],
            author: {
              name: 'LostarkMarket.Online',
              icon_url:
                'https://www.lostarkmarket.online/assets/icons/favicon.png',
            },
            thumbnail: {
              url: item.image,
            },
          },
        ],
      },
    };
  } catch (e) {
    console.error('Exception occured', e);
  }
};

export const setup = async (command: ICommand): Promise<void> => {
  log.debug('Installing command', command);
  /**
   * @TODO: Refactor the command registration to a sole responsibility helper
   */
  const endpoint = [
    'applications',
    APP_ID,
    'guilds',
    GUILD_ID,
    'commands',
  ].join('/');
  const response = await DiscordRequest(endpoint, {
    method: 'POST',
    body: command,
  });
  log.debug('Discord commands API response', await response.json());
};
