import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateItemInput, UpdateItemInput } from './dto/inputs';
import { Item } from './entities/item.entity';
import { Like, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { PaginationArgs, SearchArgs } from '../common/dto/args';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private readonly itemsRepository: Repository<Item>,
  ) {}

  async create(createItemInput: CreateItemInput, user: User): Promise<Item> {
    const newItem = this.itemsRepository.create({ ...createItemInput, user });
    return await this.itemsRepository.save(newItem);
  }

  findAll(
    user: User,
    paginationArgs: PaginationArgs,
    searchArgs: SearchArgs,
  ): Promise<Item[]> {
    const { page, limit } = paginationArgs;
    const { search } = searchArgs;
    // return this.itemsRepository.find({
    //   where: { user: { id: user.id }, name: Like(`%${search}%`) },
    //   skip: (page - 1) * limit,
    //   take: limit,
    // });
    const queryBuilder = this.itemsRepository
      .createQueryBuilder('items')
      .where('items.userId = :userId', { userId: user.id })
      .skip((page - 1) * limit)
      .take(limit);

    if (search)
      queryBuilder.andWhere('LOWER(items.name) like :name', {
        name: `%${search.toLowerCase()}%`,
      });
    return queryBuilder.getMany();
  }

  async findOne(id: string, user: User): Promise<Item> {
    const item = await this.itemsRepository.findOneBy({
      id,
      user: { id: user.id },
    });
    if (!item) throw new NotFoundException(`Item with id ${id} not found`);
    return item;
  }

  async update(updateItemInput: UpdateItemInput, user: User): Promise<Item> {
    await this.findOne(updateItemInput.id, user);
    const item = await this.itemsRepository.preload(updateItemInput);
    if (!item)
      throw new NotFoundException(
        `Item with id ${updateItemInput.id} not found`,
      );
    return this.itemsRepository.save(item);
  }

  async remove(id: string, user: User): Promise<Item> {
    // TODO: soft delete
    const item = await this.findOne(id, user);
    await this.itemsRepository.remove(item);
    return { ...item, id };
  }

  async itemsCountByUser(user: User): Promise<number> {
    return this.itemsRepository.count({
      where: { user: { id: user.id } },
    });
  }
}
