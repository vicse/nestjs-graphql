import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SignupInput } from '../auth/dto/inputs';
import * as bcrypt from 'bcrypt';
import { ValidRoles } from '../auth/enums/valid-roles.enum';
import { UpdateItemInput } from '../items/dto/inputs';
import { UpdateUserInput } from './dto/update-user.input';

@Injectable()
export class UsersService {
  private logger = new Logger('UsersService');

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(signupInput: SignupInput): Promise<User> {
    try {
      const user = this.userRepository.create({
        ...signupInput,
        password: bcrypt.hashSync(signupInput.password, 10),
      });
      return await this.userRepository.save(user);
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  findAll(roles: ValidRoles[]): Promise<User[]> {
    if (roles.length === 0) return this.userRepository.find();
    return this.userRepository
      .createQueryBuilder('users')
      .leftJoinAndSelect('users.lastUpdatedBy', 'userAdmin')
      .where('ARRAY[users.roles] && ARRAY[:...roles]', { roles })
      .getMany();
  }

  async findOneById(id: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    return user;
  }

  async findOneByEmail(email: string): Promise<User> {
    try {
      return await this.userRepository.findOneByOrFail({ email });
    } catch (error) {
      throw new NotFoundException(`${email} not found`);
    }
  }

  async update(
    id: string,
    updateUserInput: UpdateUserInput,
    updatedBy: User,
  ): Promise<User> {
    try {
      const user = await this.userRepository.preload({
        ...updateUserInput,
        id,
      });
      user.lastUpdatedBy = updatedBy;
      return await this.userRepository.save(user);
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async block(id: string, adminUser: User): Promise<User> {
    const userToBlock = await this.findOneById(id);
    userToBlock.isActive = false;
    userToBlock.lastUpdatedBy = adminUser;
    return await this.userRepository.save(userToBlock);
  }

  private handleDBErrors(error: any): never {
    if (error.code === '23505')
      throw new BadRequestException(error.detail.replace('Key ', ''));

    this.logger.error(error);
    throw new InternalServerErrorException('Please check server logs');
  }
}
