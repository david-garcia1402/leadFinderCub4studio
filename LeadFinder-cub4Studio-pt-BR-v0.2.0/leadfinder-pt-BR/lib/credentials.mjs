import {createCipheriv,createDecipheriv,randomBytes,randomUUID} from 'node:crypto';

const unavailable = () => Object.assign(new Error('Conexão com Outscraper indisponível. Entre em contato com a cub4Studio.'), {status:503});

export function createCredentials(store, env = process.env) {
  const encoded = String(env.CREDENTIAL_ENCRYPTION_KEY || '').trim();
  const secret = Buffer.from(encoded, 'base64');
  const configured = secret.length === 32 && secret.toString('base64') === encoded;
  const rowFor = userId => store.snapshot().credentials.find(row => row.userId === userId);
  return {
    configured,
    status(userId) {
      const row = rowFor(userId);
      return {provider:'outscraper', configured, connected:Boolean(row), updatedAt:row?.updatedAt || null};
    },
    async save(userId, value) {
      if (!configured) throw unavailable();
      if (typeof value !== 'string' || !/^[\x21-\x7e]{8,512}$/.test(value.trim())) {
        throw Object.assign(new Error('Cole uma chave do Outscraper válida, sem espaços.'), {status:400});
      }
      const apiKey = value.trim();
      const iv = randomBytes(12);
      const cipher = createCipheriv('aes-256-gcm', secret, iv);
      // Bind ciphertext to its owner: copying a row cannot expose another customer's key.
      cipher.setAAD(Buffer.from(userId));
      const ciphertext = Buffer.concat([cipher.update(apiKey, 'utf8'), cipher.final()]);
      const row = {userId, version:randomUUID(), iv:iv.toString('base64'), tag:cipher.getAuthTag().toString('base64'), ciphertext:ciphertext.toString('base64'), updatedAt:new Date().toISOString()};
      await store.update(data => {
        data.credentials = data.credentials.filter(item => item.userId !== userId);
        data.credentials.push(row);
      });
      return this.status(userId);
    },
    async remove(userId) {
      await store.update(data => { data.credentials = data.credentials.filter(row => row.userId !== userId); });
      return this.status(userId);
    },
    read(userId) {
      if (!configured) throw unavailable();
      const row = rowFor(userId);
      if (!row) throw Object.assign(new Error('Conecte sua chave do Outscraper em Conta e plano antes de buscar.'), {status:409});
      try {
        const decipher = createDecipheriv('aes-256-gcm', secret, Buffer.from(row.iv, 'base64'));
        decipher.setAAD(Buffer.from(userId));
        decipher.setAuthTag(Buffer.from(row.tag, 'base64'));
        const apiKey = Buffer.concat([decipher.update(Buffer.from(row.ciphertext, 'base64')), decipher.final()]).toString('utf8');
        return {apiKey, version:row.version};
      } catch {
        throw unavailable();
      }
    }
  };
}
