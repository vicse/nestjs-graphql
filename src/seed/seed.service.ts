import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Item } from '../items/entities/item.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { SEED_ITEMS, SEED_USERS } from './data/seed-data';
import { ItemsService } from '../items/items.service';

@Injectable()
export class SeedService {
  private readonly isProd: boolean;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Item) private readonly itemRepository: Repository<Item>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly usersService: UsersService,
    private readonly itemsService: ItemsService,
  ) {
    this.isProd = configService.get<string>('STATE') === 'prod';
  }

  async executeSeed() {
    if (this.isProd)
      throw new UnauthorizedException('We cannot run SEED on Prod');

    await this.deleteDatabase();
    const [user] = await this.loadUsers();
    await this.loadItems(user);

    return true;
  }

  async deleteDatabase() {
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
}
