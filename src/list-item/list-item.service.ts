import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateListItemInput } from './dto/create-list-item.input';
import { UpdateListItemInput } from './dto/update-list-item.input';
import { InjectRepository } from '@nestjs/typeorm';
import { ListItem } from './entities/list-item.entity';
import { Repository } from 'typeorm';
import { PaginationArgs, SearchArgs } from '../common/dto/args';
import { List } from '../lists/entities/list.entity';

@Injectable()
export class ListItemService {
  constructor(
    @InjectRepository(ListItem)
    private readonly listItemRepository: Repository<ListItem>,
  ) {}

  create(createListItemInput: CreateListItemInput): Promise<ListItem> {
    const { listId, itemId, ...restListItem } = createListItemInput;
    const newListItem = this.listItemRepository.create({
      ...restListItem,
      item: { id: itemId },
      list: { id: listId },
    });
    return this.listItemRepository.save(newListItem);
  }

  findAll(
    list: List,
    paginationArgs: PaginationArgs,
    searchArgs: SearchArgs,
  ): Promise<ListItem[]> {
    const { page, limit } = paginationArgs;
    const { search } = searchArgs;
    const queryBuilder = this.listItemRepository
      .createQueryBuilder('listItems')
      .leftJoin('listItems.item', 'item')
      .where('listItems.listId = :listId', { listId: list.id })
      .skip((page - 1) * limit)
      .take(limit);

    if (search)
      queryBuilder.andWhere('LOWER(item.name) like :name', {
        name: `%${search.toLowerCase()}%`,
      });
    return queryBuilder.getMany();
  }

  async countListItemsByList(list: List): Promise<number> {
    return this.listItemRepository.count({
      where: { list: { id: list.id } },
    });
  }

  async findOne(id: string): Promise<ListItem> {
    const listItem = await this.listItemRepository.findOneBy({ id });
    if (!listItem)
      throw new NotFoundException(`List item with id ${id} not found`);
    return listItem;
  }

  async update(updateListItemInput: UpdateListItemInput): Promise<ListItem> {
    // await this.findOne(updateListItemInput.id);
    const { listId, itemId, ...restListItem } = updateListItemInput;
    // const listItem = await this.listItemRepository.preload({
    //   ...restListItem,
    //   list: { id: listId },
    //   item: { id: itemId },
    // });
    // if (!listItem)
    //   throw new NotFoundException(`List item with id ${listId} not found`);
    // return this.listItemRepository.save(listItem);
    const queryBuilder = this.listItemRepository
      .createQueryBuilder()
      .update(ListItem)
      .set({
        ...restListItem,
        ...(listId && { list: { id: listId } }),
        ...(itemId && { item: { id: itemId } }),
      })
      .where('id = :id', { id: updateListItemInput.id });
    await queryBuilder.execute();
    return this.findOne(updateListItemInput.id);
  }

  async remove(id: string): Promise<ListItem> {
    const listItem = await this.findOne(id);
    await this.listItemRepository.softDelete({ id: listItem.id });
    return listItem;
  }
}
