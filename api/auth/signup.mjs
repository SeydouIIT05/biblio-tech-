import { handleSignup } from '../../backend/auth.mjs';
import { storeFromEnv } from '../../backend/store.mjs';

export default {
  fetch(request) {
    return handleSignup(request, storeFromEnv(process.env));
  },
};
