import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DBService } from './db.service';
import { DiscordService } from './discord.service';

@Module({
	imports: [],
	controllers: [AppController],
	providers: [DiscordService, DBService]
})
export class AppModule {}
