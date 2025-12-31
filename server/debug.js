try {
    console.log('Trying to require @prisma/client...');
    const { PrismaClient } = require('@prisma/client');
    console.log('PrismaClient loaded.');

    console.log('Instantiating PrismaClient...');
    const prisma = new PrismaClient({ log: ['info'] });
    console.log('PrismaClient instantiated.');

    console.log('Trying to require dist/index.js...');
    require('./dist/index.js');
    console.log('dist/index.js required.');
} catch (e) {
    console.error('ERROR:', e);
}
