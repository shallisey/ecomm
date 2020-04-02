const fs = require('fs');
const crypto = require('crypto');

class UsersRepository {
  constructor(filename) {
    if (!filename) {
      throw new Error('Creating a repository requires a filename.');
    }

    this.filename = filename;
    try {
      fs.accessSync(this.filename);
    } catch (err) {
      fs.writeFileSync(this.filename, '[]');
    }
  }
  async getAll() {
    //returning the parsed data in a file
    return JSON.parse(
      await fs.promises.readFile(this.filename, {
        encoding: 'utf8'
      })
    );
  }
  async create(attrs) {
    attrs.id = this.randomId();

    const records = await this.getAll();
    records.push(attrs);

    await this.writeAll(records);
  }
  async writeAll(records) {
    await fs.promises.writeFile(
      this.filename,
      JSON.stringify(records, null, 2)
    );
  }

  randomId() {
    return crypto.randomBytes(8).toString('hex');
  }
  async getOne(id) {
    //getAll users. iterate through them and find one that matches the id given. return if exists
    const records = await this.getAll();
    return records.find(record => record.id === id);
  }
  async delete(id) {
    const records = await this.getAll();
    const filteredRecords = records.filter(record => record.id !== id);
    await this.writeAll(filteredRecords);
  }
}
const test = async () => {
  const repo = new UsersRepository('users.json');

  await repo.delete('ba4a0642ecc2d8e5');
};

test();
