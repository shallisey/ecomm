const fs = require('fs');
const crypto = require('crypto');
const util = require('util');

const scrypt = util.promisify(crypto.scrypt);

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

    const salt = crypto.randomBytes(16).toString('hex');
    const buf = await scrypt(attrs.password, salt, 64);

    const records = await this.getAll();
    const record = {
      ...attrs,
      password: `${buf.toString('hex')}.${salt}`
    };
    records.push(record);

    await this.writeAll(records);
    return record;
  }
  async writeAll(records) {
    await fs.promises.writeFile(
      this.filename,
      JSON.stringify(records, null, 2)
    );
  }

  async comparePasswords(saved, supplied) {
    // Saved --> passwords saved in our database. 'hashed.salt'
    //Supplied --> password given to us by a user trying to sign in.

    const [hashed, salt] = saved.split('.');
    const hashedSuppliedBuf = await scrypt(supplied, salt, 64);

    return hashed === hashedSuppliedBuf.toString('hex');
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

  async update(id, attrsToUpdate) {
    const records = await this.getAll();
    const record = records.find(record => record.id === id);

    if (!record) {
      throw new Error(`Record with the id of ${id} was not found.`);
    }

    Object.assign(record, attrsToUpdate);
    await this.writeAll(records);
  }
  async getOneBy(filters) {
    const records = await this.getAll();
    for (let record of records) {
      let found = true;

      for (let key in filters) {
        if (record[key] !== filters[key]) {
          found = false;
        }
      }
      if (found) {
        return record;
      }
    }
  }
}

module.exports = new UsersRepository('users.json');
