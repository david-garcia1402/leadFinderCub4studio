import {mkdir,readFile,rename,writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';

const empty = () => ({users:[],sessions:[],subscriptions:[],checkouts:[],events:[],entitlements:[],credentials:[],leads:[],activities:[],tasks:[],workspaces:[],providerUsage:[]});

export async function createStore(file) {
  await mkdir(dirname(file), {recursive:true});
  let data = empty();
  try {
    const raw = JSON.parse(await readFile(file, 'utf8'));
    data = {
      users: Array.isArray(raw.users) ? raw.users : [],
      sessions: Array.isArray(raw.sessions) ? raw.sessions : [],
      subscriptions: Array.isArray(raw.subscriptions) ? raw.subscriptions : [],
      checkouts: Array.isArray(raw.checkouts) ? raw.checkouts : [],
      events: Array.isArray(raw.events) ? raw.events : [],
      entitlements: Array.isArray(raw.entitlements) ? raw.entitlements : [],
      credentials: Array.isArray(raw.credentials) ? raw.credentials : [],
      leads: Array.isArray(raw.leads) ? raw.leads : [],
      activities: Array.isArray(raw.activities) ? raw.activities : [],
      tasks: Array.isArray(raw.tasks) ? raw.tasks : [],
      workspaces: Array.isArray(raw.workspaces) ? raw.workspaces : [],
      providerUsage: Array.isArray(raw.providerUsage) ? raw.providerUsage : []
    };
  } catch (e) {
    if (e.code !== 'ENOENT') throw new Error('Account data is unreadable; refusing to start without customer isolation.');
  }
  let queue = Promise.resolve();
  const persist = async next => {
    const tmp = file + '.tmp';
    await writeFile(tmp, JSON.stringify(next));
    await rename(tmp, file);
  };
  return {
    snapshot: () => data,
    update(mutator) {
      const run = queue.then(async () => {
        const draft = structuredClone(data);
        const next = await mutator(draft) || draft;
        await persist(next);
        data = next;
        return data;
      });
      queue = run.catch(() => {});
      return run;
    }
  };
}
