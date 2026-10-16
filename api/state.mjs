import { handleState } from '../backend/state-handler.mjs';
import { storeFromEnv } from '../backend/store.mjs';

export default {
  fetch(request) {
    return handleState(request, storeFromEnv(process.env));
  },
};
