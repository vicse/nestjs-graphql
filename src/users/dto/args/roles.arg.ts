import { ValidRoles } from '../../../auth/enums/valid-roles.enum';
import { IsArray } from 'class-validator';
import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class ValidRolesArgs {
  @Field(() => [ValidRoles], { nullable: true })
  @IsArray()
  roles: ValidRoles[] = [];
}
