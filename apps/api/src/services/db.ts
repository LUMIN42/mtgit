import { getMongoService } from '../db/mongo.js';
import { publicProcedure, router } from '../trpc.js';
import { ScryfallService } from './scryfall.js';

export const dbRouter = router({
  ping: publicProcedure.query(async () => {
    const mongoService = await getMongoService();
    const scryfallService = new ScryfallService(mongoService);
    return scryfallService.ping();
  }),

  firstScryfallCard: publicProcedure.query(async () => {
    const mongoService = await getMongoService();
    const scryfallService = new ScryfallService(mongoService);
    return scryfallService.getFirstCard();
  }),
});



