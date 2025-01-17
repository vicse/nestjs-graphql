import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateListInput } from './dto/create-list.input';
import { UpdateListInput } from './dto/update-list.input';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { List } from './entities/list.entity';
import { User } from '../users/entities/user.entity';
import { PaginationArgs, SearchArgs } from '../common/dto/args';

@Injectable()
export class ListsService {
  constructor(
    @InjectRepository(List) private readonly listRepository: Repository<List>,
  ) {}

  async create(createListInput: CreateListInput, user: User): Promise<List> {
    const newList = this.listRepository.create({ ...createListInput, user });
    return await this.listRepository.save(newList);
  }

  findAll(
    user: User,
    paginationArgs: PaginationArgs,
    searchArgs: SearchArgs,
  ): Promise<List[]> {
    const { page, limit } = paginationArgs;
    const { search } = searchArgs;

    const queryBuilder = this.listRepository
      .createQueryBuilder('lists')
      .where('lists.userId = :userId', { userId: user.id })
      .skip((page - 1) * limit)
      .take(limit);

    if (search)
      queryBuilder.andWhere('LOWER(lists.name) like :name', {
        name: `%${search.toLowerCase()}%`,
      });
    return queryBuilder.getMany();
  }

  async findOne(id: string, user: User): Promise<List> {
    const item = await this.listRepository.findOneBy({
      id,
      user: { id: user.id },
    });
    if (!item) throw new NotFoundException(`List with id ${id} not found`);
    return item;
  }

  async update(updateListInput: UpdateListInput, user: User) {
    await this.findOne(updateListInput.id, user);
    const list = await this.listRepository.preload(updateListInput);
    if (!list)
      throw new NotFoundException(
        `Item with id ${updateListInput.id} not found`,
      );
    return this.listRepository.save(list);
  }

  async remove(id: string, user: User) {
    const list = await this.findOne(id, user);
    await this.listRepository.remove(list);
    return { ...list, id };
  }

  async listsCountByUser(user: User): Promise<number> {
    return this.listRepository.count({
      where: { user: { id: user.id } },
    });
  }
}
