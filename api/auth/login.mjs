import { handleLogin } from '../../backend/auth.mjs';
import { storeFromEnv } from '../../backend/store.mjs';

export default {
  fetch(request) {
    return handleLogin(request, storeFromEnv(process.env));
  },
};
