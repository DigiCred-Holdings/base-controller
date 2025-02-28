import { PartialType } from '@nestjs/swagger';
import { CreateSiDto } from './create-si.dto';

export class UpdateSiDto extends PartialType(CreateSiDto) {}
