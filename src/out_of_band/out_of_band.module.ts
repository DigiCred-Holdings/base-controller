import { Module } from '@nestjs/common';
import { OutOfBandController } from './out_of_band.controller';
import { OutOfBandService } from './out_of_band.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [OutOfBandController],
  providers: [OutOfBandService],
})
export class OutOfBandModule {}
