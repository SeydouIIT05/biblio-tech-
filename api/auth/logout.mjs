import { handleLogout } from '../../backend/auth.mjs';
import { storeFromEnv } from '../../backend/store.mjs';

export default {
  fetch(request) {
    return handleLogout(request, storeFromEnv(process.env));
  },
};
