import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Item } from '../items/entities/item.entity';
import { User } from '../users/entities/user.entity';
import { ListItem } from '../list-item/entities/list-item.entity';
import { List } from '../lists/entities/list.entity';

import { UsersService } from '../users/users.service';
import { SEED_ITEMS, SEED_LISTS, SEED_USERS } from './data/seed-data';
import { ItemsService } from '../items/items.service';
import { ListsService } from '../lists/lists.service';
import { ListItemService } from '../list-item/list-item.service';

@Injectable()
export class SeedService {
  private readonly isProd: boolean;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Item) private readonly itemRepository: Repository<Item>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(ListItem)
    private readonly listItemRepository: Repository<ListItem>,
    @InjectRepository(List) private readonly listRepository: Repository<List>,
    private readonly usersService: UsersService,
    private readonly itemsService: ItemsService,
    private readonly listsService: ListsService,
    private readonly listsItemsService: ListItemService,
  ) {
    this.isProd = configService.get<string>('STATE') === 'prod';
  }

  async executeSeed() {
    if (this.isProd)
      throw new UnauthorizedException('We cannot run SEED on Prod');

    await this.deleteDatabase();
    const [user] = await this.loadUsers();
    await this.loadItems(user);
    const [list] = await this.loadLists(user);

    const items = await this.itemsService.findAll(
      user,
      { limit: 15, page: 1 },
      {},
    );
    await this.loadListsItems(list, items);

    return true;
  }

  async deleteDatabase() {
    await this.listItemRepository
      .createQueryBuilder()
      .delete()
      .where({})
      .execute();
    await this.listRepository.createQueryBuilder().delete().where({}).execute();
    await this.itemRepository.createQueryBuilder().delete().where({}).execute();
    await this.userRepository.createQueryBuilder().delete().where({}).execute();
  }

  async loadUsers(): Promise<User[]> {
    const usersPromised = SEED_USERS.map(async (user) => {
      return this.usersService.create(user);
    });

    return Promise.all(usersPromised);
  }

  async loadItems(user: User): Promise<void> {
    await Promise.all(
      SEED_ITEMS.map(async (item) => {
        return this.itemsService.create(item, user);
      }),
    );
  }

  async loadLists(user: User): Promise<List[]> {
    const listsPromised = SEED_LISTS.map(async (list) => {
      return this.listsService.create(list, user);
    });

    return Promise.all(listsPromised);
  }

  async loadListsItems(list: List, items: Item[]) {
    await Promise.all(
      items.map(async (item) => {
        return this.listsItemsService.create({
          listId: list.id,
          itemId: item.id,
          completed: Math.round(Math.random()) === 1,
          quantity: Math.round(Math.random() * 10),
        });
      }),
    );
  }
}
